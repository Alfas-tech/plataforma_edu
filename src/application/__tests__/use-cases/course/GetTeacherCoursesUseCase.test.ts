import { GetTeacherCoursesUseCase } from '@/src/application/use-cases/course/GetTeacherCoursesUseCase';
import { ICourseRepository } from '@/src/core/interfaces/repositories/ICourseRepository';
import { CourseEntity } from '@/src/core/entities/Course.entity';

describe('GetTeacherCoursesUseCase', () => {
  let mockCourseRepository: jest.Mocked<ICourseRepository>;
  let getTeacherCoursesUseCase: GetTeacherCoursesUseCase;

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

    getTeacherCoursesUseCase = new GetTeacherCoursesUseCase(mockCourseRepository);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('execute', () => {
    const teacherId = 'teacher-123';

    const mockCourse1 = new CourseEntity(
      'course-1',
      'Course 1',
      'Description 1',
      new Date('2024-01-01'),
      new Date('2024-06-30'),
      true,
      'admin-123',
      new Date(),
      new Date()
    );

    const mockCourse2 = new CourseEntity(
      'course-2',
      'Course 2',
      'Description 2',
      new Date('2024-07-01'),
      new Date('2024-12-31'),
      true,
      'admin-123',
      new Date(),
      new Date()
    );

    it('should return all courses for teacher', async () => {
      mockCourseRepository.getTeacherCourses.mockResolvedValue([mockCourse1, mockCourse2]);

      const result = await getTeacherCoursesUseCase.execute(teacherId);

      expect(result.success).toBe(true);
      expect(result.courses).toHaveLength(2);
      expect(result.courses).toContain(mockCourse1);
      expect(result.courses).toContain(mockCourse2);
      expect(mockCourseRepository.getTeacherCourses).toHaveBeenCalledWith(teacherId);
    });

    it('should return empty array when teacher has no courses', async () => {
      mockCourseRepository.getTeacherCourses.mockResolvedValue([]);

      const result = await getTeacherCoursesUseCase.execute(teacherId);

      expect(result.success).toBe(true);
      expect(result.courses).toHaveLength(0);
    });

    it('should handle repository errors gracefully', async () => {
      mockCourseRepository.getTeacherCourses.mockRejectedValue(
        new Error('Database error')
      );

      const result = await getTeacherCoursesUseCase.execute(teacherId);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Database error');
    });

    it('should handle unknown errors', async () => {
      mockCourseRepository.getTeacherCourses.mockRejectedValue('Unknown error');

      const result = await getTeacherCoursesUseCase.execute(teacherId);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Error al obtener cursos del docente');
    });
  });
});

