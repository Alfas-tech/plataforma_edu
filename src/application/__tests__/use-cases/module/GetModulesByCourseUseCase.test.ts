import { GetModulesByCourseUseCase } from "@/src/application/use-cases/module/GetModulesByCourseUseCase";
import { IModuleRepository } from "@/src/core/interfaces/repositories/IModuleRepository";
import { IAuthRepository } from "@/src/core/interfaces/repositories/IAuthRepository";
import { IProfileRepository } from "@/src/core/interfaces/repositories/IProfileRepository";
import { ICourseRepository } from "@/src/core/interfaces/repositories/ICourseRepository";
import { CourseModuleEntity } from "@/src/core/entities/CourseModule.entity";
import { CourseEntity } from "@/src/core/entities/Course.entity";
import { UserEntity } from "@/src/core/entities/User.entity";
import { ProfileEntity } from "@/src/core/entities/Profile.entity";

describe("GetModulesByCourseUseCase", () => {
  let mockModuleRepository: jest.Mocked<IModuleRepository>;
  let mockAuthRepository: jest.Mocked<IAuthRepository>;
  let mockProfileRepository: jest.Mocked<IProfileRepository>;
  let mockCourseRepository: jest.Mocked<ICourseRepository>;
  let getModulesByCourseUseCase: GetModulesByCourseUseCase;

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

    getModulesByCourseUseCase = new GetModulesByCourseUseCase(
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
    const courseId = "course-123";
    const mockUser = new UserEntity(
      "user-123",
      "student@example.com",
      "Student User"
    );
    const mockCourse = new CourseEntity(
      courseId,
      "Test Course",
      "Description",
      new Date(),
      new Date(),
      true,
      new Date(),
      new Date()
    );

    it("should return published modules for students", async () => {
      const studentProfile = new ProfileEntity(
        "profile-123",
        "user-123",
        "Student",
        "User",
        "student",
        new Date(),
        new Date()
      );

      const mockModules = [
        new CourseModuleEntity(
          "module-1",
          courseId,
          "Module 1",
          "Description 1",
          1,
          "Content 1",
          true,
          new Date(),
          new Date()
        ),
        new CourseModuleEntity(
          "module-2",
          courseId,
          "Module 2",
          "Description 2",
          2,
          "Content 2",
          false,
          new Date(),
          new Date()
        ),
      ];

      mockCourseRepository.getCourseById.mockResolvedValue(mockCourse);
      mockAuthRepository.getCurrentUser.mockResolvedValue(mockUser);
      mockProfileRepository.getProfileByUserId.mockResolvedValue(
        studentProfile
      );
      mockModuleRepository.getModulesByCourseId.mockResolvedValue(mockModules);

      const result = await getModulesByCourseUseCase.execute(courseId);

      expect(result.success).toBe(true);
      expect(result.modules).toHaveLength(1);
      expect(result.modules?.[0].isPublished).toBe(true);
    });

    it("should return all modules for admins", async () => {
      const adminProfile = new ProfileEntity(
        "profile-123",
        "user-123",
        "Admin",
        "User",
        "admin",
        new Date(),
        new Date()
      );

      const mockModules = [
        new CourseModuleEntity(
          "module-1",
          courseId,
          "Module 1",
          "Description 1",
          1,
          "Content 1",
          true,
          new Date(),
          new Date()
        ),
        new CourseModuleEntity(
          "module-2",
          courseId,
          "Module 2",
          "Description 2",
          2,
          "Content 2",
          false,
          new Date(),
          new Date()
        ),
      ];

      mockCourseRepository.getCourseById.mockResolvedValue(mockCourse);
      mockAuthRepository.getCurrentUser.mockResolvedValue(mockUser);
      mockProfileRepository.getProfileByUserId.mockResolvedValue(adminProfile);
      mockModuleRepository.getModulesByCourseId.mockResolvedValue(mockModules);

      const result = await getModulesByCourseUseCase.execute(courseId);

      expect(result.success).toBe(true);
      expect(result.modules).toHaveLength(2);
    });

    it("should return all modules for teachers", async () => {
      const teacherProfile = new ProfileEntity(
        "profile-123",
        "user-123",
        "Teacher",
        "User",
        "teacher",
        new Date(),
        new Date()
      );

      const mockModules = [
        new CourseModuleEntity(
          "module-1",
          courseId,
          "Module 1",
          "Description 1",
          1,
          "Content 1",
          true,
          new Date(),
          new Date()
        ),
      ];

      mockCourseRepository.getCourseById.mockResolvedValue(mockCourse);
      mockAuthRepository.getCurrentUser.mockResolvedValue(mockUser);
      mockProfileRepository.getProfileByUserId.mockResolvedValue(
        teacherProfile
      );
      mockModuleRepository.getModulesByCourseId.mockResolvedValue(mockModules);

      const result = await getModulesByCourseUseCase.execute(courseId);

      expect(result.success).toBe(true);
      expect(result.modules).toHaveLength(1);
    });

    it("should return empty array when no modules exist", async () => {
      const studentProfile = new ProfileEntity(
        "profile-123",
        "user-123",
        "Student",
        "User",
        "student",
        new Date(),
        new Date()
      );

      mockCourseRepository.getCourseById.mockResolvedValue(mockCourse);
      mockAuthRepository.getCurrentUser.mockResolvedValue(mockUser);
      mockProfileRepository.getProfileByUserId.mockResolvedValue(
        studentProfile
      );
      mockModuleRepository.getModulesByCourseId.mockResolvedValue([]);

      const result = await getModulesByCourseUseCase.execute(courseId);

      expect(result.success).toBe(true);
      expect(result.modules).toEqual([]);
      expect(result.modules).toHaveLength(0);
    });

    it("should return error when course not found", async () => {
      mockCourseRepository.getCourseById.mockResolvedValue(null);

      const result = await getModulesByCourseUseCase.execute(courseId);

      expect(result.success).toBe(false);
      expect(result.error).toBe("Curso no encontrado");
    });

    it("should return error when no user is authenticated", async () => {
      mockCourseRepository.getCourseById.mockResolvedValue(mockCourse);
      mockAuthRepository.getCurrentUser.mockResolvedValue(null);

      const result = await getModulesByCourseUseCase.execute(courseId);

      expect(result.success).toBe(false);
      expect(result.error).toBe("No hay usuario autenticado");
    });

    it("should return error when profile not found", async () => {
      mockCourseRepository.getCourseById.mockResolvedValue(mockCourse);
      mockAuthRepository.getCurrentUser.mockResolvedValue(mockUser);
      mockProfileRepository.getProfileByUserId.mockResolvedValue(null);

      const result = await getModulesByCourseUseCase.execute(courseId);

      expect(result.success).toBe(false);
      expect(result.error).toBe("Perfil no encontrado");
    });

    it("should handle repository errors gracefully", async () => {
      mockCourseRepository.getCourseById.mockRejectedValue(
        new Error("Database error")
      );

      const result = await getModulesByCourseUseCase.execute(courseId);

      expect(result.success).toBe(false);
      expect(result.error).toBe("Database error");
    });

    it("should handle unknown errors", async () => {
      mockCourseRepository.getCourseById.mockRejectedValue("Unknown error");

      const result = await getModulesByCourseUseCase.execute(courseId);

      expect(result.success).toBe(false);
      expect(result.error).toBe("Error al obtener módulos");
    });
  });
});
