import { DeleteCourseUseCase } from "@/src/application/use-cases/course/DeleteCourseUseCase";
import { ICourseRepository } from "@/src/core/interfaces/repositories/ICourseRepository";
import { IAuthRepository } from "@/src/core/interfaces/repositories/IAuthRepository";
import { IProfileRepository } from "@/src/core/interfaces/repositories/IProfileRepository";
import { UserEntity } from "@/src/core/entities/User.entity";
import { ProfileEntity } from "@/src/core/entities/Profile.entity";

describe("DeleteCourseUseCase", () => {
  let mockCourseRepository: jest.Mocked<ICourseRepository>;
  let mockAuthRepository: jest.Mocked<IAuthRepository>;
  let mockProfileRepository: jest.Mocked<IProfileRepository>;
  let deleteCourseUseCase: DeleteCourseUseCase;

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

    deleteCourseUseCase = new DeleteCourseUseCase(
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

    it("should delete course successfully when user is admin", async () => {
      mockAuthRepository.getCurrentUser.mockResolvedValue(mockUser);
      mockProfileRepository.getProfileByUserId.mockResolvedValue(
        mockAdminProfile
      );
      mockCourseRepository.deleteCourse.mockResolvedValue(undefined);

      const result = await deleteCourseUseCase.execute(courseId);

      expect(result.success).toBe(true);
      expect(result.error).toBeUndefined();
      expect(mockCourseRepository.deleteCourse).toHaveBeenCalledWith(courseId);
      expect(mockCourseRepository.deleteCourse).toHaveBeenCalledTimes(1);
    });

    it("should return error when no user is authenticated", async () => {
      mockAuthRepository.getCurrentUser.mockResolvedValue(null);

      const result = await deleteCourseUseCase.execute(courseId);

      expect(result.success).toBe(false);
      expect(result.error).toBe("No hay usuario autenticado");
      expect(mockCourseRepository.deleteCourse).not.toHaveBeenCalled();
    });

    it("should return error when user is not admin", async () => {
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

      const result = await deleteCourseUseCase.execute(courseId);

      expect(result.success).toBe(false);
      expect(result.error).toBe(
        "Solo los administradores pueden eliminar cursos"
      );
      expect(mockCourseRepository.deleteCourse).not.toHaveBeenCalled();
    });

    it("should handle repository errors gracefully", async () => {
      mockAuthRepository.getCurrentUser.mockResolvedValue(mockUser);
      mockProfileRepository.getProfileByUserId.mockResolvedValue(
        mockAdminProfile
      );
      mockCourseRepository.deleteCourse.mockRejectedValue(
        new Error("Course not found")
      );

      const result = await deleteCourseUseCase.execute(courseId);

      expect(result.success).toBe(false);
      expect(result.error).toBe("Course not found");
    });

    it("should handle unknown errors", async () => {
      mockAuthRepository.getCurrentUser.mockResolvedValue(mockUser);
      mockProfileRepository.getProfileByUserId.mockResolvedValue(
        mockAdminProfile
      );
      mockCourseRepository.deleteCourse.mockRejectedValue("Unknown error");

      const result = await deleteCourseUseCase.execute(courseId);

      expect(result.success).toBe(false);
      expect(result.error).toBe("Error al eliminar curso");
    });
  });
});
