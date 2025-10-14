import { RemoveTeacherFromCourseUseCase } from '@/src/application/use-cases/course/RemoveTeacherFromCourseUseCase';
import { ICourseRepository } from '@/src/core/interfaces/repositories/ICourseRepository';
import { IAuthRepository } from '@/src/core/interfaces/repositories/IAuthRepository';
import { IProfileRepository } from '@/src/core/interfaces/repositories/IProfileRepository';
import { CourseEntity } from '@/src/core/entities/Course.entity';
import { UserEntity } from '@/src/core/entities/User.entity';
import { ProfileEntity } from '@/src/core/entities/Profile.entity';

describe('RemoveTeacherFromCourseUseCase', () => {
  let mockCourseRepository: jest.Mocked<ICourseRepository>;
  let mockAuthRepository: jest.Mocked<IAuthRepository>;
  let mockProfileRepository: jest.Mocked<IProfileRepository>;
  let removeTeacherFromCourseUseCase: RemoveTeacherFromCourseUseCase;

  beforeEach(() => {
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
      getActiveCourse: jest.fn(),
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
      getProfileByEmail: jest.fn(),
      getAllStudents: jest.fn(),
      getAllTeachers: jest.fn(),
      getAllProfiles: jest.fn(),
      updateProfile: jest.fn(),
      updateRole: jest.fn(),
      promoteToTeacher: jest.fn(),
      demoteToStudent: jest.fn(),
    } as any;

    removeTeacherFromCourseUseCase = new RemoveTeacherFromCourseUseCase(
      mockCourseRepository,
      mockAuthRepository,
      mockProfileRepository
    );
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('execute', () => {
    const courseId = 'course-123';
    const teacherId = 'teacher-123';

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

    const mockCourse = new CourseEntity(
      courseId,
      'Test Course',
      'Course Description',
      new Date('2024-01-01'),
      new Date('2024-12-31'),
      true,
      'admin-123',
      new Date(),
      new Date()
    );

    it('should remove teacher from course when user is admin', async () => {
      mockAuthRepository.getCurrentUser.mockResolvedValue(mockUser);
      mockProfileRepository.getProfileByUserId.mockResolvedValue(mockAdminProfile);
      mockCourseRepository.getCourseById.mockResolvedValue(mockCourse);
      mockCourseRepository.removeTeacher.mockResolvedValue(undefined);

      const result = await removeTeacherFromCourseUseCase.execute(courseId, teacherId);

      expect(result.success).toBe(true);
      expect(mockCourseRepository.removeTeacher).toHaveBeenCalledWith(courseId, teacherId);
    });

    it('should return error when no user is authenticated', async () => {
      mockAuthRepository.getCurrentUser.mockResolvedValue(null);

      const result = await removeTeacherFromCourseUseCase.execute(courseId, teacherId);

      expect(result.success).toBe(false);
      expect(result.error).toBe('No hay usuario autenticado');
      expect(mockCourseRepository.removeTeacher).not.toHaveBeenCalled();
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

      const result = await removeTeacherFromCourseUseCase.execute(courseId, teacherId);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Solo los administradores pueden remover docentes');
      expect(mockCourseRepository.removeTeacher).not.toHaveBeenCalled();
    });

    it('should return error when course not found', async () => {
      mockAuthRepository.getCurrentUser.mockResolvedValue(mockUser);
      mockProfileRepository.getProfileByUserId.mockResolvedValue(mockAdminProfile);
      mockCourseRepository.getCourseById.mockResolvedValue(null);

      const result = await removeTeacherFromCourseUseCase.execute(courseId, teacherId);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Curso no encontrado');
      expect(mockCourseRepository.removeTeacher).not.toHaveBeenCalled();
    });

    it('should handle repository errors gracefully', async () => {
      mockAuthRepository.getCurrentUser.mockResolvedValue(mockUser);
      mockProfileRepository.getProfileByUserId.mockResolvedValue(mockAdminProfile);
      mockCourseRepository.getCourseById.mockResolvedValue(mockCourse);
      mockCourseRepository.removeTeacher.mockRejectedValue(
        new Error('Database error')
      );

      const result = await removeTeacherFromCourseUseCase.execute(courseId, teacherId);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Database error');
    });

    it('should handle unknown errors', async () => {
      mockAuthRepository.getCurrentUser.mockResolvedValue(mockUser);
      mockProfileRepository.getProfileByUserId.mockResolvedValue(mockAdminProfile);
      mockCourseRepository.getCourseById.mockResolvedValue(mockCourse);
      mockCourseRepository.removeTeacher.mockRejectedValue('Unknown error');

      const result = await removeTeacherFromCourseUseCase.execute(courseId, teacherId);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Error al remover docente');
    });
  });
});

