import { ICourseRepository } from "@/src/core/interfaces/repositories/ICourseRepository";
import { IAuthRepository } from "@/src/core/interfaces/repositories/IAuthRepository";
import { IProfileRepository } from "@/src/core/interfaces/repositories/IProfileRepository";

export interface AssignTeacherToCourseResult {
  success: boolean;
  error?: string;
}

export class AssignTeacherToCourseUseCase {
  constructor(
    private readonly courseRepository: ICourseRepository,
    private readonly authRepository: IAuthRepository,
    private readonly profileRepository: IProfileRepository
  ) {}

  async execute(
    courseId: string,
    teacherId: string
  ): Promise<AssignTeacherToCourseResult> {
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
          error: "Solo los administradores pueden asignar docentes",
        };
      }

      // Verify the user is actually a teacher
      const teacherProfile =
        await this.profileRepository.getProfileByUserId(teacherId);
      if (!teacherProfile) {
        return {
          success: false,
          error: "Perfil de docente no encontrado",
        };
      }

      if (!teacherProfile.isTeacher()) {
        return {
          success: false,
          error: "El usuario no es un docente",
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

      // Check if already assigned
      const assignedTeachers =
        await this.courseRepository.getCourseTeachers(courseId);
      if (assignedTeachers && assignedTeachers.includes(teacherId)) {
        return {
          success: false,
          error: "El docente ya está asignado a este curso",
        };
      }

      // Assign teacher to course
      await this.courseRepository.assignTeacher(courseId, teacherId);

      return {
        success: true,
      };
    } catch (error) {
      return {
        success: false,
        error:
          error instanceof Error ? error.message : "Error al asignar docente",
      };
    }
  }
}
