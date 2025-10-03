import { IAuthRepository } from '@/src/core/interfaces/repositories/IAuthRepository';
import { AuthResult } from '@/src/core/types/auth.types';

export class UpdatePasswordUseCase {
  constructor(private readonly authRepository: IAuthRepository) {}

  async execute(password: string): Promise<any> {
    if (!password || password.length < 6) {
      return {
        success: false,
        error: 'La contraseña debe tener al menos 6 caracteres',
      };
    }

    try {
      await this.authRepository.updatePassword(password);
      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Error al actualizar la contraseña',
      };
    }
  }
}