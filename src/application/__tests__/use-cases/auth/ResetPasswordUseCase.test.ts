import { ResetPasswordUseCase } from '@/src/application/use-cases/auth/ResetPasswordUseCase';
import { IAuthRepository } from '@/src/core/interfaces/repositories/IAuthRepository';

describe('ResetPasswordUseCase', () => {
  let mockAuthRepository: jest.Mocked<any>;
  let resetPasswordUseCase: ResetPasswordUseCase;

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
    resetPasswordUseCase = new ResetPasswordUseCase(mockAuthRepository);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('execute', () => {
    const validEmail = 'test@example.com';

    it('should send reset password email successfully', async () => {
      mockAuthRepository.resetPassword.mockResolvedValue();

      const result = await resetPasswordUseCase.execute(validEmail);

      expect(result.success).toBe(true);
      expect(result.error).toBeUndefined();
      expect(mockAuthRepository.resetPassword).toHaveBeenCalledWith(validEmail);
      expect(mockAuthRepository.resetPassword).toHaveBeenCalledTimes(1);
    });

    it('should return error when email sending fails', async () => {
      const errorMessage = 'Error al enviar el correo';
      mockAuthRepository.resetPassword.mockRejectedValue(
        new Error(errorMessage)
      );

      const result = await resetPasswordUseCase.execute(validEmail);

      expect(result.success).toBe(false);
      expect(result.error).toBe(errorMessage);
    });

    it('should handle unknown errors gracefully', async () => {
      mockAuthRepository.resetPassword.mockRejectedValue('Unknown error');

      const result = await resetPasswordUseCase.execute(validEmail);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Error al enviar el correo');
    });
  });
});