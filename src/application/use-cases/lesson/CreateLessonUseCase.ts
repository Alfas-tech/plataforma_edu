import { ILessonRepository } from '@/src/core/interfaces/repositories/ILessonRepository';
import { IModuleRepository } from '@/src/core/interfaces/repositories/IModuleRepository';
import { ICourseRepository } from '@/src/core/interfaces/repositories/ICourseRepository';
import { IAuthRepository } from '@/src/core/interfaces/repositories/IAuthRepository';
import { IProfileRepository } from '@/src/core/interfaces/repositories/IProfileRepository';
import { LessonEntity } from '@/src/core/entities/Lesson.entity';

export interface CreateLessonInput {
  module_id: string;
  title: string;
  content: string | null;
  order_index: number;
  duration_minutes: number | null;
  is_published: boolean;
}

export interface CreateLessonResult {
  success: boolean;
  lesson?: LessonEntity;
  error?: string;
}

export class CreateLessonUseCase {
  constructor(
    private readonly lessonRepository: ILessonRepository,
    private readonly moduleRepository: IModuleRepository,
    private readonly courseRepository: ICourseRepository,
    private readonly authRepository: IAuthRepository,
    private readonly profileRepository: IProfileRepository
  ) {}

  async execute(input: CreateLessonInput): Promise<CreateLessonResult> {
    try {
      // Verify module exists
      const moduleData = await this.moduleRepository.getModuleById(input.module_id);
      if (!moduleData) {
        return {
          success: false,
          error: 'Módulo no encontrado',
        };
      }

      // Admins and assigned teachers can create lessons
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

      if (!profile.isAdmin() && !profile.isTeacher()) {
        return {
          success: false,
          error: 'No tienes permisos para crear lecciones',
        };
      }

      // If teacher, check if assigned to the course
      if (profile.isTeacher()) {
        const assignedTeachers = await this.courseRepository.getCourseTeachers(moduleData.courseId);
        if (!assignedTeachers.includes(currentUser.id)) {
          return {
            success: false,
            error: 'No estás asignado a este curso',
          };
        }
      }

      // Create lesson
      const lesson = await this.lessonRepository.createLesson(input);

      return {
        success: true,
        lesson,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Error al crear lección',
      };
    }
  }
}
