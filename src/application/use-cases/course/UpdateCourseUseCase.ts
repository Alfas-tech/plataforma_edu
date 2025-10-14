import { ICourseRepository } from '@/src/core/interfaces/repositories/ICourseRepository';
import { IAuthRepository } from '@/src/core/interfaces/repositories/IAuthRepository';
import { IProfileRepository } from '@/src/core/interfaces/repositories/IProfileRepository';
import { CourseEntity } from '@/src/core/entities/Course.entity';
import { UpdateCourseInput } from '@/src/core/types/course.types';

export interface UpdateCourseResult {
  success: boolean;
  course?: CourseEntity;
  error?: string;
}

export class UpdateCourseUseCase {
  constructor(
    private readonly courseRepository: ICourseRepository,
    private readonly authRepository: IAuthRepository,
    private readonly profileRepository: IProfileRepository
  ) {}

  async execute(courseId: string, input: UpdateCourseInput): Promise<UpdateCourseResult> {
    try {
      // Verify current user is admin or assigned teacher
      const currentUser = await this.authRepository.getCurrentUser();
      if (!currentUser) {
        return {
          success: false,
          error: 'No hay usuario autenticado',
        };
      }

      const currentProfile = await this.profileRepository.getProfileByUserId(currentUser.id);
      if (!currentProfile) {
        return {
          success: false,
          error: 'Perfil no encontrado',
        };
      }

      // Admins can edit any course, teachers only their assigned courses
      if (!currentProfile.isAdmin()) {
        if (!currentProfile.isTeacher()) {
          return {
            success: false,
            error: 'No tienes permisos para editar cursos',
          };
        }

        // Check if teacher is assigned to this course
        const assignedTeachers = await this.courseRepository.getCourseTeachers(courseId);
        if (!assignedTeachers.includes(currentUser.id)) {
          return {
            success: false,
            error: 'No estás asignado a este curso',
          };
        }
      }

      // Validate dates if provided
      if (input.start_date && input.end_date) {
        const startDate = new Date(input.start_date);
        const endDate = new Date(input.end_date);

        if (endDate <= startDate) {
          return {
            success: false,
            error: 'La fecha de fin debe ser posterior a la fecha de inicio',
          };
        }
      }

      // Update course
      const course = await this.courseRepository.updateCourse(courseId, input);

      return {
        success: true,
        course,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Error al actualizar curso',
      };
    }
  }
}

