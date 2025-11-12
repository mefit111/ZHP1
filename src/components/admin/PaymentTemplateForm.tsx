import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import toast from 'react-hot-toast';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getTemplates, createTemplate, updateTemplate } from '../../lib/admin';
import { AlertCircle, Save, X } from 'lucide-react';

const templateSchema = z.object({
  name: z.string().min(3, 'Nazwa musi mieć minimum 3 znaki'),
  content: z.string().min(10, 'Treść musi mieć minimum 10 znaków'),
  is_default: z.boolean().default(false)
});

interface PaymentTemplateFormProps {
  onClose: () => void;
  initialData?: {
    id: string;
    name: string;
    content: string;
    is_default: boolean;
  };
}

export function PaymentTemplateForm({ onClose, initialData }: PaymentTemplateFormProps) {
  const queryClient = useQueryClient();
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting }
  } = useForm({
    resolver: zodResolver(templateSchema),
    defaultValues: initialData || {
      name: '',
      content: `Szanowni Państwo,

Dziękujemy za rejestrację na obóz "{{camp_name}}".

Prosimy o dokonanie płatności w wysokości {{amount}} PLN na poniższy numer konta:
{{account_number}}

Tytuł przelewu: Opłata za obóz - {{participant_name}}

Z harcerskim pozdrowieniem,
Komenda Obozu`,
      is_default: false
    }
  });

  const mutation = useMutation({
    mutationFn: async (data: any) => {
      if (initialData?.id) {
        return updateTemplate(initialData.id, {
          ...data,
          type: 'payment_reminder'
        });
      } else {
        return createTemplate({
          ...data,
          type: 'payment_reminder'
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['paymentTemplates'] });
      toast.success(initialData ? 'Szablon został zaktualizowany' : 'Szablon został utworzony');
      onClose();
    },
    onError: (error) => {
      console.error('Error saving template:', error);
      toast.error('Wystąpił błąd podczas zapisywania szablonu');
    }
  });

  return (
    <form onSubmit={handleSubmit((data) => mutation.mutate(data))} className="space-y-6">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Nazwa szablonu
        </label>
        <input
          type="text"
          {...register('name')}
          className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500 sm:text-sm"
          placeholder="np. Standardowe przypomnienie o płatności"
        />
        {errors.name && (
          <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Treść wiadomości
        </label>
        <div className="mt-1 mb-2 text-sm text-gray-500">
          Dostępne zmienne:
          <ul className="list-disc list-inside mt-1">
            <li>{'{{current_date}}'} - aktualna data</li>
            <li>{'{{camp_name}}'} - nazwa obozu</li>
            <li>{'{{participant_name}}'} - imię i nazwisko uczestnika</li>
            <li>{'{{amount}}'} - kwota do zapłaty</li>
            <li>{'{{account_number}}'} - numer konta</li>
            <li>{'{{due_date}}'} - termin płatności</li>
          </ul>
        </div>
        <textarea
          {...register('content')}
          rows={10}
          className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500 sm:text-sm font-mono"
        />
        {errors.content && (
          <p className="mt-1 text-sm text-red-600">{errors.content.message}</p>
        )}
      </div>

      <div className="flex items-center">
        <input
          type="checkbox"
          {...register('is_default')}
          className="h-4 w-4 rounded border-gray-300 text-green-600 focus:ring-green-500"
        />
        <label className="ml-2 block text-sm text-gray-900">
          Ustaw jako domyślny szablon
        </label>
      </div>

      <div className="flex justify-end space-x-3">
        <button
          type="button"
          onClick={onClose}
          className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
        >
          Anuluj
        </button>
        <button
          type="submit"
          disabled={isSubmitting}
          className="px-4 py-2 text-sm font-medium text-white bg-green-600 border border-transparent rounded-lg hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50"
        >
          {isSubmitting ? 'Zapisywanie...' : initialData ? 'Aktualizuj' : 'Utwórz'}
        </button>
      </div>
    </form>
  );
}