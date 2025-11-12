import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Tent, Users, CreditCard, Settings, BarChart } from 'lucide-react';
import clsx from 'clsx';

const tabs = [
  { name: 'Obozy', path: '/admin/camps', icon: Tent },
  { name: 'Zgłoszenia', path: '/admin/registrations', icon: Users },
  { name: 'Płatności', path: '/admin/payments', icon: CreditCard },
  { name: 'Statystyki', path: '/admin/stats', icon: BarChart },
  { name: 'Ustawienia', path: '/admin/settings', icon: Settings }
];

export function AdminTabs() {
  const location = useLocation();

  return (
    <nav className="bg-white shadow-soft-xl rounded-xl p-2 mb-8">
      <div className="flex space-x-4">
        {tabs.map((tab) => {
          const isActive = location.pathname === tab.path;
          
          return (
            <Link
              key={tab.path}
              to={tab.path}
              className={clsx(
                'flex items-center px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200',
                isActive
                  ? 'bg-green-100 text-green-700'
                  : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
              )}
            >
              <tab.icon className={clsx(
                'h-5 w-5 mr-2 transition-transform duration-200',
                isActive ? 'transform rotate-6' : ''
              )} />
              {tab.name}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}