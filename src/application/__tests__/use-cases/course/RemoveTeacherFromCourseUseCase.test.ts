import { RemoveTeacherFromCourseUseCase } from "@/src/application/use-cases/course/RemoveTeacherFromCourseUseCase";
import { ICourseRepository } from "@/src/core/interfaces/repositories/ICourseRepository";
import { IAuthRepository } from "@/src/core/interfaces/repositories/IAuthRepository";
import { IProfileRepository } from "@/src/core/interfaces/repositories/IProfileRepository";
import { CourseEntity } from "@/src/core/entities/Course.entity";
import { UserEntity } from "@/src/core/entities/User.entity";
import { ProfileEntity } from "@/src/core/entities/Profile.entity";

declare const describe: any;
declare const beforeEach: any;
declare const afterEach: any;
declare const it: any;
declare const expect: any;
declare const jest: any;

describe("RemoveTeacherFromCourseUseCase", () => {
  let mockCourseRepository: any;
  let mockAuthRepository: any;
  let mockProfileRepository: any;
  let removeTeacherFromCourseUseCase: RemoveTeacherFromCourseUseCase;

  beforeEach(() => {
    mockCourseRepository = {
      getActiveCourse: jest.fn(),
      getCourseById: jest.fn(),
      createCourse: jest.fn(),
      getAllCourses: jest.fn(),
      updateCourse: jest.fn(),
      deleteCourse: jest.fn(),
      assignTeacherToVersion: jest.fn(),
      removeTeacherFromVersion: jest.fn(),
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
      getAllStudents: jest.fn(),
      getAllTeachers: jest.fn(),
      getAllProfiles: jest.fn(),
      updateProfile: jest.fn(),
      updateRole: jest.fn(),
      promoteToTeacher: jest.fn(),
      demoteToStudent: jest.fn(),
    };

    removeTeacherFromCourseUseCase = new RemoveTeacherFromCourseUseCase(
      mockCourseRepository as ICourseRepository,
      mockAuthRepository as IAuthRepository,
      mockProfileRepository as IProfileRepository
    );
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("execute", () => {
    const courseId = "course-123";
    const teacherId = "teacher-123";

    const mockUser = new UserEntity(
      "admin-123",
      "admin@example.com",
      "Admin User"
    );
    const mockAdminProfile = new ProfileEntity(
      "admin-123",
      "admin@example.com",
      "Admin User",
      null,
      "admin",
      new Date(),
      new Date()
    );

    const now = new Date();
    const mockCourse = CourseEntity.fromDatabase(
      {
        id: courseId,
        title: "Test Course",
        summary: "Course Summary",
        description: "Course Description",
        slug: "test-course",
        visibility_override: false,
        active_version_id: "version-123",
        default_branch_id: null,
        created_by: "admin-123",
        created_at: now.toISOString(),
        updated_at: now.toISOString(),
      },
      {
        id: "version-123",
        course_id: courseId,
        branch_id: null,
        version_label: "v1.0.0",
        summary: "Course Summary",
        status: "published",
        is_active: true,
        is_published: true,
        is_tip: true,
        based_on_version_id: null,
        parent_version_id: null,
        merged_into_version_id: null,
        merge_request_id: null,
        created_by: "admin-123",
        reviewed_by: null,
        approved_at: now.toISOString(),
        created_at: now.toISOString(),
        updated_at: now.toISOString(),
      }
    );

    it("should remove teacher from course when user is admin", async () => {
      mockAuthRepository.getCurrentUser.mockResolvedValue(mockUser);
      mockProfileRepository.getProfileByUserId.mockResolvedValue(
        mockAdminProfile
      );
      mockCourseRepository.getCourseById.mockResolvedValue(mockCourse);
      mockCourseRepository.removeTeacherFromVersion.mockResolvedValue(
        undefined
      );

      const result = await removeTeacherFromCourseUseCase.execute(
        courseId,
        teacherId
      );

      expect(result.success).toBe(true);
      expect(
        mockCourseRepository.removeTeacherFromVersion
      ).toHaveBeenCalledWith(courseId, "version-123", teacherId);
    });

    it("should return error when no user is authenticated", async () => {
      mockAuthRepository.getCurrentUser.mockResolvedValue(null);

      const result = await removeTeacherFromCourseUseCase.execute(
        courseId,
        teacherId
      );

      expect(result.success).toBe(false);
      expect(result.error).toBe("No hay usuario autenticado");
      expect(
        mockCourseRepository.removeTeacherFromVersion
      ).not.toHaveBeenCalled();
    });

    it("should return error when user is not admin", async () => {
      const teacherProfile = new ProfileEntity(
        "user-123",
        "teacher@example.com",
        "Teacher User",
        null,
        "teacher",
        new Date(),
        new Date()
      );

      mockAuthRepository.getCurrentUser.mockResolvedValue(mockUser);
      mockProfileRepository.getProfileByUserId.mockResolvedValue(
        teacherProfile
      );

      const result = await removeTeacherFromCourseUseCase.execute(
        courseId,
        teacherId
      );

      expect(result.success).toBe(false);
      expect(result.error).toBe(
        "Solo los administradores pueden remover docentes"
      );
      expect(
        mockCourseRepository.removeTeacherFromVersion
      ).not.toHaveBeenCalled();
    });

    it("should return error when course not found", async () => {
      mockAuthRepository.getCurrentUser.mockResolvedValue(mockUser);
      mockProfileRepository.getProfileByUserId.mockResolvedValue(
        mockAdminProfile
      );
      mockCourseRepository.getCourseById.mockResolvedValue(null);

      const result = await removeTeacherFromCourseUseCase.execute(
        courseId,
        teacherId
      );

      expect(result.success).toBe(false);
      expect(result.error).toBe("Curso no encontrado");
      expect(
        mockCourseRepository.removeTeacherFromVersion
      ).not.toHaveBeenCalled();
    });

    it("should handle repository errors gracefully", async () => {
      mockAuthRepository.getCurrentUser.mockResolvedValue(mockUser);
      mockProfileRepository.getProfileByUserId.mockResolvedValue(
        mockAdminProfile
      );
      mockCourseRepository.getCourseById.mockResolvedValue(mockCourse);
      mockCourseRepository.removeTeacherFromVersion.mockRejectedValue(
        new Error("Database error")
      );

      const result = await removeTeacherFromCourseUseCase.execute(
        courseId,
        teacherId
      );

      expect(result.success).toBe(false);
      expect(result.error).toBe("Database error");
    });

    it("should handle unknown errors", async () => {
      mockAuthRepository.getCurrentUser.mockResolvedValue(mockUser);
      mockProfileRepository.getProfileByUserId.mockResolvedValue(
        mockAdminProfile
      );
      mockCourseRepository.getCourseById.mockResolvedValue(mockCourse);
      mockCourseRepository.removeTeacherFromVersion.mockRejectedValue(
        "Unknown error"
      );

      const result = await removeTeacherFromCourseUseCase.execute(
        courseId,
        teacherId
      );

      expect(result.success).toBe(false);
      expect(result.error).toBe("Error al remover docente");
    });
  });
});
