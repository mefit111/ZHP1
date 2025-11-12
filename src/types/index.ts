import { z } from 'zod';

// Base schemas
export const campSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(5, 'Nazwa musi mieć minimum 5 znaków'),
  start_date: z.string().refine(date => new Date(date) > new Date(), {
    message: 'Data rozpoczęcia musi być w przyszłości'
  }),
  end_date: z.string().refine(date => new Date(date) > new Date(), {
    message: 'Data zakończenia musi być w przyszłości'
  }),
  price: z.number().min(1, 'Cena musi być większa od 0'),
  capacity: z.number().min(1, 'Pojemność musi być większa od 0'),
  created_at: z.string().datetime(),
  updated_at: z.string().datetime()
}).refine(data => {
  const start = new Date(data.start_date);
  const end = new Date(data.end_date);
  return end > start;
}, {
  message: "Data zakończenia musi być późniejsza niż data rozpoczęcia",
  path: ["end_date"]
});

export const registrationSchema = z.object({
  id: z.string().uuid().optional(),
  camp_id: z.string().uuid(),
  first_name: z.string().min(2, 'Imię musi mieć minimum 2 znaki'),
  last_name: z.string().min(2, 'Nazwisko musi mieć minimum 2 znaki'),
  pesel: z.string().regex(/^\d{11}$/, 'PESEL musi mieć 11 cyfr'),
  birth_date: z.string().refine(date => {
    const birthDate = new Date(date);
    const today = new Date();
    const age = today.getFullYear() - birthDate.getFullYear();
    return age >= 7 && age <= 21;
  }, 'Uczestnik musi mieć między 7 a 21 lat'),
  email: z.string().email('Wprowadź poprawny adres email'),
  phone: z.string().regex(/^\+?[\d\s-]{9,}$/, 'Wprowadź poprawny numer telefonu'),
  address: z.string().min(5, 'Wprowadź pełny adres'),
  city: z.string().min(2, 'Wprowadź nazwę miasta'),
  postal_code: z.string().regex(/^\d{2}-\d{3}$/, 'Wprowadź poprawny kod pocztowy (XX-XXX)'),
  zhp_status: z.string().optional(),
  notes: z.string().optional(),
  payment_status: z.enum(['pending', 'partial', 'completed', 'refunded']).default('pending'),
  registration_status: z.enum(['pending', 'confirmed', 'cancelled']).default('pending'),
  created_at: z.string().datetime().optional(),
  updated_at: z.string().datetime().optional()
});

export const paymentSchema = z.object({
  id: z.string().uuid().optional(),
  registration_id: z.string().uuid(),
  amount: z.number().min(0.01, 'Kwota musi być większa od 0'),
  status: z.enum(['pending', 'completed', 'failed', 'refunded']),
  payment_date: z.string().datetime().optional(),
  created_at: z.string().datetime().optional()
});

export const notificationSchema = z.object({
  id: z.string().uuid().optional(),
  registration_id: z.string().uuid(),
  type: z.enum(['registration', 'payment', 'reminder', 'confirmation']),
  subject: z.string().min(1, 'Temat jest wymagany'),
  content: z.string().min(1, 'Treść jest wymagana'),
  sent_at: z.string().datetime().optional()
});

// Inferred types
export type Camp = z.infer<typeof campSchema>;
export type Registration = z.infer<typeof registrationSchema>;
export type Payment = z.infer<typeof paymentSchema>;
export type Notification = z.infer<typeof notificationSchema>;

// Utility types
export type RegistrationWithCamp = Registration & {
  camp: Camp;
};

export type PaymentWithRegistration = Payment & {
  registration: Registration;
};

export type NotificationWithRegistration = Notification & {
  registration: Registration;
};

// API response types
export interface ApiResponse<T> {
  data: T | null;
  error: Error | null;
}

export interface PaginatedResponse<T> {
  data: T[];
  count: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

// Auth types
export interface LoginCredentials {
  email: string;
  password: string;
  remember?: boolean;
}

export interface AuthError {
  message: string;
  status?: number;
}

// Form types
export interface FormStepProps {
  onNext: () => void;
  onPrev: () => void;
  isFirst: boolean;
  isLast: boolean;
  currentStep: number;
  totalSteps: number;
}