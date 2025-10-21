import { CreateModuleUseCase } from "@/src/application/use-cases/module/CreateModuleUseCase";
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

describe("CreateModuleUseCase", () => {
  let mockModuleRepository: any;
  let mockAuthRepository: any;
  let mockProfileRepository: any;
  let mockCourseRepository: any;
  let createModuleUseCase: CreateModuleUseCase;

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
      getCourseById: jest.fn(),
      getCourseVersionById: jest.fn(),
      getAllCourses: jest.fn(),
      createCourse: jest.fn(),
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

    createModuleUseCase = new CreateModuleUseCase(
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
    const validInput = {
      courseId,
      courseVersionId: "version-123",
      title: "Test Module",
      description: "Test Description",
      orderIndex: 1,
      content: "Test Content",
      isPublished: false,
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
    const now = new Date();
    const mockCourse = CourseEntity.fromDatabase(
      {
        id: courseId,
        title: "Course",
        summary: "Summary",
        description: "Description",
        slug: "course",
        visibility_override: false,
        active_version_id: "version-123",
        default_branch_id: null,
        created_by: "admin-1",
        created_at: now.toISOString(),
        updated_at: now.toISOString(),
      },
      {
        id: "version-123",
        course_id: courseId,
        branch_id: null,
        version_label: "v1.0.0",
        summary: "Summary",
        status: "published",
        is_active: true,
        is_published: true,
        is_tip: false,
        based_on_version_id: null,
        parent_version_id: null,
        merged_into_version_id: null,
        merge_request_id: null,
        created_by: "admin-1",
        reviewed_by: null,
        approved_at: now.toISOString(),
        created_at: now.toISOString(),
        updated_at: now.toISOString(),
      }
    );
    const mockCourseVersion = mockCourse.activeVersion!;

    it("should create module successfully when user is admin", async () => {
      const mockModule = new CourseModuleEntity(
        "module-123",
        "course-123",
        "version-123",
        "Test Module",
        "Test Description",
        1,
        "Test Content",
        false,
        new Date(),
        new Date()
      );

      mockCourseRepository.getCourseById.mockResolvedValue(mockCourse);
      mockCourseRepository.getCourseVersionById.mockResolvedValue(
        mockCourseVersion
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
        expect.objectContaining({
          course_id: courseId,
          course_version_id: "version-123",
          title: "Test Module",
          description: "Test Description",
          order_index: 1,
          content: "Test Content",
          is_published: false,
        })
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
        "version-123",
        "Test Module",
        "Test Description",
        1,
        "Test Content",
        false,
        new Date(),
        new Date()
      );

      mockAuthRepository.getCurrentUser.mockResolvedValue(mockUser);
      mockCourseRepository.getCourseById.mockResolvedValue(mockCourse);
      mockCourseRepository.getCourseVersionById.mockResolvedValue(
        mockCourseVersion
      );
      mockProfileRepository.getProfileByUserId.mockResolvedValue(
        teacherProfile
      );
      mockCourseRepository.isTeacherAssignedToVersion.mockResolvedValue(true);
      mockModuleRepository.createModule.mockResolvedValue(mockModule);

      const result = await createModuleUseCase.execute(validInput);

      expect(result.success).toBe(true);
      expect(result.module).toEqual(mockModule);
      expect(
        mockCourseRepository.isTeacherAssignedToVersion
      ).toHaveBeenCalledWith("version-123", mockUser.id);
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

    it("should return error when course is not found", async () => {
      mockAuthRepository.getCurrentUser.mockResolvedValue(mockUser);
      mockProfileRepository.getProfileByUserId.mockResolvedValue(
        mockAdminProfile
      );
      mockCourseRepository.getCourseById.mockResolvedValue(null);

      const result = await createModuleUseCase.execute(validInput);

      expect(result.success).toBe(false);
      expect(result.error).toBe("Curso no encontrado");
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
      mockCourseRepository.getCourseById.mockResolvedValue(mockCourse);
      mockCourseRepository.getCourseVersionById.mockResolvedValue(
        mockCourseVersion
      );
      mockProfileRepository.getProfileByUserId.mockResolvedValue(
        teacherProfile
      );
      mockCourseRepository.isTeacherAssignedToVersion.mockResolvedValue(false);

      const result = await createModuleUseCase.execute(validInput);

      expect(result.success).toBe(false);
      expect(result.error).toBe("No estás asignado a esta versión del curso");
      expect(mockModuleRepository.createModule).not.toHaveBeenCalled();
    });

    it("should return error when course has no active version and none provided", async () => {
      const courseWithoutActiveVersion = CourseEntity.fromDatabase(
        {
          id: courseId,
          title: "Course",
          summary: "Summary",
          description: "Description",
          slug: "course",
          visibility_override: false,
          active_version_id: null,
          default_branch_id: null,
          created_by: "admin-1",
          created_at: now.toISOString(),
          updated_at: now.toISOString(),
        },
        null
      );

      mockAuthRepository.getCurrentUser.mockResolvedValue(mockUser);
      mockProfileRepository.getProfileByUserId.mockResolvedValue(
        mockAdminProfile
      );
      mockCourseRepository.getCourseById.mockResolvedValue(
        courseWithoutActiveVersion
      );

      const result = await createModuleUseCase.execute({
        ...validInput,
        courseVersionId: undefined,
      });

      expect(result.success).toBe(false);
      expect(result.error).toBe("El curso no tiene una versión activa");
      expect(mockModuleRepository.createModule).not.toHaveBeenCalled();
    });

    it("should handle repository errors gracefully", async () => {
      mockAuthRepository.getCurrentUser.mockResolvedValue(mockUser);
      mockCourseRepository.getCourseById.mockResolvedValue(mockCourse);
      mockCourseRepository.getCourseVersionById.mockResolvedValue(
        mockCourseVersion
      );
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
      mockCourseRepository.getCourseById.mockResolvedValue(mockCourse);
      mockCourseRepository.getCourseVersionById.mockResolvedValue(
        mockCourseVersion
      );
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
