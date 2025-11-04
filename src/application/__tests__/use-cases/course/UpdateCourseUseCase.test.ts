import { UpdateCourseUseCase } from "@/src/application/use-cases/course/UpdateCourseUseCase";
import { ICourseRepository } from "@/src/core/interfaces/repositories/ICourseRepository";
import { IAuthRepository } from "@/src/core/interfaces/repositories/IAuthRepository";
import { IProfileRepository } from "@/src/core/interfaces/repositories/IProfileRepository";
import { CourseEntity } from "@/src/core/entities/Course.entity";
import { UserEntity } from "@/src/core/entities/User.entity";
import { ProfileEntity } from "@/src/core/entities/Profile.entity";
import { UpdateCourseInput } from "@/src/core/types/course.types";

declare const describe: any;
declare const beforeEach: any;
declare const afterEach: any;
declare const it: any;
declare const expect: any;
declare const jest: any;

describe("UpdateCourseUseCase", () => {
  let mockCourseRepository: any;
  let mockAuthRepository: any;
  let mockProfileRepository: any;
  let updateCourseUseCase: UpdateCourseUseCase;

  beforeEach(() => {
    mockCourseRepository = {
      getActiveCourse: jest.fn(),
      getCourseById: jest.fn(),
      createCourse: jest.fn(),
      getAllCourses: jest.fn(),
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
      getAllStudents: jest.fn(),
      getAllTeachers: jest.fn(),
      updateUserRole: jest.fn(),
      createProfile: jest.fn(),
      deleteProfile: jest.fn(),
    };

    updateCourseUseCase = new UpdateCourseUseCase(
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
    const validInput: UpdateCourseInput = {
      title: "Updated Course",
      summary: "Updated Summary",
      description: "Updated Description",
      visibility_override: true,
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

    it("should update course successfully when user is admin", async () => {
      const now = new Date();
      const mockUpdatedCourse = CourseEntity.fromDatabase(
        {
          id: courseId,
          title: "Updated Course",
          summary: "Updated Summary",
          description: "Updated Description",
          slug: "updated-course",
          visibility_override: true,
          active_version_id: "version-1",
          created_by: "admin-123",
          created_at: now.toISOString(),
          updated_at: now.toISOString(),
        },
        {
          id: "version-1",
          course_id: courseId,
          version_label: "v1.0.1",
          summary: "Updated Summary",
          status: "published",
          is_active: true,
          is_published: true,
          based_on_version_id: null,
          created_by: "admin-123",
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
      mockCourseRepository.updateCourse.mockResolvedValue(mockUpdatedCourse);

      const result = await updateCourseUseCase.execute(courseId, validInput);

      expect(result.success).toBe(true);
      expect(result.course).toEqual(mockUpdatedCourse);
      expect(result.error).toBeUndefined();
      expect(mockCourseRepository.updateCourse).toHaveBeenCalledWith(
        courseId,
        validInput
      );
      expect(mockCourseRepository.updateCourse).toHaveBeenCalledTimes(1);
    });

    it("should return error when no user is authenticated", async () => {
      mockAuthRepository.getCurrentUser.mockResolvedValue(null);

      const result = await updateCourseUseCase.execute(courseId, validInput);

      expect(result.success).toBe(false);
      expect(result.error).toBe("No hay usuario autenticado");
      expect(result.course).toBeUndefined();
      expect(mockCourseRepository.updateCourse).not.toHaveBeenCalled();
    });

    it("should handle repository errors gracefully", async () => {
      mockAuthRepository.getCurrentUser.mockResolvedValue(mockUser);
      mockProfileRepository.getProfileByUserId.mockResolvedValue(
        mockAdminProfile
      );
      mockCourseRepository.updateCourse.mockRejectedValue(
        new Error("Course not found")
      );

      const result = await updateCourseUseCase.execute(courseId, validInput);

      expect(result.success).toBe(false);
      expect(result.error).toBe("Course not found");
      expect(result.course).toBeUndefined();
    });

    it("should handle unknown errors", async () => {
      mockAuthRepository.getCurrentUser.mockResolvedValue(mockUser);
      mockProfileRepository.getProfileByUserId.mockResolvedValue(
        mockAdminProfile
      );
      mockCourseRepository.updateCourse.mockRejectedValue("Unknown error");

      const result = await updateCourseUseCase.execute(courseId, validInput);

      expect(result.success).toBe(false);
      expect(result.error).toBe("Error al actualizar curso");
    });

    it("should return error when profile not found", async () => {
      mockAuthRepository.getCurrentUser.mockResolvedValue(mockUser);
      mockProfileRepository.getProfileByUserId.mockResolvedValue(null);

      const result = await updateCourseUseCase.execute(courseId, validInput);

      expect(result.success).toBe(false);
      expect(result.error).toBe("Perfil no encontrado");
    });

    it("should return error when user is student", async () => {
      const studentProfile = new ProfileEntity(
        "user-123",
        "student@example.com",
        "Student User",
        null,
        "student",
        new Date(),
        new Date()
      );
      mockAuthRepository.getCurrentUser.mockResolvedValue(mockUser);
      mockProfileRepository.getProfileByUserId.mockResolvedValue(
        studentProfile
      );

      const result = await updateCourseUseCase.execute(courseId, validInput);

      expect(result.success).toBe(false);
      expect(result.error).toBe("No tienes permisos para editar cursos");
    });

    it("should return error when teacher is not assigned to course", async () => {
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
      mockCourseRepository.getCourseTeachers.mockResolvedValue([
        "other-teacher-id",
      ]);

      const result = await updateCourseUseCase.execute(courseId, validInput);

      expect(result.success).toBe(false);
      expect(result.error).toBe("No estás asignado a este curso");
    });

    it("should update course successfully when teacher is assigned to course", async () => {
      const teacherProfile = new ProfileEntity(
        "user-123",
        "teacher@example.com",
        "Teacher User",
        null,
        "teacher",
        new Date(),
        new Date()
      );

      const now = new Date();
      const mockUpdatedCourse = CourseEntity.fromDatabase(
        {
          id: courseId,
          title: "Updated Course",
          summary: "Updated Summary",
          description: "Updated Description",
          slug: "updated-course",
          visibility_override: false,
          active_version_id: "version-1",
          created_by: "admin-123",
          created_at: now.toISOString(),
          updated_at: now.toISOString(),
        },
        {
          id: "version-1",
          course_id: courseId,
          version_label: "v1.0.1",
          summary: "Updated Summary",
          status: "published",
          is_active: true,
          is_published: true,
          based_on_version_id: null,
          created_by: "admin-123",
          reviewed_by: null,
          approved_at: now.toISOString(),
          created_at: now.toISOString(),
          updated_at: now.toISOString(),
        }
      );

      mockAuthRepository.getCurrentUser.mockResolvedValue(mockUser);
      mockProfileRepository.getProfileByUserId.mockResolvedValue(
        teacherProfile
      );
      mockCourseRepository.getCourseTeachers.mockResolvedValue(["user-123"]);
      mockCourseRepository.updateCourse.mockResolvedValue(mockUpdatedCourse);

      const result = await updateCourseUseCase.execute(courseId, validInput);

      expect(result.success).toBe(true);
      expect(result.course).toEqual(mockUpdatedCourse);
    });
  });
});
