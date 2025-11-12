import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../../lib/supabase';
import { Settings, Users, Shield, Bell, Database, Key, Edit2, Save, X, Layout, Image as ImageIcon, Upload } from 'lucide-react';
import toast from 'react-hot-toast';
import { motion } from 'framer-motion';
import clsx from 'clsx';

interface HomepageSection {
  id: string;
  type: 'hero' | 'features' | 'stats' | 'camps';
  title: string | null;
  subtitle: string | null;
  content: any;
  order: number;
  is_visible: boolean;
}

interface HomepageImage {
  id: string;
  section_id: string;
  url: string;
  alt: string | null;
}

export function AdminSettings() {
  const [activeTab, setActiveTab] = useState('homepage');
  const [editingSection, setEditingSection] = useState<string | null>(null);
  const [uploadingSectionId, setUploadingSectionId] = useState<string | null>(null);
  const queryClient = useQueryClient();

  const { data: homepageSections, isLoading: isLoadingSections } = useQuery({
    queryKey: ['homepageSections'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('homepage_sections')
        .select('*, homepage_images(*)')
        .order('order');

      if (error) throw error;
      return data as (HomepageSection & { homepage_images: HomepageImage[] })[];
    }
  });

  const updateSectionMutation = useMutation({
    mutationFn: async (section: Partial<HomepageSection> & { id: string }) => {
      const { error } = await supabase
        .from('homepage_sections')
        .update(section)
        .eq('id', section.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['homepageSections'] });
      setEditingSection(null);
      toast.success('Sekcja została zaktualizowana');
    },
    onError: (error) => {
      console.error('Error updating section:', error);
      toast.error('Wystąpił błąd podczas aktualizacji sekcji');
    }
  });

  const uploadImageMutation = useMutation({
    mutationFn: async ({ sectionId, file, alt }: { sectionId: string; file: File; alt?: string }) => {
      // Upload image to storage
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random()}.${fileExt}`;
      const filePath = `homepage/${sectionId}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('images')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('images')
        .getPublicUrl(filePath);

      // Create database record
      const { error: dbError } = await supabase
        .from('homepage_images')
        .insert({
          section_id: sectionId,
          url: publicUrl,
          alt: alt || file.name
        });

      if (dbError) throw dbError;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['homepageSections'] });
      setUploadingSectionId(null);
      toast.success('Obraz został dodany');
    },
    onError: (error) => {
      console.error('Error uploading image:', error);
      toast.error('Wystąpił błąd podczas dodawania obrazu');
    }
  });

  const deleteImageMutation = useMutation({
    mutationFn: async (imageId: string) => {
      const { error } = await supabase
        .from('homepage_images')
        .delete()
        .eq('id', imageId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['homepageSections'] });
      toast.success('Obraz został usunięty');
    },
    onError: (error) => {
      console.error('Error deleting image:', error);
      toast.error('Wystąpił błąd podczas usuwania obrazu');
    }
  });

  const handleFileUpload = async (sectionId: string, file: File) => {
    if (!file.type.startsWith('image/')) {
      toast.error('Dozwolone są tylko pliki graficzne');
      return;
    }

    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      toast.error('Maksymalny rozmiar pliku to 5MB');
      return;
    }

    setUploadingSectionId(sectionId);
    uploadImageMutation.mutate({ sectionId, file });
  };

  const tabs = [
    {
      id: 'homepage',
      name: 'Strona główna',
      icon: Layout,
      content: (
        <div className="space-y-6">
          <h3 className="text-lg font-medium text-gray-900">Zarządzanie stroną główną</h3>
          {isLoadingSections ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
            </div>
          ) : (
            <div className="space-y-6">
              {homepageSections?.map((section) => (
                <div key={section.id} className="bg-white rounded-lg border p-4">
                  {editingSection === section.id ? (
                    <form
                      onSubmit={(e) => {
                        e.preventDefault();
                        const formData = new FormData(e.currentTarget);
                        const updatedSection = {
                          id: section.id,
                          title: formData.get('title') as string,
                          subtitle: formData.get('subtitle') as string,
                          is_visible: formData.get('is_visible') === 'true',
                          content: section.content
                        };
                        updateSectionMutation.mutate(updatedSection);
                      }}
                      className="space-y-4"
                    >
                      <div>
                        <label className="block text-sm font-medium text-gray-700">
                          Tytuł
                        </label>
                        <input
                          type="text"
                          name="title"
                          defaultValue={section.title || ''}
                          className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500 sm:text-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">
                          Podtytuł
                        </label>
                        <input
                          type="text"
                          name="subtitle"
                          defaultValue={section.subtitle || ''}
                          className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500 sm:text-sm"
                        />
                      </div>
                      <div className="flex items-center">
                        <input
                          type="checkbox"
                          name="is_visible"
                          defaultChecked={section.is_visible}
                          value="true"
                          className="h-4 w-4 rounded border-gray-300 text-green-600 focus:ring-green-500"
                        />
                        <label className="ml-2 block text-sm text-gray-900">
                          Sekcja widoczna
                        </label>
                      </div>
                      <div className="flex justify-end space-x-2">
                        <button
                          type="button"
                          onClick={() => setEditingSection(null)}
                          className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                        >
                          <X className="h-4 w-4 mr-2" />
                          Anuluj
                        </button>
                        <button
                          type="submit"
                          className="inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                        >
                          <Save className="h-4 w-4 mr-2" />
                          Zapisz
                        </button>
                      </div>
                    </form>
                  ) : (
                    <div className="space-y-4">
                      <div className="flex justify-between items-start">
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="text-lg font-medium text-gray-900">
                              {section.title || `Sekcja ${section.type}`}
                            </h4>
                            {!section.is_visible && (
                              <span className="bg-yellow-100 text-yellow-800 text-xs font-medium px-2.5 py-0.5 rounded">
                                Ukryta
                              </span>
                            )}
                          </div>
                          {section.subtitle && (
                            <p className="text-gray-500 mt-1">{section.subtitle}</p>
                          )}
                        </div>
                        <button
                          onClick={() => setEditingSection(section.id)}
                          className="text-green-600 hover:text-green-700"
                        >
                          <Edit2 className="h-5 w-5" />
                        </button>
                      </div>

                      {/* Images section */}
                      <div className="mt-4">
                        <div className="flex items-center justify-between mb-2">
                          <h5 className="text-sm font-medium text-gray-700">Obrazy</h5>
                          <label className="cursor-pointer inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500">
                            <Upload className="h-4 w-4 mr-2" />
                            Dodaj obraz
                            <input
                              type="file"
                              className="hidden"
                              accept="image/*"
                              onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (file) {
                                  handleFileUpload(section.id, file);
                                }
                              }}
                              disabled={uploadingSectionId === section.id}
                            />
                          </label>
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                          {section.homepage_images?.map((image) => (
                            <div key={image.id} className="relative group">
                              <img
                                src={image.url}
                                alt={image.alt || ''}
                                className="w-full h-32 object-cover rounded-lg"
                              />
                              <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 transition-all duration-200 rounded-lg flex items-center justify-center">
                                <button
                                  onClick={() => deleteImageMutation.mutate(image.id)}
                                  className="opacity-0 group-hover:opacity-100 text-white hover:text-red-500 transition-all duration-200"
                                >
                                  <X className="h-6 w-6" />
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )
    },
    // ... other existing tabs
  ];

  if (isLoadingSections) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-soft-xl overflow-hidden">
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8 px-6" aria-label="Tabs">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={clsx(
                'group inline-flex items-center py-4 px-1 border-b-2 font-medium text-sm',
                activeTab === tab.id
                  ? 'border-green-500 text-green-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              )}
            >
              <tab.icon className={clsx(
                'h-5 w-5 mr-2 transition-colors duration-200',
                activeTab === tab.id ? 'text-green-500' : 'text-gray-400 group-hover:text-gray-500'
              )} />
              {tab.name}
            </button>
          ))}
        </nav>
      </div>
      <div className="p-6">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.2 }}
        >
          {tabs.find(tab => tab.id === activeTab)?.content}
        </motion.div>
      </div>
    </div>
  );
}