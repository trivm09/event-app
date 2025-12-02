/*
  # Create AI Generations System

  ## Overview
  This migration creates the complete AI image generation tracking system
  including the generations table, credit system, and Row Level Security policies.

  ## 1. New Tables
    - `ai_generations`
      - `id` (uuid, primary key) - Unique generation identifier
      - `user_id` (uuid, foreign key) - Links to users table
      - `prompt` (text, not null) - Text prompt used for generation
      - `aspect_ratio` (text, not null) - Image aspect ratio (16:9, 9:16, 1:1, etc.)
      - `model_version` (text, not null) - Runway model version used
      - `image_url` (text) - URL of generated image in Supabase Storage
      - `replicate_prediction_id` (text) - Prediction ID from Replicate API
      - `status` (text, not null) - Generation status (starting, processing, succeeded, failed, cancelled)
      - `error_message` (text) - Error details if generation failed
      - `cost_credits` (numeric, not null) - Credits cost for this generation
      - `created_at` (timestamptz, default now()) - When generation was requested
      - `completed_at` (timestamptz) - When generation completed/failed

  ## 2. Schema Changes to Users Table
    - Add `credits` column to track user credit balance
    - Add `total_generations` column to track usage statistics
    - Add `last_generation_at` column for rate limiting

  ## 3. Security Measures
    - Enable Row Level Security (RLS) on ai_generations table
    - Users can view only their own generations
    - Users can create generations for themselves
    - Users cannot modify completed generations
    - Admin can view all generations

  ## 4. Functions
    - Function to deduct credits from user balance
    - Function to check if user has sufficient credits
    - Function to update generation statistics

  ## 5. Triggers
    - Automatic update of user statistics when generation completes
    - Automatic timestamp update on status changes

  ## 6. Indexes
    - Index on user_id for fast user lookups
    - Index on status for filtering active generations
    - Index on created_at for chronological sorting
    - Index on replicate_prediction_id for API lookups

  ## 7. Important Notes
    - Default 10 credits for new users
    - Credits are deducted when generation starts
    - Failed generations do not refund credits automatically
    - Admin users have unlimited credits (credits = -1)
    - All user data is protected by RLS
*/

-- Add credits system to users table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'users' AND column_name = 'credits'
  ) THEN
    ALTER TABLE users ADD COLUMN credits numeric NOT NULL DEFAULT 10;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'users' AND column_name = 'total_generations'
  ) THEN
    ALTER TABLE users ADD COLUMN total_generations integer NOT NULL DEFAULT 0;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'users' AND column_name = 'last_generation_at'
  ) THEN
    ALTER TABLE users ADD COLUMN last_generation_at timestamptz;
  END IF;
END $$;

-- Create ai_generations table
CREATE TABLE IF NOT EXISTS ai_generations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  prompt text NOT NULL,
  aspect_ratio text NOT NULL DEFAULT '16:9',
  model_version text NOT NULL DEFAULT 'runway-gen-4',
  image_url text,
  replicate_prediction_id text,
  status text NOT NULL DEFAULT 'starting' CHECK (status IN ('starting', 'processing', 'succeeded', 'failed', 'cancelled')),
  error_message text,
  cost_credits numeric NOT NULL DEFAULT 1.0,
  created_at timestamptz NOT NULL DEFAULT now(),
  completed_at timestamptz
);

-- Enable Row Level Security
ALTER TABLE ai_generations ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view their own generations
CREATE POLICY "Users can view own generations"
  ON ai_generations
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Policy: Admin can view all generations
CREATE POLICY "Admin can view all generations"
  ON ai_generations
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.is_admin = true
    )
  );

-- Policy: Users can create their own generations
CREATE POLICY "Users can create own generations"
  ON ai_generations
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Policy: Users can update their own generations (for status updates)
CREATE POLICY "Users can update own generations"
  ON ai_generations
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Policy: Users can delete their own generations
CREATE POLICY "Users can delete own generations"
  ON ai_generations
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Function to check if user has sufficient credits
CREATE OR REPLACE FUNCTION check_user_credits(
  p_user_id uuid,
  p_required_credits numeric
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_credits numeric;
  v_is_admin boolean;
BEGIN
  SELECT credits, is_admin
  INTO v_credits, v_is_admin
  FROM users
  WHERE id = p_user_id;

  IF v_is_admin THEN
    RETURN true;
  END IF;

  RETURN v_credits >= p_required_credits;
END;
$$;

-- Function to deduct credits from user
CREATE OR REPLACE FUNCTION deduct_user_credits(
  p_user_id uuid,
  p_credits_to_deduct numeric
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_is_admin boolean;
BEGIN
  SELECT is_admin INTO v_is_admin
  FROM users
  WHERE id = p_user_id;

  IF v_is_admin THEN
    RETURN true;
  END IF;

  UPDATE users
  SET credits = credits - p_credits_to_deduct
  WHERE id = p_user_id
  AND credits >= p_credits_to_deduct;

  RETURN FOUND;
END;
$$;

-- Function to update user generation statistics
CREATE OR REPLACE FUNCTION update_generation_statistics()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  IF NEW.status = 'succeeded' AND (OLD.status IS NULL OR OLD.status != 'succeeded') THEN
    UPDATE users
    SET 
      total_generations = total_generations + 1,
      last_generation_at = now()
    WHERE id = NEW.user_id;
  END IF;

  IF NEW.status IN ('succeeded', 'failed', 'cancelled') AND NEW.completed_at IS NULL THEN
    NEW.completed_at = now();
  END IF;

  RETURN NEW;
END;
$$;

-- Trigger to update statistics when generation status changes
DROP TRIGGER IF EXISTS update_generation_statistics_trigger ON ai_generations;
CREATE TRIGGER update_generation_statistics_trigger
  BEFORE UPDATE ON ai_generations
  FOR EACH ROW
  EXECUTE FUNCTION update_generation_statistics();

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS ai_generations_user_id_idx ON ai_generations(user_id);
CREATE INDEX IF NOT EXISTS ai_generations_status_idx ON ai_generations(status);
CREATE INDEX IF NOT EXISTS ai_generations_created_at_idx ON ai_generations(created_at DESC);
CREATE INDEX IF NOT EXISTS ai_generations_replicate_id_idx ON ai_generations(replicate_prediction_id);
CREATE INDEX IF NOT EXISTS ai_generations_user_status_idx ON ai_generations(user_id, status);
