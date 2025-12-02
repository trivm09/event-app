import 'jsr:@supabase/functions-js/edge-runtime.d.ts';
import Replicate from 'npm:replicate@1.4.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Client-Info, Apikey',
};

interface GenerateRequest {
  prompt: string;
  aspect_ratio: string;
}

interface PredictionRequest {
  predictionId: string;
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const url = new URL(req.url);
    const path = url.pathname;

    const replicateToken = Deno.env.get('REPLICATE_API_TOKEN');
    if (!replicateToken) {
      throw new Error('REPLICATE_API_TOKEN not configured');
    }

    const replicate = new Replicate({ auth: replicateToken });

    if (path.endsWith('/start') && req.method === 'POST') {
      const body: GenerateRequest = await req.json();

      const prediction = await replicate.predictions.create({
        model: 'black-forest-labs/flux-pro',
        input: {
          prompt: body.prompt,
          aspect_ratio: body.aspect_ratio,
          output_format: 'png',
          output_quality: 90,
        },
      });

      return new Response(
        JSON.stringify(prediction),
        {
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json',
          },
        }
      );
    }

    if (path.endsWith('/status') && req.method === 'POST') {
      const body: PredictionRequest = await req.json();

      const prediction = await replicate.predictions.get(body.predictionId);

      return new Response(
        JSON.stringify(prediction),
        {
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json',
          },
        }
      );
    }

    if (path.endsWith('/cancel') && req.method === 'POST') {
      const body: PredictionRequest = await req.json();

      const prediction = await replicate.predictions.cancel(body.predictionId);

      return new Response(
        JSON.stringify(prediction),
        {
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json',
          },
        }
      );
    }

    return new Response(
      JSON.stringify({ error: 'Not found' }),
      {
        status: 404,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      }
    );
  } catch (error) {
    console.error('Error:', error);
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : 'Unknown error',
      }),
      {
        status: 500,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      }
    );
  }
});
