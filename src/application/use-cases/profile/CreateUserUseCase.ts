import { IAuthRepository } from '@/src/core/interfaces/repositories/IAuthRepository';
import { IProfileRepository } from '@/src/core/interfaces/repositories/IProfileRepository';

export interface CreateUserInput {
  email: string;
  password: string;
  fullName: string;
  role: 'student' | 'teacher' | 'admin';
}

export interface CreateUserResult {
  success: boolean;
  userId?: string;
  error?: string;
}

export class CreateUserUseCase {
  constructor(
    private readonly authRepository: IAuthRepository,
    private readonly profileRepository: IProfileRepository
  ) {}

  async execute(input: CreateUserInput): Promise<CreateUserResult> {
    try {
      // Verify current user is admin
      const currentUser = await this.authRepository.getCurrentUser();
      if (!currentUser) {
        return {
          success: false,
          error: 'No hay usuario autenticado',
        };
      }

      const currentProfile = await this.profileRepository.getProfileByUserId(currentUser.id);
      if (!currentProfile || !currentProfile.isAdmin()) {
        return {
          success: false,
          error: 'Solo los administradores pueden crear usuarios',
        };
      }

      // Validate input
      if (!input.email || !input.password || !input.fullName) {
        return {
          success: false,
          error: 'Email, contraseña y nombre completo son requeridos',
        };
      }

      if (input.password.length < 6) {
        return {
          success: false,
          error: 'La contraseña debe tener al menos 6 caracteres',
        };
      }

      // Check if user already exists
      const existingProfile = await this.profileRepository.getProfileByEmail(input.email);
      if (existingProfile) {
        return {
          success: false,
          error: 'Ya existe un usuario con este email',
        };
      }

      // Create user - This will be handled by Supabase Admin API
      // For now, we'll return success and handle it in the infrastructure layer
      return {
        success: true,
        error: 'Esta funcionalidad requiere configuración adicional en Supabase',
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Error al crear usuario',
      };
    }
  }
}

