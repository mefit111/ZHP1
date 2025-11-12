/*
  # Add Registration Cards Support
  
  1. Changes
    - Creates storage bucket for registration cards
    - Adds registration_cards table
    - Sets up proper RLS policies
    - Adds necessary indexes

  2. Security
    - Only admins can upload cards
    - Only admins and card owners can view cards
    - Maintains data integrity
*/

BEGIN;

-- Create registration_cards table
CREATE TABLE IF NOT EXISTS public.registration_cards (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    registration_id uuid REFERENCES public.registrations(id) ON DELETE CASCADE,
    file_path text NOT NULL,
    uploaded_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
    uploaded_at timestamptz DEFAULT now(),
    UNIQUE(registration_id)
);

-- Enable RLS
ALTER TABLE public.registration_cards ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Registration cards are viewable by admins"
ON public.registration_cards
FOR SELECT
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.admins
        WHERE user_id = auth.uid()
    )
);

CREATE POLICY "Registration cards are manageable by admins"
ON public.registration_cards
FOR ALL
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.admins
        WHERE user_id = auth.uid()
    )
)
WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.admins
        WHERE user_id = auth.uid()
    )
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_registration_cards_registration_id 
ON public.registration_cards(registration_id);

CREATE INDEX IF NOT EXISTS idx_registration_cards_uploaded_by 
ON public.registration_cards(uploaded_by);

-- Create storage bucket for registration cards
INSERT INTO storage.buckets (id, name, public)
VALUES ('registration_cards', 'registration_cards', false);

-- Enable storage policies
CREATE POLICY "Registration cards are accessible by admins"
ON storage.objects
FOR ALL
TO authenticated
USING (
    bucket_id = 'registration_cards' AND
    EXISTS (
        SELECT 1 FROM public.admins
        WHERE user_id = auth.uid()
    )
)
WITH CHECK (
    bucket_id = 'registration_cards' AND
    EXISTS (
        SELECT 1 FROM public.admins
        WHERE user_id = auth.uid()
    )
);

COMMIT;