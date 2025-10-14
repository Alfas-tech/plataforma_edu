import { CreateModuleUseCase } from "@/src/application/use-cases/module/CreateModuleUseCase";
import { IModuleRepository } from "@/src/core/interfaces/repositories/IModuleRepository";
import { IAuthRepository } from "@/src/core/interfaces/repositories/IAuthRepository";
import { IProfileRepository } from "@/src/core/interfaces/repositories/IProfileRepository";
import { ICourseRepository } from "@/src/core/interfaces/repositories/ICourseRepository";
import { CourseModuleEntity } from "@/src/core/entities/CourseModule.entity";
import { UserEntity } from "@/src/core/entities/User.entity";
import { ProfileEntity } from "@/src/core/entities/Profile.entity";

describe("CreateModuleUseCase", () => {
  let mockModuleRepository: jest.Mocked<IModuleRepository>;
  let mockAuthRepository: jest.Mocked<IAuthRepository>;
  let mockProfileRepository: jest.Mocked<IProfileRepository>;
  let mockCourseRepository: jest.Mocked<ICourseRepository>;
  let createModuleUseCase: CreateModuleUseCase;

  beforeEach(() => {
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

    createModuleUseCase = new CreateModuleUseCase(
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
      course_id: "course-123",
      title: "Test Module",
      description: "Test Description",
      order_index: 1,
      content: "Test Content",
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

    it("should create module successfully when user is admin", async () => {
      const mockModule = new CourseModuleEntity(
        "module-123",
        "course-123",
        "Test Module",
        "Test Description",
        1,
        "Test Content",
        false,
        new Date(),
        new Date()
      );

      mockAuthRepository.getCurrentUser.mockResolvedValue(mockUser);
      mockProfileRepository.getProfileByUserId.mockResolvedValue(
        mockAdminProfile
      );
      mockModuleRepository.createModule.mockResolvedValue(mockModule);

      const result = await createModuleUseCase.execute(validInput);

      expect(result.success).toBe(true);
      expect(result.module).toEqual(mockModule);
      expect(result.error).toBeUndefined();
      expect(mockModuleRepository.createModule).toHaveBeenCalledWith(
        validInput
      );
    });

    it("should create module successfully when user is assigned teacher", async () => {
      const teacherProfile = new ProfileEntity(
        "profile-123",
        "user-123",
        "Teacher",
        "User",
        "teacher",
        new Date(),
        new Date()
      );

      const mockModule = new CourseModuleEntity(
        "module-123",
        "course-123",
        "Test Module",
        "Test Description",
        1,
        "Test Content",
        false,
        new Date(),
        new Date()
      );

      mockAuthRepository.getCurrentUser.mockResolvedValue(mockUser);
      mockProfileRepository.getProfileByUserId.mockResolvedValue(
        teacherProfile
      );
      mockCourseRepository.getCourseTeachers.mockResolvedValue(["user-123"]);
      mockModuleRepository.createModule.mockResolvedValue(mockModule);

      const result = await createModuleUseCase.execute(validInput);

      expect(result.success).toBe(true);
      expect(result.module).toEqual(mockModule);
      expect(mockCourseRepository.getCourseTeachers).toHaveBeenCalledWith(
        "course-123"
      );
    });

    it("should return error when no user is authenticated", async () => {
      mockAuthRepository.getCurrentUser.mockResolvedValue(null);

      const result = await createModuleUseCase.execute(validInput);

      expect(result.success).toBe(false);
      expect(result.error).toBe("No hay usuario autenticado");
      expect(mockModuleRepository.createModule).not.toHaveBeenCalled();
    });

    it("should return error when profile not found", async () => {
      mockAuthRepository.getCurrentUser.mockResolvedValue(mockUser);
      mockProfileRepository.getProfileByUserId.mockResolvedValue(null);

      const result = await createModuleUseCase.execute(validInput);

      expect(result.success).toBe(false);
      expect(result.error).toBe("Perfil no encontrado");
      expect(mockModuleRepository.createModule).not.toHaveBeenCalled();
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

      mockAuthRepository.getCurrentUser.mockResolvedValue(mockUser);
      mockProfileRepository.getProfileByUserId.mockResolvedValue(
        studentProfile
      );

      const result = await createModuleUseCase.execute(validInput);

      expect(result.success).toBe(false);
      expect(result.error).toBe("No tienes permisos para crear módulos");
      expect(mockModuleRepository.createModule).not.toHaveBeenCalled();
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

      mockAuthRepository.getCurrentUser.mockResolvedValue(mockUser);
      mockProfileRepository.getProfileByUserId.mockResolvedValue(
        teacherProfile
      );
      mockCourseRepository.getCourseTeachers.mockResolvedValue([
        "other-user-id",
      ]);

      const result = await createModuleUseCase.execute(validInput);

      expect(result.success).toBe(false);
      expect(result.error).toBe("No estás asignado a este curso");
      expect(mockModuleRepository.createModule).not.toHaveBeenCalled();
    });

    it("should handle repository errors gracefully", async () => {
      mockAuthRepository.getCurrentUser.mockResolvedValue(mockUser);
      mockProfileRepository.getProfileByUserId.mockResolvedValue(
        mockAdminProfile
      );
      mockModuleRepository.createModule.mockRejectedValue(
        new Error("Database error")
      );

      const result = await createModuleUseCase.execute(validInput);

      expect(result.success).toBe(false);
      expect(result.error).toBe("Database error");
    });

    it("should handle unknown errors", async () => {
      mockAuthRepository.getCurrentUser.mockResolvedValue(mockUser);
      mockProfileRepository.getProfileByUserId.mockResolvedValue(
        mockAdminProfile
      );
      mockModuleRepository.createModule.mockRejectedValue("Unknown error");

      const result = await createModuleUseCase.execute(validInput);

      expect(result.success).toBe(false);
      expect(result.error).toBe("Error al crear módulo");
    });
  });
});
