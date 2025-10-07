import { IAuthRepository } from "@/src/core/interfaces/repositories/IAuthRepository";

interface GoogleSignInResult {
  success: boolean;
  url?: string;
  error?: string;
}

export class SignInWithGoogleUseCase {
  constructor(private readonly authRepository: IAuthRepository) {}

  async execute(): Promise<any> {
    try {
      const url = await this.authRepository.signInWithGoogle();
      return { success: true, url };
    } catch (error) {
      return {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Error al iniciar sesión con Google",
      };
    }
  }
}
