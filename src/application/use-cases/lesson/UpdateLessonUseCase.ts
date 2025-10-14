import { ILessonRepository } from '@/src/core/interfaces/repositories/ILessonRepository';
import { IModuleRepository } from '@/src/core/interfaces/repositories/IModuleRepository';
import { ICourseRepository } from '@/src/core/interfaces/repositories/ICourseRepository';
import { IAuthRepository } from '@/src/core/interfaces/repositories/IAuthRepository';
import { IProfileRepository } from '@/src/core/interfaces/repositories/IProfileRepository';
import { LessonEntity } from '@/src/core/entities/Lesson.entity';
import { LessonData } from '@/src/core/types/course.types';

export interface UpdateLessonResult {
  success: boolean;
  lesson?: LessonEntity;
  error?: string;
}

export class UpdateLessonUseCase {
  constructor(
    private readonly lessonRepository: ILessonRepository,
    private readonly moduleRepository: IModuleRepository,
    private readonly courseRepository: ICourseRepository,
    private readonly authRepository: IAuthRepository,
    private readonly profileRepository: IProfileRepository
  ) {}

  async execute(lessonId: string, data: Partial<LessonData>): Promise<UpdateLessonResult> {
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

      // Admins and assigned teachers can update lessons
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
          error: 'No tienes permisos para editar lecciones',
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

      // Handle order_index change with automatic reordering
      if (data.order_index !== undefined && data.order_index !== lesson.orderIndex) {
        const allLessons = await this.lessonRepository.getLessonsByModuleId(lesson.moduleId);
        const newOrder = data.order_index;
        const oldOrder = lesson.orderIndex;

        // Validate new order is within bounds
        if (newOrder < 1 || newOrder > allLessons.length) {
          return {
            success: false,
            error: `El orden debe estar entre 1 y ${allLessons.length}`,
          };
        }

        // Reorder logic
        if (newOrder < oldOrder) {
          // Moving up (e.g., from 4 to 2): shift lessons 2,3 down
          for (const l of allLessons) {
            if (l.id === lessonId) continue;
            if (l.orderIndex >= newOrder && l.orderIndex < oldOrder) {
              await this.lessonRepository.updateLesson(l.id, {
                order_index: l.orderIndex + 1,
              });
            }
          }
        } else {
          // Moving down (e.g., from 2 to 4): shift lessons 3,4 up
          for (const l of allLessons) {
            if (l.id === lessonId) continue;
            if (l.orderIndex > oldOrder && l.orderIndex <= newOrder) {
              await this.lessonRepository.updateLesson(l.id, {
                order_index: l.orderIndex - 1,
              });
            }
          }
        }
      }

      // Update the lesson with all data
      const updatedLesson = await this.lessonRepository.updateLesson(lessonId, data);

      return {
        success: true,
        lesson: updatedLesson,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Error al actualizar lección',
      };
    }
  }
}
