import { z } from 'zod';

// ============================================
// AUTH SCHEMAS
// ============================================

export const loginSchema = z.object({
  email: z
    .string()
    .min(1, 'El email es requerido')
    .email('Email inválido'),
  password: z
    .string()
    .min(6, 'La contraseña debe tener al menos 6 caracteres'),
});

export const signupSchema = z.object({
  firstName: z
    .string()
    .min(2, 'El nombre debe tener al menos 2 caracteres')
    .max(50, 'El nombre no puede exceder 50 caracteres')
    .regex(/^[a-zA-ZáéíóúÁÉÍÓÚñÑ]+$/, 'El nombre solo puede contener letras'),
  lastName: z
    .string()
    .min(2, 'El apellido debe tener al menos 2 caracteres')
    .max(50, 'El apellido no puede exceder 50 caracteres')
    .regex(/^[a-zA-ZáéíóúÁÉÍÓÚñÑ]+$/, 'El apellido solo puede contener letras'),
  email: z
    .string()
    .min(1, 'El email es requerido')
    .email('Email inválido'),
  password: z
    .string()
    .min(6, 'La contraseña debe tener al menos 6 caracteres')
    .regex(/[A-Z]/, 'Debe contener al menos una mayúscula')
    .regex(/[a-z]/, 'Debe contener al menos una minúscula')
    .regex(/[0-9]/, 'Debe contener al menos un número'),
});

export const forgotPasswordSchema = z.object({
  email: z
    .string()
    .min(1, 'El email es requerido')
    .email('Email inválido'),
});

export const resetPasswordSchema = z.object({
  password: z
    .string()
    .min(6, 'La contraseña debe tener al menos 6 caracteres')
    .regex(/[A-Z]/, 'Debe contener al menos una mayúscula')
    .regex(/[a-z]/, 'Debe contener al menos una minúscula')
    .regex(/[0-9]/, 'Debe contener al menos un número'),
  confirmPassword: z
    .string()
    .min(1, 'Debes confirmar la contraseña'),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Las contraseñas no coinciden',
  path: ['confirmPassword'],
});

// ============================================
// USER MANAGEMENT SCHEMAS
// ============================================

export const createUserSchema = z.object({
  email: z
    .string()
    .min(1, 'El email es requerido')
    .email('Email inválido'),
  password: z
    .string()
    .min(6, 'La contraseña debe tener al menos 6 caracteres')
    .regex(/[A-Z]/, 'Debe contener al menos una mayúscula')
    .regex(/[a-z]/, 'Debe contener al menos una minúscula')
    .regex(/[0-9]/, 'Debe contener al menos un número'),
  fullName: z
    .string()
    .min(2, 'El nombre debe tener al menos 2 caracteres')
    .max(100, 'El nombre no puede exceder 100 caracteres')
    .regex(/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/, 'El nombre solo puede contener letras'),
  role: z.enum(['student', 'teacher', 'admin']),
});

// ============================================
// COURSE SCHEMAS
// ============================================

export const courseSchema = z.object({
  title: z
    .string()
    .min(3, 'El título debe tener al menos 3 caracteres')
    .max(200, 'El título no puede exceder 200 caracteres'),
  description: z
    .string()
    .min(10, 'La descripción debe tener al menos 10 caracteres')
    .max(1000, 'La descripción no puede exceder 1000 caracteres')
    .optional()
    .or(z.literal('')),
  startDate: z
    .string()
    .min(1, 'La fecha de inicio es requerida')
    .refine((date) => !isNaN(Date.parse(date)), {
      message: 'Fecha inválida',
    }),
  endDate: z
    .string()
    .min(1, 'La fecha de fin es requerida')
    .refine((date) => !isNaN(Date.parse(date)), {
      message: 'Fecha inválida',
    }),
  isActive: z.boolean().optional(),
}).refine((data) => {
  const start = new Date(data.startDate);
  const end = new Date(data.endDate);
  return end >= start;
}, {
  message: 'La fecha de fin debe ser posterior a la fecha de inicio',
  path: ['endDate'],
});

// ============================================
// MODULE SCHEMAS
// ============================================

export const moduleSchema = z.object({
  title: z
    .string()
    .min(3, 'El título debe tener al menos 3 caracteres')
    .max(200, 'El título no puede exceder 200 caracteres'),
  description: z
    .string()
    .min(10, 'La descripción debe tener al menos 10 caracteres')
    .max(500, 'La descripción no puede exceder 500 caracteres')
    .optional()
    .or(z.literal('')),
  orderIndex: z
    .number()
    .int('El orden debe ser un número entero')
    .positive('El orden debe ser mayor a 0'),
  content: z
    .string()
    .max(10000, 'El contenido no puede exceder 10000 caracteres')
    .optional()
    .or(z.literal('')),
  isPublished: z.boolean().optional(),
});

// ============================================
// LESSON SCHEMAS
// ============================================

export const lessonSchema = z.object({
  title: z
    .string()
    .min(3, 'El título debe tener al menos 3 caracteres')
    .max(200, 'El título no puede exceder 200 caracteres'),
  content: z
    .string()
    .max(50000, 'El contenido no puede exceder 50000 caracteres')
    .optional()
    .or(z.literal('')),
  orderIndex: z
    .number()
    .int('El orden debe ser un número entero')
    .positive('El orden debe ser mayor a 0'),
  durationMinutes: z
    .number()
    .int('La duración debe ser un número entero')
    .positive('La duración debe ser mayor a 0')
    .max(480, 'La duración no puede exceder 480 minutos (8 horas)')
    .optional()
    .or(z.literal(0)),
  isPublished: z.boolean().optional(),
});

// ============================================
// PROFILE SCHEMAS
// ============================================

export const updateProfileSchema = z.object({
  fullName: z
    .string()
    .min(2, 'El nombre debe tener al menos 2 caracteres')
    .max(100, 'El nombre no puede exceder 100 caracteres')
    .regex(/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/, 'El nombre solo puede contener letras')
    .optional(),
  avatarUrl: z
    .string()
    .url('URL inválida')
    .optional()
    .or(z.literal('')),
});

// ============================================
// TYPE EXPORTS
// ============================================

export type LoginInput = z.infer<typeof loginSchema>;
export type SignupInput = z.infer<typeof signupSchema>;
export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;
export type CreateUserInput = z.infer<typeof createUserSchema>;
export type CourseInput = z.infer<typeof courseSchema>;
export type ModuleInput = z.infer<typeof moduleSchema>;
export type LessonInput = z.infer<typeof lessonSchema>;
export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
