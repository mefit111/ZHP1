import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { format } from 'date-fns';
import toast from 'react-hot-toast';
import { CampData, createCamp, updateCamp } from '../../lib/admin';
import { Calendar, DollarSign, Users, MapPin, Tag } from 'lucide-react';

const campSchema = z.object({
  name: z.string().min(5, 'Nazwa musi mieć minimum 5 znaków'),
  type: z.enum(['hotelik', 'zlot', 'turnus'], {
    required_error: 'Wybierz typ obozu'
  }),
  location: z.string().min(2, 'Lokalizacja musi mieć minimum 2 znaki'),
  start_date: z.string().refine(date => {
    const startDate = new Date(date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return startDate >= today;
  }, {
    message: 'Data rozpoczęcia musi być w przyszłości'
  }),
  end_date: z.string(),
  price: z.number().min(1, 'Cena musi być większa od 0'),
  capacity: z.number().min(1, 'Pojemność musi być większa od 0')
}).refine((data) => {
  const startDate = new Date(data.start_date);
  const endDate = new Date(data.end_date);
  return endDate >= startDate;
}, {
  message: "Data zakończenia musi być późniejsza niż data rozpoczęcia",
  path: ["end_date"]
});

interface CampFormProps {
  initialData?: CampData;
  onSuccess?: () => void;
  onCancel?: () => void;
}

export function CampForm({ initialData, onSuccess, onCancel }: CampFormProps) {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    watch
  } = useForm({
    resolver: zodResolver(campSchema),
    defaultValues: initialData || {
      name: '',
      type: 'turnus',
      location: 'Przebrno',
      start_date: format(new Date(), 'yyyy-MM-dd'),
      end_date: format(new Date(), 'yyyy-MM-dd'),
      price: 0,
      capacity: 0
    }
  });

  const startDate = watch('start_date');

  const onSubmit = async (data: any) => {
    try {
      if (initialData?.id) {
        const { error } = await updateCamp(initialData.id, data);
        if (error) throw error;
        toast.success('Obóz został zaktualizowany');
      } else {
        const { error } = await createCamp(data);
        if (error) throw error;
        toast.success('Obóz został utworzony');
      }
      onSuccess?.();
    } catch (error) {
      console.error('Error saving camp:', error);
      toast.error('Wystąpił błąd podczas zapisywania obozu');
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Nazwa obozu
        </label>
        <input
          type="text"
          {...register('name')}
          className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500 sm:text-sm"
          placeholder="np. OBÓZ ŻEGLARSKI W PRZEBRNIE"
        />
        {errors.name && (
          <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Typ obozu
        </label>
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Tag className="h-5 w-5 text-gray-400" />
          </div>
          <select
            {...register('type')}
            className="mt-1 block w-full pl-10 rounded-lg border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500 sm:text-sm"
          >
            <option value="hotelik">Hotelik</option>
            <option value="zlot">Zlot</option>
            <option value="turnus">Turnus</option>
          </select>
        </div>
        {errors.type && (
          <p className="mt-1 text-sm text-red-600">{errors.type.message}</p>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Lokalizacja
        </label>
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <MapPin className="h-5 w-5 text-gray-400" />
          </div>
          <input
            type="text"
            {...register('location')}
            className="mt-1 block w-full pl-10 rounded-lg border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500 sm:text-sm"
          />
        </div>
        {errors.location && (
          <p className="mt-1 text-sm text-red-600">{errors.location.message}</p>
        )}
      </div>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Data rozpoczęcia
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Calendar className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="date"
              {...register('start_date')}
              min={format(new Date(), 'yyyy-MM-dd')}
              className="mt-1 block w-full pl-10 rounded-lg border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500 sm:text-sm"
            />
          </div>
          {errors.start_date && (
            <p className="mt-1 text-sm text-red-600">{errors.start_date.message}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Data zakończenia
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Calendar className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="date"
              {...register('end_date')}
              min={startDate}
              className="mt-1 block w-full pl-10 rounded-lg border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500 sm:text-sm"
            />
          </div>
          {errors.end_date && (
            <p className="mt-1 text-sm text-red-600">{errors.end_date.message}</p>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Cena (PLN)
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <DollarSign className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="number"
              {...register('price', { valueAsNumber: true })}
              min="0"
              step="0.01"
              className="mt-1 block w-full pl-10 rounded-lg border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500 sm:text-sm"
            />
          </div>
          {errors.price && (
            <p className="mt-1 text-sm text-red-600">{errors.price.message}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Liczba miejsc
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Users className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="number"
              {...register('capacity', { valueAsNumber: true })}
              min="1"
              className="mt-1 block w-full pl-10 rounded-lg border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500 sm:text-sm"
            />
          </div>
          {errors.capacity && (
            <p className="mt-1 text-sm text-red-600">{errors.capacity.message}</p>
          )}
        </div>
      </div>

      <div className="flex justify-end space-x-3">
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 border border-gray-300 rounded-lg shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-colors duration-200"
          >
            Anuluj
          </button>
        )}
        <button
          type="submit"
          disabled={isSubmitting}
          className="inline-flex justify-center py-2 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 transition-colors duration-200"
        >
          {isSubmitting ? 'Zapisywanie...' : initialData ? 'Aktualizuj' : 'Utwórz'}
        </button>
      </div>
    </form>
  );
}