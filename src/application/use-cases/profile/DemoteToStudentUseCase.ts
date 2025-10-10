import { IProfileRepository } from '@/src/core/interfaces/repositories/IProfileRepository';
import { IAuthRepository } from '@/src/core/interfaces/repositories/IAuthRepository';

export interface DemoteToStudentResult {
  success: boolean;
  error?: string;
}

export class DemoteToStudentUseCase {
  constructor(
    private readonly profileRepository: IProfileRepository,
    private readonly authRepository: IAuthRepository
  ) {}

  async execute(userId: string): Promise<DemoteToStudentResult> {
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

      // Demote teacher to student
      await this.profileRepository.demoteToStudent(userId);

      return {
        success: true,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Error al degradar usuario',
      };
    }
  }
}

