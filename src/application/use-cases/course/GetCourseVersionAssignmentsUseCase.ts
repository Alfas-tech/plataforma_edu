import { CourseEntity } from "@/src/core/entities/Course.entity";
import { CourseVersionEntity } from "@/src/core/entities/CourseVersion.entity";
import { ICourseRepository } from "@/src/core/interfaces/repositories/ICourseRepository";
import { IAuthRepository } from "@/src/core/interfaces/repositories/IAuthRepository";
import { IProfileRepository } from "@/src/core/interfaces/repositories/IProfileRepository";

export interface CourseVersionAssignmentsResult {
  success: boolean;
  course?: CourseEntity;
  assignments?: Array<{
    version: CourseVersionEntity;
    teacherIds: string[];
  }>;
  error?: string;
}

export class GetCourseVersionAssignmentsUseCase {
  constructor(
    private readonly courseRepository: ICourseRepository,
    private readonly authRepository: IAuthRepository,
    private readonly profileRepository: IProfileRepository
  ) {}

  async execute(courseId: string): Promise<CourseVersionAssignmentsResult> {
    try {
      const currentUser = await this.authRepository.getCurrentUser();
      if (!currentUser) {
        return {
          success: false,
          error: "No hay usuario autenticado",
        };
      }

      const profile = await this.profileRepository.getProfileByUserId(
        currentUser.id
      );

      if (!profile) {
        return {
          success: false,
          error: "Perfil no encontrado",
        };
      }

      const course = await this.courseRepository.getCourseById(courseId);
      if (!course) {
        return {
          success: false,
          error: "Curso no encontrado",
        };
      }

      const assignments = await this.courseRepository.getCourseVersionAssignments(
        courseId
      );

      if (profile.isAdmin()) {
        return {
          success: true,
          course,
          assignments,
        };
      }

      if (!profile.isTeacher()) {
        return {
          success: false,
          error: "No tienes permisos para acceder a las versiones del curso",
        };
      }

      const teacherAssignments = assignments.filter((assignment) =>
        assignment.teacherIds.includes(currentUser.id)
      );

      if (teacherAssignments.length === 0) {
        return {
          success: false,
          error: "No estás asignado a ninguna versión de este curso",
        };
      }

      return {
        success: true,
        course,
        assignments: teacherAssignments,
      };
    } catch (error) {
      return {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Error al obtener las versiones del curso",
      };
    }
  }
}
