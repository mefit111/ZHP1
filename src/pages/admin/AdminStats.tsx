import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '../../lib/supabase';
import { Users, Tent, ClipboardList, CreditCard } from 'lucide-react';
import { motion } from 'framer-motion';
import CountUp from 'react-countup';

export function AdminStats() {
  const { data: stats, isLoading } = useQuery({
    queryKey: ['adminStats'],
    queryFn: async () => {
      const [
        { count: totalCamps } = { count: 0 },
        { count: totalRegistrations } = { count: 0 },
        { count: pendingRegistrations } = { count: 0 },
        { count: confirmedRegistrations } = { count: 0 }
      ] = await Promise.all([
        supabase.from('camps').select('*', { count: 'exact', head: true }),
        supabase.from('registrations').select('*', { count: 'exact', head: true }),
        supabase.from('registrations').select('*', { count: 'exact', head: true }).eq('registration_status', 'pending'),
        supabase.from('registrations').select('*', { count: 'exact', head: true }).eq('registration_status', 'confirmed')
      ]);

      return {
        totalCamps,
        totalRegistrations,
        pendingRegistrations,
        confirmedRegistrations
      };
    }
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
      </div>
    );
  }

  const cards = [
    {
      title: 'Liczba obozów',
      value: stats?.totalCamps || 0,
      icon: Tent,
      color: 'bg-blue-500'
    },
    {
      title: 'Wszystkie zgłoszenia',
      value: stats?.totalRegistrations || 0,
      icon: ClipboardList,
      color: 'bg-green-500'
    },
    {
      title: 'Oczekujące zgłoszenia',
      value: stats?.pendingRegistrations || 0,
      icon: Users,
      color: 'bg-yellow-500'
    },
    {
      title: 'Potwierdzone zgłoszenia',
      value: stats?.confirmedRegistrations || 0,
      icon: CreditCard,
      color: 'bg-purple-500'
    }
  ];

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map((card, index) => (
          <motion.div
            key={card.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="bg-white rounded-xl shadow-soft-xl overflow-hidden"
          >
            <div className="p-6">
              <div className="flex items-center">
                <div className={`rounded-xl p-3 ${card.color}`}>
                  <card.icon className="h-6 w-6 text-white" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">{card.title}</p>
                  <h3 className="text-xl font-bold text-gray-900 mt-1">
                    <CountUp end={card.value} duration={2} />
                  </h3>
                </div>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow-soft-xl p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Statystyki zgłoszeń</h3>
          <div className="relative pt-1">
            <div className="flex mb-2 items-center justify-between">
              <div>
                <span className="text-xs font-semibold inline-block py-1 px-2 uppercase rounded-full text-green-600 bg-green-200">
                  Potwierdzone
                </span>
              </div>
              <div className="text-right">
                <span className="text-xs font-semibold inline-block text-green-600">
                  {stats?.totalRegistrations ? 
                    Math.round((stats.confirmedRegistrations / stats.totalRegistrations) * 100) : 0}%
                </span>
              </div>
            </div>
            <div className="overflow-hidden h-2 mb-4 text-xs flex rounded bg-green-200">
              <motion.div
                initial={{ width: 0 }}
                animate={{ 
                  width: `${stats?.totalRegistrations ? 
                    (stats.confirmedRegistrations / stats.totalRegistrations) * 100 : 0}%` 
                }}
                transition={{ duration: 1 }}
                className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-green-500"
              />
            </div>
            <div className="flex mb-2 items-center justify-between">
              <div>
                <span className="text-xs font-semibold inline-block py-1 px-2 uppercase rounded-full text-yellow-600 bg-yellow-200">
                  Oczekujące
                </span>
              </div>
              <div className="text-right">
                <span className="text-xs font-semibold inline-block text-yellow-600">
                  {stats?.totalRegistrations ? 
                    Math.round((stats.pendingRegistrations / stats.totalRegistrations) * 100) : 0}%
                </span>
              </div>
            </div>
            <div className="overflow-hidden h-2 mb-4 text-xs flex rounded bg-yellow-200">
              <motion.div
                initial={{ width: 0 }}
                animate={{ 
                  width: `${stats?.totalRegistrations ? 
                    (stats.pendingRegistrations / stats.totalRegistrations) * 100 : 0}%` 
                }}
                transition={{ duration: 1 }}
                className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-yellow-500"
              />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-soft-xl p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Wykorzystanie miejsc</h3>
          <div className="space-y-4">
            {stats?.totalCamps === 0 ? (
              <p className="text-gray-500 text-center py-4">Brak dostępnych obozów</p>
            ) : (
              <div className="animate-pulse">
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                <div className="space-y-3 mt-4">
                  <div className="h-4 bg-gray-200 rounded"></div>
                  <div className="h-4 bg-gray-200 rounded w-5/6"></div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}