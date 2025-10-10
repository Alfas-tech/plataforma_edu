import { IProfileRepository } from '@/src/core/interfaces/repositories/IProfileRepository';
import { IAuthRepository } from '@/src/core/interfaces/repositories/IAuthRepository';

export interface PromoteToTeacherResult {
  success: boolean;
  error?: string;
}

export class PromoteToTeacherUseCase {
  constructor(
    private readonly profileRepository: IProfileRepository,
    private readonly authRepository: IAuthRepository
  ) {}

  async execute(userId: string): Promise<PromoteToTeacherResult> {
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
          error: 'No tienes permisos para realizar esta acción',
        };
      }

      // Promote user to teacher
      await this.profileRepository.promoteToTeacher(userId);

      return {
        success: true,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Error al promover usuario',
      };
    }
  }
}

