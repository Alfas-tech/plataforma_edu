import { CreateLessonUseCase } from "@/src/application/use-cases/lesson/CreateLessonUseCase";
import { ILessonRepository } from "@/src/core/interfaces/repositories/ILessonRepository";
import { IAuthRepository } from "@/src/core/interfaces/repositories/IAuthRepository";
import { IProfileRepository } from "@/src/core/interfaces/repositories/IProfileRepository";
import { ICourseRepository } from "@/src/core/interfaces/repositories/ICourseRepository";
import { LessonEntity } from "@/src/core/entities/Lesson.entity";
import { UserEntity } from "@/src/core/entities/User.entity";
import { ProfileEntity } from "@/src/core/entities/Profile.entity";

describe("CreateLessonUseCase", () => {
  let mockLessonRepository: jest.Mocked<ILessonRepository>;
  let mockModuleRepository: jest.Mocked<any>;
  let mockAuthRepository: jest.Mocked<IAuthRepository>;
  let mockProfileRepository: jest.Mocked<IProfileRepository>;
  let mockCourseRepository: jest.Mocked<ICourseRepository>;
  let createLessonUseCase: CreateLessonUseCase;

  beforeEach(() => {
    mockLessonRepository = {
      createLesson: jest.fn(),
      getLessonsByModule: jest.fn(),
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
    } as any;

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
      getCourseTeachers: jest.fn(),
    } as any;

    createLessonUseCase = new CreateLessonUseCase(
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

  describe("execute", () => {
    const validInput = {
      module_id: "module-123",
      title: "Test Lesson",
      content: "Test Content",
      order_index: 1,
      duration_minutes: 30,
      is_published: false,
    };

    const mockUser = new UserEntity(
      "user-123",
      "admin@example.com",
      "Admin User"
    );
    const mockAdminProfile = new ProfileEntity(
      "profile-123",
      "user-123",
      "Admin",
      "User",
      "admin",
      new Date(),
      new Date()
    );

    const mockModule = { id: "module-123", course_id: "course-123" };

    it("should create lesson successfully when user is admin", async () => {
      const mockLesson = new LessonEntity(
        "lesson-123",
        "module-123",
        "Test Lesson",
        "Test Content",
        1,
        30,
        false,
        new Date(),
        new Date()
      );

      mockModuleRepository.getModuleById.mockResolvedValue(mockModule);
      mockAuthRepository.getCurrentUser.mockResolvedValue(mockUser);
      mockProfileRepository.getProfileByUserId.mockResolvedValue(
        mockAdminProfile
      );
      mockLessonRepository.createLesson.mockResolvedValue(mockLesson);

      const result = await createLessonUseCase.execute(validInput);

      expect(result.success).toBe(true);
      expect(result.lesson).toEqual(mockLesson);
      expect(result.error).toBeUndefined();
      expect(mockLessonRepository.createLesson).toHaveBeenCalledWith(
        validInput
      );
    });

    it("should create lesson successfully when user is assigned teacher", async () => {
      const teacherProfile = new ProfileEntity(
        "profile-123",
        "user-123",
        "Teacher",
        "User",
        "teacher",
        new Date(),
        new Date()
      );

      const mockLesson = new LessonEntity(
        "lesson-123",
        "module-123",
        "Test Lesson",
        "Test Content",
        1,
        30,
        false,
        new Date(),
        new Date()
      );

      mockModuleRepository.getModuleById.mockResolvedValue(mockModule);
      mockAuthRepository.getCurrentUser.mockResolvedValue(mockUser);
      mockProfileRepository.getProfileByUserId.mockResolvedValue(
        teacherProfile
      );
      mockCourseRepository.getCourseTeachers.mockResolvedValue(["user-123"]);
      mockLessonRepository.createLesson.mockResolvedValue(mockLesson);

      const result = await createLessonUseCase.execute(validInput);

      expect(result.success).toBe(true);
      expect(result.lesson).toEqual(mockLesson);
      expect(mockCourseRepository.getCourseTeachers).toHaveBeenCalled();
    });

    it("should return error when module not found", async () => {
      mockModuleRepository.getModuleById.mockResolvedValue(null);

      const result = await createLessonUseCase.execute(validInput);

      expect(result.success).toBe(false);
      expect(result.error).toBe("Módulo no encontrado");
      expect(mockLessonRepository.createLesson).not.toHaveBeenCalled();
    });

    it("should return error when no user is authenticated", async () => {
      mockModuleRepository.getModuleById.mockResolvedValue(mockModule);
      mockAuthRepository.getCurrentUser.mockResolvedValue(null);

      const result = await createLessonUseCase.execute(validInput);

      expect(result.success).toBe(false);
      expect(result.error).toBe("No hay usuario autenticado");
      expect(mockLessonRepository.createLesson).not.toHaveBeenCalled();
    });

    it("should return error when profile not found", async () => {
      mockModuleRepository.getModuleById.mockResolvedValue(mockModule);
      mockAuthRepository.getCurrentUser.mockResolvedValue(mockUser);
      mockProfileRepository.getProfileByUserId.mockResolvedValue(null);

      const result = await createLessonUseCase.execute(validInput);

      expect(result.success).toBe(false);
      expect(result.error).toBe("Perfil no encontrado");
      expect(mockLessonRepository.createLesson).not.toHaveBeenCalled();
    });

    it("should return error when user is student", async () => {
      const studentProfile = new ProfileEntity(
        "profile-123",
        "user-123",
        "Student",
        "User",
        "student",
        new Date(),
        new Date()
      );

      mockModuleRepository.getModuleById.mockResolvedValue(mockModule);
      mockAuthRepository.getCurrentUser.mockResolvedValue(mockUser);
      mockProfileRepository.getProfileByUserId.mockResolvedValue(
        studentProfile
      );

      const result = await createLessonUseCase.execute(validInput);

      expect(result.success).toBe(false);
      expect(result.error).toBe("No tienes permisos para crear lecciones");
      expect(mockLessonRepository.createLesson).not.toHaveBeenCalled();
    });

    it("should return error when teacher is not assigned to course", async () => {
      const teacherProfile = new ProfileEntity(
        "profile-123",
        "user-123",
        "Teacher",
        "User",
        "teacher",
        new Date(),
        new Date()
      );

      mockModuleRepository.getModuleById.mockResolvedValue(mockModule);
      mockAuthRepository.getCurrentUser.mockResolvedValue(mockUser);
      mockProfileRepository.getProfileByUserId.mockResolvedValue(
        teacherProfile
      );
      mockCourseRepository.getCourseTeachers.mockResolvedValue([
        "other-user-id",
      ]);

      const result = await createLessonUseCase.execute(validInput);

      expect(result.success).toBe(false);
      expect(result.error).toBe("No estás asignado a este curso");
      expect(mockLessonRepository.createLesson).not.toHaveBeenCalled();
    });

    it("should handle repository errors gracefully", async () => {
      mockModuleRepository.getModuleById.mockResolvedValue(mockModule);
      mockAuthRepository.getCurrentUser.mockResolvedValue(mockUser);
      mockProfileRepository.getProfileByUserId.mockResolvedValue(
        mockAdminProfile
      );
      mockLessonRepository.createLesson.mockRejectedValue(
        new Error("Database error")
      );

      const result = await createLessonUseCase.execute(validInput);

      expect(result.success).toBe(false);
      expect(result.error).toBe("Database error");
    });

    it("should handle unknown errors", async () => {
      mockModuleRepository.getModuleById.mockResolvedValue(mockModule);
      mockAuthRepository.getCurrentUser.mockResolvedValue(mockUser);
      mockProfileRepository.getProfileByUserId.mockResolvedValue(
        mockAdminProfile
      );
      mockLessonRepository.createLesson.mockRejectedValue("Unknown error");

      const result = await createLessonUseCase.execute(validInput);

      expect(result.success).toBe(false);
      expect(result.error).toBe("Error al crear lección");
    });
  });
});
