import { GetLessonsByModuleUseCase } from '@/src/application/use-cases/lesson/GetLessonsByModuleUseCase';
import { ILessonRepository } from '@/src/core/interfaces/repositories/ILessonRepository';
import { IModuleRepository } from '@/src/core/interfaces/repositories/IModuleRepository';
import { IAuthRepository } from '@/src/core/interfaces/repositories/IAuthRepository';
import { IProfileRepository } from '@/src/core/interfaces/repositories/IProfileRepository';
import { LessonEntity } from '@/src/core/entities/Lesson.entity';
import { UserEntity } from '@/src/core/entities/User.entity';
import { ProfileEntity } from '@/src/core/entities/Profile.entity';

describe('GetLessonsByModuleUseCase', () => {
  let mockLessonRepository: jest.Mocked<ILessonRepository>;
  let mockModuleRepository: jest.Mocked<IModuleRepository>;
  let mockAuthRepository: jest.Mocked<IAuthRepository>;
  let mockProfileRepository: jest.Mocked<IProfileRepository>;
  let getLessonsByModuleUseCase: GetLessonsByModuleUseCase;

  beforeEach(() => {
    mockLessonRepository = {
      createLesson: jest.fn(),
      getLessonsByModuleId: jest.fn(),
      getLessonById: jest.fn(),
      updateLesson: jest.fn(),
      deleteLesson: jest.fn(),
    } as any;

    mockModuleRepository = {
      createModule: jest.fn(),
      getModulesByCourse: jest.fn(),
      getModulesByCourseId: jest.fn(),
      getModuleById: jest.fn(),
      updateModule: jest.fn(),
      deleteModule: jest.fn(),
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

    getLessonsByModuleUseCase = new GetLessonsByModuleUseCase(
      mockLessonRepository,
      mockModuleRepository,
      mockAuthRepository,
      mockProfileRepository
    );
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('execute', () => {
    const moduleId = 'module-123';
    const mockModule = {
      id: moduleId,
      courseId: 'course-123',
      title: 'Test Module',
      description: 'Description',
      orderIndex: 1,
      content: 'Content',
      isPublished: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const publishedLesson = new LessonEntity(
      'lesson-1',
      moduleId,
      'Published Lesson',
      'Content',
      1,
      30,
      true,
      new Date(),
      new Date()
    );

    const unpublishedLesson = new LessonEntity(
      'lesson-2',
      moduleId,
      'Unpublished Lesson',
      'Content',
      2,
      45,
      false,
      new Date(),
      new Date()
    );

    it('should return all lessons for admin user', async () => {
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

      mockModuleRepository.getModuleById.mockResolvedValue(mockModule);
      mockAuthRepository.getCurrentUser.mockResolvedValue(mockUser);
      mockProfileRepository.getProfileByUserId.mockResolvedValue(mockAdminProfile);
      mockLessonRepository.getLessonsByModuleId.mockResolvedValue([publishedLesson, unpublishedLesson]);

      const result = await getLessonsByModuleUseCase.execute(moduleId);

      expect(result.success).toBe(true);
      expect(result.lessons).toHaveLength(2);
      expect(result.lessons).toContain(publishedLesson);
      expect(result.lessons).toContain(unpublishedLesson);
    });

    it('should return all lessons for teacher user', async () => {
      const mockUser = new UserEntity('teacher-123', 'teacher@example.com', 'Teacher User');
      const mockTeacherProfile = new ProfileEntity(
        'teacher-123',
        'teacher@example.com',
        'Teacher User',
        null,
        'teacher',
        new Date(),
        new Date()
      );

      mockModuleRepository.getModuleById.mockResolvedValue(mockModule);
      mockAuthRepository.getCurrentUser.mockResolvedValue(mockUser);
      mockProfileRepository.getProfileByUserId.mockResolvedValue(mockTeacherProfile);
      mockLessonRepository.getLessonsByModuleId.mockResolvedValue([publishedLesson, unpublishedLesson]);

      const result = await getLessonsByModuleUseCase.execute(moduleId);

      expect(result.success).toBe(true);
      expect(result.lessons).toHaveLength(2);
    });

    it('should return only published lessons for student user', async () => {
      const mockUser = new UserEntity('student-123', 'student@example.com', 'Student User');
      const mockStudentProfile = new ProfileEntity(
        'student-123',
        'student@example.com',
        'Student User',
        null,
        'student',
        new Date(),
        new Date()
      );

      mockModuleRepository.getModuleById.mockResolvedValue(mockModule);
      mockAuthRepository.getCurrentUser.mockResolvedValue(mockUser);
      mockProfileRepository.getProfileByUserId.mockResolvedValue(mockStudentProfile);
      mockLessonRepository.getLessonsByModuleId.mockResolvedValue([publishedLesson, unpublishedLesson]);

      const result = await getLessonsByModuleUseCase.execute(moduleId);

      expect(result.success).toBe(true);
      expect(result.lessons).toHaveLength(1);
      expect(result.lessons).toContain(publishedLesson);
      expect(result.lessons).not.toContain(unpublishedLesson);
    });

    it('should return empty array when no lessons exist', async () => {
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

      mockModuleRepository.getModuleById.mockResolvedValue(mockModule);
      mockAuthRepository.getCurrentUser.mockResolvedValue(mockUser);
      mockProfileRepository.getProfileByUserId.mockResolvedValue(mockAdminProfile);
      mockLessonRepository.getLessonsByModuleId.mockResolvedValue([]);

      const result = await getLessonsByModuleUseCase.execute(moduleId);

      expect(result.success).toBe(true);
      expect(result.lessons).toHaveLength(0);
    });

    it('should return error when module not found', async () => {
      mockModuleRepository.getModuleById.mockResolvedValue(null);

      const result = await getLessonsByModuleUseCase.execute(moduleId);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Módulo no encontrado');
    });

    it('should return error when no user is authenticated', async () => {
      mockModuleRepository.getModuleById.mockResolvedValue(mockModule);
      mockAuthRepository.getCurrentUser.mockResolvedValue(null);

      const result = await getLessonsByModuleUseCase.execute(moduleId);

      expect(result.success).toBe(false);
      expect(result.error).toBe('No hay usuario autenticado');
    });

    it('should return error when profile not found', async () => {
      const mockUser = new UserEntity('user-123', 'user@example.com', 'User');

      mockModuleRepository.getModuleById.mockResolvedValue(mockModule);
      mockAuthRepository.getCurrentUser.mockResolvedValue(mockUser);
      mockProfileRepository.getProfileByUserId.mockResolvedValue(null);

      const result = await getLessonsByModuleUseCase.execute(moduleId);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Perfil no encontrado');
    });

    it('should handle repository errors gracefully', async () => {
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

      mockModuleRepository.getModuleById.mockResolvedValue(mockModule);
      mockAuthRepository.getCurrentUser.mockResolvedValue(mockUser);
      mockProfileRepository.getProfileByUserId.mockResolvedValue(mockAdminProfile);
      mockLessonRepository.getLessonsByModuleId.mockRejectedValue(
        new Error('Database error')
      );

      const result = await getLessonsByModuleUseCase.execute(moduleId);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Database error');
    });

    it('should handle unknown errors', async () => {
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

      mockModuleRepository.getModuleById.mockResolvedValue(mockModule);
      mockAuthRepository.getCurrentUser.mockResolvedValue(mockUser);
      mockProfileRepository.getProfileByUserId.mockResolvedValue(mockAdminProfile);
      mockLessonRepository.getLessonsByModuleId.mockRejectedValue('Unknown error');

      const result = await getLessonsByModuleUseCase.execute(moduleId);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Error al obtener lecciones');
    });
  });
});

