import { ICourseRepository } from "@/src/core/interfaces/repositories/ICourseRepository";
import { IAuthRepository } from "@/src/core/interfaces/repositories/IAuthRepository";
import { IProfileRepository } from "@/src/core/interfaces/repositories/IProfileRepository";

export interface RemoveTeacherFromCourseResult {
  success: boolean;
  error?: string;
}

export class RemoveTeacherFromCourseUseCase {
  constructor(
    private readonly courseRepository: ICourseRepository,
    private readonly authRepository: IAuthRepository,
    private readonly profileRepository: IProfileRepository
  ) {}

  async execute(
    courseId: string,
    teacherId: string
  ): Promise<RemoveTeacherFromCourseResult> {
    try {
      // Verify current user is admin
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

      // Verify course exists
      const course = await this.courseRepository.getCourseById(courseId);
      if (!course) {
        return {
          success: false,
          error: "Curso no encontrado",
        };
      }

      const activeVersion = course.activeVersion;
      if (!activeVersion) {
        return {
          success: false,
          error: "El curso no tiene una versión activa",
        };
      }

      await this.courseRepository.removeTeacherFromVersion(
        courseId,
        activeVersion.id,
        teacherId
      );

      return {
        success: true,
      };
    } catch (error) {
      return {
        success: false,
        error:
          error instanceof Error ? error.message : "Error al remover docente",
      };
    }
  }
}
