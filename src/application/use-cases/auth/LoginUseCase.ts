import { IAuthRepository } from "@/src/core/interfaces/repositories/IAuthRepository";
import { LoginCredentials, AuthResult } from "@/src/core/types/auth.types";
import { UserEntity } from "@/src/core/entities/User.entity";

interface LoginResult extends AuthResult {
  user?: UserEntity;
}

export class LoginUseCase {
  constructor(private readonly authRepository: IAuthRepository) {}

  async execute(credentials: LoginCredentials): Promise<any> {
    try {
      const user = await this.authRepository.login(credentials);
      return { success: true, user };
    } catch (error) {
      return {
        success: false,
        error:
          error instanceof Error ? error.message : "Error al iniciar sesión",
      };
    }
  }
}
