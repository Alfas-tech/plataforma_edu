import { UpdateLessonUseCase } from '@/src/application/use-cases/lesson/UpdateLessonUseCase';
import { ILessonRepository } from '@/src/core/interfaces/repositories/ILessonRepository';
import { IModuleRepository } from '@/src/core/interfaces/repositories/IModuleRepository';
import { ICourseRepository } from '@/src/core/interfaces/repositories/ICourseRepository';
import { IAuthRepository } from '@/src/core/interfaces/repositories/IAuthRepository';
import { IProfileRepository } from '@/src/core/interfaces/repositories/IProfileRepository';
import { LessonEntity } from '@/src/core/entities/Lesson.entity';
import { UserEntity } from '@/src/core/entities/User.entity';
import { ProfileEntity } from '@/src/core/entities/Profile.entity';

describe('UpdateLessonUseCase', () => {
  let mockLessonRepository: jest.Mocked<ILessonRepository>;
  let mockModuleRepository: jest.Mocked<IModuleRepository>;
  let mockCourseRepository: jest.Mocked<ICourseRepository>;
  let mockAuthRepository: jest.Mocked<IAuthRepository>;
  let mockProfileRepository: jest.Mocked<IProfileRepository>;
  let updateLessonUseCase: UpdateLessonUseCase;

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

    updateLessonUseCase = new UpdateLessonUseCase(
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

    const validInput = {
      title: 'Updated Lesson',
      content: 'Updated Content',
      duration_minutes: 60,
      is_published: true,
    };

    const mockLesson = new LessonEntity(
      lessonId,
      moduleId,
      'Old Lesson',
      'Old Content',
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

    const mockUser = new UserEntity('user-123', 'admin@example.com', 'Admin User');
    const mockAdminProfile = new ProfileEntity(
      'user-123',
      'admin@example.com',
      'Admin User',
      null,
      'admin',
      new Date(),
      new Date()
    );

    it('should update lesson successfully when user is admin', async () => {
      const updatedLesson = new LessonEntity(
        lessonId,
        moduleId,
        'Updated Lesson',
        'Updated Content',
        1,
        60,
        true,
        new Date(),
        new Date()
      );

      mockLessonRepository.getLessonById.mockResolvedValue(mockLesson);
      mockModuleRepository.getModuleById.mockResolvedValue(mockModule);
      mockAuthRepository.getCurrentUser.mockResolvedValue(mockUser);
      mockProfileRepository.getProfileByUserId.mockResolvedValue(mockAdminProfile);
      mockLessonRepository.updateLesson.mockResolvedValue(updatedLesson);

      const result = await updateLessonUseCase.execute(lessonId, validInput);

      expect(result.success).toBe(true);
      expect(result.lesson).toEqual(updatedLesson);
    });

    it('should update lesson successfully when user is assigned teacher', async () => {
      const teacherProfile = new ProfileEntity(
        'user-123',
        'teacher@example.com',
        'Teacher User',
        null,
        'teacher',
        new Date(),
        new Date()
      );

      const updatedLesson = new LessonEntity(
        lessonId,
        moduleId,
        'Updated Lesson',
        'Updated Content',
        1,
        60,
        true,
        new Date(),
        new Date()
      );

      mockLessonRepository.getLessonById.mockResolvedValue(mockLesson);
      mockModuleRepository.getModuleById.mockResolvedValue(mockModule);
      mockAuthRepository.getCurrentUser.mockResolvedValue(mockUser);
      mockProfileRepository.getProfileByUserId.mockResolvedValue(teacherProfile);
      mockCourseRepository.getCourseTeachers.mockResolvedValue(['user-123']);
      mockLessonRepository.updateLesson.mockResolvedValue(updatedLesson);

      const result = await updateLessonUseCase.execute(lessonId, validInput);

      expect(result.success).toBe(true);
      expect(result.lesson).toEqual(updatedLesson);
    });

    it('should return error when lesson not found', async () => {
      mockLessonRepository.getLessonById.mockResolvedValue(null);

      const result = await updateLessonUseCase.execute(lessonId, validInput);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Lección no encontrada');
    });

    it('should return error when module not found', async () => {
      mockLessonRepository.getLessonById.mockResolvedValue(mockLesson);
      mockModuleRepository.getModuleById.mockResolvedValue(null);

      const result = await updateLessonUseCase.execute(lessonId, validInput);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Módulo no encontrado');
    });

    it('should return error when no user is authenticated', async () => {
      mockLessonRepository.getLessonById.mockResolvedValue(mockLesson);
      mockModuleRepository.getModuleById.mockResolvedValue(mockModule);
      mockAuthRepository.getCurrentUser.mockResolvedValue(null);

      const result = await updateLessonUseCase.execute(lessonId, validInput);

      expect(result.success).toBe(false);
      expect(result.error).toBe('No hay usuario autenticado');
    });

    it('should return error when user is student', async () => {
      const studentProfile = new ProfileEntity(
        'user-123',
        'student@example.com',
        'Student User',
        null,
        'student',
        new Date(),
        new Date()
      );

      mockLessonRepository.getLessonById.mockResolvedValue(mockLesson);
      mockModuleRepository.getModuleById.mockResolvedValue(mockModule);
      mockAuthRepository.getCurrentUser.mockResolvedValue(mockUser);
      mockProfileRepository.getProfileByUserId.mockResolvedValue(studentProfile);

      const result = await updateLessonUseCase.execute(lessonId, validInput);

      expect(result.success).toBe(false);
      expect(result.error).toBe('No tienes permisos para editar lecciones');
    });

    it('should return error when teacher is not assigned to course', async () => {
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
      mockCourseRepository.getCourseTeachers.mockResolvedValue(['other-user-id']);

      const result = await updateLessonUseCase.execute(lessonId, validInput);

      expect(result.success).toBe(false);
      expect(result.error).toBe('No estás asignado a este curso');
    });

    it('should handle repository errors gracefully', async () => {
      mockLessonRepository.getLessonById.mockResolvedValue(mockLesson);
      mockModuleRepository.getModuleById.mockResolvedValue(mockModule);
      mockAuthRepository.getCurrentUser.mockResolvedValue(mockUser);
      mockProfileRepository.getProfileByUserId.mockResolvedValue(mockAdminProfile);
      mockLessonRepository.updateLesson.mockRejectedValue(
        new Error('Database error')
      );

      const result = await updateLessonUseCase.execute(lessonId, validInput);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Database error');
    });

    it('should handle unknown errors', async () => {
      mockLessonRepository.getLessonById.mockResolvedValue(mockLesson);
      mockModuleRepository.getModuleById.mockResolvedValue(mockModule);
      mockAuthRepository.getCurrentUser.mockResolvedValue(mockUser);
      mockProfileRepository.getProfileByUserId.mockResolvedValue(mockAdminProfile);
      mockLessonRepository.updateLesson.mockRejectedValue('Unknown error');

      const result = await updateLessonUseCase.execute(lessonId, validInput);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Error al actualizar lección');
    });

    it('should handle order_index change - moving up', async () => {
      const lesson1 = new LessonEntity('les-1', moduleId, 'Lesson 1', 'Content', 1, 30, false, new Date(), new Date());
      const lesson2 = new LessonEntity('les-2', moduleId, 'Lesson 2', 'Content', 2, 30, false, new Date(), new Date());
      const lesson3 = new LessonEntity('les-3', moduleId, 'Lesson 3', 'Content', 3, 30, false, new Date(), new Date());
      const lesson4 = new LessonEntity(lessonId, moduleId, 'Lesson 4', 'Content', 4, 30, false, new Date(), new Date());

      const inputWithOrder = { ...validInput, order_index: 2 };

      mockLessonRepository.getLessonById.mockResolvedValue(lesson4);
      mockModuleRepository.getModuleById.mockResolvedValue(mockModule);
      mockAuthRepository.getCurrentUser.mockResolvedValue(mockUser);
      mockProfileRepository.getProfileByUserId.mockResolvedValue(mockAdminProfile);
      mockLessonRepository.getLessonsByModuleId.mockResolvedValue([lesson1, lesson2, lesson3, lesson4]);
      mockLessonRepository.updateLesson.mockResolvedValue({} as any);

      const result = await updateLessonUseCase.execute(lessonId, inputWithOrder);

      expect(result.success).toBe(true);
      expect(mockLessonRepository.updateLesson).toHaveBeenCalledTimes(3); // 2 shifts + 1 final update
    });

    it('should handle order_index change - moving down', async () => {
      const lesson1 = new LessonEntity(lessonId, moduleId, 'Lesson 1', 'Content', 1, 30, false, new Date(), new Date());
      const lesson2 = new LessonEntity('les-2', moduleId, 'Lesson 2', 'Content', 2, 30, false, new Date(), new Date());
      const lesson3 = new LessonEntity('les-3', moduleId, 'Lesson 3', 'Content', 3, 30, false, new Date(), new Date());
      const lesson4 = new LessonEntity('les-4', moduleId, 'Lesson 4', 'Content', 4, 30, false, new Date(), new Date());

      const inputWithOrder = { ...validInput, order_index: 3 };

      mockLessonRepository.getLessonById.mockResolvedValue(lesson1);
      mockModuleRepository.getModuleById.mockResolvedValue(mockModule);
      mockAuthRepository.getCurrentUser.mockResolvedValue(mockUser);
      mockProfileRepository.getProfileByUserId.mockResolvedValue(mockAdminProfile);
      mockLessonRepository.getLessonsByModuleId.mockResolvedValue([lesson1, lesson2, lesson3, lesson4]);
      mockLessonRepository.updateLesson.mockResolvedValue({} as any);

      const result = await updateLessonUseCase.execute(lessonId, inputWithOrder);

      expect(result.success).toBe(true);
      expect(mockLessonRepository.updateLesson).toHaveBeenCalledTimes(3); // 2 shifts + 1 final update
    });

    it('should return error when order_index is out of bounds - too low', async () => {
      const inputWithOrder = { ...validInput, order_index: 0 };

      mockLessonRepository.getLessonById.mockResolvedValue(mockLesson);
      mockModuleRepository.getModuleById.mockResolvedValue(mockModule);
      mockAuthRepository.getCurrentUser.mockResolvedValue(mockUser);
      mockProfileRepository.getProfileByUserId.mockResolvedValue(mockAdminProfile);
      mockLessonRepository.getLessonsByModuleId.mockResolvedValue([mockLesson]);

      const result = await updateLessonUseCase.execute(lessonId, inputWithOrder);

      expect(result.success).toBe(false);
      expect(result.error).toBe('El orden debe estar entre 1 y 1');
    });

    it('should return error when order_index is out of bounds - too high', async () => {
      const inputWithOrder = { ...validInput, order_index: 10 };

      mockLessonRepository.getLessonById.mockResolvedValue(mockLesson);
      mockModuleRepository.getModuleById.mockResolvedValue(mockModule);
      mockAuthRepository.getCurrentUser.mockResolvedValue(mockUser);
      mockProfileRepository.getProfileByUserId.mockResolvedValue(mockAdminProfile);
      mockLessonRepository.getLessonsByModuleId.mockResolvedValue([mockLesson]);

      const result = await updateLessonUseCase.execute(lessonId, inputWithOrder);

      expect(result.success).toBe(false);
      expect(result.error).toBe('El orden debe estar entre 1 y 1');
    });

    it('should return error when profile not found', async () => {
      mockLessonRepository.getLessonById.mockResolvedValue(mockLesson);
      mockModuleRepository.getModuleById.mockResolvedValue(mockModule);
      mockAuthRepository.getCurrentUser.mockResolvedValue(mockUser);
      mockProfileRepository.getProfileByUserId.mockResolvedValue(null);

      const result = await updateLessonUseCase.execute(lessonId, validInput);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Perfil no encontrado');
    });
  });
});

