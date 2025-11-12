import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase, isAdmin } from '../lib/supabase';
import { Lock, AlertCircle, Loader2, Shield, Eye, EyeOff, ChevronDown } from 'lucide-react';
import toast from 'react-hot-toast';
import { monitorDatabaseHealth, monitorAuthHealth } from '../lib/monitoring';

export function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showCredentials, setShowCredentials] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    checkCurrentSession();
  }, []);

  const checkCurrentSession = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        const adminAccess = await isAdmin();
        if (adminAccess) {
          navigate('/admin');
        } else {
          await supabase.auth.signOut();
          setError('Brak uprawnień administratora');
          toast.error('Brak uprawnień administratora');
        }
      }
    } catch (error) {
      console.error('Session check error:', error);
      setError('Wystąpił błąd podczas sprawdzania sesji');
    }
  };

  const validateInput = () => {
    if (!email) {
      setError('Wprowadź adres email');
      return false;
    }
    if (!password) {
      setError('Wprowadź hasło');
      return false;
    }
    if (!email.includes('@')) {
      setError('Wprowadź poprawny adres email');
      return false;
    }
    return true;
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!validateInput()) {
      return;
    }

    setLoading(true);

    try {
      // Check database health before attempting login
      const dbHealth = await monitorDatabaseHealth();
      const authHealth = await monitorAuthHealth();

      if (dbHealth.status === 'error' || authHealth.status === 'error') {
        throw new Error('Problem z połączeniem z bazą danych. Spróbuj ponownie za chwilę.');
      }

      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password: password.trim()
      });

      if (signInError) {
        if (signInError.message === 'Invalid login credentials') {
          throw new Error('Nieprawidłowy email lub hasło');
        }
        throw signInError;
      }

      if (data.user) {
        const adminAccess = await isAdmin();
        
        if (!adminAccess) {
          await supabase.auth.signOut();
          throw new Error('Brak uprawnień administratora');
        }

        toast.success('Zalogowano pomyślnie');
        navigate('/admin');
      }
    } catch (error: any) {
      console.error('Login error:', error);
      
      let errorMessage = 'Wystąpił błąd podczas logowania';
      
      if (error.message === 'Nieprawidłowy email lub hasło') {
        errorMessage = error.message;
      } else if (error.message === 'Brak uprawnień administratora') {
        errorMessage = error.message;
      } else if (error.message?.includes('network')) {
        errorMessage = 'Problem z połączeniem internetowym';
      } else if (error.message?.includes('Database error') || error.message?.includes('Problem z połączeniem')) {
        errorMessage = 'Problem z połączeniem z bazą danych. Spróbuj ponownie za chwilę.';
      }
      
      setError(errorMessage);
      toast.error(errorMessage);
      
      await supabase.auth.signOut();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <div className="mx-auto h-12 w-12 bg-green-100 text-green-600 rounded-lg flex items-center justify-center">
            <Shield className="h-8 w-8" />
          </div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Panel administratora
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Zaloguj się, aby uzyskać dostęp do panelu
          </p>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleLogin}>
          {error && (
            <div className="rounded-md bg-red-50 p-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <AlertCircle className="h-5 w-5 text-red-400" />
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium text-red-800">{error}</p>
                </div>
              </div>
            </div>
          )}

          <div className="rounded-md shadow-sm space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                Email
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                className="appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-green-500 focus:border-green-500 focus:z-10 sm:text-sm"
                placeholder="Wprowadź adres email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  setError(null);
                }}
                disabled={loading}
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                Hasło
              </label>
              <div className="relative">
                <input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  required
                  className="appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-green-500 focus:border-green-500 focus:z-10 sm:text-sm pr-10"
                  placeholder="Wprowadź hasło"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    setError(null);
                  }}
                  disabled={loading}
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5 text-gray-400" />
                  ) : (
                    <Eye className="h-5 w-5 text-gray-400" />
                  )}
                </button>
              </div>
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={loading}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <div className="flex items-center">
                  <Loader2 className="animate-spin h-5 w-5 mr-2" />
                  Logowanie...
                </div>
              ) : (
                <>
                  <Lock className="h-5 w-5 mr-2" />
                  Zaloguj się
                </>
              )}
            </button>
          </div>

          <div className="bg-gray-50 rounded-lg p-4">
            <button
              type="button"
              onClick={() => setShowCredentials(!showCredentials)}
              className="flex items-center justify-between w-full text-sm text-gray-600 hover:text-gray-900"
            >
              <span>Dane logowania</span>
              <ChevronDown className={`h-4 w-4 transform transition-transform ${showCredentials ? 'rotate-180' : ''}`} />
            </button>
            
            {showCredentials && (
              <div className="mt-4 space-y-4">
                <div className="border-b pb-4">
                  <p className="text-sm font-medium text-gray-700">Administrator:</p>
                  <p className="text-sm text-gray-600">Email: admin@obozy-zhp.pl</p>
                  <p className="text-sm text-gray-600">Hasło: admin123</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-700">Super Administrator:</p>
                  <p className="text-sm text-gray-600">Email: superadmin@obozy-zhp.pl</p>
                  <p className="text-sm text-gray-600">Hasło: superadmin123</p>
                </div>
              </div>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}