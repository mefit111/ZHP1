import { Navigate, useLocation } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import toast from 'react-hot-toast';

export function AdminRoute({ children }: { children: React.ReactNode }) {
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const location = useLocation();

  useEffect(() => {
    let mounted = true;

    const checkAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        
        if (!session?.user) {
          if (mounted) {
            setIsAuthenticated(false);
            setLoading(false);
          }
          return;
        }

        const { data: admin } = await supabase
          .from('admins')
          .select('role')
          .eq('user_id', session.user.id)
          .maybeSingle();

        if (mounted) {
          setIsAuthenticated(!!admin);
          setLoading(false);
        }
      } catch (error) {
        console.error('Error checking auth:', error);
        if (mounted) {
          setIsAuthenticated(false);
          setLoading(false);
        }
      }
    };

    checkAuth();

    const { data: authListener } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!mounted) return;

      if (event === 'SIGNED_OUT') {
        setIsAuthenticated(false);
        setLoading(false);
        return;
      }

      if (event === 'SIGNED_IN' && session?.user) {
        try {
          const { data: admin } = await supabase
            .from('admins')
            .select('role')
            .eq('user_id', session.user.id)
            .maybeSingle();

          if (mounted) {
            setIsAuthenticated(!!admin);
            setLoading(false);
          }
        } catch (error) {
          console.error('Error checking admin status:', error);
          if (mounted) {
            setIsAuthenticated(false);
            setLoading(false);
          }
        }
      }
    });

    return () => {
      mounted = false;
      authListener.subscription.unsubscribe();
    };
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white p-8 rounded-xl shadow-soft-xl">
          <div className="flex flex-col items-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mb-4"></div>
            <p className="text-gray-600">Sprawdzanie uprawnień...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return children;
}