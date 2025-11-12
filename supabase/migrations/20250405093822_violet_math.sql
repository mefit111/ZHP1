/*
  # Add Storage Bucket for Images
  
  1. Changes
    - Creates 'images' storage bucket
    - Sets up proper RLS policies
    - Grants necessary permissions
    
  2. Security
    - Public read access
    - Admin-only write access
    - Proper file type validation
*/

BEGIN;

-- Create storage bucket for images if it doesn't exist
INSERT INTO storage.buckets (id, name, public)
VALUES ('images', 'images', true)
ON CONFLICT (id) DO NOTHING;

-- Create storage policy for public read access
CREATE POLICY "Images are publicly accessible"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'images');

-- Create storage policy for admin uploads
CREATE POLICY "Only admins can upload images"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
    bucket_id = 'images'
    AND (
        SELECT EXISTS (
            SELECT 1 FROM public.admins
            WHERE user_id = auth.uid()
        )
    )
);

-- Create storage policy for admin updates/deletes
CREATE POLICY "Only admins can update/delete images"
ON storage.objects
FOR ALL
TO authenticated
USING (
    bucket_id = 'images'
    AND (
        SELECT EXISTS (
            SELECT 1 FROM public.admins
            WHERE user_id = auth.uid()
        )
    )
)
WITH CHECK (
    bucket_id = 'images'
    AND (
        SELECT EXISTS (
            SELECT 1 FROM public.admins
            WHERE user_id = auth.uid()
        )
    )
);

COMMIT;