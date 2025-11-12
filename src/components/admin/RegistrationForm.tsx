import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { format } from 'date-fns';
import toast from 'react-hot-toast';
import { RegistrationData, updateRegistration } from '../../lib/admin';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '../../lib/supabase';

const registrationSchema = z.object({
  camp_id: z.string().uuid('Wybierz obóz'),
  first_name: z.string().min(2, 'Imię musi mieć minimum 2 znaki'),
  last_name: z.string().min(2, 'Nazwisko musi mieć minimum 2 znaki'),
  pesel: z.string().regex(/^\d{11}$/, 'PESEL musi mieć 11 cyfr'),
  birth_date: z.string(),
  email: z.string().email('Wprowadź poprawny adres email'),
  phone: z.string().regex(/^\+?[\d\s-]{9,}$/, 'Wprowadź poprawny numer telefonu'),
  address: z.string().min(5, 'Wprowadź pełny adres'),
  city: z.string().min(2, 'Wprowadź nazwę miasta'),
  postal_code: z.string().regex(/^\d{2}-\d{3}$/, 'Wprowadź poprawny kod pocztowy (XX-XXX)'),
  zhp_status: z.string().optional(),
  notes: z.string().optional(),
  registration_status: z.string(),
  payment_status: z.string()
});

interface RegistrationFormProps {
  initialData: RegistrationData;
  onSuccess?: () => void;
  onCancel?: () => void;
}

export function RegistrationForm({ initialData, onSuccess, onCancel }: RegistrationFormProps) {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting }
  } = useForm({
    resolver: zodResolver(registrationSchema),
    defaultValues: {
      ...initialData,
      birth_date: format(new Date(initialData.birth_date), 'yyyy-MM-dd'),
      camp_id: initialData.camp_id
    }
  });

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

  const onSubmit = async (data: any) => {
    try {
      if (!initialData.id) {
        throw new Error('Missing registration ID');
      }

      const { error } = await updateRegistration(initialData.id, data);
      if (error) throw error;

      toast.success('Zgłoszenie zostało zaktualizowane');
      onSuccess?.();
    } catch (error) {
      console.error('Error updating registration:', error);
      toast.error('Wystąpił błąd podczas aktualizacji zgłoszenia');
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Obóz
        </label>
        <select
          {...register('camp_id')}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500 sm:text-sm"
        >
          <option value="">Wybierz obóz</option>
          {camps?.map((camp) => (
            <option key={camp.id} value={camp.id}>
              {camp.name} ({format(new Date(camp.start_date), 'dd.MM.yyyy')} - {format(new Date(camp.end_date), 'dd.MM.yyyy')})
            </option>
          ))}
        </select>
        {errors.camp_id && (
          <p className="mt-1 text-sm text-red-600">{errors.camp_id.message}</p>
        )}
      </div>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Imię
          </label>
          <input
            type="text"
            {...register('first_name')}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500 sm:text-sm"
          />
          {errors.first_name && (
            <p className="mt-1 text-sm text-red-600">{errors.first_name.message}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">
            Nazwisko
          </label>
          <input
            type="text"
            {...register('last_name')}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500 sm:text-sm"
          />
          {errors.last_name && (
            <p className="mt-1 text-sm text-red-600">{errors.last_name.message}</p>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
        <div>
          <label className="block text-sm font-medium text-gray-700">
            PESEL
          </label>
          <input
            type="text"
            {...register('pesel')}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500 sm:text-sm"
          />
          {errors.pesel && (
            <p className="mt-1 text-sm text-red-600">{errors.pesel.message}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">
            Data urodzenia
          </label>
          <input
            type="date"
            {...register('birth_date')}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500 sm:text-sm"
          />
          {errors.birth_date && (
            <p className="mt-1 text-sm text-red-600">{errors.birth_date.message}</p>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Email
          </label>
          <input
            type="email"
            {...register('email')}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500 sm:text-sm"
          />
          {errors.email && (
            <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">
            Telefon
          </label>
          <input
            type="tel"
            {...register('phone')}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500 sm:text-sm"
          />
          {errors.phone && (
            <p className="mt-1 text-sm text-red-600">{errors.phone.message}</p>
          )}
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">
          Adres
        </label>
        <input
          type="text"
          {...register('address')}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500 sm:text-sm"
        />
        {errors.address && (
          <p className="mt-1 text-sm text-red-600">{errors.address.message}</p>
        )}
      </div>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Miasto
          </label>
          <input
            type="text"
            {...register('city')}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500 sm:text-sm"
          />
          {errors.city && (
            <p className="mt-1 text-sm text-red-600">{errors.city.message}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">
            Kod pocztowy
          </label>
          <input
            type="text"
            {...register('postal_code')}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500 sm:text-sm"
          />
          {errors.postal_code && (
            <p className="mt-1 text-sm text-red-600">{errors.postal_code.message}</p>
          )}
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">
          Status w ZHP
        </label>
        <select
          {...register('zhp_status')}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500 sm:text-sm"
        >
          <option value="">Brak</option>
          <option value="zuch">Zuch</option>
          <option value="harcerz">Harcerz</option>
          <option value="wedrownik">Wędrownik</option>
          <option value="instruktor">Instruktor</option>
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">
          Uwagi
        </label>
        <textarea
          {...register('notes')}
          rows={3}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500 sm:text-sm"
        />
      </div>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Status zgłoszenia
          </label>
          <select
            {...register('registration_status')}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500 sm:text-sm"
          >
            <option value="pending">Oczekujące</option>
            <option value="confirmed">Potwierdzone</option>
            <option value="cancelled">Anulowane</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">
            Status płatności
          </label>
          <select
            {...register('payment_status')}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500 sm:text-sm"
          >
            <option value="pending">Oczekująca</option>
            <option value="partial">Częściowa</option>
            <option value="completed">Opłacona</option>
            <option value="refunded">Zwrócona</option>
          </select>
        </div>
      </div>

      <div className="flex justify-end space-x-3">
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
          >
            Anuluj
          </button>
        )}
        <button
          type="submit"
          disabled={isSubmitting}
          className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50"
        >
          {isSubmitting ? 'Zapisywanie...' : 'Aktualizuj'}
        </button>
      </div>
    </form>
  );
}