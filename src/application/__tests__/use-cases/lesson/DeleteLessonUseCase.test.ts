import { DeleteLessonUseCase } from '@/src/application/use-cases/lesson/DeleteLessonUseCase';
import { ILessonRepository } from '@/src/core/interfaces/repositories/ILessonRepository';
import { IModuleRepository } from '@/src/core/interfaces/repositories/IModuleRepository';
import { ICourseRepository } from '@/src/core/interfaces/repositories/ICourseRepository';
import { IAuthRepository } from '@/src/core/interfaces/repositories/IAuthRepository';
import { IProfileRepository } from '@/src/core/interfaces/repositories/IProfileRepository';
import { LessonEntity } from '@/src/core/entities/Lesson.entity';
import { UserEntity } from '@/src/core/entities/User.entity';
import { ProfileEntity } from '@/src/core/entities/Profile.entity';

describe('DeleteLessonUseCase', () => {
  let mockLessonRepository: jest.Mocked<ILessonRepository>;
  let mockModuleRepository: jest.Mocked<IModuleRepository>;
  let mockCourseRepository: jest.Mocked<ICourseRepository>;
  let mockAuthRepository: jest.Mocked<IAuthRepository>;
  let mockProfileRepository: jest.Mocked<IProfileRepository>;
  let deleteLessonUseCase: DeleteLessonUseCase;

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

    mockCourseRepository = {
      createCourse: jest.fn(),
      getAllCourses: jest.fn(),
      getCourseById: jest.fn(),
      updateCourse: jest.fn(),
      deleteCourse: jest.fn(),
      assignTeacher: jest.fn(),
      removeTeacher: jest.fn(),
      getCourseWithTeachers: jest.fn(),
      getTeacherCourses: jest.fn(),
      getCourseTeachers: jest.fn(),
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

    deleteLessonUseCase = new DeleteLessonUseCase(
      mockLessonRepository,
      mockModuleRepository,
      mockCourseRepository,
      mockAuthRepository,
      mockProfileRepository
    );
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('execute', () => {
    const lessonId = 'lesson-123';
    const moduleId = 'module-123';
    const courseId = 'course-123';

    const mockLesson = new LessonEntity(
      lessonId,
      moduleId,
      'Lesson to Delete',
      'Content',
      1,
      30,
      false,
      new Date(),
      new Date()
    );

    const mockModule = {
      id: moduleId,
      courseId,
      title: 'Test Module',
      description: 'Description',
      orderIndex: 1,
      content: 'Content',
      isPublished: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

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

    it('should delete lesson successfully when user is admin', async () => {
      mockLessonRepository.getLessonById.mockResolvedValue(mockLesson);
      mockModuleRepository.getModuleById.mockResolvedValue(mockModule);
      mockAuthRepository.getCurrentUser.mockResolvedValue(mockUser);
      mockProfileRepository.getProfileByUserId.mockResolvedValue(mockAdminProfile);
      mockLessonRepository.deleteLesson.mockResolvedValue(undefined);

      const result = await deleteLessonUseCase.execute(lessonId);

      expect(result.success).toBe(true);
      expect(mockLessonRepository.deleteLesson).toHaveBeenCalledWith(lessonId);
    });

    it('should return error when lesson not found', async () => {
      mockLessonRepository.getLessonById.mockResolvedValue(null);

      const result = await deleteLessonUseCase.execute(lessonId);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Lección no encontrada');
    });

    it('should return error when module not found', async () => {
      mockLessonRepository.getLessonById.mockResolvedValue(mockLesson);
      mockModuleRepository.getModuleById.mockResolvedValue(null);

      const result = await deleteLessonUseCase.execute(lessonId);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Módulo no encontrado');
    });

    it('should return error when no user is authenticated', async () => {
      mockLessonRepository.getLessonById.mockResolvedValue(mockLesson);
      mockModuleRepository.getModuleById.mockResolvedValue(mockModule);
      mockAuthRepository.getCurrentUser.mockResolvedValue(null);

      const result = await deleteLessonUseCase.execute(lessonId);

      expect(result.success).toBe(false);
      expect(result.error).toBe('No hay usuario autenticado');
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

      mockLessonRepository.getLessonById.mockResolvedValue(mockLesson);
      mockModuleRepository.getModuleById.mockResolvedValue(mockModule);
      mockAuthRepository.getCurrentUser.mockResolvedValue(mockUser);
      mockProfileRepository.getProfileByUserId.mockResolvedValue(teacherProfile);

      const result = await deleteLessonUseCase.execute(lessonId);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Solo los administradores pueden eliminar lecciones');
    });

    it('should handle repository errors gracefully', async () => {
      mockLessonRepository.getLessonById.mockResolvedValue(mockLesson);
      mockModuleRepository.getModuleById.mockResolvedValue(mockModule);
      mockAuthRepository.getCurrentUser.mockResolvedValue(mockUser);
      mockProfileRepository.getProfileByUserId.mockResolvedValue(mockAdminProfile);
      mockLessonRepository.deleteLesson.mockRejectedValue(
        new Error('Database error')
      );

      const result = await deleteLessonUseCase.execute(lessonId);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Database error');
    });

    it('should handle unknown errors', async () => {
      mockLessonRepository.getLessonById.mockResolvedValue(mockLesson);
      mockModuleRepository.getModuleById.mockResolvedValue(mockModule);
      mockAuthRepository.getCurrentUser.mockResolvedValue(mockUser);
      mockProfileRepository.getProfileByUserId.mockResolvedValue(mockAdminProfile);
      mockLessonRepository.deleteLesson.mockRejectedValue('Unknown error');

      const result = await deleteLessonUseCase.execute(lessonId);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Error al eliminar lección');
    });

    it('should return error when profile not found', async () => {
      mockLessonRepository.getLessonById.mockResolvedValue(mockLesson);
      mockModuleRepository.getModuleById.mockResolvedValue(mockModule);
      mockAuthRepository.getCurrentUser.mockResolvedValue(mockUser);
      mockProfileRepository.getProfileByUserId.mockResolvedValue(null);

      const result = await deleteLessonUseCase.execute(lessonId);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Perfil no encontrado');
    });
  });
});

