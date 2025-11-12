import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { AdminTabs } from '../components/admin/AdminTabs';
import { AdminCamps } from './admin/AdminCamps';
import { AdminRegistrations } from './admin/AdminRegistrations';
import { AdminSettings } from './admin/AdminSettings';
import { AdminStats } from './admin/AdminStats';
import { AdminPayments } from './admin/AdminPayments';

export function AdminDashboard() {
  return (
    <div>
      <AdminTabs />
      <Routes>
        <Route path="/" element={<Navigate to="/admin/camps" replace />} />
        <Route path="/camps" element={<AdminCamps />} />
        <Route path="/registrations" element={<AdminRegistrations />} />
        <Route path="/payments" element={<AdminPayments />} />
        <Route path="/stats" element={<AdminStats />} />
        <Route path="/settings" element={<AdminSettings />} />
      </Routes>
    </div>
  );
}