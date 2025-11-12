import { z } from 'zod';

export const loginSchema = z.object({
  email: z.string().email('Wprowadź poprawny adres email'),
  password: z.string().min(6, 'Hasło musi mieć minimum 6 znaków')
});

export const registrationSchema = z.object({
  firstName: z.string().min(2, 'Imię musi mieć minimum 2 znaki'),
  lastName: z.string().min(2, 'Nazwisko musi mieć minimum 2 znaki'),
  pesel: z.string().regex(/^\d{11}$/, 'PESEL musi mieć 11 cyfr'),
  birthDate: z.string().refine((date) => {
    const birthDate = new Date(date);
    const today = new Date();
    return birthDate < today;
  }, 'Data urodzenia nie może być z przyszłości'),
  email: z.string().email('Wprowadź poprawny adres email'),
  phone: z.string().regex(/^\+?[\d\s-]{9,}$/, 'Wprowadź poprawny numer telefonu'),
  address: z.string().min(5, 'Wprowadź pełny adres'),
  city: z.string().min(2, 'Wprowadź nazwę miasta'),
  postalCode: z.string().regex(/^\d{2}-\d{3}$/, 'Wprowadź poprawny kod pocztowy (XX-XXX)'),
  zhpStatus: z.string().optional(),
  notes: z.string().optional()
});

export type LoginFormData = z.infer<typeof loginSchema>;
export type RegistrationFormData = z.infer<typeof registrationSchema>;

export function validateLoginData(data: LoginFormData) {
  try {
    loginSchema.parse(data);
    return { success: true, error: null };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        success: false,
        error: error.errors[0].message
      };
    }
    return {
      success: false,
      error: 'Nieprawidłowe dane logowania'
    };
  }
}

export function validateRegistrationData(data: RegistrationFormData) {
  try {
    registrationSchema.parse(data);
    return { success: true, error: null };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        success: false,
        error: error.errors[0].message
      };
    }
    return {
      success: false,
      error: 'Nieprawidłowe dane rejestracji'
    };
  }
}