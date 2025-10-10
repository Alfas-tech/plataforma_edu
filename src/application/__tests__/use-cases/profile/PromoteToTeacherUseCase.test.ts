import { PromoteToTeacherUseCase } from '@/src/application/use-cases/profile/PromoteToTeacherUseCase';
import { IProfileRepository } from '@/src/core/interfaces/repositories/IProfileRepository';
import { IAuthRepository } from '@/src/core/interfaces/repositories/IAuthRepository';
import { ProfileEntity } from '@/src/core/entities/Profile.entity';
import { UserEntity } from '@/src/core/entities/User.entity';

describe('PromoteToTeacherUseCase', () => {
  let mockProfileRepository: jest.Mocked<IProfileRepository>;
  let mockAuthRepository: jest.Mocked<IAuthRepository>;
  let promoteToTeacherUseCase: PromoteToTeacherUseCase;

  beforeEach(() => {
    mockProfileRepository = {
      getProfileByUserId: jest.fn(),
      getAllStudents: jest.fn(),
      getAllTeachers: jest.fn(),
      updateUserRole: jest.fn(),
      createProfile: jest.fn(),
      deleteProfile: jest.fn(),
      promoteToTeacher: jest.fn(),
      demoteToStudent: jest.fn(),
    } as any;

    mockAuthRepository = {
      login: jest.fn(),
      signUp: jest.fn(),
      signOut: jest.fn(),
      getCurrentUser: jest.fn(),
      signInWithGoogle: jest.fn(),
      resetPassword: jest.fn(),
      updatePassword: jest.fn(),
    } as any;

    promoteToTeacherUseCase = new PromoteToTeacherUseCase(
      mockProfileRepository,
      mockAuthRepository
    );
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('execute', () => {
    const mockUser = new UserEntity('admin-123', 'admin@example.com', 'Admin User');
    const mockAdminProfile = new ProfileEntity(
      'profile-admin',
      'admin-123',
      'Admin',
      'User',
      'admin',
      new Date(),
      new Date()
    );

    it('should promote user to teacher when user is admin', async () => {
      mockAuthRepository.getCurrentUser.mockResolvedValue(mockUser);
      mockProfileRepository.getProfileByUserId.mockResolvedValue(mockAdminProfile);
      mockProfileRepository.promoteToTeacher.mockResolvedValue(undefined);

      const result = await promoteToTeacherUseCase.execute('user-123');

      expect(result.success).toBe(true);
      expect(mockProfileRepository.promoteToTeacher).toHaveBeenCalledWith('user-123');
    });

    it('should return error when no user is authenticated', async () => {
      mockAuthRepository.getCurrentUser.mockResolvedValue(null);

      const result = await promoteToTeacherUseCase.execute('user-123');

      expect(result.success).toBe(false);
      expect(result.error).toBe('No hay usuario autenticado');
    });

    it('should return error when user is not admin', async () => {
      const teacherProfile = new ProfileEntity(
        'profile-123',
        'user-123',
        'Teacher',
        'User',
        'teacher',
        new Date(),
        new Date()
      );

      mockAuthRepository.getCurrentUser.mockResolvedValue(mockUser);
      mockProfileRepository.getProfileByUserId.mockResolvedValue(teacherProfile);

      const result = await promoteToTeacherUseCase.execute('user-123');

      expect(result.success).toBe(false);
      expect(result.error).toBe('No tienes permisos para realizar esta acción');
    });

    it('should handle repository errors gracefully', async () => {
      mockAuthRepository.getCurrentUser.mockResolvedValue(mockUser);
      mockProfileRepository.getProfileByUserId.mockResolvedValue(mockAdminProfile);
      mockProfileRepository.promoteToTeacher.mockRejectedValue(
        new Error('Database error')
      );

      const result = await promoteToTeacherUseCase.execute('user-123');

      expect(result.success).toBe(false);
      expect(result.error).toBe('Database error');
    });

    it('should handle unknown errors', async () => {
      mockAuthRepository.getCurrentUser.mockResolvedValue(mockUser);
      mockProfileRepository.getProfileByUserId.mockResolvedValue(mockAdminProfile);
      mockProfileRepository.promoteToTeacher.mockRejectedValue('Unknown error');

      const result = await promoteToTeacherUseCase.execute('user-123');

      expect(result.success).toBe(false);
      expect(result.error).toBe('Error al promover usuario');
    });
  });
});
