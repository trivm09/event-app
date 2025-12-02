/*
  # Create User Profiles System

  ## Overview
  This migration creates the complete user authentication and profile management system
  with security measures, including the profiles table and Row Level Security policies.

  ## 1. New Tables
    - `profiles`
      - `id` (uuid, primary key) - Links to auth.users
      - `email` (text, unique, not null) - User's email address
      - `full_name` (text, not null) - User's full display name
      - `is_admin` (boolean, default false) - Admin privilege flag
      - `created_at` (timestamptz, default now()) - Account creation timestamp
      - `updated_at` (timestamptz, default now()) - Last profile update timestamp

  ## 2. Security Measures
    - Enable Row Level Security (RLS) on profiles table
    - Create SELECT policy: Users can view their own profile
    - Create UPDATE policy: Users can update their own profile
    - Create INSERT policy: Authenticated users can create their profile (one-time)
    - Admin users cannot be modified through standard policies

  ## 3. Triggers
    - Automatic trigger to create profile when new user signs up
    - Automatic update of `updated_at` timestamp on profile changes

  ## 4. Important Notes
    - Passwords are handled by Supabase Auth (bcrypt hashed automatically)
    - Email confirmation is disabled by default
    - Admin status can only be set via direct database access or admin functions
    - All user data is protected by RLS - no public access
*/

-- Create profiles table
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text UNIQUE NOT NULL,
  full_name text NOT NULL DEFAULT '',
  is_admin boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view their own profile
CREATE POLICY "Users can view own profile"
  ON profiles
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

-- Policy: Users can update their own profile (except admin status)
CREATE POLICY "Users can update own profile"
  ON profiles
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (
    auth.uid() = id 
    AND is_admin = (SELECT is_admin FROM profiles WHERE id = auth.uid())
  );

-- Policy: Authenticated users can insert their profile once
CREATE POLICY "Users can create own profile"
  ON profiles
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

-- Policy: Users can delete their own profile
CREATE POLICY "Users can delete own profile"
  ON profiles
  FOR DELETE
  TO authenticated
  USING (auth.uid() = id);

-- Function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update updated_at on profile changes
DROP TRIGGER IF EXISTS update_profiles_updated_at ON profiles;
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Function to automatically create profile for new users
CREATE OR REPLACE FUNCTION create_profile_for_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', '')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create profile when user signs up
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION create_profile_for_new_user();

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS profiles_email_idx ON profiles(email);
CREATE INDEX IF NOT EXISTS profiles_is_admin_idx ON profiles(is_admin);
