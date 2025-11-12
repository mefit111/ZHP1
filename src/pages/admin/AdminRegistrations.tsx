import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';
import { Edit2, Trash2, Download, Mail, Ban, FileText, MessageSquare, Filter, ChevronRight, AlertTriangle, Info } from 'lucide-react';
import { RegistrationForm } from '../../components/admin/RegistrationForm';
import { RegistrationCardUpload } from '../../components/admin/RegistrationCardUpload';
import { supabase } from '../../lib/supabase';
import { 
  deleteRegistration, 
  exportRegistrationsToExcel,
  sendPaymentReminder,
  sendCustomEmail,
  excludeRegistration,
  generateRegistrationCard,
  addRegistrationNote
} from '../../lib/admin';
import toast from 'react-hot-toast';
import * as XLSX from 'xlsx';
import { motion } from 'framer-motion';
import clsx from 'clsx';

export function AdminRegistrations() {
  const [selectedRegistration, setSelectedRegistration] = useState<any>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isEmailModalOpen, setIsEmailModalOpen] = useState(false);
  const [emailSubject, setEmailSubject] = useState('');
  const [emailContent, setEmailContent] = useState('');
  const [isExcludeModalOpen, setIsExcludeModalOpen] = useState(false);
  const [excludeReason, setExcludeReason] = useState('');
  const [isNoteModalOpen, setIsNoteModalOpen] = useState(false);
  const [noteContent, setNoteContent] = useState('');
  const [selectedCampId, setSelectedCampId] = useState<string>('all');
  const [exportCampId, setExportCampId] = useState<string>('all');
  const [expandedNotes, setExpandedNotes] = useState<string[]>([]);
  const queryClient = useQueryClient();

  const { data: camps } = useQuery({
    queryKey: ['camps'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('camps')
        .select('*')
        .order('start_date', { ascending: true });
      
      if (error) throw error;
      return data;
    }
  });

  const { data: registrations, isLoading } = useQuery({
    queryKey: ['registrations', selectedCampId],
    queryFn: async () => {
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

      if (selectedCampId !== 'all') {
        query = query.eq('camp_id', selectedCampId);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data;
    }
  });

  const mutations = {
    delete: useMutation({
      mutationFn: deleteRegistration,
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['registrations'] });
        toast.success('Zgłoszenie zostało usunięte');
      }
    }),
    paymentReminder: useMutation({
      mutationFn: sendPaymentReminder,
      onSuccess: () => {
        toast.success('Wysłano przypomnienie o płatności');
      }
    }),
    email: useMutation({
      mutationFn: ({ id, subject, content }) => sendCustomEmail(id, subject, content),
      onSuccess: () => {
        setIsEmailModalOpen(false);
        setEmailSubject('');
        setEmailContent('');
        toast.success('Wysłano wiadomość');
      }
    }),
    exclude: useMutation({
      mutationFn: ({ id, reason }) => excludeRegistration(id, reason),
      onSuccess: () => {
        setIsExcludeModalOpen(false);
        setExcludeReason('');
        queryClient.invalidateQueries({ queryKey: ['registrations'] });
        toast.success('Uczestnik został wykluczony');
      }
    }),
    note: useMutation({
      mutationFn: ({ id, note }) => addRegistrationNote(id, note),
      onSuccess: () => {
        setIsNoteModalOpen(false);
        setNoteContent('');
        queryClient.invalidateQueries({ queryKey: ['registrations'] });
        toast.success('Dodano notatkę');
      }
    })
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Czy na pewno chcesz usunąć to zgłoszenie?')) {
      mutations.delete.mutate(id);
    }
  };

  const handleEdit = (registration: any) => {
    setSelectedRegistration(registration);
    setIsFormOpen(true);
  };

  const handleFormSuccess = () => {
    setIsFormOpen(false);
    setSelectedRegistration(null);
    queryClient.invalidateQueries({ queryKey: ['registrations'] });
  };

  const handleExport = async () => {
    try {
      const { data, error } = await exportRegistrationsToExcel(exportCampId === 'all' ? undefined : exportCampId);
      if (error) throw error;

      const ws = XLSX.utils.json_to_sheet(data);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Zgłoszenia');
      
      const campName = exportCampId === 'all' 
        ? 'wszystkie' 
        : camps?.find(c => c.id === exportCampId)?.name?.toLowerCase().replace(/\s+/g, '_') || 'oboz';
      
      XLSX.writeFile(wb, `zgloszenia_${campName}_${format(new Date(), 'yyyy-MM-dd')}.xlsx`);

      toast.success('Pomyślnie wyeksportowano dane');
    } catch (error) {
      console.error('Export error:', error);
      toast.error('Wystąpił błąd podczas eksportu danych');
    }
  };

  const handleGenerateCard = async (registration: any) => {
    try {
      const { data, error } = await generateRegistrationCard(registration.id);
      if (error) throw error;

      toast.success('Wygenerowano kartę zgłoszeniową');
      console.log('Card data:', data);
    } catch (error) {
      console.error('Error generating card:', error);
      toast.error('Wystąpił błąd podczas generowania karty');
    }
  };

  const toggleNotes = (registrationId: string) => {
    setExpandedNotes(prev => 
      prev.includes(registrationId)
        ? prev.filter(id => id !== registrationId)
        : [...prev, registrationId]
    );
  };

  const formatNotes = (notes: string | null) => {
    if (!notes) return [];
    return notes.split('\n').filter(note => note.trim());
  };

  const ActionButton = ({ 
    onClick, 
    icon: Icon, 
    label, 
    colorClass 
  }: { 
    onClick: () => void, 
    icon: React.ElementType, 
    label: string, 
    colorClass: string 
  }) => (
    <button
      onClick={onClick}
      className={clsx(
        "group relative inline-flex items-center",
        colorClass
      )}
    >
      <Icon className="h-5 w-5" />
      <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 text-xs font-medium text-white bg-gray-900 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap">
        {label}
      </span>
    </button>
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
      </div>
    );
  }

  if (isFormOpen && selectedRegistration) {
    return (
      <div className="bg-white rounded-xl shadow-soft-xl p-6">
        <h2 className="text-2xl font-bold mb-6">
          Edytuj zgłoszenie
        </h2>
        <RegistrationForm
          initialData={selectedRegistration}
          onSuccess={handleFormSuccess}
          onCancel={() => {
            setIsFormOpen(false);
            setSelectedRegistration(null);
          }}
        />
      </div>
    );
  }

  return (
    <>
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row justify-between items-start gap-4 mb-6">
          <h2 className="text-2xl font-bold">Lista zgłoszeń</h2>
          <div className="flex flex-col md:flex-row items-start md:items-center gap-4">
            {/* View Filter */}
            <div className="bg-white rounded-lg shadow-sm p-2 flex items-center gap-2">
              <span className="text-sm font-medium text-gray-700">Pokaż zgłoszenia:</span>
              <div className="relative">
                <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                <select
                  value={selectedCampId}
                  onChange={(e) => setSelectedCampId(e.target.value)}
                  className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                >
                  <option value="all">Wszystkie obozy</option>
                  {camps?.map((camp) => (
                    <option key={camp.id} value={camp.id}>
                      {camp.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Export Controls */}
            <div className="bg-white rounded-lg shadow-sm p-2 flex items-center gap-2">
              <span className="text-sm font-medium text-gray-700">Eksportuj zgłoszenia:</span>
              <select
                value={exportCampId}
                onChange={(e) => setExportCampId(e.target.value)}
                className="pl-4 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              >
                <option value="all">Wszystkie obozy</option>
                {camps?.map((camp) => (
                  <option key={camp.id} value={camp.id}>
                    {camp.name}
                  </option>
                ))}
              </select>
              <button
                onClick={handleExport}
                className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
              >
                <Download className="h-5 w-5 mr-2" />
                Eksportuj
              </button>
            </div>
          </div>
        </div>

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
                    Status zgłoszenia
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status płatności
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Data zgłoszenia
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Akcje
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {registrations?.map((registration) => (
                  <React.Fragment key={registration.id}>
                    <tr className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div className="text-sm font-medium text-gray-900">
                          {registration.first_name} {registration.last_name}
                        </div>
                        <div className="text-sm text-gray-500">
                          {registration.email}
                        </div>
                        {registration.notes && (
                          <button
                            onClick={() => toggleNotes(registration.id)}
                            className={clsx(
                              "mt-2 inline-flex items-center text-xs font-medium rounded-full px-2.5 py-0.5 transition-colors duration-200",
                              expandedNotes.includes(registration.id)
                                ? "bg-yellow-100 text-yellow-800"
                                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                            )}
                          >
                            <Info className="h-3.5 w-3.5 mr-1" />
                            {expandedNotes.includes(registration.id) ? 'Ukryj notatki' : 'Pokaż notatki'}
                          </button>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {registration.camp.name}
                        </div>
                        <div className="text-sm text-gray-500">
                          {format(new Date(registration.camp.start_date), 'dd.MM.yyyy')} - {format(new Date(registration.camp.end_date), 'dd.MM.yyyy')}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          registration.registration_status === 'confirmed'
                            ? 'bg-green-100 text-green-800'
                            : registration.registration_status === 'pending'
                            ? 'bg-yellow-100 text-yellow-800'
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {registration.registration_status === 'confirmed' ? 'Potwierdzone' :
                           registration.registration_status === 'pending' ? 'Oczekujące' : 'Anulowane'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          registration.payment_status === 'completed'
                            ? 'bg-green-100 text-green-800'
                            : registration.payment_status === 'partial'
                            ? 'bg-blue-100 text-blue-800'
                            : registration.payment_status === 'pending'
                            ? 'bg-yellow-100 text-yellow-800'
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {registration.payment_status === 'completed' ? 'Opłacone' :
                           registration.payment_status === 'partial' ? 'Częściowo' :
                           registration.payment_status === 'pending' ? 'Oczekujące' : 'Zwrócone'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {format(new Date(registration.created_at), 'dd.MM.yyyy HH:mm')}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
                        <ActionButton
                          onClick={() => handleEdit(registration)}
                          icon={Edit2}
                          label="Edytuj zgłoszenie"
                          colorClass="text-green-600 hover:text-green-900"
                        />
                        <ActionButton
                          onClick={() => mutations.paymentReminder.mutate(registration.id)}
                          icon={Mail}
                          label="Wyślij przypomnienie o płatności"
                          colorClass="text-blue-600 hover:text-blue-900"
                        />
                        <ActionButton
                          onClick={() => {
                            setSelectedRegistration(registration);
                            setIsEmailModalOpen(true);
                          }}
                          icon={MessageSquare}
                          label="Wyślij wiadomość"
                          colorClass="text-indigo-600 hover:text-indigo-900"
                        />
                        <ActionButton
                          onClick={() => handleGenerateCard(registration)}
                          icon={FileText}
                          label="Generuj kartę zgłoszeniową"
                          colorClass="text-purple-600 hover:text-purple-900"
                        />
                        <ActionButton
                          onClick={() => {
                            setSelectedRegistration(registration);
                            setIsNoteModalOpen(true);
                          }}
                          icon={Edit2}
                          label="Dodaj notatkę"
                          colorClass="text-yellow-600 hover:text-yellow-900"
                        />
                        <ActionButton
                          onClick={() => {
                            setSelectedRegistration(registration);
                            setIsExcludeModalOpen(true);
                          }}
                          icon={Ban}
                          label="Wyklucz uczestnika"
                          colorClass="text-orange-600 hover:text-orange-900"
                        />
                        <ActionButton
                          onClick={() => handleDelete(registration.id)}
                          icon={Trash2}
                          label="Usuń zgłoszenie"
                          colorClass="text-red-600 hover:text-red-900"
                        />
                      </td>
                    </tr>
                    {/* Notes Panel */}
                    {expandedNotes.includes(registration.id) && registration.notes && (
                      <tr>
                        <td colSpan={6} className="px-6 py-4 bg-gray-50">
                          <div className="space-y-2">
                            {formatNotes(registration.notes).map((note, index) => {
                              const [timestamp, ...contentParts] = note.split(': ');
                              const content = contentParts.join(': ');
                              return (
                                <div key={index} className="flex items-start space-x-2">
                                  <div className="flex-shrink-0 w-32">
                                    <span className="text-xs font-medium text-gray-500">{timestamp}</span>
                                  </div>
                                  <div className="flex-grow">
                                    <p className="text-sm text-gray-700">{content}</p>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Email Modal */}
      {isEmailModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-xl shadow-xl p-6 max-w-lg w-full"
          >
            <h3 className="text-lg font-medium mb-4">Wyślij wiadomość</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Temat
                </label>
                <input
                  type="text"
                  value={emailSubject}
                  onChange={(e) => setEmailSubject(e.target.value)}
                  className="w-full rounded-lg border-gray-300"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Treść
                </label>
                <textarea
                  value={emailContent}
                  onChange={(e) => setEmailContent(e.target.value)}
                  rows={4}
                  className="w-full rounded-lg border-gray-300"
                />
              </div>
              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => {
                    setIsEmailModalOpen(false);
                    setEmailSubject('');
                    setEmailContent('');
                  }}
                  className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
                >
                  Anuluj
                </button>
                <button
                  onClick={() => {
                    mutations.email.mutate({
                      id: selectedRegistration.id,
                      subject: emailSubject,
                      content: emailContent
                    });
                  }}
                  className="px-4 py-2 text-white bg-green-600 rounded-lg hover:bg-green-700"
                >
                  Wyślij
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}

      {/* Exclude Modal */}
      {isExcludeModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-xl shadow-xl p-6 max-w-lg w-full"
          >
            <div className="flex items-center space-x-2 text-red-600 mb-4">
              <AlertTriangle className="h-6 w-6" />
              <h3 className="text-lg font-medium">Wyklucz uczestnika</h3>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Powód wykluczenia
                </label>
                <textarea
                  value={excludeReason}
                  onChange={(e) => setExcludeReason(e.target.value)}
                  rows={4}
                  className="w-full rounded-lg border-gray-300"
                  placeholder="Podaj powód wykluczenia..."
                />
              </div>
              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => {
                    setIsExcludeModalOpen(false);
                    setExcludeReason('');
                  }}
                  className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
                >
                  Anuluj
                </button>
                <button
                  onClick={() => {
                    mutations.exclude.mutate({
                      id: selectedRegistration.id,
                      reason: excludeReason
                    });
                  }}
                  className="px-4 py-2 text-white bg-red-600 rounded-lg hover:bg-red-700"
                >
                  Wyklucz
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}

      {/* Note Modal */}
      {isNoteModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-xl shadow-xl p-6 max-w-lg w-full"
          >
            <h3 className="text-lg font-medium mb-4">Dodaj notatkę</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Treść notatki
                </label>
                <textarea
                  value={noteContent}
                  onChange={(e) => setNoteContent(e.target.value)}
                  rows={4}
                  className="w-full rounded-lg border-gray-300"
                  placeholder="Wpisz notatkę..."
                />
              </div>
              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => {
                    setIsNoteModalOpen(false);
                    setNoteContent('');
                  }}
                  className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
                >
                  Anuluj
                </button>
                <button
                  onClick={() => {
                    mutations.note.mutate({
                      id: selectedRegistration.id,
                      note: noteContent
                    });
                  }}
                  className="px-4 py-2 text-white bg-green-600 rounded-lg hover:bg-green-700"
                >
                  Dodaj
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </>
  );
}