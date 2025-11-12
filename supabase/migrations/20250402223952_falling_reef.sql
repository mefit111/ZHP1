/*
  # Add Document Templates Support
  
  1. New Tables
    - `document_templates`
      - `id` (uuid, primary key)
      - `type` (text) - Type of template (payment_reminder, registration_card)
      - `name` (text) - Template name
      - `content` (text) - Template content in HTML format
      - `is_default` (boolean) - Whether this is the default template
      - `created_by` (uuid) - Reference to admin who created the template
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

  2. Security
    - Enable RLS
    - Only admins can manage templates
    - Everyone can view templates
*/

BEGIN;

-- Create document_templates table
CREATE TABLE IF NOT EXISTS public.document_templates (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    type text NOT NULL CHECK (type IN ('payment_reminder', 'registration_card')),
    name text NOT NULL,
    content text NOT NULL,
    is_default boolean DEFAULT false,
    created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- Create a partial unique index to ensure only one default template per type
CREATE UNIQUE INDEX idx_document_templates_default 
ON public.document_templates (type) 
WHERE is_default = true;

-- Enable RLS
ALTER TABLE public.document_templates ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Templates are viewable by everyone"
ON public.document_templates
FOR SELECT
TO public
USING (true);

CREATE POLICY "Templates are manageable by admins"
ON public.document_templates
FOR ALL
TO authenticated
USING (EXISTS (
    SELECT 1 FROM public.admins
    WHERE user_id = auth.uid()
))
WITH CHECK (EXISTS (
    SELECT 1 FROM public.admins
    WHERE user_id = auth.uid()
));

-- Create indexes
CREATE INDEX idx_document_templates_type ON public.document_templates(type);
CREATE INDEX idx_document_templates_created_by ON public.document_templates(created_by);

-- Insert default templates
INSERT INTO public.document_templates (type, name, content, is_default) VALUES
(
    'payment_reminder',
    'Domyślne upomnienie o płatności',
    '<!DOCTYPE html>
    <html>
    <head>
        <meta charset="UTF-8">
        <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; }
            .header { text-align: center; margin-bottom: 2em; }
            .content { margin: 2em 0; }
            .footer { margin-top: 2em; text-align: center; font-size: 0.9em; }
        </style>
    </head>
    <body>
        <div class="header">
            <h2>Upomnienie o płatności</h2>
            <p>{{current_date}}</p>
        </div>
        <div class="content">
            <p>Szanowni Państwo,</p>
            <p>Przypominamy o konieczności uregulowania płatności za obóz "{{camp_name}}" dla uczestnika {{participant_name}}.</p>
            <p>Szczegóły płatności:</p>
            <ul>
                <li>Kwota do zapłaty: {{amount}} PLN</li>
                <li>Termin płatności: {{due_date}}</li>
                <li>Numer konta: {{account_number}}</li>
            </ul>
            <p>W przypadku pytań prosimy o kontakt.</p>
        </div>
        <div class="footer">
            <p>Z harcerskim pozdrowieniem,<br>Komenda Obozu</p>
        </div>
    </body>
    </html>',
    true
),
(
    'registration_card',
    'Domyślna karta zgłoszeniowa',
    '<!DOCTYPE html>
    <html>
    <head>
        <meta charset="UTF-8">
        <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; }
            .header { text-align: center; margin-bottom: 2em; }
            .section { margin: 1.5em 0; }
            .field { margin: 0.5em 0; }
            .label { font-weight: bold; }
            .signature { margin-top: 3em; }
            .footer { margin-top: 2em; font-size: 0.8em; }
        </style>
    </head>
    <body>
        <div class="header">
            <h1>Karta Zgłoszeniowa</h1>
            <h2>{{camp_name}}</h2>
            <p>{{camp_dates}}</p>
        </div>
        
        <div class="section">
            <h3>Dane uczestnika</h3>
            <div class="field">
                <span class="label">Imię i nazwisko:</span> {{participant_name}}
            </div>
            <div class="field">
                <span class="label">PESEL:</span> {{pesel}}
            </div>
            <div class="field">
                <span class="label">Data urodzenia:</span> {{birth_date}}
            </div>
            <div class="field">
                <span class="label">Adres:</span> {{address}}
            </div>
        </div>

        <div class="section">
            <h3>Dane kontaktowe</h3>
            <div class="field">
                <span class="label">Email:</span> {{email}}
            </div>
            <div class="field">
                <span class="label">Telefon:</span> {{phone}}
            </div>
        </div>

        <div class="section">
            <h3>Informacje dodatkowe</h3>
            <div class="field">
                <span class="label">Status w ZHP:</span> {{zhp_status}}
            </div>
            <div class="field">
                <span class="label">Uwagi (choroby, alergie, leki):</span><br>
                {{notes}}
            </div>
        </div>

        <div class="signature">
            <p>Data: ________________</p>
            <p>Podpis rodzica/opiekuna: ________________</p>
        </div>

        <div class="footer">
            <p>Wyrażam zgodę na przetwarzanie danych osobowych zawartych w karcie zgłoszeniowej na potrzeby niezbędne do zapewnienia bezpieczeństwa i ochrony zdrowia uczestnika wypoczynku (zgodnie z ustawą z dnia 10 maja 2018 r. o ochronie danych osobowych (Dz. U. z 2018 r. poz. 1000)).</p>
        </div>
    </body>
    </html>',
    true
);

COMMIT;