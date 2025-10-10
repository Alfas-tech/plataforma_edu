import { IModuleRepository } from '@/src/core/interfaces/repositories/IModuleRepository';
import { ICourseRepository } from '@/src/core/interfaces/repositories/ICourseRepository';
import { IAuthRepository } from '@/src/core/interfaces/repositories/IAuthRepository';
import { IProfileRepository } from '@/src/core/interfaces/repositories/IProfileRepository';
import { CourseModuleEntity } from '@/src/core/entities/CourseModule.entity';

export interface GetModulesByCourseResult {
  success: boolean;
  modules?: CourseModuleEntity[];
  error?: string;
}

export class GetModulesByCourseUseCase {
  constructor(
    private readonly moduleRepository: IModuleRepository,
    private readonly courseRepository: ICourseRepository,
    private readonly authRepository: IAuthRepository,
    private readonly profileRepository: IProfileRepository
  ) {}

  async execute(courseId: string): Promise<GetModulesByCourseResult> {
    try {
      // Verify course exists
      const course = await this.courseRepository.getCourseById(courseId);
      if (!course) {
        return {
          success: false,
          error: 'Curso no encontrado',
        };
      }

      // Get current user and check permissions
      const currentUser = await this.authRepository.getCurrentUser();
      if (!currentUser) {
        return {
          success: false,
          error: 'No hay usuario autenticado',
        };
      }

      const profile = await this.profileRepository.getProfileByUserId(currentUser.id);
      if (!profile) {
        return {
          success: false,
          error: 'Perfil no encontrado',
        };
      }

      // Get all modules
      const modules = await this.moduleRepository.getModulesByCourseId(courseId);

      // Filter based on user role
      if (profile.isStudent()) {
        // Students only see published modules
        return {
          success: true,
          modules: modules.filter(m => m.isPublished),
        };
      } else {
        // Admins and teachers see all modules
        return {
          success: true,
          modules,
        };
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Error al obtener módulos',
      };
    }
  }
}

