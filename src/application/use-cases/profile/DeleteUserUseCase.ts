import { IAuthRepository } from "@/src/core/interfaces/repositories/IAuthRepository";
import { IProfileRepository } from "@/src/core/interfaces/repositories/IProfileRepository";

export interface DeleteUserResult {
  success: boolean;
  error?: string;
}

export class DeleteUserUseCase {
  constructor(
    private readonly authRepository: IAuthRepository,
    private readonly profileRepository: IProfileRepository
  ) {}

  async execute(userId: string): Promise<DeleteUserResult> {
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
          error: "Solo los administradores pueden eliminar usuarios",
        };
      }

      // Prevent self-deletion
      if (currentUser.id === userId) {
        return {
          success: false,
          error: "No puedes eliminar tu propia cuenta",
        };
      }

      // Check if user exists
      const userProfile =
        await this.profileRepository.getProfileByUserId(userId);
      if (!userProfile) {
        return {
          success: false,
          error: "Usuario no encontrado",
        };
      }

      // Prevent deleting the last admin
      if (userProfile.isAdmin()) {
        const allProfiles = await this.profileRepository.getAllProfiles();
        const adminCount = allProfiles.filter((p) => p.isAdmin()).length;

        if (adminCount <= 1) {
          return {
            success: false,
            error: "No se puede eliminar al último administrador",
          };
        }
      }

      // Delete user - This will be handled by Supabase Admin API
      return {
        success: true,
        error:
          "Esta funcionalidad requiere configuración adicional en Supabase",
      };
    } catch (error) {
      return {
        success: false,
        error:
          error instanceof Error ? error.message : "Error al eliminar usuario",
      };
    }
  }
}
