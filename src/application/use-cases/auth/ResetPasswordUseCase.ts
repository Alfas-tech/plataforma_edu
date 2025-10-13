import { IAuthRepository } from "@/src/core/interfaces/repositories/IAuthRepository";
import { AuthResult } from "@/src/core/types/auth.types";

export class ResetPasswordUseCase {
  constructor(private readonly authRepository: IAuthRepository) {}

  async execute(email: string): Promise<any> {
    try {
      await this.authRepository.resetPassword(email);
      return { success: true };
    } catch (error) {
      return {
        success: false,
        error:
          error instanceof Error ? error.message : "Error al enviar el correo",
      };
    }
  }
}
