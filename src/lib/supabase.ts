import { createClient } from '@supabase/supabase-js';
import toast from 'react-hot-toast';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Missing Supabase configuration');
}

export const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
    storage: window.localStorage,
    flowType: 'pkce',
    debug: import.meta.env.DEV
  },
  db: {
    schema: 'public'
  }
});

export async function handleAuthError(error: any): Promise<string> {
  let errorMessage = 'Wystąpił nieoczekiwany błąd';

  if (typeof error === 'string') {
    errorMessage = error;
  } else if (error?.message === 'Invalid login credentials') {
    errorMessage = 'Nieprawidłowy email lub hasło';
  } else if (error?.message?.includes('network')) {
    errorMessage = 'Problem z połączeniem internetowym';
  } else if (error?.message === 'Email not confirmed') {
    errorMessage = 'Email nie został potwierdzony';
  } else if (error?.message?.includes('Database error') || error?.message?.includes('relation') || error?.code === '42P01') {
    errorMessage = 'Problem z połączeniem z bazą danych. Spróbuj ponownie za chwilę.';
  }

  console.error('Auth error:', error);
  return errorMessage;
}

export async function signIn(email: string, password: string) {
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password: password.trim()
    });

    if (error) {
      const errorMessage = await handleAuthError(error);
      toast.error(errorMessage);
      return { data: null, error: new Error(errorMessage) };
    }

    return { data, error: null };
  } catch (error) {
    const errorMessage = await handleAuthError(error);
    toast.error(errorMessage);
    return { data: null, error: new Error(errorMessage) };
  }
}

export async function getSession() {
  try {
    const { data: { session }, error } = await supabase.auth.getSession();
    
    if (error) throw error;
    return { session, error: null };
  } catch (error) {
    console.error('Get session error:', error);
    return { session: null, error };
  }
}

export async function isAdmin(): Promise<boolean> {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) return false;

    const { data: admin, error } = await supabase
      .from('admins')
      .select('role')
      .eq('user_id', session.user.id)
      .maybeSingle();

    if (error) {
      console.error('Error checking admin role:', error);
      return false;
    }

    return !!admin;
  } catch (error) {
    console.error('Error checking admin status:', error);
    return false;
  }
}

// Database helper functions
export const db = {
  camps: {
    getAll: async () => {
      try {
        const { data, error } = await supabase
          .from('camps')
          .select('*')
          .order('start_date', { ascending: true });

        if (error) throw error;
        return { data, error: null };
      } catch (error) {
        const errorMessage = await handleAuthError(error);
        return { data: null, error: new Error(errorMessage) };
      }
    }
  },
  registrations: {
    create: async (registrationData: any) => {
      try {
        const { data, error } = await supabase
          .from('registrations')
          .insert([registrationData])
          .select()
          .single();

        if (error) throw error;
        return { data, error: null };
      } catch (error) {
        const errorMessage = await handleAuthError(error);
        return { data: null, error: new Error(errorMessage) };
      }
    }
  }
};