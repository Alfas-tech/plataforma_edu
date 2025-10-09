import { SupabaseAuthRepository } from '@/src/infrastructure/repositories/SupabaseAuthRepository';
import { LoginCredentials, SignUpData } from '@/src/core/types/auth.types';
import { UserEntity } from '@/src/core/entities/User.entity';

// Mock Supabase client
jest.mock('@/src/infrastructure/supabase/server', () => ({
  createClient: jest.fn(),
}));

import { createClient } from '@/src/infrastructure/supabase/server';

describe('SupabaseAuthRepository', () => {
  let repository: SupabaseAuthRepository;
  let mockSupabaseClient: any;

  beforeEach(() => {
    mockSupabaseClient = {
      auth: {
        signInWithPassword: jest.fn(),
        signUp: jest.fn(),
        signOut: jest.fn(),
        getUser: jest.fn(),
        signInWithOAuth: jest.fn(),
        resetPasswordForEmail: jest.fn(),
        updateUser: jest.fn(),
      },
    };

    (createClient as jest.Mock).mockReturnValue(mockSupabaseClient);
    repository = new SupabaseAuthRepository();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('login', () => {
    const credentials: LoginCredentials = {
      email: 'test@example.com',
      password: 'password123',
    };

    it('should login successfully and return UserEntity', async () => {
      const mockUser = {
        id: '123',
        email: 'test@example.com',
        user_metadata: { full_name: 'John Doe' },
      };

      mockSupabaseClient.auth.signInWithPassword.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      });

      const result = await repository.login(credentials);

      expect(result).toBeInstanceOf(UserEntity);
      expect(result.id).toBe('123');
      expect(result.email).toBe('test@example.com');
      expect(mockSupabaseClient.auth.signInWithPassword).toHaveBeenCalledWith({
        email: credentials.email,
        password: credentials.password,
      });
    });

    it('should throw error when credentials are invalid', async () => {
      mockSupabaseClient.auth.signInWithPassword.mockResolvedValue({
        data: { user: null },
        error: { message: 'Invalid credentials' },
      });

      await expect(repository.login(credentials)).rejects.toThrow(
        'Email o contraseña incorrectos'
      );
    });

    it('should throw error when user is null', async () => {
      mockSupabaseClient.auth.signInWithPassword.mockResolvedValue({
        data: { user: null },
        error: null,
      });

      await expect(repository.login(credentials)).rejects.toThrow(
        'Email o contraseña incorrectos'
      );
    });
  });

  describe('signUp', () => {
    const signUpData: SignUpData = {
      email: 'test@example.com',
      password: 'password123',
      firstName: 'John',
      lastName: 'Doe',
    };

    it('should sign up successfully and return user with confirmation flag', async () => {
      const mockUser = {
        id: '123',
        email: 'test@example.com',
        user_metadata: { full_name: 'John Doe' },
        confirmed_at: null,
      };

      mockSupabaseClient.auth.signUp.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      });

      const result = await repository.signUp(signUpData);

      expect(result.user).toBeInstanceOf(UserEntity);
      expect(result.needsConfirmation).toBe(true);
      expect(mockSupabaseClient.auth.signUp).toHaveBeenCalledWith({
        email: signUpData.email,
        password: signUpData.password,
        options: {
          data: {
            full_name: 'John Doe',
            email: signUpData.email,
          },
          emailRedirectTo: expect.stringContaining('/auth/confirm'),
        },
      });
    });

    it('should indicate no confirmation needed when user is confirmed', async () => {
      const mockUser = {
        id: '123',
        email: 'test@example.com',
        confirmed_at: '2024-01-01T00:00:00Z',
      };

      mockSupabaseClient.auth.signUp.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      });

      const result = await repository.signUp(signUpData);

      expect(result.needsConfirmation).toBe(false);
    });

    it('should throw error when sign up fails', async () => {
      mockSupabaseClient.auth.signUp.mockResolvedValue({
        data: { user: null },
        error: { message: 'Email already exists' },
      });

      await expect(repository.signUp(signUpData)).rejects.toThrow(
        'Error al crear la cuenta'
      );
    });
  });

  describe('signOut', () => {
    it('should sign out successfully', async () => {
      mockSupabaseClient.auth.signOut.mockResolvedValue({
        error: null,
      });

      await expect(repository.signOut()).resolves.not.toThrow();
      expect(mockSupabaseClient.auth.signOut).toHaveBeenCalledTimes(1);
    });

    it('should throw error when sign out fails', async () => {
      mockSupabaseClient.auth.signOut.mockResolvedValue({
        error: { message: 'Sign out failed' },
      });

      await expect(repository.signOut()).rejects.toThrow(
        'Error al cerrar sesión'
      );
    });
  });

  describe('getCurrentUser', () => {
    it('should return current user', async () => {
      const mockUser = {
        id: '123',
        email: 'test@example.com',
      };

      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
      });

      const result = await repository.getCurrentUser();

      expect(result).toBeInstanceOf(UserEntity);
      expect(result?.id).toBe('123');
    });

    it('should return null when no user is logged in', async () => {
      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: null },
      });

      const result = await repository.getCurrentUser();

      expect(result).toBeNull();
    });
  });

  describe('signInWithGoogle', () => {
    it('should return OAuth URL', async () => {
      const mockUrl = 'https://accounts.google.com/oauth';

      mockSupabaseClient.auth.signInWithOAuth.mockResolvedValue({
        data: { url: mockUrl },
        error: null,
      });

      const result = await repository.signInWithGoogle();

      expect(result).toBe(mockUrl);
      expect(mockSupabaseClient.auth.signInWithOAuth).toHaveBeenCalledWith({
        provider: 'google',
        options: expect.objectContaining({
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          },
        }),
      });
    });

    it('should throw error when OAuth fails', async () => {
      mockSupabaseClient.auth.signInWithOAuth.mockResolvedValue({
        data: { url: null },
        error: { message: 'OAuth failed' },
      });

      await expect(repository.signInWithGoogle()).rejects.toThrow(
        'Error al iniciar sesión con Google'
      );
    });
  });

  describe('resetPassword', () => {
    it('should send reset password email', async () => {
      mockSupabaseClient.auth.resetPasswordForEmail.mockResolvedValue({
        error: null,
      });

      await expect(
        repository.resetPassword('test@example.com')
      ).resolves.not.toThrow();

      expect(
        mockSupabaseClient.auth.resetPasswordForEmail
      ).toHaveBeenCalledWith('test@example.com', {
        redirectTo: expect.stringContaining('/auth/confirm'),
      });
    });

    it('should throw error when email sending fails', async () => {
      mockSupabaseClient.auth.resetPasswordForEmail.mockResolvedValue({
        error: { message: 'Failed to send email' },
      });

      await expect(
        repository.resetPassword('test@example.com')
      ).rejects.toThrow('Error al enviar el correo de recuperación');
    });
  });

  describe('updatePassword', () => {
    it('should update password successfully', async () => {
      mockSupabaseClient.auth.updateUser.mockResolvedValue({
        error: null,
      });

      await expect(
        repository.updatePassword('newPassword123')
      ).resolves.not.toThrow();

      expect(mockSupabaseClient.auth.updateUser).toHaveBeenCalledWith({
        password: 'newPassword123',
      });
    });

    it('should throw error when password update fails', async () => {
      mockSupabaseClient.auth.updateUser.mockResolvedValue({
        error: { message: 'Update failed' },
      });

      await expect(
        repository.updatePassword('newPassword123')
      ).rejects.toThrow('No se pudo actualizar la contraseña');
    });
  });
});