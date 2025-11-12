import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { Calendar, MapPin, CreditCard, User, Mail, Phone, Home, CheckCircle, ChevronDown, Info, AlertCircle, Tent, Compass, Award } from 'lucide-react';
import toast from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';
import clsx from 'clsx';

interface Camp {
  id: string;
  name: string;
  type: 'hotelik' | 'zlot' | 'turnus';
  start_date: string;
  end_date: string;
  price: number;
  capacity: number;
  location: string;
}

interface CampTypeDescription {
  type: 'hotelik' | 'zlot' | 'turnus';
  label: string;
  description: string;
}

interface FormSection {
  id: string;
  title: string;
  icon: React.ElementType;
  description: string;
  isOpen: boolean;
}

// Type configuration with icons
const typeConfig = {
  hotelik: { Icon: Tent },
  zlot: { Icon: Compass },
  turnus: { Icon: Award }
};

export function Registration() {
  const navigate = useNavigate();
  const [camps, setCamps] = useState<Camp[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [activeType, setActiveType] = useState<'hotelik' | 'zlot' | 'turnus' | 'all'>('all');
  const [typeDescriptions, setTypeDescriptions] = useState<CampTypeDescription[]>([]);
  const [sections, setSections] = useState<FormSection[]>([
    { 
      id: 'camp', 
      title: 'Wybór obozu', 
      icon: Tent,
      description: 'Wybierz obóz, w którym chcesz wziąć udział',
      isOpen: true 
    },
    { 
      id: 'personal', 
      title: 'Dane osobowe', 
      icon: User,
      description: 'Wprowadź swoje podstawowe dane osobowe',
      isOpen: false 
    },
    { 
      id: 'contact', 
      title: 'Dane kontaktowe', 
      icon: Phone,
      description: 'Podaj dane do kontaktu',
      isOpen: false 
    },
    { 
      id: 'address', 
      title: 'Adres zamieszkania', 
      icon: Home,
      description: 'Wprowadź swój adres zamieszkania',
      isOpen: false 
    },
    { 
      id: 'additional', 
      title: 'Informacje dodatkowe', 
      icon: Info,
      description: 'Dodatkowe informacje i preferencje',
      isOpen: false 
    }
  ]);
  
  const [formData, setFormData] = useState({
    campId: '',
    firstName: '',
    lastName: '',
    pesel: '',
    birthDate: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    postalCode: '',
    zhpStatus: '',
    notes: ''
  });

  useEffect(() => {
    fetchCamps();
    fetchTypeDescriptions();
  }, []);

  const fetchCamps = async () => {
    try {
      const { data, error } = await supabase
        .from('camps')
        .select('*')
        .order('start_date', { ascending: true });

      if (error) throw error;
      setCamps(data || []);
    } catch (error) {
      console.error('Error fetching camps:', error);
      toast.error('Nie udało się pobrać listy obozów');
    } finally {
      setLoading(false);
    }
  };

  const fetchTypeDescriptions = async () => {
    try {
      const { data, error } = await supabase
        .from('camp_type_descriptions')
        .select('*')
        .order('type');

      if (error) throw error;
      setTypeDescriptions(data || []);
    } catch (error) {
      console.error('Error fetching type descriptions:', error);
      toast.error('Nie udało się pobrać opisów typów obozów');
    }
  };

  const toggleSection = (sectionId: string) => {
    setSections(sections.map(section => ({
      ...section,
      isOpen: section.id === sectionId ? !section.isOpen : section.isOpen
    })));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.campId) {
      toast.error('Wybierz obóz');
      return;
    }

    setSubmitting(true);

    try {
      const { data, error } = await supabase
        .from('registrations')
        .insert([{
          camp_id: formData.campId,
          first_name: formData.firstName,
          last_name: formData.lastName,
          pesel: formData.pesel,
          birth_date: formData.birthDate,
          email: formData.email,
          phone: formData.phone,
          address: formData.address,
          city: formData.city,
          postal_code: formData.postalCode,
          zhp_status: formData.zhpStatus || null,
          notes: formData.notes || null,
          payment_status: 'pending',
          registration_status: 'pending'
        }])
        .select();

      if (error) {
        if (error.message.includes('registrations_pesel_check')) {
          throw new Error('Nieprawidłowy format numeru PESEL');
        } else if (error.message.includes('registrations_email_check')) {
          throw new Error('Nieprawidłowy format adresu email');
        } else if (error.message.includes('registrations_phone_check')) {
          throw new Error('Nieprawidłowy format numeru telefonu');
        } else if (error.message.includes('registrations_postal_code_check')) {
          throw new Error('Nieprawidłowy format kodu pocztowego');
        } else if (error.message.includes('duplicate')) {
          throw new Error('Już istnieje zgłoszenie dla tego uczestnika na ten obóz');
        } else {
          throw error;
        }
      }

      toast.success('Zgłoszenie zostało wysłane pomyślnie! Sprawdź swoją skrzynkę email.');
      navigate('/');
    } catch (error: any) {
      console.error('Error submitting registration:', error);
      toast.error(error.message || 'Wystąpił błąd podczas wysyłania zgłoszenia');
    } finally {
      setSubmitting(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));

    // Auto-expand sections as user fills out form
    if (value) {
      const currentSectionIndex = sections.findIndex(s => s.isOpen);
      if (currentSectionIndex < sections.length - 1) {
        const nextSection = sections[currentSectionIndex + 1];
        if (!nextSection.isOpen) {
          setSections(sections.map((section, index) => ({
            ...section,
            isOpen: index <= currentSectionIndex + 1
          })));
        }
      }
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pl-PL', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  };

  const filteredCamps = camps.filter(camp => 
    activeType === 'all' || camp.type === activeType
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-2xl shadow-soft-xl overflow-hidden"
      >
        <div className="p-8">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-gray-900 mb-2">Formularz zgłoszeniowy</h2>
            <p className="text-gray-600">Wypełnij poniższy formularz, aby zapisać się na wybrany obóz</p>
          </div>
          
          <form onSubmit={handleSubmit} className="space-y-6">
            {sections.map((section, sectionIndex) => (
              <motion.div
                key={section.id}
                initial={false}
                animate={{ backgroundColor: section.isOpen ? 'rgb(240, 253, 244)' : 'rgb(249, 250, 251)' }}
                className={clsx(
                  'border rounded-xl overflow-hidden transition-colors duration-200',
                  section.isOpen ? 'border-green-200' : 'border-gray-200'
                )}
              >
                <button
                  type="button"
                  onClick={() => toggleSection(section.id)}
                  className="w-full flex items-center justify-between p-6 text-left"
                >
                  <div className="flex items-center space-x-4">
                    <div className={clsx(
                      'flex items-center justify-center w-10 h-10 rounded-lg transition-colors duration-200',
                      section.isOpen ? 'bg-green-500 text-white' : 'bg-gray-100 text-gray-500'
                    )}>
                      <section.icon className="h-6 w-6" />
                    </div>
                    <div>
                      <h3 className={clsx(
                        'text-lg font-semibold transition-colors duration-200',
                        section.isOpen ? 'text-green-700' : 'text-gray-700'
                      )}>
                        {sectionIndex + 1}. {section.title}
                      </h3>
                      <p className="text-sm text-gray-500">{section.description}</p>
                    </div>
                  </div>
                  <ChevronDown className={clsx(
                    'h-5 w-5 transform transition-transform duration-200',
                    section.isOpen ? 'rotate-180 text-green-600' : 'text-gray-400'
                  )} />
                </button>

                <AnimatePresence>
                  {section.isOpen && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.3 }}
                      className="overflow-hidden border-t border-gray-200"
                    >
                      <div className="p-6 bg-white">
                        {section.id === 'camp' && (
                          <div className="space-y-8">
                            {/* Camp Types Navigation */}
                            <div className="flex flex-wrap gap-4 justify-center">
                              <button
                                type="button"
                                onClick={() => setActiveType('all')}
                                className={clsx(
                                  'px-6 py-3 rounded-lg font-medium transition-all duration-200 flex items-center gap-2',
                                  activeType === 'all'
                                    ? 'bg-green-600 text-white shadow-lg'
                                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                )}
                              >
                                Wszystkie
                              </button>
                              {typeDescriptions.map((desc) => (
                                <button
                                  type="button"
                                  key={desc.type}
                                  onClick={() => setActiveType(desc.type)}
                                  className={clsx(
                                    'px-6 py-3 rounded-lg font-medium transition-all duration-200 flex items-center gap-2',
                                    activeType === desc.type
                                      ? 'bg-green-600 text-white shadow-lg'
                                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                  )}
                                >
                                  {React.createElement(typeConfig[desc.type].Icon, { className: "h-5 w-5" })}
                                  {desc.label}
                                </button>
                              ))}
                            </div>

                            {/* Camp Type Description */}
                            {activeType !== 'all' && (
                              <motion.div
                                initial={{ opacity: 0, y: -20 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="bg-green-50 p-6 rounded-xl text-center"
                              >
                                <h3 className="text-xl font-semibold text-green-800 mb-2">
                                  {typeDescriptions.find(desc => desc.type === activeType)?.label}
                                </h3>
                                <p className="text-green-600">
                                  {typeDescriptions.find(desc => desc.type === activeType)?.description}
                                </p>
                              </motion.div>
                            )}

                            {/* Camps Grid */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              {filteredCamps.map((camp) => (
                                <label
                                  key={camp.id}
                                  className={clsx(
                                    'relative flex flex-col p-4 border-2 rounded-xl cursor-pointer transition-all duration-300',
                                    formData.campId === camp.id
                                      ? 'border-green-500 bg-green-50'
                                      : 'border-gray-200 hover:border-green-300'
                                  )}
                                >
                                  <input
                                    type="radio"
                                    name="campId"
                                    value={camp.id}
                                    checked={formData.campId === camp.id}
                                    onChange={handleInputChange}
                                    className="sr-only"
                                  />
                                  <div className="flex justify-between items-start">
                                    <div>
                                      <div className="flex items-center gap-2 mb-2">
                                        {React.createElement(typeConfig[camp.type].Icon, { className: "h-5 w-5 text-green-600" })}
                                        <span className="font-medium text-green-600">
                                          {typeDescriptions.find(desc => desc.type === camp.type)?.label}
                                        </span>
                                      </div>
                                      <p className="font-semibold text-gray-900">{camp.name}</p>
                                      <div className="mt-2 space-y-1">
                                        <div className="flex items-center text-sm text-gray-600">
                                          <Calendar className="h-4 w-4 mr-2" />
                                          <span>
                                            {formatDate(camp.start_date)} -{' '}
                                            {formatDate(camp.end_date)}
                                          </span>
                                        </div>
                                        <div className="flex items-center text-sm text-gray-600">
                                          <MapPin className="h-4 w-4 mr-2" />
                                          <span>{camp.location}</span>
                                        </div>
                                        <div className="flex items-center text-sm font-medium text-green-600">
                                          <CreditCard className="h-4 w-4 mr-2" />
                                          <span>{camp.price} zł</span>
                                        </div>
                                      </div>
                                    </div>
                                    {formData.campId === camp.id && (
                                      <CheckCircle className="h-6 w-6 text-green-500" />
                                    )}
                                  </div>
                                </label>
                              ))}
                            </div>
                          </div>
                        )}

                        {section.id === 'personal' && (
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                Imię
                              </label>
                              <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                  <User className="h-5 w-5 text-gray-400" />
                                </div>
                                <input
                                  type="text"
                                  name="firstName"
                                  value={formData.firstName}
                                  onChange={handleInputChange}
                                  required
                                  className="pl-10 block w-full rounded-lg border-gray-300 shadow-sm focus:ring-green-500 focus:border-green-500"
                                />
                              </div>
                            </div>

                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                Nazwisko
                              </label>
                              <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                  <User className="h-5 w-5 text-gray-400" />
                                </div>
                                <input
                                  type="text"
                                  name="lastName"
                                  value={formData.lastName}
                                  onChange={handleInputChange}
                                  required
                                  className="pl-10 block w-full rounded-lg border-gray-300 shadow-sm focus:ring-green-500 focus:border-green-500"
                                />
                              </div>
                            </div>

                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                PESEL
                              </label>
                              <input
                                type="text"
                                name="pesel"
                                value={formData.pesel}
                                onChange={handleInputChange}
                                required
                                pattern="[0-9]{11}"
                                className="block w-full rounded-lg border-gray-300 shadow-sm focus:ring-green-500 focus:border-green-500"
                              />
                            </div>

                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                Data urodzenia
                              </label>
                              <input
                                type="date"
                                name="birthDate"
                                value={formData.birthDate}
                                onChange={handleInputChange}
                                required
                                className="block w-full rounded-lg border-gray-300 shadow-sm focus:ring-green-500 focus:border-green-500"
                              />
                            </div>
                          </div>
                        )}

                        {section.id === 'contact' && (
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                Email
                              </label>
                              <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                  <Mail className="h-5 w-5 text-gray-400" />
                                </div>
                                <input
                                  type="email"
                                  name="email"
                                  value={formData.email}
                                  onChange={handleInputChange}
                                  required
                                  className="pl-10 block w-full rounded-lg border-gray-300 shadow-sm focus:ring-green-500 focus:border-green-500"
                                />
                              </div>
                            </div>

                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                Telefon
                              </label>
                              <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                  <Phone className="h-5 w-5 text-gray-400" />
                                </div>
                                <input
                                  type="tel"
                                  name="phone"
                                  value={formData.phone}
                                  onChange={handleInputChange}
                                  required
                                  className="pl-10 block w-full rounded-lg border-gray-300 shadow-sm focus:ring-green-500 focus:border-green-500"
                                />
                              </div>
                            </div>
                          </div>
                        )}

                        {section.id === 'address' && (
                          <div className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                              <div className="md:col-span-2">
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                  Ulica i numer
                                </label>
                                <div className="relative">
                                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <Home className="h-5 w-5 text-gray-400" />
                                  </div>
                                  <input
                                    type="text"
                                    name="address"
                                    value={formData.address}
                                    onChange={handleInputChange}
                                    required
                                    className="pl-10 block w-full rounded-lg border-gray-300 shadow-sm focus:ring-green-500 focus:border-green-500"
                                  />
                                </div>
                              </div>

                              <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                  Miasto
                                </label>
                                <input
                                  type="text"
                                  name="city"
                                  value={formData.city}
                                  onChange={handleInputChange}
                                  required
                                  className="block w-full rounded-lg border-gray-300 shadow-sm focus:ring-green-500 focus:border-green-500"
                                />
                              </div>

                              <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                  Kod pocztowy
                                </label>
                                <input
                                  type="text"
                                  name="postalCode"
                                  value={formData.postalCode}
                                  onChange={handleInputChange}
                                  required
                                  pattern="[0-9]{2}-[0-9]{3}"
                                  placeholder="00-000"
                                  className="block w-full rounded-lg border-gray-300 shadow-sm focus:ring-green-500 focus:border-green-500"
                                />
                              </div>
                            </div>
                          </div>
                        )}

                        {section.id === 'additional' && (
                          <div className="space-y-6">
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                Status w ZHP
                              </label>
                              <select
                                name="zhpStatus"
                                value={formData.zhpStatus}
                                onChange={handleInputChange}
                                className="block w-full rounded-lg border-gray-300 shadow-sm focus:ring-green-500 focus:border-green-500"
                              >
                                <option value="">Wybierz status</option>
                                <option value="zuch">Zuch</option>
                                <option value="harcerz">Harcerz</option>
                                <option value="wedrownik">Wędrownik</option>
                                <option value="instruktor">Instruktor</option>
                                <option value="brak">Nie należę do ZHP</option>
                              </select>
                            </div>

                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                Uwagi (opcjonalnie)
                              </label>
                              <div className="relative">
                                <textarea
                                  name="notes"
                                  value={formData.notes}
                                  onChange={handleInputChange}
                                  rows={4}
                                  className="block w-full rounded-lg border-gray-300 shadow-sm focus:ring-green-500 focus:border-green-500"
                                  placeholder="Np. specjalne wymagania dietetyczne, choroby, przyjmowane leki..."
                                />
                                <div className="absolute top-0 right-0 p-2">
                                  <AlertCircle className="h-5 w-5 text-gray-400" />
                                </div>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            ))}

            <div className="pt-6">
              <button
                type="submit"
                disabled={submitting}
                className="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submitting ? 'Wysyłanie...' : 'Wyślij zgłoszenie'}
              </button>
            </div>
          </form>
        </div>
      </motion.div>
    </div>
  );
}