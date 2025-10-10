import { CreateCourseUseCase } from '@/src/application/use-cases/course/CreateCourseUseCase';
import { ICourseRepository } from '@/src/core/interfaces/repositories/ICourseRepository';
import { IAuthRepository } from '@/src/core/interfaces/repositories/IAuthRepository';
import { IProfileRepository } from '@/src/core/interfaces/repositories/IProfileRepository';
import { CourseEntity } from '@/src/core/entities/Course.entity';
import { UserEntity } from '@/src/core/entities/User.entity';
import { ProfileEntity } from '@/src/core/entities/Profile.entity';
import { CreateCourseInput } from '@/src/core/types/course.types';

describe('CreateCourseUseCase', () => {
  let mockCourseRepository: jest.Mocked<ICourseRepository>;
  let mockAuthRepository: jest.Mocked<IAuthRepository>;
  let mockProfileRepository: jest.Mocked<IProfileRepository>;
  let createCourseUseCase: CreateCourseUseCase;

  beforeEach(() => {
    mockCourseRepository = {
      createCourse: jest.fn(),
      getAllCourses: jest.fn(),
      getCourseById: jest.fn(),
      updateCourse: jest.fn(),
      deleteCourse: jest.fn(),
      assignTeacherToCourse: jest.fn(),
      removeTeacherFromCourse: jest.fn(),
      getCourseWithTeachers: jest.fn(),
      getTeacherCourses: jest.fn(),
    } as jest.Mocked<ICourseRepository>;

    mockAuthRepository = {
      login: jest.fn(),
      signUp: jest.fn(),
      signOut: jest.fn(),
      getCurrentUser: jest.fn(),
      signInWithGoogle: jest.fn(),
      resetPassword: jest.fn(),
      updatePassword: jest.fn(),
    } as jest.Mocked<IAuthRepository>;

    mockProfileRepository = {
      getProfileByUserId: jest.fn(),
      getAllStudents: jest.fn(),
      getAllTeachers: jest.fn(),
      updateUserRole: jest.fn(),
      createProfile: jest.fn(),
      deleteProfile: jest.fn(),
    } as jest.Mocked<IProfileRepository>;

    createCourseUseCase = new CreateCourseUseCase(
      mockCourseRepository,
      mockAuthRepository,
      mockProfileRepository
    );
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('execute', () => {
    const validInput: CreateCourseInput = {
      title: 'Test Course',
      description: 'Test Description',
      start_date: '2025-01-01',
      end_date: '2025-12-31',
      is_active: true,
    };

    const mockUser = new UserEntity('user-123', 'admin@example.com', 'Admin User');
    const mockAdminProfile = new ProfileEntity(
      'profile-123',
      'user-123',
      'Admin',
      'User',
      'admin',
      new Date(),
      new Date()
    );

    it('should create course successfully when user is admin', async () => {
      const mockCourse = new CourseEntity(
        'course-123',
        'Test Course',
        'Test Description',
        new Date('2025-01-01'),
        new Date('2025-12-31'),
        true,
        new Date(),
        new Date()
      );

      mockAuthRepository.getCurrentUser.mockResolvedValue(mockUser);
      mockProfileRepository.getProfileByUserId.mockResolvedValue(mockAdminProfile);
      mockCourseRepository.createCourse.mockResolvedValue(mockCourse);

      const result = await createCourseUseCase.execute(validInput);

      expect(result.success).toBe(true);
      expect(result.course).toEqual(mockCourse);
      expect(result.error).toBeUndefined();
      expect(mockCourseRepository.createCourse).toHaveBeenCalledWith(validInput);
      expect(mockCourseRepository.createCourse).toHaveBeenCalledTimes(1);
    });

    it('should return error when no user is authenticated', async () => {
      mockAuthRepository.getCurrentUser.mockResolvedValue(null);

      const result = await createCourseUseCase.execute(validInput);

      expect(result.success).toBe(false);
      expect(result.error).toBe('No hay usuario autenticado');
      expect(result.course).toBeUndefined();
      expect(mockCourseRepository.createCourse).not.toHaveBeenCalled();
    });

    it('should return error when user is not admin', async () => {
      const studentProfile = new ProfileEntity(
        'profile-123',
        'user-123',
        'Student',
        'User',
        'student',
        new Date(),
        new Date()
      );

      mockAuthRepository.getCurrentUser.mockResolvedValue(mockUser);
      mockProfileRepository.getProfileByUserId.mockResolvedValue(studentProfile);

      const result = await createCourseUseCase.execute(validInput);

      expect(result.success).toBe(false);
      expect(result.error).toBe('No tienes permisos para crear cursos');
      expect(result.course).toBeUndefined();
      expect(mockCourseRepository.createCourse).not.toHaveBeenCalled();
    });

    it('should return error when end date is before start date', async () => {
      const invalidInput: CreateCourseInput = {
        ...validInput,
        start_date: '2025-12-31',
        end_date: '2025-01-01',
      };

      mockAuthRepository.getCurrentUser.mockResolvedValue(mockUser);
      mockProfileRepository.getProfileByUserId.mockResolvedValue(mockAdminProfile);

      const result = await createCourseUseCase.execute(invalidInput);

      expect(result.success).toBe(false);
      expect(result.error).toBe('La fecha de fin debe ser posterior a la fecha de inicio');
      expect(result.course).toBeUndefined();
      expect(mockCourseRepository.createCourse).not.toHaveBeenCalled();
    });

    it('should return error when end date equals start date', async () => {
      const invalidInput: CreateCourseInput = {
        ...validInput,
        start_date: '2025-06-15',
        end_date: '2025-06-15',
      };

      mockAuthRepository.getCurrentUser.mockResolvedValue(mockUser);
      mockProfileRepository.getProfileByUserId.mockResolvedValue(mockAdminProfile);

      const result = await createCourseUseCase.execute(invalidInput);

      expect(result.success).toBe(false);
      expect(result.error).toBe('La fecha de fin debe ser posterior a la fecha de inicio');
    });

    it('should handle repository errors gracefully', async () => {
      mockAuthRepository.getCurrentUser.mockResolvedValue(mockUser);
      mockProfileRepository.getProfileByUserId.mockResolvedValue(mockAdminProfile);
      mockCourseRepository.createCourse.mockRejectedValue(
        new Error('Database connection failed')
      );

      const result = await createCourseUseCase.execute(validInput);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Database connection failed');
      expect(result.course).toBeUndefined();
    });

    it('should handle unknown errors', async () => {
      mockAuthRepository.getCurrentUser.mockResolvedValue(mockUser);
      mockProfileRepository.getProfileByUserId.mockResolvedValue(mockAdminProfile);
      mockCourseRepository.createCourse.mockRejectedValue('Unknown error');

      const result = await createCourseUseCase.execute(validInput);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Error al crear curso');
    });
  });
});

