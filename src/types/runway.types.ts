export type AspectRatio = '16:9' | '9:16' | '1:1' | '4:3' | '3:4' | '21:9' | '9:21';

export type GenerationStatus = 'starting' | 'processing' | 'succeeded' | 'failed' | 'cancelled';

export interface RunwayGenerationRequest {
  prompt: string;
  aspectRatio: AspectRatio;
  modelVersion?: string;
}

export interface RunwayGenerationOptions {
  prompt: string;
  aspect_ratio?: AspectRatio;
  duration?: number;
  seed?: number;
}

export interface ReplicatePrediction {
  id: string;
  status: 'starting' | 'processing' | 'succeeded' | 'failed' | 'canceled';
  output?: string | string[];
  error?: string;
  logs?: string;
  created_at: string;
  started_at?: string;
  completed_at?: string;
}

export interface AIGeneration {
  id: string;
  user_id: string;
  prompt: string;
  aspect_ratio: AspectRatio;
  model_version: string;
  image_url: string | null;
  replicate_prediction_id: string | null;
  status: GenerationStatus;
  error_message: string | null;
  cost_credits: number;
  created_at: string;
  completed_at: string | null;
}

export interface GenerationHistory {
  id: string;
  prompt: string;
  aspect_ratio: AspectRatio;
  image_url: string | null;
  status: GenerationStatus;
  cost_credits: number;
  created_at: string;
  completed_at: string | null;
}

export interface CreateGenerationParams {
  prompt: string;
  aspect_ratio: AspectRatio;
  cost_credits: number;
}

export interface UpdateGenerationParams {
  status?: GenerationStatus;
  image_url?: string;
  error_message?: string;
  replicate_prediction_id?: string;
  completed_at?: string;
}

export interface UserCredits {
  credits: number;
  total_generations: number;
  last_generation_at: string | null;
}

export interface GenerationFilters {
  status?: GenerationStatus;
  startDate?: string;
  endDate?: string;
  limit?: number;
  offset?: number;
}

export interface GenerationResult {
  success: boolean;
  generation?: AIGeneration;
  error?: {
    message: string;
    code?: string;
  };
}

export interface PredictionResult {
  success: boolean;
  prediction?: ReplicatePrediction;
  error?: {
    message: string;
    code?: string;
  };
}

export interface CreditCheckResult {
  hasCredits: boolean;
  currentCredits: number;
  requiredCredits: number;
  isAdmin: boolean;
}

export interface AspectRatioOption {
  value: AspectRatio;
  label: string;
  width: number;
  height: number;
  cost: number;
}
