import { supabase } from './supabase';
import { createNotification } from './notifications';
import { format } from 'date-fns';

// Types
export interface AdminData {
  id: string;
  user_id: string;
  role: 'admin' | 'super_admin';
  permissions: Record<string, boolean>;
  last_login: string;
}

export interface CampData {
  id?: string;
  name: string;
  type: 'hotelik' | 'zlot' | 'turnus';
  location: string;
  start_date: string;
  end_date: string;
  price: number;
  capacity: number;
}

export interface RegistrationData {
  id?: string;
  camp_id: string;
  first_name: string;
  last_name: string;
  pesel: string;
  birth_date: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  postal_code: string;
  zhp_status?: string;
  notes?: string;
  payment_status?: string;
  registration_status?: string;
}

export interface DocumentTemplate {
  id: string;
  type: 'payment_reminder' | 'registration_card';
  name: string;
  content: string;
  is_default: boolean;
  created_by?: string;
  created_at: string;
  updated_at: string;
}

// Template Management
export async function getTemplates(type: 'payment_reminder' | 'registration_card') {
  try {
    const { data, error } = await supabase
      .from('document_templates')
      .select('*')
      .eq('type', type)
      .order('is_default', { ascending: false })
      .order('created_at', { ascending: false });

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error('Error fetching templates:', error);
    return { data: null, error };
  }
}

export async function createTemplate(template: Omit<DocumentTemplate, 'id' | 'created_at' | 'updated_at'>) {
  try {
    // If this is set as default, unset other defaults of the same type
    if (template.is_default) {
      await supabase
        .from('document_templates')
        .update({ is_default: false })
        .eq('type', template.type);
    }

    const { data, error } = await supabase
      .from('document_templates')
      .insert([template])
      .select()
      .single();

    if (error) throw error;

    await createNotification({
      title: 'Nowy szablon',
      message: `Utworzono nowy szablon: ${template.name}`,
      severity: 'success'
    });

    return { data, error: null };
  } catch (error) {
    console.error('Error creating template:', error);
    return { data: null, error };
  }
}

export async function updateTemplate(id: string, template: Partial<DocumentTemplate>) {
  try {
    // If this is set as default, unset other defaults of the same type
    if (template.is_default) {
      await supabase
        .from('document_templates')
        .update({ is_default: false })
        .eq('type', template.type);
    }

    const { data, error } = await supabase
      .from('document_templates')
      .update(template)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    await createNotification({
      title: 'Aktualizacja szablonu',
      message: `Zaktualizowano szablon: ${template.name || data.name}`,
      severity: 'success'
    });

    return { data, error: null };
  } catch (error) {
    console.error('Error updating template:', error);
    return { data: null, error };
  }
}

export async function deleteTemplate(id: string) {
  try {
    const { data, error } = await supabase
      .from('document_templates')
      .delete()
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    await createNotification({
      title: 'Usunięcie szablonu',
      message: `Usunięto szablon: ${data.name}`,
      severity: 'warning'
    });

    return { data, error: null };
  } catch (error) {
    console.error('Error deleting template:', error);
    return { data: null, error };
  }
}

export async function generateDocument(templateId: string, registrationId: string) {
  try {
    // Get template
    const { data: template, error: templateError } = await supabase
      .from('document_templates')
      .select('*')
      .eq('id', templateId)
      .single();

    if (templateError) throw templateError;

    // Get registration data
    const { data: registration, error: registrationError } = await supabase
      .from('registrations')
      .select(`
        *,
        camp:camp_id (
          name,
          start_date,
          end_date,
          price
        )
      `)
      .eq('id', registrationId)
      .single();

    if (registrationError) throw registrationError;

    // Prepare template variables
    const variables = {
      current_date: format(new Date(), 'dd.MM.yyyy'),
      camp_name: registration.camp.name,
      camp_dates: `${format(new Date(registration.camp.start_date), 'dd.MM.yyyy')} - ${format(new Date(registration.camp.end_date), 'dd.MM.yyyy')}`,
      participant_name: `${registration.first_name} ${registration.last_name}`,
      amount: registration.camp.price,
      due_date: format(new Date(registration.camp.start_date), 'dd.MM.yyyy'),
      account_number: '12 3456 7890 1234 5678 9012 3456',
      pesel: registration.pesel,
      birth_date: format(new Date(registration.birth_date), 'dd.MM.yyyy'),
      email: registration.email,
      phone: registration.phone,
      address: `${registration.address}, ${registration.postal_code} ${registration.city}`,
      zhp_status: registration.zhp_status || 'Brak',
      notes: registration.notes || ''
    };

    // Replace variables in template
    let content = template.content;
    Object.entries(variables).forEach(([key, value]) => {
      content = content.replace(new RegExp(`{{${key}}}`, 'g'), value);
    });

    return { data: content, error: null };
  } catch (error) {
    console.error('Error generating document:', error);
    return { data: null, error };
  }
}

