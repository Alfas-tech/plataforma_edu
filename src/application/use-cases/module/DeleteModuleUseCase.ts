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

      // Admins can delete any module
      if (profile.isAdmin()) {
        await this.moduleRepository.deleteModule(moduleId);
        return { success: true };
      }

      // Teachers can delete modules if they are assigned to the course/version
      if (profile.isTeacher()) {
        // Get course version ID from module
        const courseVersionId = moduleData.courseVersionId;
        
        // Check if teacher is assigned to this version
        const isAssigned = await this.courseRepository.isTeacherAssignedToVersion(
          courseVersionId,
          currentUser.id
        );

        if (!isAssigned) {
          return {
            success: false,
            error: "No tienes permisos para eliminar este módulo",
          };
        }

        // Teacher is assigned, allow deletion
        await this.moduleRepository.deleteModule(moduleId);
        return { success: true };
      }

      // Not admin or teacher
      return {
        success: false,
        error: "No tienes permisos para eliminar módulos",
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
