import { CreateCourseUseCase } from "@/src/application/use-cases/course/CreateCourseUseCase";
import { ICourseRepository } from "@/src/core/interfaces/repositories/ICourseRepository";
import { IAuthRepository } from "@/src/core/interfaces/repositories/IAuthRepository";
import { IProfileRepository } from "@/src/core/interfaces/repositories/IProfileRepository";
import { CourseEntity } from "@/src/core/entities/Course.entity";
import { UserEntity } from "@/src/core/entities/User.entity";
import { ProfileEntity } from "@/src/core/entities/Profile.entity";
import { CreateCourseInput } from "@/src/core/types/course.types";

declare const describe: any;
declare const beforeEach: any;
declare const afterEach: any;
declare const it: any;
declare const expect: any;
declare const jest: any;

describe("CreateCourseUseCase", () => {
  let mockCourseRepository: any;
  let mockAuthRepository: any;
  let mockProfileRepository: any;
  let createCourseUseCase: CreateCourseUseCase;

  beforeEach(() => {
    mockCourseRepository = {
      getActiveCourse: jest.fn(),
      getCourseById: jest.fn(),
      getAllCourses: jest.fn(),
      createCourse: jest.fn(),
      updateCourse: jest.fn(),
      deleteCourse: jest.fn(),
      assignTeacher: jest.fn(),
      removeTeacher: jest.fn(),
      getTeacherCourses: jest.fn(),
      getCourseTeachers: jest.fn(),
    };

    mockAuthRepository = {
      login: jest.fn(),
      signUp: jest.fn(),
      signOut: jest.fn(),
      getCurrentUser: jest.fn(),
      signInWithGoogle: jest.fn(),
      resetPassword: jest.fn(),
      updatePassword: jest.fn(),
    };

    mockProfileRepository = {
      getProfileByUserId: jest.fn(),
      getProfileByEmail: jest.fn(),
      getAllProfiles: jest.fn(),
      updateProfile: jest.fn(),
      promoteToTeacher: jest.fn(),
      demoteToStudent: jest.fn(),
      updateRole: jest.fn(),
      getAllTeachers: jest.fn(),
      getAllStudents: jest.fn(),
    };

    createCourseUseCase = new CreateCourseUseCase(
      mockCourseRepository as ICourseRepository,
      mockAuthRepository as IAuthRepository,
      mockProfileRepository as IProfileRepository
    );
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("execute", () => {
    const validInput: CreateCourseInput = {
      title: "Test Course",
      summary: "Test Summary",
      description: "Test Description",
      initialVersionLabel: "v1.0.0",
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

    it("should create course successfully when user is admin", async () => {
      const now = new Date();
      const mockCourse = CourseEntity.fromDatabase(
        {
          id: "course-123",
          title: "Test Course",
          summary: "Test Summary",
          description: "Test Description",
          slug: "test-course",
          visibility_override: false,
          active_version_id: "version-1",
          created_by: "user-123",
          created_at: now.toISOString(),
          updated_at: now.toISOString(),
        },
        {
          id: "version-1",
          course_id: "course-123",
          version_label: "v1.0.0",
          summary: "Version summary",
          status: "published",
          is_active: true,
          is_published: true,
          based_on_version_id: null,
          created_by: "user-123",
          reviewed_by: null,
          approved_at: now.toISOString(),
          created_at: now.toISOString(),
          updated_at: now.toISOString(),
        }
      );

      mockAuthRepository.getCurrentUser.mockResolvedValue(mockUser);
      mockProfileRepository.getProfileByUserId.mockResolvedValue(
        mockAdminProfile
      );
      mockCourseRepository.createCourse.mockResolvedValue(mockCourse);

      const result = await createCourseUseCase.execute(validInput);

      expect(result.success).toBe(true);
      expect(result.course).toEqual(mockCourse);
      expect(result.error).toBeUndefined();
      expect(mockCourseRepository.createCourse).toHaveBeenCalledWith(
        validInput
      );
      expect(mockCourseRepository.createCourse).toHaveBeenCalledTimes(1);
    });

    it("should return error when no user is authenticated", async () => {
      mockAuthRepository.getCurrentUser.mockResolvedValue(null);

      const result = await createCourseUseCase.execute(validInput);

      expect(result.success).toBe(false);
      expect(result.error).toBe("No hay usuario autenticado");
      expect(result.course).toBeUndefined();
      expect(mockCourseRepository.createCourse).not.toHaveBeenCalled();
    });

    it("should return error when user is not admin", async () => {
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

      const result = await createCourseUseCase.execute(validInput);

      expect(result.success).toBe(false);
      expect(result.error).toBe("No tienes permisos para crear cursos");
      expect(result.course).toBeUndefined();
      expect(mockCourseRepository.createCourse).not.toHaveBeenCalled();
    });

    it("should handle repository errors gracefully", async () => {
      mockAuthRepository.getCurrentUser.mockResolvedValue(mockUser);
      mockProfileRepository.getProfileByUserId.mockResolvedValue(
        mockAdminProfile
      );
      mockCourseRepository.createCourse.mockRejectedValue(
        new Error("Database connection failed")
      );

      const result = await createCourseUseCase.execute(validInput);

      expect(result.success).toBe(false);
      expect(result.error).toBe("Database connection failed");
      expect(result.course).toBeUndefined();
    });

    it("should handle unknown errors", async () => {
      mockAuthRepository.getCurrentUser.mockResolvedValue(mockUser);
      mockProfileRepository.getProfileByUserId.mockResolvedValue(
        mockAdminProfile
      );
      mockCourseRepository.createCourse.mockRejectedValue("Unknown error");

      const result = await createCourseUseCase.execute(validInput);

      expect(result.success).toBe(false);
      expect(result.error).toBe("Error al crear curso");
    });
  });
});
