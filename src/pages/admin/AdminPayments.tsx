import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';
import { Edit2, Plus, Settings, Mail, CreditCard, Download } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { PaymentTemplateForm } from '../../components/admin/PaymentTemplateForm';
import { sendPaymentReminder } from '../../lib/admin';
import toast from 'react-hot-toast';
import { motion } from 'framer-motion';
import clsx from 'clsx';
import { Tooltip } from 'react-tooltip';

export function AdminPayments() {
  const [isTemplateFormOpen, setIsTemplateFormOpen] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<'registrations' | 'templates'>('registrations');
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [selectedRegistration, setSelectedRegistration] = useState<any>(null);
  const queryClient = useQueryClient();

  const { data: templates, isLoading: isLoadingTemplates } = useQuery({
    queryKey: ['paymentTemplates'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('document_templates')
        .select('*')
        .eq('type', 'payment_reminder')
        .order('is_default', { ascending: false })
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data;
    }
  });

  const { data: registrations, isLoading: isLoadingRegistrations } = useQuery({
    queryKey: ['registrations'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('registrations')
        .select(`
          *,
          camp:camp_id (
            name,
            price
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data;
    }
  });

  const paymentReminderMutation = useMutation({
    mutationFn: sendPaymentReminder,
    onSuccess: () => {
      toast.success('Wysłano przypomnienie o płatności');
      queryClient.invalidateQueries({ queryKey: ['registrations'] });
    },
    onError: (error) => {
      console.error('Error sending payment reminder:', error);
      toast.error('Wystąpił błąd podczas wysyłania przypomnienia');
    }
  });

  const handleEditTemplate = (template: any) => {
    setSelectedTemplate(template);
    setIsTemplateFormOpen(true);
  };

  const handleSendPaymentReminder = (registrationId: string) => {
    paymentReminderMutation.mutate(registrationId);
  };

  const handleRegisterPayment = (registration: any) => {
    setSelectedRegistration(registration);
    setIsPaymentModalOpen(true);
  };

  const handlePaymentSubmit = async (amount: number) => {
    try {
      const newPaidAmount = (selectedRegistration.paid_amount || 0) + amount;
      const { error } = await supabase
        .from('registrations')
        .update({
          paid_amount: newPaidAmount
        })
        .eq('id', selectedRegistration.id);

      if (error) throw error;

      toast.success('Płatność została zarejestrowana');
      queryClient.invalidateQueries({ queryKey: ['registrations'] });
      setIsPaymentModalOpen(false);
      setSelectedRegistration(null);
    } catch (error) {
      console.error('Error registering payment:', error);
      toast.error('Wystąpił błąd podczas rejestracji płatności');
    }
  };

  const getPaymentStatus = (registration: any) => {
    const paidAmount = registration.paid_amount || 0;
    const totalAmount = registration.camp.price;
    const remainingAmount = totalAmount - paidAmount;

    if (paidAmount === 0) return { status: 'pending', text: 'Oczekujące' };
    if (paidAmount >= totalAmount) return { status: 'completed', text: 'Opłacone' };
    return { status: 'partial', text: `Częściowo (${paidAmount} / ${totalAmount} PLN)` };
  };

  if (isTemplateFormOpen) {
    return (
      <div className="bg-white rounded-xl shadow-soft-xl p-6">
        <h2 className="text-2xl font-bold mb-6">
          {selectedTemplate ? 'Edytuj szablon' : 'Nowy szablon'}
        </h2>
        <PaymentTemplateForm
          initialData={selectedTemplate}
          onClose={() => {
            setIsTemplateFormOpen(false);
            setSelectedTemplate(null);
          }}
        />
      </div>
    );
  }

  return (
    <>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div className="flex items-center space-x-4">
            <h2 className="text-2xl font-bold">Płatności</h2>
            <div className="flex bg-gray-100 rounded-lg p-1">
              <button
                onClick={() => setActiveTab('registrations')}
                className={clsx(
                  'px-4 py-2 rounded-md text-sm font-medium transition-colors duration-200',
                  activeTab === 'registrations'
                    ? 'bg-white text-gray-900 shadow'
                    : 'text-gray-600 hover:text-gray-900'
                )}
              >
                Lista płatności
              </button>
              <button
                onClick={() => setActiveTab('templates')}
                className={clsx(
                  'px-4 py-2 rounded-md text-sm font-medium transition-colors duration-200',
                  activeTab === 'templates'
                    ? 'bg-white text-gray-900 shadow'
                    : 'text-gray-600 hover:text-gray-900'
                )}
              >
                Szablony wiadomości
              </button>
            </div>
          </div>
          {activeTab === 'templates' && (
            <button
              onClick={() => setIsTemplateFormOpen(true)}
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
            >
              <Plus className="h-5 w-5 mr-2" />
              Dodaj szablon
            </button>
          )}
        </div>

        {activeTab === 'registrations' ? (
          <div className="bg-white rounded-xl shadow-soft-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Uczestnik
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Obóz
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Kwota
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Wpłacono
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status płatności
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Akcje
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {registrations?.map((registration) => {
                    const paymentStatus = getPaymentStatus(registration);
                    return (
                      <tr key={registration.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">
                            {registration.first_name} {registration.last_name}
                          </div>
                          <div className="text-sm text-gray-500">
                            {registration.email}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            {registration.camp.name}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">
                            {registration.camp.price} PLN
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">
                            {registration.paid_amount || 0} PLN
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={clsx(
                            'px-2 inline-flex text-xs leading-5 font-semibold rounded-full',
                            paymentStatus.status === 'completed'
                              ? 'bg-green-100 text-green-800'
                              : paymentStatus.status === 'partial'
                              ? 'bg-blue-100 text-blue-800'
                              : paymentStatus.status === 'pending'
                              ? 'bg-yellow-100 text-yellow-800'
                              : 'bg-red-100 text-red-800'
                          )}>
                            {paymentStatus.text}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
                          <button
                            onClick={() => handleSendPaymentReminder(registration.id)}
                            className="text-blue-600 hover:text-blue-900 p-1 rounded-lg hover:bg-blue-50 transition-colors duration-200"
                            data-tooltip-id={`reminder-${registration.id}`}
                            data-tooltip-content="Wyślij przypomnienie o płatności"
                          >
                            <Mail className="h-5 w-5" />
                          </button>
                          <Tooltip id={`reminder-${registration.id}`} place="top" />
                          
                          <button
                            onClick={() => handleRegisterPayment(registration)}
                            className="text-green-600 hover:text-green-900 p-1 rounded-lg hover:bg-green-50 transition-colors duration-200"
                            data-tooltip-id={`payment-${registration.id}`}
                            data-tooltip-content="Zarejestruj wpłatę"
                          >
                            <CreditCard className="h-5 w-5" />
                          </button>
                          <Tooltip id={`payment-${registration.id}`} place="top" />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6">
            {isLoadingTemplates ? (
              <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
              </div>
            ) : templates?.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-gray-500">Brak szablonów wiadomości</p>
              </div>
            ) : (
              templates?.map((template) => (
                <motion.div
                  key={template.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-white rounded-lg shadow-soft-xl p-6"
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-lg font-semibold text-gray-900">
                          {template.name}
                        </h3>
                        {template.is_default && (
                          <span className="bg-green-100 text-green-800 text-xs font-medium px-2.5 py-0.5 rounded">
                            Domyślny
                          </span>
                        )}
                      </div>
                      <p className="mt-2 text-sm text-gray-500">
                        Utworzono: {format(new Date(template.created_at), 'dd.MM.yyyy HH:mm')}
                      </p>
                    </div>
                    <button
                      onClick={() => handleEditTemplate(template)}
                      className="text-gray-400 hover:text-gray-500 p-1 rounded-lg hover:bg-gray-50 transition-colors duration-200"
                      data-tooltip-id={`edit-template-${template.id}`}
                      data-tooltip-content="Edytuj szablon"
                    >
                      <Settings className="h-5 w-5" />
                    </button>
                    <Tooltip id={`edit-template-${template.id}`} place="top" />
                  </div>
                  <div className="mt-4">
                    <pre className="whitespace-pre-wrap text-sm text-gray-600 font-mono bg-gray-50 p-4 rounded-lg">
                      {template.content}
                    </pre>
                  </div>
                </motion.div>
              ))
            )}
          </div>
        )}
      </div>

      {/* Payment Modal */}
      {isPaymentModalOpen && selectedRegistration && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-xl shadow-xl p-6 max-w-lg w-full"
          >
            <h3 className="text-lg font-medium mb-4">Zarejestruj płatność</h3>
            <div className="space-y-4">
              <div>
                <p className="text-sm text-gray-600">
                  Uczestnik: {selectedRegistration.first_name} {selectedRegistration.last_name}
                </p>
                <p className="text-sm text-gray-600">
                  Obóz: {selectedRegistration.camp.name}
                </p>
                <p className="text-sm text-gray-600">
                  Kwota całkowita: {selectedRegistration.camp.price} PLN
                </p>
                <p className="text-sm text-gray-600">
                  Wpłacono dotychczas: {selectedRegistration.paid_amount || 0} PLN
                </p>
                <p className="text-sm text-gray-600">
                  Pozostało do zapłaty: {selectedRegistration.camp.price - (selectedRegistration.paid_amount || 0)} PLN
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Kwota wpłaty (PLN)
                </label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  className="w-full rounded-lg border-gray-300"
                  id="paymentAmount"
                />
              </div>
              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => {
                    setIsPaymentModalOpen(false);
                    setSelectedRegistration(null);
                  }}
                  className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
                >
                  Anuluj
                </button>
                <button
                  onClick={() => {
                    const amount = Number(
                      (document.getElementById('paymentAmount') as HTMLInputElement).value
                    );
                    if (amount > 0) {
                      handlePaymentSubmit(amount);
                    } else {
                      toast.error('Wprowadź poprawną kwotę');
                    }
                  }}
                  className="px-4 py-2 text-white bg-green-600 rounded-lg hover:bg-green-700"
                >
                  Zarejestruj
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </>
  );
}