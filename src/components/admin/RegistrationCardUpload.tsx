import React, { useState } from 'react';
import { Upload, X, FileText, Loader2 } from 'lucide-react';
import { uploadRegistrationCard, getRegistrationCard, deleteRegistrationCard } from '../../lib/admin';
import toast from 'react-hot-toast';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';

interface RegistrationCardUploadProps {
  registrationId: string;
}

export function RegistrationCardUpload({ registrationId }: RegistrationCardUploadProps) {
  const [isDragging, setIsDragging] = useState(false);
  const queryClient = useQueryClient();

  const { data: cardUrl, isLoading: isLoadingCard } = useQuery({
    queryKey: ['registrationCard', registrationId],
    queryFn: async () => {
      const { url, error } = await getRegistrationCard(registrationId);
      if (error) throw error;
      return url;
    }
  });

  const uploadMutation = useMutation({
    mutationFn: async (file: File) => {
      const { error } = await uploadRegistrationCard(registrationId, file);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['registrationCard', registrationId] });
      toast.success('Karta zgłoszeniowa została pomyślnie dodana');
    },
    onError: (error) => {
      console.error('Error uploading card:', error);
      toast.error('Wystąpił błąd podczas dodawania karty');
    }
  });

  const deleteMutation = useMutation({
    mutationFn: async () => {
      const { error } = await deleteRegistrationCard(registrationId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['registrationCard', registrationId] });
      toast.success('Karta zgłoszeniowa została usunięta');
    },
    onError: (error) => {
      console.error('Error deleting card:', error);
      toast.error('Wystąpił błąd podczas usuwania karty');
    }
  });

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    const file = e.dataTransfer.files[0];
    if (!file) return;

    if (!file.type.includes('pdf')) {
      toast.error('Dozwolone są tylko pliki PDF');
      return;
    }

    uploadMutation.mutate(file);
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.includes('pdf')) {
      toast.error('Dozwolone są tylko pliki PDF');
      return;
    }

    uploadMutation.mutate(file);
  };

  if (isLoadingCard) {
    return (
      <div className="flex items-center justify-center h-32 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
        <Loader2 className="h-6 w-6 text-gray-400 animate-spin" />
      </div>
    );
  }

  if (cardUrl) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative bg-gray-50 rounded-lg border-2 border-gray-300 p-4"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <FileText className="h-6 w-6 text-green-600" />
            <span className="text-sm font-medium text-gray-900">Karta zgłoszeniowa</span>
          </div>
          <div className="flex items-center space-x-2">
            <a
              href={cardUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm font-medium text-green-600 hover:text-green-700"
            >
              Pobierz
            </a>
            <button
              onClick={() => {
                if (window.confirm('Czy na pewno chcesz usunąć kartę zgłoszeniową?')) {
                  deleteMutation.mutate();
                }
              }}
              className="text-red-600 hover:text-red-700"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>
      </motion.div>
    );
  }

  return (
    <div
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={`relative h-32 rounded-lg border-2 border-dashed transition-colors duration-200 ${
        isDragging
          ? 'border-green-500 bg-green-50'
          : 'border-gray-300 bg-gray-50 hover:bg-gray-100'
      }`}
    >
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <Upload
          className={`h-8 w-8 ${
            isDragging ? 'text-green-500' : 'text-gray-400'
          }`}
        />
        <p className="mt-2 text-sm text-gray-600">
          Przeciągnij kartę zgłoszeniową lub{' '}
          <label className="text-green-600 hover:text-green-700 cursor-pointer">
            wybierz plik
            <input
              type="file"
              className="hidden"
              accept=".pdf"
              onChange={handleFileChange}
              disabled={uploadMutation.isLoading}
            />
          </label>
        </p>
        <p className="mt-1 text-xs text-gray-500">Tylko pliki PDF</p>
      </div>
    </div>
  );
}