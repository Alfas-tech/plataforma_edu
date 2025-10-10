import { DemoteToStudentUseCase } from '@/src/application/use-cases/profile/DemoteToStudentUseCase';
import { IProfileRepository } from '@/src/core/interfaces/repositories/IProfileRepository';
import { IAuthRepository } from '@/src/core/interfaces/repositories/IAuthRepository';
import { UserEntity } from '@/src/core/entities/User.entity';
import { ProfileEntity } from '@/src/core/entities/Profile.entity';

describe('DemoteToStudentUseCase', () => {
  let mockProfileRepository: jest.Mocked<IProfileRepository>;
  let mockAuthRepository: jest.Mocked<IAuthRepository>;
  let demoteToStudentUseCase: DemoteToStudentUseCase;

  beforeEach(() => {
    mockProfileRepository = {
      getProfileByUserId: jest.fn(),
      getProfileByEmail: jest.fn(),
      getAllStudents: jest.fn(),
      getAllTeachers: jest.fn(),
      getAllProfiles: jest.fn(),
      updateProfile: jest.fn(),
      updateRole: jest.fn(),
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

    demoteToStudentUseCase = new DemoteToStudentUseCase(
      mockProfileRepository,
      mockAuthRepository
    );
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('execute', () => {
    const userId = 'teacher-123';
    const mockUser = new UserEntity('admin-123', 'admin@example.com', 'Admin User');
    const mockAdminProfile = new ProfileEntity(
      'admin-123',
      'admin@example.com',
      'Admin User',
      null,
      'admin',
      new Date(),
      new Date()
    );

    it('should demote teacher to student when user is admin', async () => {
      mockAuthRepository.getCurrentUser.mockResolvedValue(mockUser);
      mockProfileRepository.getProfileByUserId.mockResolvedValue(mockAdminProfile);
      mockProfileRepository.demoteToStudent.mockResolvedValue(undefined);

      const result = await demoteToStudentUseCase.execute(userId);

      expect(result.success).toBe(true);
      expect(mockProfileRepository.demoteToStudent).toHaveBeenCalledWith(userId);
    });

    it('should return error when no user is authenticated', async () => {
      mockAuthRepository.getCurrentUser.mockResolvedValue(null);

      const result = await demoteToStudentUseCase.execute(userId);

      expect(result.success).toBe(false);
      expect(result.error).toBe('No hay usuario autenticado');
      expect(mockProfileRepository.demoteToStudent).not.toHaveBeenCalled();
    });

    it('should return error when user is not admin', async () => {
      const teacherProfile = new ProfileEntity(
        'user-123',
        'teacher@example.com',
        'Teacher User',
        null,
        'teacher',
        new Date(),
        new Date()
      );

      mockAuthRepository.getCurrentUser.mockResolvedValue(mockUser);
      mockProfileRepository.getProfileByUserId.mockResolvedValue(teacherProfile);

      const result = await demoteToStudentUseCase.execute(userId);

      expect(result.success).toBe(false);
      expect(result.error).toBe('No tienes permisos para realizar esta acción');
      expect(mockProfileRepository.demoteToStudent).not.toHaveBeenCalled();
    });

    it('should handle repository errors gracefully', async () => {
      mockAuthRepository.getCurrentUser.mockResolvedValue(mockUser);
      mockProfileRepository.getProfileByUserId.mockResolvedValue(mockAdminProfile);
      mockProfileRepository.demoteToStudent.mockRejectedValue(
        new Error('Database error')
      );

      const result = await demoteToStudentUseCase.execute(userId);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Database error');
    });

    it('should handle unknown errors', async () => {
      mockAuthRepository.getCurrentUser.mockResolvedValue(mockUser);
      mockProfileRepository.getProfileByUserId.mockResolvedValue(mockAdminProfile);
      mockProfileRepository.demoteToStudent.mockRejectedValue('Unknown error');

      const result = await demoteToStudentUseCase.execute(userId);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Error al degradar usuario');
    });
  });
});

