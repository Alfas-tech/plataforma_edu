import { IModuleRepository } from "@/src/core/interfaces/repositories/IModuleRepository";
import { ICourseRepository } from "@/src/core/interfaces/repositories/ICourseRepository";
import { IAuthRepository } from "@/src/core/interfaces/repositories/IAuthRepository";
import { IProfileRepository } from "@/src/core/interfaces/repositories/IProfileRepository";

export interface DeleteModuleResult {
  success: boolean;
  error?: string;
}

export class DeleteModuleUseCase {
  constructor(
    private readonly moduleRepository: IModuleRepository,
    private readonly courseRepository: ICourseRepository,
    private readonly authRepository: IAuthRepository,
    private readonly profileRepository: IProfileRepository
  ) {}

  async execute(moduleId: string): Promise<DeleteModuleResult> {
    try {
      // Verify module exists
      const moduleData = await this.moduleRepository.getModuleById(moduleId);
      if (!moduleData) {
        return {
          success: false,
          error: "Módulo no encontrado",
        };
      }

      // Verify current user is authenticated
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

      // Only admins can delete modules (teachers cannot delete)
      if (!profile.isAdmin()) {
        return {
          success: false,
          error: "Solo los administradores pueden eliminar módulos",
        };
      }

      // Additional security: Verify the course exists and is accessible
      const course = await this.courseRepository.getCourseById(
        moduleData.courseId
      );
      if (!course) {
        return {
          success: false,
          error: "Curso no encontrado",
        };
      }

      // Delete module (will cascade delete associated lessons)
      await this.moduleRepository.deleteModule(moduleId);

      return {
        success: true,
      };
    } catch (error) {
      return {
        success: false,
        error:
          error instanceof Error ? error.message : "Error al eliminar módulo",
      };
    }
  }
}
