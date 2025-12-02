import { supabase } from '../config/supabase';
import {
  RUNWAY_CONFIG,
  calculateCost,
  ERROR_MESSAGES,
  STORAGE_CONFIG,
} from '../config/runway.config';
import type {
  AIGeneration,
  CreateGenerationParams,
  UpdateGenerationParams,
  GenerationResult,
  PredictionResult,
  CreditCheckResult,
  UserCredits,
  GenerationFilters,
  ReplicatePrediction,
  AspectRatio,
} from '../types/runway.types';

const EDGE_FUNCTION_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-image`;

async function callEdgeFunction(path: string, body: unknown): Promise<Response> {
  const { data: { session } } = await supabase.auth.getSession();

  const response = await fetch(`${EDGE_FUNCTION_URL}${path}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${session?.access_token || ''}`,
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Edge function call failed');
  }

  return response;
}

export async function checkUserCredits(userId: string, requiredCredits: number): Promise<CreditCheckResult> {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('credits, is_admin')
      .eq('id', userId)
      .maybeSingle();

    if (error) throw error;
    if (!data) throw new Error('User not found');

    const isAdmin = data.is_admin || false;
    const currentCredits = data.credits || 0;

    return {
      hasCredits: isAdmin || currentCredits >= requiredCredits,
      currentCredits,
      requiredCredits,
      isAdmin,
    };
  } catch (error) {
    console.error('Error checking credits:', error);
    throw error;
  }
}

export async function getUserCredits(userId: string): Promise<UserCredits> {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('credits, total_generations, last_generation_at')
      .eq('id', userId)
      .maybeSingle();

    if (error) throw error;
    if (!data) throw new Error('User not found');

    return {
      credits: data.credits || 0,
      total_generations: data.total_generations || 0,
      last_generation_at: data.last_generation_at,
    };
  } catch (error) {
    console.error('Error getting user credits:', error);
    throw error;
  }
}

export async function createGeneration(
  userId: string,
  params: CreateGenerationParams
): Promise<GenerationResult> {
  try {
    const creditCheck = await checkUserCredits(userId, params.cost_credits);

    if (!creditCheck.hasCredits) {
      return {
        success: false,
        error: {
          message: ERROR_MESSAGES.INSUFFICIENT_CREDITS,
          code: 'INSUFFICIENT_CREDITS',
        },
      };
    }

    const { data, error } = await supabase
      .from('ai_generations')
      .insert({
        user_id: userId,
        prompt: params.prompt,
        aspect_ratio: params.aspect_ratio,
        model_version: RUNWAY_CONFIG.MODEL_VERSION,
        cost_credits: params.cost_credits,
        status: 'starting',
      })
      .select()
      .single();

    if (error) throw error;

    if (!creditCheck.isAdmin) {
      const { error: deductError } = await supabase.rpc('deduct_user_credits', {
        p_user_id: userId,
        p_credits_to_deduct: params.cost_credits,
      });

      if (deductError) {
        await supabase
          .from('ai_generations')
          .delete()
          .eq('id', data.id);
        throw deductError;
      }
    }

    return {
      success: true,
      generation: data as AIGeneration,
    };
  } catch (error) {
    console.error('Error creating generation:', error);
    return {
      success: false,
      error: {
        message: error instanceof Error ? error.message : ERROR_MESSAGES.GENERATION_FAILED,
      },
    };
  }
}

export async function startReplicatePrediction(
  prompt: string,
  aspectRatio: AspectRatio
): Promise<PredictionResult> {
  try {
    const response = await callEdgeFunction('/start', {
      prompt,
      aspect_ratio: aspectRatio,
    });

    const prediction = await response.json();

    return {
      success: true,
      prediction: prediction as ReplicatePrediction,
    };
  } catch (error) {
    console.error('Error starting Replicate prediction:', error);
    return {
      success: false,
      error: {
        message: error instanceof Error ? error.message : ERROR_MESSAGES.GENERATION_FAILED,
      },
    };
  }
}

export async function updateGeneration(
  generationId: string,
  params: UpdateGenerationParams
): Promise<GenerationResult> {
  try {
    const { data, error } = await supabase
      .from('ai_generations')
      .update(params)
      .eq('id', generationId)
      .select()
      .single();

    if (error) throw error;

    return {
      success: true,
      generation: data as AIGeneration,
    };
  } catch (error) {
    console.error('Error updating generation:', error);
    return {
      success: false,
      error: {
        message: error instanceof Error ? error.message : 'Failed to update generation',
      },
    };
  }
}

export async function checkPredictionStatus(predictionId: string): Promise<PredictionResult> {
  try {
    const response = await callEdgeFunction('/status', {
      predictionId,
    });

    const prediction = await response.json();

    return {
      success: true,
      prediction: prediction as ReplicatePrediction,
    };
  } catch (error) {
    console.error('Error checking prediction status:', error);
    return {
      success: false,
      error: {
        message: error instanceof Error ? error.message : 'Failed to check status',
      },
    };
  }
}

export async function uploadImageToStorage(
  imageUrl: string,
  userId: string,
  generationId: string
): Promise<string | null> {
  try {
    const response = await fetch(imageUrl);
    const blob = await response.blob();

    const fileName = `${STORAGE_CONFIG.FOLDER_PREFIX}/${userId}/${generationId}.png`;

    const { error: uploadError } = await supabase.storage
      .from(STORAGE_CONFIG.BUCKET_NAME)
      .upload(fileName, blob, {
        contentType: 'image/png',
        upsert: true,
      });

    if (uploadError) throw uploadError;

    const { data: { publicUrl } } = supabase.storage
      .from(STORAGE_CONFIG.BUCKET_NAME)
      .getPublicUrl(fileName);

    return publicUrl;
  } catch (error) {
    console.error('Error uploading image:', error);
    return null;
  }
}

export async function pollPrediction(
  predictionId: string,
  generationId: string,
  userId: string
): Promise<void> {
  let pollInterval = RUNWAY_CONFIG.POLL_INTERVAL_START;
  const startTime = Date.now();

  const poll = async (): Promise<void> => {
    if (Date.now() - startTime > RUNWAY_CONFIG.MAX_POLL_DURATION) {
      await updateGeneration(generationId, {
        status: 'failed',
        error_message: ERROR_MESSAGES.API_TIMEOUT,
      });
      return;
    }

    const result = await checkPredictionStatus(predictionId);

    if (!result.success || !result.prediction) {
      await updateGeneration(generationId, {
        status: 'failed',
        error_message: result.error?.message || 'Unknown error',
      });
      return;
    }

    const { status, output, error } = result.prediction;

    if (status === 'succeeded' && output) {
      const imageUrl = Array.isArray(output) ? output[0] : output;
      const storageUrl = await uploadImageToStorage(imageUrl, userId, generationId);

      await updateGeneration(generationId, {
        status: 'succeeded',
        image_url: storageUrl || imageUrl,
      });
      return;
    }

    if (status === 'failed' || status === 'canceled') {
      await updateGeneration(generationId, {
        status: status === 'canceled' ? 'cancelled' : 'failed',
        error_message: error || 'Generation failed',
      });
      return;
    }

    if (status === 'processing') {
      await updateGeneration(generationId, {
        status: 'processing',
      });
    }

    pollInterval = Math.min(
      pollInterval * RUNWAY_CONFIG.POLL_INTERVAL_MULTIPLIER,
      RUNWAY_CONFIG.POLL_INTERVAL_MAX
    );

    setTimeout(poll, pollInterval);
  };

  await poll();
}

export async function generateImage(
  userId: string,
  prompt: string,
  aspectRatio: AspectRatio
): Promise<GenerationResult> {
  try {
    const cost = calculateCost(aspectRatio);

    const createResult = await createGeneration(userId, {
      prompt,
      aspect_ratio: aspectRatio,
      cost_credits: cost,
    });

    if (!createResult.success || !createResult.generation) {
      return createResult;
    }

    const generationId = createResult.generation.id;

    const predictionResult = await startReplicatePrediction(prompt, aspectRatio);

    if (!predictionResult.success || !predictionResult.prediction) {
      await updateGeneration(generationId, {
        status: 'failed',
        error_message: predictionResult.error?.message || ERROR_MESSAGES.GENERATION_FAILED,
      });
      return {
        success: false,
        error: predictionResult.error,
      };
    }

    await updateGeneration(generationId, {
      replicate_prediction_id: predictionResult.prediction.id,
      status: 'processing',
    });

    pollPrediction(predictionResult.prediction.id, generationId, userId);

    return createResult;
  } catch (error) {
    console.error('Error in generateImage:', error);
    return {
      success: false,
      error: {
        message: error instanceof Error ? error.message : ERROR_MESSAGES.GENERATION_FAILED,
      },
    };
  }
}

export async function getUserGenerations(
  userId: string,
  filters?: GenerationFilters
): Promise<AIGeneration[]> {
  try {
    let query = supabase
      .from('ai_generations')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (filters?.status) {
      query = query.eq('status', filters.status);
    }

    if (filters?.startDate) {
      query = query.gte('created_at', filters.startDate);
    }

    if (filters?.endDate) {
      query = query.lte('created_at', filters.endDate);
    }

    if (filters?.limit) {
      query = query.limit(filters.limit);
    }

    if (filters?.offset) {
      query = query.range(filters.offset, filters.offset + (filters.limit || 10) - 1);
    }

    const { data, error } = await query;

    if (error) throw error;

    return data as AIGeneration[];
  } catch (error) {
    console.error('Error getting user generations:', error);
    return [];
  }
}

export async function getGenerationById(generationId: string): Promise<AIGeneration | null> {
  try {
    const { data, error } = await supabase
      .from('ai_generations')
      .select('*')
      .eq('id', generationId)
      .maybeSingle();

    if (error) throw error;

    return data as AIGeneration | null;
  } catch (error) {
    console.error('Error getting generation:', error);
    return null;
  }
}

export async function deleteGeneration(generationId: string, userId: string): Promise<boolean> {
  try {
    const generation = await getGenerationById(generationId);

    if (generation?.image_url) {
      const fileName = `${STORAGE_CONFIG.FOLDER_PREFIX}/${userId}/${generationId}.png`;
      await supabase.storage
        .from(STORAGE_CONFIG.BUCKET_NAME)
        .remove([fileName]);
    }

    const { error } = await supabase
      .from('ai_generations')
      .delete()
      .eq('id', generationId)
      .eq('user_id', userId);

    if (error) throw error;

    return true;
  } catch (error) {
    console.error('Error deleting generation:', error);
    return false;
  }
}

export async function cancelGeneration(generationId: string): Promise<boolean> {
  try {
    const generation = await getGenerationById(generationId);

    if (!generation || !generation.replicate_prediction_id) {
      return false;
    }

    if (generation.status === 'succeeded' || generation.status === 'failed') {
      return false;
    }

    await callEdgeFunction('/cancel', {
      predictionId: generation.replicate_prediction_id,
    });

    await updateGeneration(generationId, {
      status: 'cancelled',
    });

    return true;
  } catch (error) {
    console.error('Error cancelling generation:', error);
    return false;
  }
}
