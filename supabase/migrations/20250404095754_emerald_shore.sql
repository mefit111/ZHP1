/*
  # Add Camp Type Descriptions Table
  
  1. New Tables
    - `camp_type_descriptions`
      - `id` (uuid, primary key)
      - `type` (text) - Type of camp (hotelik, zlot, turnus)
      - `label` (text) - Display name
      - `description` (text) - Description text
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)
  
  2. Security
    - Enable RLS
    - Only admins can manage descriptions
    - Everyone can view descriptions
*/

BEGIN;

-- Create camp_type_descriptions table
CREATE TABLE IF NOT EXISTS public.camp_type_descriptions (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    type text NOT NULL UNIQUE CHECK (type IN ('hotelik', 'zlot', 'turnus')),
    label text NOT NULL,
    description text NOT NULL,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.camp_type_descriptions ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Camp type descriptions are viewable by everyone"
ON public.camp_type_descriptions
FOR SELECT
TO public
USING (true);

CREATE POLICY "Camp type descriptions are manageable by admins"
ON public.camp_type_descriptions
FOR ALL
TO authenticated
USING (EXISTS (
    SELECT 1 FROM admins
    WHERE user_id = auth.uid()
))
WITH CHECK (EXISTS (
    SELECT 1 FROM admins
    WHERE user_id = auth.uid()
));

-- Insert default descriptions
INSERT INTO public.camp_type_descriptions (type, label, description) VALUES
('hotelik', 'Hoteliki', 'Komfortowe zakwaterowanie z pełnym wyżywieniem i programem zajęć'),
('zlot', 'Zloty', 'Spotkania harcerskie pełne przygód i nowych znajomości'),
('turnus', 'Turnusy', 'Dłuższe obozy z bogatym programem i rozwojem umiejętności');

COMMIT;