// Camp Management
export async function createCamp(campData: CampData) {
  try {
    const { data, error } = await supabase
      .from('camps')
      .insert([campData])
      .select()
      .single();

    if (error) throw error;

    await createNotification({
      title: 'Nowy obóz',
      message: `Utworzono nowy obóz: ${campData.name}`,
      severity: 'success'
    });

    return { data, error: null };
  } catch (error) {
    console.error('Error creating camp:', error);
    return { data: null, error };
  }
}

export async function updateCamp(id: string, campData: Partial<CampData>) {
  try {
    const { data, error } = await supabase
      .from('camps')
      .update(campData)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    await createNotification({
      title: 'Aktualizacja obozu',
      message: `Zaktualizowano obóz: ${campData.name || data.name}`,
      severity: 'success'
    });

    return { data, error: null };
  } catch (error) {
    console.error('Error updating camp:', error);
    return { data: null, error };
  }
}

export async function deleteCamp(id: string) {
  try {
    const { data, error } = await supabase
      .from('camps')
      .delete()
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    await createNotification({
      title: 'Usunięcie obozu',
      message: `Usunięto obóz: ${data.name}`,
      severity: 'warning'
    });

    return { data, error: null };
  } catch (error) {
    console.error('Error deleting camp:', error);
    return { data: null, error };
  }
}

// Registration Management
export async function updateRegistration(id: string, registrationData: Partial<RegistrationData>) {
  try {
    const { data, error } = await supabase
      .from('registrations')
      .update(registrationData)
      .eq('id', id)
      .select(`
        *,
        camp:camp_id (
          name
        )
      `)
      .single();

    if (error) throw error;

    await createNotification({
      title: 'Aktualizacja zgłoszenia',
      message: `Zaktualizowano zgłoszenie: ${data.first_name} ${data.last_name}`,
      severity: 'success'
    });

    return { data, error: null };
  } catch (error) {
    console.error('Error updating registration:', error);
    return { data: null, error };
  }
}

export async function deleteRegistration(id: string) {
  try {
    const { data, error } = await supabase
      .from('registrations')
      .delete()
      .eq('id', id)
      .select(`
        *,
        camp:camp_id (
          name
        )
      `)
      .single();

    if (error) throw error;

    await createNotification({
      title: 'Usunięcie zgłoszenia',
      message: `Usunięto zgłoszenie: ${data.first_name} ${data.last_name}`,
      severity: 'warning'
    });

    return { data, error: null };
  } catch (error) {
    console.error('Error deleting registration:', error);
    return { data: null, error };
  }
}

export async function uploadRegistrationCard(registrationId: string, file: File) {
  try {
    const filePath = `${registrationId}/${file.name}`;
    
    // Upload file to storage
    const { error: uploadError } = await supabase.storage
      .from('registration_cards')
      .upload(filePath, file);

    if (uploadError) throw uploadError;

    // Create database record
    const { error: dbError } = await supabase
      .from('registration_cards')
      .insert([{
        registration_id: registrationId,
        file_path: filePath,
        uploaded_by: (await supabase.auth.getUser()).data.user?.id
      }]);

    if (dbError) throw dbError;

    await createNotification({
      title: 'Dodano kartę zgłoszeniową',
      message: 'Karta zgłoszeniowa została pomyślnie dodana',
      severity: 'success'
    });

    return { error: null };
  } catch (error) {
    console.error('Error uploading registration card:', error);
    return { error };
  }
}

