import { IAuthRepository } from "@/src/core/interfaces/repositories/IAuthRepository";
import { IProfileRepository } from "@/src/core/interfaces/repositories/IProfileRepository";

export interface SendPasswordResetResult {
  success: boolean;
  error?: string;
}

export class SendPasswordResetUseCase {
  constructor(
    private readonly authRepository: IAuthRepository,
    private readonly profileRepository: IProfileRepository
  ) {}

  async execute(userId: string): Promise<SendPasswordResetResult> {
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
          error:
            "Solo los administradores pueden enviar emails de restablecimiento",
        };
      }

      // Get user profile to get email
      const userProfile =
        await this.profileRepository.getProfileByUserId(userId);
      if (!userProfile) {
        return {
          success: false,
          error: "Usuario no encontrado",
        };
      }

      // Send password reset email - This will be handled by Supabase
      return {
        success: true,
        error:
          "Esta funcionalidad requiere configuración adicional en Supabase",
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Error al enviar email",
      };
    }
  }
}
