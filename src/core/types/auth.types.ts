import { UserRole } from "./roles.types";

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface SignUpData {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
}

export interface AuthResult {
  success: boolean;
  error?: string;
}

export interface UserData {
  id: string;
  email: string;
  full_name?: string;
  avatar_url?: string;
  user_metadata?: Record<string, unknown>;
  created_at?: string;
}

export interface SupabaseUserData {
  id: string;
  email?: string;
  user_metadata?: {
    full_name?: string;
    avatar_url?: string;
    [key: string]: unknown;
  };
  created_at?: string;
}

export interface ProfileData {
  id: string;
  email: string;
  full_name: string | null;
  avatar_url: string | null;
  role: UserRole; // NUEVO
  created_at: string; // NUEVO
  updated_at: string; // NUEVO
}