export async function getRegistrationCard(registrationId: string) {
  try {
    const { data: cardData, error: cardError } = await supabase
      .from('registration_cards')
      .select('file_path')
      .eq('registration_id', registrationId)
      .single();

    if (cardError) throw cardError;
    if (!cardData) return { url: null, error: null };

    const { data: { publicUrl }, error: urlError } = await supabase.storage
      .from('registration_cards')
      .getPublicUrl(cardData.file_path);

    if (urlError) throw urlError;

    return { url: publicUrl, error: null };
  } catch (error) {
    console.error('Error getting registration card:', error);
    return { url: null, error };
  }
}

export async function deleteRegistrationCard(registrationId: string) {
  try {
    const { data: cardData, error: cardError } = await supabase
      .from('registration_cards')
      .select('file_path')
      .eq('registration_id', registrationId)
      .single();

    if (cardError) throw cardError;
    if (!cardData) return { error: new Error('Card not found') };

    // Delete file from storage
    const { error: storageError } = await supabase.storage
      .from('registration_cards')
      .remove([cardData.file_path]);

    if (storageError) throw storageError;

    // Delete database record
    const { error: dbError } = await supabase
      .from('registration_cards')
      .delete()
      .eq('registration_id', registrationId);

    if (dbError) throw dbError;

    await createNotification({
      title: 'Usunięto kartę zgłoszeniową',
      message: 'Karta zgłoszeniowa została pomyślnie usunięta',
      severity: 'warning'
    });

    return { error: null };
  } catch (error) {
    console.error('Error deleting registration card:', error);
    return { error };
  }
}

export async function sendPaymentReminder(registrationId: string) {
  try {
    const { data: registration, error: registrationError } = await supabase
      .from('registrations')
      .select('*, camp:camp_id(*)')
      .eq('id', registrationId)
      .single();

    if (registrationError) throw registrationError;

    const { error: notificationError } = await supabase
      .from('notifications')
      .insert([{
        registration_id: registrationId,
        type: 'payment',
        subject: 'Przypomnienie o płatności',
        content: `Przypominamy o konieczności dokonania płatności za obóz "${registration.camp.name}". 
                 Prosimy o uregulowanie należności w wysokości ${registration.camp.price} PLN.`
      }]);

    if (notificationError) throw notificationError;

    await createNotification({
      title: 'Wysłano przypomnienie',
      message: `Wysłano przypomnienie o płatności do ${registration.first_name} ${registration.last_name}`,
      severity: 'success'
    });

    return { error: null };
  } catch (error) {
    console.error('Error sending payment reminder:', error);
    return { error };
  }
}

export async function sendCustomEmail(registrationId: string, subject: string, content: string) {
  try {
    const { error } = await supabase
      .from('notifications')
      .insert([{
        registration_id: registrationId,
        type: 'custom',
        subject,
        content
      }]);

    if (error) throw error;

    await createNotification({
      title: 'Wysłano wiadomość',
      message: 'Wiadomość została wysłana pomyślnie',
      severity: 'success'
    });

    return { error: null };
  } catch (error) {
    console.error('Error sending custom email:', error);
    return { error };
  }
}

export async function excludeRegistration(registrationId: string, reason: string) {
  try {
    const { error: updateError } = await supabase
      .from('registrations')
      .update({
        registration_status: 'cancelled',
        notes: `Wykluczono: ${reason}`
      })
      .eq('id', registrationId);

    if (updateError) throw updateError;

    const { error: notificationError } = await supabase
      .from('notifications')
      .insert([{
        registration_id: registrationId,
        type: 'confirmation',
        subject: 'Wykluczenie z obozu',
        content: `Twoje zgłoszenie zostało anulowane. Powód: ${reason}`
      }]);

    if (notificationError) throw notificationError;

    await createNotification({
      title: 'Wykluczono uczestnika',
      message: 'Uczestnik został wykluczony z obozu',
      severity: 'warning'
    });

    return { error: null };
  } catch (error) {
    console.error('Error excluding registration:', error);
    return { error };
  }
}

