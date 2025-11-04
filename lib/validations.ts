import { z } from "zod";

// ============================================
// AUTH SCHEMAS
// ============================================

export const loginSchema = z.object({
  email: z.string().min(1, "El email es requerido").email("Email inválido"),
  password: z.string().min(6, "La contraseña debe tener al menos 6 caracteres"),
});

export const signupSchema = z.object({
  firstName: z
    .string()
    .min(2, "El nombre debe tener al menos 2 caracteres")
    .max(50, "El nombre no puede exceder 50 caracteres")
    .regex(/^[a-zA-ZáéíóúÁÉÍÓÚñÑ]+$/, "El nombre solo puede contener letras"),
  lastName: z
    .string()
    .min(2, "El apellido debe tener al menos 2 caracteres")
    .max(50, "El apellido no puede exceder 50 caracteres")
    .regex(/^[a-zA-ZáéíóúÁÉÍÓÚñÑ]+$/, "El apellido solo puede contener letras"),
  email: z.string().min(1, "El email es requerido").email("Email inválido"),
  password: z
    .string()
    .min(6, "La contraseña debe tener al menos 6 caracteres")
    .regex(/[A-Z]/, "Debe contener al menos una mayúscula")
    .regex(/[a-z]/, "Debe contener al menos una minúscula")
    .regex(/[0-9]/, "Debe contener al menos un número"),
});

export const forgotPasswordSchema = z.object({
  email: z.string().min(1, "El email es requerido").email("Email inválido"),
});

export const resetPasswordSchema = z
  .object({
    password: z
      .string()
      .min(6, "La contraseña debe tener al menos 6 caracteres")
      .regex(/[A-Z]/, "Debe contener al menos una mayúscula")
      .regex(/[a-z]/, "Debe contener al menos una minúscula")
      .regex(/[0-9]/, "Debe contener al menos un número"),
    confirmPassword: z.string().min(1, "Debes confirmar la contraseña"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Las contraseñas no coinciden",
    path: ["confirmPassword"],
  });

// ============================================
// USER MANAGEMENT SCHEMAS
// ============================================

export const createUserSchema = z.object({
  email: z.string().min(1, "El email es requerido").email("Email inválido"),
  password: z
    .string()
    .min(6, "La contraseña debe tener al menos 6 caracteres")
    .regex(/[A-Z]/, "Debe contener al menos una mayúscula")
    .regex(/[a-z]/, "Debe contener al menos una minúscula")
    .regex(/[0-9]/, "Debe contener al menos un número"),
  fullName: z
    .string()
    .min(2, "El nombre debe tener al menos 2 caracteres")
    .max(100, "El nombre no puede exceder 100 caracteres")
    .regex(/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/, "El nombre solo puede contener letras"),
  role: z.enum(["student", "teacher", "admin"]),
});

// ============================================
// COURSE SCHEMAS
// ============================================

export const courseSchema = z.object({
  title: z
    .string()
    .min(3, "El título debe tener al menos 3 caracteres")
    .max(200, "El título no puede exceder 200 caracteres"),
  summary: z
    .string()
    .min(10, "El resumen debe tener al menos 10 caracteres")
    .max(500, "El resumen no puede exceder 500 caracteres")
    .optional()
    .or(z.literal("")),
  description: z
    .string()
    .min(10, "La descripción debe tener al menos 10 caracteres")
    .max(2000, "La descripción no puede exceder 2000 caracteres")
    .optional()
    .or(z.literal("")),
  initialVersionLabel: z
    .string()
    .min(2, "La etiqueta debe tener al menos 2 caracteres")
    .max(50, "La etiqueta no puede exceder 50 caracteres")
    .optional()
    .or(z.literal("")),
  initialVersionSummary: z
    .string()
    .min(10, "El resumen de la versión debe tener al menos 10 caracteres")
    .max(500, "El resumen de la versión no puede exceder 500 caracteres")
    .optional()
    .or(z.literal("")),
});

// ============================================
// TOPIC SCHEMAS
// ============================================

export const topicSchema = z.object({
  title: z
    .string()
    .min(3, "El título debe tener al menos 3 caracteres")
    .max(200, "El título no puede exceder 200 caracteres"),
  description: z
    .string()
    .min(10, "La descripción debe tener al menos 10 caracteres")
    .max(500, "La descripción no puede exceder 500 caracteres")
    .optional()
    .or(z.literal("")),
});

// ============================================
// RESOURCE SCHEMAS
// ============================================

export const resourceSchema = z.object({
  title: z
    .string()
    .min(3, "El título debe tener al menos 3 caracteres")
    .max(200, "El título no puede exceder 200 caracteres"),
  description: z
    .string()
    .max(1000, "La descripción no puede exceder 1000 caracteres")
    .optional()
    .or(z.literal("")),
  resourceType: z.enum([
    "pdf",
    "document",
    "image",
    "audio",
    "video",
    "link",
  ]),
  fileUrl: z.string().url("URL inválida").optional().or(z.literal("")),
  externalUrl: z.string().url("URL inválida").optional().or(z.literal("")),
  orderIndex: z
    .number()
    .int("El orden debe ser un entero")
    .min(1, "El orden debe ser al menos 1")
    .optional(),
  fileName: z
    .string()
    .max(255, "El nombre del archivo es demasiado largo")
    .optional()
    .or(z.literal("")),
  fileSize: z
    .number()
    .int("El tamaño debe ser un entero")
    .positive("El tamaño debe ser mayor a 0")
    .optional(),
  mimeType: z
    .string()
    .max(120, "El tipo MIME es demasiado largo")
    .optional()
    .or(z.literal("")),
});

// ============================================
// PROFILE SCHEMAS
// ============================================
export const updateProfileSchema = z.object({
  fullName: z
    .string()
    .min(2, "El nombre debe tener al menos 2 caracteres")
    .max(100, "El nombre no puede exceder 100 caracteres")
    .regex(/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/, "El nombre solo puede contener letras")
    .optional(),
  avatarUrl: z.string().url("URL inválida").optional().or(z.literal("")),
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
export type TopicInput = z.infer<typeof topicSchema>;
export type ResourceInput = z.infer<typeof resourceSchema>;
export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
