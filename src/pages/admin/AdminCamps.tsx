import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';
import { Edit2, Trash2, Plus, Settings } from 'lucide-react';
import { CampForm } from '../../components/admin/CampForm';
import { supabase } from '../../lib/supabase';
import { deleteCamp } from '../../lib/admin';
import toast from 'react-hot-toast';
import clsx from 'clsx';

interface CampTypeDescription {
  type: 'hotelik' | 'zlot' | 'turnus';
  label: string;
  description: string;
}

export function AdminCamps() {
  const [selectedCamp, setSelectedCamp] = useState<any>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'list' | 'types'>('list');
  const [editingType, setEditingType] = useState<string | null>(null);
  const queryClient = useQueryClient();

  const { data: camps, isLoading: isLoadingCamps } = useQuery({
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

  const { data: typeDescriptions, isLoading: isLoadingDescriptions } = useQuery({
    queryKey: ['campTypeDescriptions'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('camp_type_descriptions')
        .select('*')
        .order('type');

      if (error) throw error;
      return data;
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteCamp(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['camps'] });
      toast.success('Obóz został usunięty');
    },
    onError: () => {
      toast.error('Wystąpił błąd podczas usuwania obozu');
    }
  });

  const updateDescriptionMutation = useMutation({
    mutationFn: async (description: CampTypeDescription) => {
      const { error } = await supabase
        .from('camp_type_descriptions')
        .update({
          label: description.label,
          description: description.description
        })
        .eq('type', description.type);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['campTypeDescriptions'] });
      setEditingType(null);
      toast.success('Opis został zaktualizowany');
    },
    onError: (error) => {
      console.error('Error updating description:', error);
      toast.error('Wystąpił błąd podczas aktualizacji opisu');
    }
  });

  const handleDelete = async (id: string) => {
    if (window.confirm('Czy na pewno chcesz usunąć ten obóz?')) {
      deleteMutation.mutate(id);
    }
  };

  const handleEdit = (camp: any) => {
    setSelectedCamp(camp);
    setIsFormOpen(true);
  };

  const handleFormSuccess = () => {
    setIsFormOpen(false);
    setSelectedCamp(null);
    queryClient.invalidateQueries({ queryKey: ['camps'] });
  };

  const handleDescriptionSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!editingType) return;

    const formData = new FormData(e.currentTarget);
    const description: CampTypeDescription = {
      type: editingType as 'hotelik' | 'zlot' | 'turnus',
      label: formData.get('label') as string,
      description: formData.get('description') as string
    };

    updateDescriptionMutation.mutate(description);
  };

  if (isLoadingCamps || isLoadingDescriptions) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
      </div>
    );
  }

  if (isFormOpen) {
    return (
      <div className="bg-white rounded-xl shadow-soft-xl p-6">
        <h2 className="text-2xl font-bold mb-6">
          {selectedCamp ? 'Edytuj obóz' : 'Dodaj nowy obóz'}
        </h2>
        <CampForm
          initialData={selectedCamp}
          onSuccess={handleFormSuccess}
          onCancel={() => {
            setIsFormOpen(false);
            setSelectedCamp(null);
          }}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div className="flex items-center space-x-4">
          <h2 className="text-2xl font-bold">Zarządzanie obozami</h2>
          <div className="flex bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => setActiveTab('list')}
              className={clsx(
                'px-4 py-2 rounded-md text-sm font-medium transition-colors duration-200',
                activeTab === 'list'
                  ? 'bg-white text-gray-900 shadow'
                  : 'text-gray-600 hover:text-gray-900'
              )}
            >
              Lista obozów
            </button>
            <button
              onClick={() => setActiveTab('types')}
              className={clsx(
                'px-4 py-2 rounded-md text-sm font-medium transition-colors duration-200',
                activeTab === 'types'
                  ? 'bg-white text-gray-900 shadow'
                  : 'text-gray-600 hover:text-gray-900'
              )}
            >
              Typy obozów
            </button>
          </div>
        </div>
        {activeTab === 'list' && (
          <button
            onClick={() => setIsFormOpen(true)}
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
          >
            <Plus className="h-5 w-5 mr-2" />
            Dodaj obóz
          </button>
        )}
      </div>

      {activeTab === 'list' ? (
        <div className="bg-white rounded-xl shadow-soft-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Nazwa
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Data rozpoczęcia
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Data zakończenia
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Cena
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Miejsca
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Akcje
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {camps?.map((camp) => (
                  <tr key={camp.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {camp.name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {format(new Date(camp.start_date), 'dd.MM.yyyy')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {format(new Date(camp.end_date), 'dd.MM.yyyy')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {camp.price} zł
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {camp.capacity}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button
                        onClick={() => handleEdit(camp)}
                        className="text-green-600 hover:text-green-900 mr-4"
                      >
                        <Edit2 className="h-5 w-5" />
                      </button>
                      <button
                        onClick={() => handleDelete(camp.id)}
                        className="text-red-600 hover:text-red-900"
                      >
                        <Trash2 className="h-5 w-5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          {typeDescriptions?.map((desc) => (
            <div key={desc.type} className="bg-white rounded-lg shadow-soft-xl p-6">
              {editingType === desc.type ? (
                <form onSubmit={handleDescriptionSubmit} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Nazwa wyświetlana
                    </label>
                    <input
                      type="text"
                      name="label"
                      defaultValue={desc.label}
                      required
                      className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500 sm:text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Opis
                    </label>
                    <textarea
                      name="description"
                      defaultValue={desc.description}
                      required
                      rows={3}
                      className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500 sm:text-sm"
                    />
                  </div>
                  <div className="flex justify-end space-x-2">
                    <button
                      type="button"
                      onClick={() => setEditingType(null)}
                      className="px-4 py-2 border border-gray-300 rounded-lg shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                    >
                      Anuluj
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-2 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                    >
                      Zapisz
                    </button>
                  </div>
                </form>
              ) : (
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-lg font-medium text-gray-900">{desc.label}</h3>
                    <p className="mt-1 text-gray-500">{desc.description}</p>
                  </div>
                  <button
                    onClick={() => setEditingType(desc.type)}
                    className="text-green-600 hover:text-green-700"
                  >
                    <Settings className="h-5 w-5" />
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}