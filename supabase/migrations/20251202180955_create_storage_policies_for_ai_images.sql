/*
  # Create Storage Policies for AI Generated Images

  ## Overview
  This migration sets up storage bucket policies for the ai-generated-images bucket
  to allow authenticated users to upload their generated images and allow public
  access to view the images.

  ## 1. Storage Policies
    - Authenticated users can insert (upload) images to their own folders
    - Authenticated users can update their own images
    - Authenticated users can delete their own images
    - Public users can view all images (for sharing)

  ## 2. Security Considerations
    - Users can only upload to their own user_id folder
    - File size limits enforced at application level
    - Image types validated at application level
    - RLS ensures users only manage their own files

  ## 3. Folder Structure
    - Pattern: generations/{user_id}/{generation_id}.png
    - This ensures clear ownership and organization
*/

-- Policy: Allow authenticated users to upload images to their own folder
CREATE POLICY "Users can upload own images"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'ai-generated-images' AND
  (storage.foldername(name))[1] = 'generations' AND
  (storage.foldername(name))[2] = auth.uid()::text
);

-- Policy: Allow authenticated users to update their own images
CREATE POLICY "Users can update own images"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'ai-generated-images' AND
  (storage.foldername(name))[1] = 'generations' AND
  (storage.foldername(name))[2] = auth.uid()::text
)
WITH CHECK (
  bucket_id = 'ai-generated-images' AND
  (storage.foldername(name))[1] = 'generations' AND
  (storage.foldername(name))[2] = auth.uid()::text
);

-- Policy: Allow authenticated users to delete their own images
CREATE POLICY "Users can delete own images"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'ai-generated-images' AND
  (storage.foldername(name))[1] = 'generations' AND
  (storage.foldername(name))[2] = auth.uid()::text
);

-- Policy: Allow public access to view all images
CREATE POLICY "Anyone can view images"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'ai-generated-images');

-- Policy: Admin can manage all images
CREATE POLICY "Admin can manage all images"
ON storage.objects
FOR ALL
TO authenticated
USING (
  bucket_id = 'ai-generated-images' AND
  EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid()
    AND users.is_admin = true
  )
);
