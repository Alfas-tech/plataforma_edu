import { ICourseRepository } from "@/src/core/interfaces/repositories/ICourseRepository";
import { IAuthRepository } from "@/src/core/interfaces/repositories/IAuthRepository";
import { IProfileRepository } from "@/src/core/interfaces/repositories/IProfileRepository";

export interface RemoveTeacherFromCourseVersionResult {
  success: boolean;
  error?: string;
}

export class RemoveTeacherFromCourseVersionUseCase {
  constructor(
    private readonly courseRepository: ICourseRepository,
    private readonly authRepository: IAuthRepository,
    private readonly profileRepository: IProfileRepository
  ) {}

  async execute(
    courseId: string,
    courseVersionId: string,
    teacherId: string
  ): Promise<RemoveTeacherFromCourseVersionResult> {
    try {
      const currentUser = await this.authRepository.getCurrentUser();
      if (!currentUser) {
        return {
          success: false,
          error: "No hay usuario autenticado",
        };
      }

      const currentProfile = await this.profileRepository.getProfileByUserId(
        currentUser.id
      );
      if (!currentProfile || !currentProfile.isAdmin()) {
        return {
          success: false,
          error: "Solo los administradores pueden remover docentes",
        };
      }

      const course = await this.courseRepository.getCourseById(courseId);
      if (!course) {
        return {
          success: false,
          error: "Curso no encontrado",
        };
      }

      const version =
        await this.courseRepository.getCourseVersionById(courseVersionId);
      if (!version) {
        return {
          success: false,
          error: "Versión del curso no encontrada",
        };
      }

      if (version.courseId !== course.id) {
        return {
          success: false,
          error: "La versión seleccionada no pertenece al curso",
        };
      }

      const assignedTeachers =
        await this.courseRepository.getVersionTeachers(courseVersionId);

      if (!assignedTeachers.includes(teacherId)) {
        return {
          success: false,
          error: "El docente no está asignado a esta versión",
        };
      }

      await this.courseRepository.removeTeacherFromVersion(
        courseId,
        courseVersionId,
        teacherId
      );

      return {
        success: true,
      };
    } catch (error) {
      return {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Error al remover docente de la versión",
      };
    }
  }
}
