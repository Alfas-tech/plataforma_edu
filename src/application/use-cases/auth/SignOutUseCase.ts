import { IAuthRepository } from '@/src/core/interfaces/repositories/IAuthRepository';
import { AuthResult } from '@/src/core/types/auth.types';

export class SignOutUseCase {
  constructor(private readonly authRepository: IAuthRepository) {}

  async execute(): Promise<any> {
    try {
      await this.authRepository.signOut();
      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Error al cerrar sesión',
      };
    }
  }
}