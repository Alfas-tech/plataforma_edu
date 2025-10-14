import { ILessonRepository } from '@/src/core/interfaces/repositories/ILessonRepository';
import { IModuleRepository } from '@/src/core/interfaces/repositories/IModuleRepository';
import { ICourseRepository } from '@/src/core/interfaces/repositories/ICourseRepository';
import { IAuthRepository } from '@/src/core/interfaces/repositories/IAuthRepository';
import { IProfileRepository } from '@/src/core/interfaces/repositories/IProfileRepository';

export interface DeleteLessonResult {
  success: boolean;
  error?: string;
}

export class DeleteLessonUseCase {
  constructor(
    private readonly lessonRepository: ILessonRepository,
    private readonly moduleRepository: IModuleRepository,
    private readonly courseRepository: ICourseRepository,
    private readonly authRepository: IAuthRepository,
    private readonly profileRepository: IProfileRepository
  ) {}

  async execute(lessonId: string): Promise<DeleteLessonResult> {
    try {
      // Verify lesson exists
      const lesson = await this.lessonRepository.getLessonById(lessonId);
      if (!lesson) {
        return {
          success: false,
          error: 'Lección no encontrada',
        };
      }

      // Get module
      const moduleData = await this.moduleRepository.getModuleById(lesson.moduleId);
      if (!moduleData) {
        return {
          success: false,
          error: 'Módulo no encontrado',
        };
      }

      // Only admins can delete lessons
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

      if (!profile.isAdmin()) {
        return {
          success: false,
          error: 'Solo los administradores pueden eliminar lecciones',
        };
      }

      // Delete lesson
      await this.lessonRepository.deleteLesson(lessonId);

      return {
        success: true,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Error al eliminar lección',
      };
    }
  }
}
