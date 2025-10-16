import { IAuthRepository } from "@/src/core/interfaces/repositories/IAuthRepository";
import { OAuthCallbackData, OAuthCallbackResult } from "@/src/core/types/auth.types";

export class HandleOAuthCallbackUseCase {
  constructor(private readonly authRepository: IAuthRepository) {}

  async execute(data: OAuthCallbackData): Promise<OAuthCallbackResult> {
    try {
      const user = await this.authRepository.handleOAuthCallback(data);
      
      return {
        success: true,
        redirectTo: data.next || "/dashboard",
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Error desconocido",
      };
    }
  }
}
