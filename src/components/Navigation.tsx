import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Tent, UserPlus, Settings, LogOut } from 'lucide-react';
import { supabase } from '../lib/supabase';
import toast from 'react-hot-toast';

export function Navigation() {
  const navigate = useNavigate();
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    // Check initial auth state
    checkAuth();

    // Subscribe to auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setIsLoggedIn(!!session);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const checkAuth = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      setIsLoggedIn(!!session);
    } catch (error) {
      console.error('Error checking auth status:', error);
    }
  };

  const handleLogout = async () => {
    try {
      // Check if there's an active session first
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        console.warn('No active session found');
        setIsLoggedIn(false);
        return;
      }

      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      
      setIsLoggedIn(false);
      toast.success('Wylogowano pomyślnie');
      navigate('/');
    } catch (error) {
      console.error('Error signing out:', error);
      toast.error('Wystąpił błąd podczas wylogowywania');
    }
  };

  return (
    <nav className="bg-white shadow-soft-xl">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-20">
          <Link 
            to="/" 
            className="flex items-center space-x-3 group"
          >
            <div className="relative">
              <div className="absolute inset-0 bg-green-400 rounded-lg blur-sm group-hover:blur-md transition-all duration-300"></div>
              <div className="bg-green-600 p-2 rounded-lg transform group-hover:scale-110 transition-all duration-300 relative">
                <Tent className="h-8 w-8 text-white animate-float" />
              </div>
            </div>
            <span className="font-bold text-2xl text-gray-800 group-hover:text-green-600 transition-colors duration-300">
              Obozy ZHP
            </span>
          </Link>
          
          <div className="flex space-x-4">
            <Link 
              to="/registration" 
              className="relative group"
            >
              <div className="absolute inset-0 bg-green-400 rounded-lg blur group-hover:blur-md transition-all duration-300"></div>
              <div className="relative flex items-center space-x-2 px-6 py-3 rounded-lg bg-green-600 text-white hover:bg-green-700 transition-all transform hover:scale-105 duration-300 shadow-md hover:shadow-lg">
                <UserPlus className="h-5 w-5 group-hover:rotate-12 transition-transform duration-300" />
                <span className="font-semibold">Zapisz się</span>
              </div>
            </Link>
            
            <Link 
              to="/admin" 
              className="flex items-center space-x-2 px-6 py-3 rounded-lg border-2 border-gray-200 hover:border-green-600 hover:text-green-600 transition-all duration-300 group bg-white hover:bg-green-50"
            >
              <Settings className="h-5 w-5 group-hover:rotate-90 transition-transform duration-500" />
              <span className="font-semibold">Panel</span>
            </Link>

            {isLoggedIn && (
              <button
                onClick={handleLogout}
                className="flex items-center space-x-2 px-6 py-3 rounded-lg border-2 border-red-200 text-red-600 hover:bg-red-50 hover:border-red-600 transition-all duration-300 group"
              >
                <LogOut className="h-5 w-5 group-hover:-translate-x-1 transition-transform duration-300" />
                <span className="font-semibold">Wyloguj</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}