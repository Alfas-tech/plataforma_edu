import { LoginUseCase } from '@/src/application/use-cases/auth/LoginUseCase';
import { IAuthRepository } from '@/src/core/interfaces/repositories/IAuthRepository';
import { UserEntity } from '@/src/core/entities/User.entity';
import { LoginCredentials } from '@/src/core/types/auth.types';

describe('LoginUseCase', () => {
  let mockAuthRepository: jest.Mocked<any>;
  let loginUseCase: LoginUseCase;

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
    loginUseCase = new LoginUseCase(mockAuthRepository);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('execute', () => {
    const validCredentials: LoginCredentials = {
      email: 'test@example.com',
      password: 'password123',
    };

    it('should login successfully with valid credentials', async () => {
      const mockUser = new UserEntity('123', 'test@example.com', 'John Doe');
      mockAuthRepository.login.mockResolvedValue(mockUser);

      const result = await loginUseCase.execute(validCredentials);

      expect(result.success).toBe(true);
      expect(result.user).toEqual(mockUser);
      expect(result.error).toBeUndefined();
      expect(mockAuthRepository.login).toHaveBeenCalledWith(validCredentials);
      expect(mockAuthRepository.login).toHaveBeenCalledTimes(1);
    });

    it('should return error when credentials are invalid', async () => {
      const errorMessage = 'Email o contraseña incorrectos';
      mockAuthRepository.login.mockRejectedValue(new Error(errorMessage));

      const result = await loginUseCase.execute(validCredentials);

      expect(result.success).toBe(false);
      expect(result.error).toBe(errorMessage);
      expect(result.user).toBeUndefined();
      expect(mockAuthRepository.login).toHaveBeenCalledWith(validCredentials);
    });

    it('should handle unknown errors gracefully', async () => {
      mockAuthRepository.login.mockRejectedValue('Unknown error');

      const result = await loginUseCase.execute(validCredentials);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Error al iniciar sesión');
    });

    it('should handle network errors', async () => {
      mockAuthRepository.login.mockRejectedValue(
        new Error('Network request failed')
      );

      const result = await loginUseCase.execute(validCredentials);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Network request failed');
    });
  });
});