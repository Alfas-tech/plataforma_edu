import { SignInWithGoogleUseCase } from '@/src/application/use-cases/auth/SignInWithGoogleUseCase';
import { IAuthRepository } from '@/src/core/interfaces/repositories/IAuthRepository';

describe('SignInWithGoogleUseCase', () => {
  let mockAuthRepository: jest.Mocked<any>;
  let signInWithGoogleUseCase: SignInWithGoogleUseCase;

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
    signInWithGoogleUseCase = new SignInWithGoogleUseCase(mockAuthRepository);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('execute', () => {
    it('should return Google OAuth URL successfully', async () => {
      const mockUrl = 'https://accounts.google.com/oauth?...';
      mockAuthRepository.signInWithGoogle.mockResolvedValue(mockUrl);

      const result = await signInWithGoogleUseCase.execute();

      expect(result.success).toBe(true);
      expect(result.url).toBe(mockUrl);
      expect(result.error).toBeUndefined();
      expect(mockAuthRepository.signInWithGoogle).toHaveBeenCalledTimes(1);
    });

    it('should return error when Google sign-in fails', async () => {
      const errorMessage = 'Error al iniciar sesión con Google';
      mockAuthRepository.signInWithGoogle.mockRejectedValue(
        new Error(errorMessage)
      );

      const result = await signInWithGoogleUseCase.execute();

      expect(result.success).toBe(false);
      expect(result.error).toBe(errorMessage);
      expect(result.url).toBeUndefined();
    });

    it('should handle unknown errors gracefully', async () => {
      mockAuthRepository.signInWithGoogle.mockRejectedValue('Unknown error');

      const result = await signInWithGoogleUseCase.execute();

      expect(result.success).toBe(false);
      expect(result.error).toBe('Error al iniciar sesión con Google');
    });
  });
});