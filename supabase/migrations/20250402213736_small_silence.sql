/*
  # Create Initial Schema Migration
  
  1. New Tables
    - `admins`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references auth.users)
      - `role` (text)
      - `permissions` (jsonb)
      - `last_login` (timestamptz)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)
    
    - `camps`
      - `id` (uuid, primary key)
      - `name` (text)
      - `start_date` (date)
      - `end_date` (date)
      - `price` (numeric)
      - `capacity` (integer)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)
  
  2. Security
    - Enable RLS on both tables
    - Add appropriate policies
*/

BEGIN;

-- Create admins table first (required for RLS policies)
CREATE TABLE IF NOT EXISTS public.admins (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
    role text NOT NULL CHECK (role IN ('admin', 'super_admin')),
    permissions jsonb DEFAULT '{}',
    last_login timestamptz,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now(),
    UNIQUE(user_id)
);

-- Enable RLS on admins table
ALTER TABLE public.admins ENABLE ROW LEVEL SECURITY;

-- Create policies for admins table
CREATE POLICY "Admins can view all records" ON public.admins
    FOR SELECT TO authenticated
    USING (EXISTS (
        SELECT 1 FROM public.admins WHERE user_id = auth.uid()
    ));

CREATE POLICY "Super admins can manage admins" ON public.admins
    FOR ALL TO authenticated
    USING (EXISTS (
        SELECT 1 FROM public.admins
        WHERE user_id = auth.uid() AND role = 'super_admin'
    ))
    WITH CHECK (EXISTS (
        SELECT 1 FROM public.admins
        WHERE user_id = auth.uid() AND role = 'super_admin'
    ));

-- Create camps table
CREATE TABLE IF NOT EXISTS public.camps (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    name text NOT NULL,
    start_date date NOT NULL,
    end_date date NOT NULL,
    price numeric NOT NULL CHECK (price > 0),
    capacity integer NOT NULL CHECK (capacity > 0),
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now(),
    CONSTRAINT valid_dates CHECK (end_date >= start_date)
);

-- Enable RLS on camps table
ALTER TABLE public.camps ENABLE ROW LEVEL SECURITY;

-- Create policies for camps table
CREATE POLICY "Camps are viewable by everyone" ON public.camps
    FOR SELECT TO public USING (true);

CREATE POLICY "Camps are manageable by admins" ON public.camps
    FOR ALL TO authenticated
    USING (EXISTS (
        SELECT 1 FROM public.admins WHERE user_id = auth.uid()
    ));

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_camps_dates ON public.camps(start_date, end_date);
CREATE INDEX IF NOT EXISTS idx_admins_user_id ON public.admins(user_id);

-- Insert sample data
INSERT INTO public.camps (name, start_date, end_date, price, capacity) VALUES
    ('ZIMOWISKO W MAŁE CICHE', '2025-01-20', '2025-01-27', 1899, 45),
    ('OBÓZ NARCIARSKI W ZAKOPANEM', '2025-02-10', '2025-02-17', 2199, 40),
    ('OBÓZ ŻEGLARSKI W PRZEBRNIE', '2025-07-01', '2025-07-14', 2899, 30),
    ('OBÓZ W PRZEBRNIE', '2025-07-15', '2025-07-28', 2499, 60),
    ('OBÓZ SURVIVALOWY W BIESZCZADACH', '2025-07-20', '2025-08-02', 2699, 25),
    ('KOLONIA W MAŁE CICHE', '2025-08-01', '2025-08-14', 2299, 50),
    ('OBÓZ JĘZYKOWY W MAŁE CICHE', '2025-08-16', '2025-08-29', 2599, 35),
    ('OBÓZ WSPINACZKOWY W TATRACH', '2025-08-20', '2025-08-31', 2799, 20);

COMMIT;