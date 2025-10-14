import { IProfileRepository } from '@/src/core/interfaces/repositories/IProfileRepository';
import { IAuthRepository } from '@/src/core/interfaces/repositories/IAuthRepository';
import { ProfileEntity } from '@/src/core/entities/Profile.entity';

export interface GetCurrentProfileResult {
  success: boolean;
  profile?: ProfileEntity;
  error?: string;
}

export class GetCurrentProfileUseCase {
  constructor(
    private readonly profileRepository: IProfileRepository,
    private readonly authRepository: IAuthRepository
  ) {}

  async execute(): Promise<GetCurrentProfileResult> {
    try {
      // Get current user
      const user = await this.authRepository.getCurrentUser();
      
      if (!user) {
        return {
          success: false,
          error: 'No hay usuario autenticado'
        };
      }

      // Get profile with role information
      const profile = await this.profileRepository.getProfileByUserId(user.id);

      if (!profile) {
        return {
          success: false,
          error: 'Perfil no encontrado'
        };
      }

      return {
        success: true,
        profile
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Error al obtener el perfil'
      };
    }
  }
}

