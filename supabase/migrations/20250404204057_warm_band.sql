/*
  # Add Notifications System
  
  1. New Tables
    - `notifications`
      - `id` (uuid, primary key)
      - `registration_id` (uuid, references registrations)
      - `type` (text) - Type of notification (payment, confirmation, etc.)
      - `subject` (text) - Email subject
      - `content` (text) - Email content
      - `sent_at` (timestamptz) - When the notification was sent
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)
  
  2. Security
    - Enable RLS
    - Add appropriate policies
    - Create necessary indexes
*/

BEGIN;

-- Create notifications table
CREATE TABLE IF NOT EXISTS public.notifications (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    registration_id uuid REFERENCES public.registrations(id) ON DELETE CASCADE,
    type text NOT NULL CHECK (type IN ('payment', 'confirmation', 'reminder', 'custom')),
    subject text NOT NULL,
    content text NOT NULL,
    sent_at timestamptz DEFAULT now(),
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Notifications are viewable by admins"
ON public.notifications
FOR SELECT
TO authenticated
USING (EXISTS (
    SELECT 1 FROM admins
    WHERE user_id = auth.uid()
));

CREATE POLICY "Notifications are manageable by admins"
ON public.notifications
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

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_notifications_registration_id 
ON public.notifications(registration_id);

CREATE INDEX IF NOT EXISTS idx_notifications_type 
ON public.notifications(type);

CREATE INDEX IF NOT EXISTS idx_notifications_sent_at 
ON public.notifications(sent_at);

COMMIT;