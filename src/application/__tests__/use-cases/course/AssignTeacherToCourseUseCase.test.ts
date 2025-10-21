import { AssignTeacherToCourseUseCase } from "@/src/application/use-cases/course/AssignTeacherToCourseUseCase";
import { ICourseRepository } from "@/src/core/interfaces/repositories/ICourseRepository";
import { IAuthRepository } from "@/src/core/interfaces/repositories/IAuthRepository";
import { IProfileRepository } from "@/src/core/interfaces/repositories/IProfileRepository";
import { UserEntity } from "@/src/core/entities/User.entity";
import { ProfileEntity } from "@/src/core/entities/Profile.entity";
import { CourseEntity } from "@/src/core/entities/Course.entity";

declare const describe: any;
declare const beforeEach: any;
declare const afterEach: any;
declare const it: any;
declare const expect: any;
declare const jest: any;

describe("AssignTeacherToCourseUseCase", () => {
  let mockCourseRepository: any;
  let mockAuthRepository: any;
  let mockProfileRepository: any;
  let assignTeacherToCourseUseCase: AssignTeacherToCourseUseCase;

  beforeEach(() => {
    mockCourseRepository = {
      getActiveCourse: jest.fn(),
      getCourseById: jest.fn(),
      getAllCourses: jest.fn(),
      createCourse: jest.fn(),
      updateCourse: jest.fn(),
      deleteCourse: jest.fn(),
      assignTeacherToVersion: jest.fn(),
      removeTeacherFromVersion: jest.fn(),
      getCourseTeachers: jest.fn(),
      getTeacherCourses: jest.fn(),
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

    assignTeacherToCourseUseCase = new AssignTeacherToCourseUseCase(
      mockCourseRepository as ICourseRepository,
      mockAuthRepository as IAuthRepository,
      mockProfileRepository as IProfileRepository
    );
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("execute", () => {
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
    const mockTeacherProfile = new ProfileEntity(
      "teacher-123",
      "teacher@example.com",
      "Teacher User",
      null,
      "teacher",
      new Date(),
      new Date()
    );
    const now = new Date();
    const mockCourse = CourseEntity.fromDatabase(
      {
        id: "course-123",
        title: "Test Course",
        summary: "Description",
        description: "Long description",
        slug: "test-course",
        visibility_override: false,
        active_version_id: "version-1",
        default_branch_id: null,
        created_by: "admin-123",
        created_at: now.toISOString(),
        updated_at: now.toISOString(),
      },
      {
        id: "version-1",
        course_id: "course-123",
        branch_id: null,
        version_label: "v1.0.0",
        summary: "Version summary",
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

    it("should assign teacher to course when user is admin", async () => {
      mockAuthRepository.getCurrentUser.mockResolvedValue(mockUser);
      mockProfileRepository.getProfileByUserId
        .mockResolvedValueOnce(mockAdminProfile)
        .mockResolvedValueOnce(mockTeacherProfile);
      mockCourseRepository.getCourseById.mockResolvedValue(mockCourse);
      mockCourseRepository.getCourseTeachers.mockResolvedValue([]);
      mockCourseRepository.assignTeacherToVersion.mockResolvedValue(undefined);

      const result = await assignTeacherToCourseUseCase.execute(
        "course-123",
        "teacher-123"
      );

      expect(result.success).toBe(true);
      expect(mockCourseRepository.assignTeacherToVersion).toHaveBeenCalledWith(
        "course-123",
        "version-1",
        "teacher-123"
      );
    });

    it("should return error when no user is authenticated", async () => {
      mockAuthRepository.getCurrentUser.mockResolvedValue(null);

      const result = await assignTeacherToCourseUseCase.execute(
        "course-123",
        "teacher-123"
      );

      expect(result.success).toBe(false);
      expect(result.error).toBe("No hay usuario autenticado");
    });

    it("should return error when user is not admin", async () => {
      const teacherProfile = new ProfileEntity(
        "user-123",
        "user@example.com",
        "User",
        null,
        "teacher",
        new Date(),
        new Date()
      );

      mockAuthRepository.getCurrentUser.mockResolvedValue(mockUser);
      mockProfileRepository.getProfileByUserId.mockResolvedValue(
        teacherProfile
      );

      const result = await assignTeacherToCourseUseCase.execute(
        "course-123",
        "teacher-123"
      );

      expect(result.success).toBe(false);
      expect(result.error).toBe(
        "Solo los administradores pueden asignar docentes"
      );
    });

    it("should return error when teacher profile not found", async () => {
      mockAuthRepository.getCurrentUser.mockResolvedValue(mockUser);
      mockProfileRepository.getProfileByUserId
        .mockResolvedValueOnce(mockAdminProfile)
        .mockResolvedValueOnce(null);

      const result = await assignTeacherToCourseUseCase.execute(
        "course-123",
        "teacher-123"
      );

      expect(result.success).toBe(false);
      expect(result.error).toBe("Perfil de docente no encontrado");
    });

    it("should return error when user is not a teacher", async () => {
      const studentProfile = new ProfileEntity(
        "student-123",
        "student@example.com",
        "Student User",
        null,
        "student",
        new Date(),
        new Date()
      );

      mockAuthRepository.getCurrentUser.mockResolvedValue(mockUser);
      mockProfileRepository.getProfileByUserId
        .mockResolvedValueOnce(mockAdminProfile)
        .mockResolvedValueOnce(studentProfile);

      const result = await assignTeacherToCourseUseCase.execute(
        "course-123",
        "student-123"
      );

      expect(result.success).toBe(false);
      expect(result.error).toBe("El usuario no es un docente");
    });

    it("should return error when course not found", async () => {
      mockAuthRepository.getCurrentUser.mockResolvedValue(mockUser);
      mockProfileRepository.getProfileByUserId
        .mockResolvedValueOnce(mockAdminProfile)
        .mockResolvedValueOnce(mockTeacherProfile);
      mockCourseRepository.getCourseById.mockResolvedValue(null);

      const result = await assignTeacherToCourseUseCase.execute(
        "course-123",
        "teacher-123"
      );

      expect(result.success).toBe(false);
      expect(result.error).toBe("Curso no encontrado");
    });

    it("should return error when teacher is already assigned", async () => {
      mockAuthRepository.getCurrentUser.mockResolvedValue(mockUser);
      mockProfileRepository.getProfileByUserId
        .mockResolvedValueOnce(mockAdminProfile)
        .mockResolvedValueOnce(mockTeacherProfile);
      mockCourseRepository.getCourseById.mockResolvedValue(mockCourse);
      mockCourseRepository.getCourseTeachers.mockResolvedValue(["teacher-123"]);

      const result = await assignTeacherToCourseUseCase.execute(
        "course-123",
        "teacher-123"
      );

      expect(result.success).toBe(false);
      expect(result.error).toBe("El docente ya está asignado a este curso");
    });

    it("should handle repository errors gracefully", async () => {
      mockAuthRepository.getCurrentUser.mockResolvedValue(mockUser);
      mockProfileRepository.getProfileByUserId
        .mockResolvedValueOnce(mockAdminProfile)
        .mockResolvedValueOnce(mockTeacherProfile);
      mockCourseRepository.getCourseById.mockResolvedValue(mockCourse);
      mockCourseRepository.getCourseTeachers.mockResolvedValue([]);
      mockCourseRepository.assignTeacherToVersion.mockRejectedValue(
        new Error("Database error")
      );

      const result = await assignTeacherToCourseUseCase.execute(
        "course-123",
        "teacher-123"
      );

      expect(result.success).toBe(false);
      expect(result.error).toBe("Database error");
    });

    it("should handle unknown errors", async () => {
      mockAuthRepository.getCurrentUser.mockResolvedValue(mockUser);
      mockProfileRepository.getProfileByUserId
        .mockResolvedValueOnce(mockAdminProfile)
        .mockResolvedValueOnce(mockTeacherProfile);
      mockCourseRepository.getCourseById.mockResolvedValue(mockCourse);
      mockCourseRepository.getCourseTeachers.mockResolvedValue([]);
      mockCourseRepository.assignTeacherToVersion.mockRejectedValue(
        "Unknown error"
      );

      const result = await assignTeacherToCourseUseCase.execute(
        "course-123",
        "teacher-123"
      );

      expect(result.success).toBe(false);
      expect(result.error).toBe("Error al asignar docente");
    });
  });
});
