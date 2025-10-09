import { UpdatePasswordUseCase } from '@/src/application/use-cases/auth/UpdatePasswordUseCase';
import { IAuthRepository } from '@/src/core/interfaces/repositories/IAuthRepository';

describe('UpdatePasswordUseCase', () => {
  let mockAuthRepository: jest.Mocked<any>;
  let updatePasswordUseCase: UpdatePasswordUseCase;

  beforeEach(() => {
    mockAuthRepository = {
      login: jest.fn(),
      signUp: jest.fn(),
      signOut: jest.fn(),
      getCurrentUser: jest.fn(),
      signInWithGoogle: jest.fn(),
      resetPassword: jest.fn(),
      updatePassword: jest.fn(),
    };
    updatePasswordUseCase = new UpdatePasswordUseCase(mockAuthRepository);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('execute', () => {
    it('should update password successfully', async () => {
      const validPassword = 'newPassword123';
      mockAuthRepository.updatePassword.mockResolvedValue();

      const result = await updatePasswordUseCase.execute(validPassword);

      expect(result.success).toBe(true);
      expect(result.error).toBeUndefined();
      expect(mockAuthRepository.updatePassword).toHaveBeenCalledWith(
        validPassword
      );
    });

    it('should return error when password is too short', async () => {
      const shortPassword = '12345';

      const result = await updatePasswordUseCase.execute(shortPassword);

      expect(result.success).toBe(false);
      expect(result.error).toBe(
        'La contraseña debe tener al menos 6 caracteres'
      );
      expect(mockAuthRepository.updatePassword).not.toHaveBeenCalled();
    });

    it('should return error when password is empty', async () => {
      const emptyPassword = '';

      const result = await updatePasswordUseCase.execute(emptyPassword);

      expect(result.success).toBe(false);
      expect(result.error).toBe(
        'La contraseña debe tener al menos 6 caracteres'
      );
      expect(mockAuthRepository.updatePassword).not.toHaveBeenCalled();
    });

    it('should return error when update fails', async () => {
      const validPassword = 'newPassword123';
      const errorMessage = 'Error al actualizar la contraseña';
      mockAuthRepository.updatePassword.mockRejectedValue(
        new Error(errorMessage)
      );

      const result = await updatePasswordUseCase.execute(validPassword);

      expect(result.success).toBe(false);
      expect(result.error).toBe(errorMessage);
    });

    it('should handle unknown errors gracefully', async () => {
      const validPassword = 'newPassword123';
      mockAuthRepository.updatePassword.mockRejectedValue('Unknown error');

      const result = await updatePasswordUseCase.execute(validPassword);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Error al actualizar la contraseña');
    });
  });
});