export async function generateRegistrationCard(registrationId: string) {
  try {
    const { data: registration, error } = await supabase
      .from('registrations')
      .select(`
        *,
        camp:camp_id (
          name,
          start_date,
          end_date,
          price
        )
      `)
      .eq('id', registrationId)
      .single();

    if (error) throw error;

    // Format data for PDF generation
    const cardData = {
      participant: {
        name: `${registration.first_name} ${registration.last_name}`,
        pesel: registration.pesel,
        birthDate: format(new Date(registration.birth_date), 'dd.MM.yyyy'),
        email: registration.email,
        phone: registration.phone,
        address: `${registration.address}, ${registration.postal_code} ${registration.city}`,
        zhpStatus: registration.zhp_status || 'Brak'
      },
      camp: {
        name: registration.camp.name,
        dates: `${format(new Date(registration.camp.start_date), 'dd.MM.yyyy')} - ${format(new Date(registration.camp.end_date), 'dd.MM.yyyy')}`,
        price: `${registration.camp.price} PLN`
      },
      status: {
        registration: registration.registration_status,
        payment: registration.payment_status
      }
    };

    return { data: cardData, error: null };
  } catch (error) {
    console.error('Error generating registration card:', error);
    return { data: null, error };
  }
}

export async function addRegistrationNote(registrationId: string, note: string) {
  try {
    const { data: registration, error: getError } = await supabase
      .from('registrations')
      .select('notes')
      .eq('id', registrationId)
      .single();

    if (getError) throw getError;

    const currentNotes = registration.notes || '';
    const timestamp = format(new Date(), 'dd.MM.yyyy HH:mm');
    const newNote = `${timestamp}: ${note}\n${currentNotes}`;

    const { error: updateError } = await supabase
      .from('registrations')
      .update({ notes: newNote })
      .eq('id', registrationId);

    if (updateError) throw updateError;

    await createNotification({
      title: 'Dodano notatkę',
      message: 'Notatka została dodana pomyślnie',
      severity: 'success'
    });

    return { error: null };
  } catch (error) {
    console.error('Error adding note:', error);
    return { error };
  }
}

export async function exportRegistrationsToExcel(campId?: string) {
  try {
    let query = supabase
      .from('registrations')
      .select(`
        *,
        camp:camp_id (
          name,
          start_date,
          end_date,
          price
        )
      `)
      .order('created_at', { ascending: false });

    // If campId is provided, filter by it
    if (campId && campId !== 'all') {
      query = query.eq('camp_id', campId);
    }

    const { data, error } = await query;

    if (error) throw error;

    // Format data for Excel
    const formattedData = data.map(registration => ({
      'Imię': registration.first_name,
      'Nazwisko': registration.last_name,
      'PESEL': registration.pesel,
      'Data urodzenia': format(new Date(registration.birth_date), 'dd.MM.yyyy'),
      'Email': registration.email,
      'Telefon': registration.phone,
      'Adres': registration.address,
      'Miasto': registration.city,
      'Kod pocztowy': registration.postal_code,
      'Status ZHP': registration.zhp_status || 'Brak',
      'Obóz': registration.camp.name,
      'Data rozpoczęcia': format(new Date(registration.camp.start_date), 'dd.MM.yyyy'),
      'Data zakończenia': format(new Date(registration.camp.end_date), 'dd.MM.yyyy'),
      'Cena': `${registration.camp.price} PLN`,
      'Status zgłoszenia': registration.registration_status,
      'Status płatności': registration.payment_status,
      'Data zgłoszenia': format(new Date(registration.created_at), 'dd.MM.yyyy HH:mm'),
      'Uwagi': registration.notes || ''
    }));

    return { data: formattedData, error: null };
  } catch (error) {
    console.error('Error exporting registrations:', error);
    return { data: null, error };
  }
}