import { IAuthRepository } from "@/src/core/interfaces/repositories/IAuthRepository";
import { SignUpData, AuthResult } from "@/src/core/types/auth.types";
import { UserEntity } from "@/src/core/entities/User.entity";

interface SignUpResult extends AuthResult {
  user?: UserEntity;
  needsConfirmation?: boolean;
}

export class SignUpUseCase {
  constructor(private readonly authRepository: IAuthRepository) {}

  async execute(data: SignUpData): Promise<SignUpResult> {
    try {
      const result = await this.authRepository.signUp(data);
      return {
        success: true,
        user: result.user,
        needsConfirmation: result.needsConfirmation,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Error al registrarse",
      };
    }
  }
}
