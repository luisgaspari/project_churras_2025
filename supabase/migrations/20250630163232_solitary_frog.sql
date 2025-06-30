/*
  # Create service images storage bucket

  1. Storage
    - Create `service_images` bucket for storing service photos
    - Enable public access for service images
    - Set up RLS policies for service images

  2. Security
    - Only authenticated users can upload images
    - Anyone can view service images
    - Users can only delete their own images
*/

-- Create service_images bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('service_images', 'service_images', true);

-- Allow authenticated users to upload service images
CREATE POLICY "Authenticated users can upload service images"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'service_images');

-- Allow anyone to view service images
CREATE POLICY "Anyone can view service images"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'service_images');

-- Allow users to delete their own service images
CREATE POLICY "Users can delete their own service images"
ON storage.objects
FOR DELETE
TO authenticated
USING (bucket_id = 'service_images' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Allow users to update their own service images
CREATE POLICY "Users can update their own service images"
ON storage.objects
FOR UPDATE
TO authenticated
USING (bucket_id = 'service_images' AND auth.uid()::text = (storage.foldername(name))[1]);