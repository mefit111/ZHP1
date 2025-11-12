/*
  # Add Homepage Content Management
  
  1. New Tables
    - `homepage_sections`
      - `id` (uuid, primary key)
      - `type` (text) - Type of section (hero, features, stats)
      - `title` (text)
      - `subtitle` (text)
      - `content` (jsonb) - Flexible content storage
      - `order` (integer)
      - `is_visible` (boolean)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)
    
    - `homepage_images`
      - `id` (uuid, primary key)
      - `section_id` (uuid, references homepage_sections)
      - `url` (text)
      - `alt` (text)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)
  
  2. Security
    - Enable RLS
    - Only admins can manage content
    - Everyone can view content
*/

BEGIN;

-- Create homepage_sections table
CREATE TABLE IF NOT EXISTS public.homepage_sections (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    type text NOT NULL CHECK (type IN ('hero', 'features', 'stats', 'camps')),
    title text,
    subtitle text,
    content jsonb DEFAULT '{}',
    "order" integer NOT NULL,
    is_visible boolean DEFAULT true,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- Create homepage_images table
CREATE TABLE IF NOT EXISTS public.homepage_images (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    section_id uuid REFERENCES public.homepage_sections(id) ON DELETE CASCADE,
    url text NOT NULL,
    alt text,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.homepage_sections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.homepage_images ENABLE ROW LEVEL SECURITY;

-- Create policies for homepage_sections
CREATE POLICY "Homepage sections are viewable by everyone"
ON public.homepage_sections
FOR SELECT
TO public
USING (true);

CREATE POLICY "Homepage sections are manageable by admins"
ON public.homepage_sections
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

-- Create policies for homepage_images
CREATE POLICY "Homepage images are viewable by everyone"
ON public.homepage_images
FOR SELECT
TO public
USING (true);

CREATE POLICY "Homepage images are manageable by admins"
ON public.homepage_images
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

-- Insert default content
INSERT INTO public.homepage_sections (type, title, subtitle, content, "order", is_visible) VALUES
(
    'hero',
    'Przygoda Czeka na Ciebie',
    'Odkryj niezapomniane przygody na naszych obozach. Przeżyj wspaniałe chwile, zdobądź nowe umiejętności i zawrzyj przyjaźnie na całe życie.',
    '{
        "buttonText": "Zapisz się teraz",
        "buttonLink": "/registration",
        "backgroundImage": "https://images.unsplash.com/photo-1517164850305-99a3e65bb47e?auto=format&fit=crop&q=80"
    }'::jsonb,
    1,
    true
),
(
    'stats',
    'Nasze osiągnięcia',
    null,
    '{
        "stats": [
            {
                "value": 10000,
                "label": "Zadowolonych uczestników",
                "suffix": "+"
            },
            {
                "value": 40,
                "label": "Doświadczonych opiekunów",
                "suffix": "+"
            },
            {
                "value": 50,
                "label": "Lat doświadczenia",
                "suffix": ""
            },
            {
                "value": 100,
                "label": "Poziom satysfakcji",
                "suffix": "%"
            }
        ]
    }'::jsonb,
    2,
    true
),
(
    'features',
    'Dlaczego warto z nami jechać?',
    null,
    '{
        "features": [
            {
                "icon": "Calendar",
                "title": "Elastyczne terminy",
                "description": "Oferujemy różnorodne terminy w czasie wakacji i ferii zimowych, dopasowane do Twoich potrzeb"
            },
            {
                "icon": "Users",
                "title": "Doświadczona kadra",
                "description": "Nasi wykwalifikowani instruktorzy zapewnią bezpieczeństwo i niezapomniane wrażenia"
            },
            {
                "icon": "Shield",
                "title": "Bezpieczne otoczenie",
                "description": "Bezpieczeństwo uczestników jest naszym najwyższym priorytetem"
            }
        ]
    }'::jsonb,
    3,
    true
),
(
    'camps',
    'Nadchodzące obozy',
    null,
    '{
        "filters": {
            "showSearch": true,
            "showTypeFilter": true,
            "showDateFilter": true
        }
    }'::jsonb,
    4,
    true
);

COMMIT;