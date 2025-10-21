import { GetModulesByCourseUseCase } from "@/src/application/use-cases/module/GetModulesByCourseUseCase";
import { IModuleRepository } from "@/src/core/interfaces/repositories/IModuleRepository";
import { IAuthRepository } from "@/src/core/interfaces/repositories/IAuthRepository";
import { IProfileRepository } from "@/src/core/interfaces/repositories/IProfileRepository";
import { ICourseRepository } from "@/src/core/interfaces/repositories/ICourseRepository";
import { CourseModuleEntity } from "@/src/core/entities/CourseModule.entity";
import { CourseEntity } from "@/src/core/entities/Course.entity";
import { UserEntity } from "@/src/core/entities/User.entity";
import { ProfileEntity } from "@/src/core/entities/Profile.entity";

declare const describe: any;
declare const beforeEach: any;
declare const afterEach: any;
declare const it: any;
declare const expect: any;
declare const jest: any;

describe("GetModulesByCourseUseCase", () => {
  let mockModuleRepository: any;
  let mockAuthRepository: any;
  let mockProfileRepository: any;
  let mockCourseRepository: any;
  let getModulesByCourseUseCase: GetModulesByCourseUseCase;

  beforeEach(() => {
    mockModuleRepository = {
      createModule: jest.fn(),
      getModulesByCourse: jest.fn(),
      getModulesByCourseId: jest.fn(),
      getModuleById: jest.fn(),
      updateModule: jest.fn(),
      deleteModule: jest.fn(),
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

    mockCourseRepository = {
      getActiveCourse: jest.fn(),
      createCourse: jest.fn(),
      getAllCourses: jest.fn(),
      getCourseById: jest.fn(),
      getCourseVersionById: jest.fn(),
      updateCourse: jest.fn(),
      deleteCourse: jest.fn(),
      assignTeacherToVersion: jest.fn(),
      removeTeacherFromVersion: jest.fn(),
      getTeacherCourses: jest.fn(),
      getCourseTeachers: jest.fn(),
      getVersionTeachers: jest.fn(),
      getCourseVersionAssignments: jest.fn(),
      isTeacherAssignedToVersion: jest.fn(),
    };

    getModulesByCourseUseCase = new GetModulesByCourseUseCase(
      mockModuleRepository as IModuleRepository,
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
    const mockUser = new UserEntity(
      "user-123",
      "student@example.com",
      "Student User"
    );
    const now = new Date();
    const mockCourse = CourseEntity.fromDatabase(
      {
        id: courseId,
        title: "Test Course",
        summary: "Description",
        description: "Detailed description",
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
        summary: "Version summary",
        status: "published",
        is_active: true,
        is_published: true,
        is_tip: false,
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
    const mockCourseVersion = mockCourse.activeVersion!;

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
          "version-123",
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
          "version-123",
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
          "version-123",
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
          "version-123",
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
          "version-123",
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
      mockCourseRepository.getCourseVersionAssignments.mockResolvedValue([
        {
          version: mockCourseVersion,
          teacherIds: [mockUser.id],
        },
      ]);
      mockModuleRepository.getModulesByCourseId.mockResolvedValue(mockModules);

      const result = await getModulesByCourseUseCase.execute(courseId);

      expect(result.success).toBe(true);
      expect(result.modules).toHaveLength(1);
      expect(
        mockCourseRepository.getCourseVersionAssignments
      ).toHaveBeenCalledWith(courseId);
    });

    it("should return modules for teacher when specific version is assigned", async () => {
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
          mockCourseVersion.id,
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
      mockCourseRepository.isTeacherAssignedToVersion.mockResolvedValue(true);
      mockModuleRepository.getModulesByCourseId.mockResolvedValue(mockModules);

      const result = await getModulesByCourseUseCase.execute(
        courseId,
        mockCourseVersion.id
      );

      expect(result.success).toBe(true);
      expect(result.modules).toHaveLength(1);
      expect(
        mockCourseRepository.isTeacherAssignedToVersion
      ).toHaveBeenCalledWith(mockCourseVersion.id, mockUser.id);
      expect(mockModuleRepository.getModulesByCourseId).toHaveBeenCalledWith(
        courseId,
        { courseVersionId: mockCourseVersion.id }
      );
    });

    it("should return error when teacher requests unassigned version", async () => {
      const teacherProfile = new ProfileEntity(
        "profile-123",
        "user-123",
        "Teacher",
        "User",
        "teacher",
        new Date(),
        new Date()
      );

      mockCourseRepository.getCourseById.mockResolvedValue(mockCourse);
      mockAuthRepository.getCurrentUser.mockResolvedValue(mockUser);
      mockProfileRepository.getProfileByUserId.mockResolvedValue(
        teacherProfile
      );
      mockCourseRepository.isTeacherAssignedToVersion.mockResolvedValue(false);

      const result = await getModulesByCourseUseCase.execute(
        courseId,
        mockCourseVersion.id
      );

      expect(result.success).toBe(false);
      expect(result.error).toBe(
        "No estás asignado a esta versión del curso"
      );
      expect(mockModuleRepository.getModulesByCourseId).not.toHaveBeenCalled();
    });

    it("should return error when teacher has no assigned versions", async () => {
      const teacherProfile = new ProfileEntity(
        "profile-123",
        "user-123",
        "Teacher",
        "User",
        "teacher",
        new Date(),
        new Date()
      );

      mockCourseRepository.getCourseById.mockResolvedValue(mockCourse);
      mockAuthRepository.getCurrentUser.mockResolvedValue(mockUser);
      mockProfileRepository.getProfileByUserId.mockResolvedValue(
        teacherProfile
      );
      mockCourseRepository.getCourseVersionAssignments.mockResolvedValue([
        {
          version: mockCourseVersion,
          teacherIds: ["another-teacher"],
        },
      ]);

      const result = await getModulesByCourseUseCase.execute(courseId);

      expect(result.success).toBe(false);
      expect(result.error).toBe(
        "No estás asignado a ninguna versión de este curso"
      );
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
