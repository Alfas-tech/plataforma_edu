import { DeleteModuleUseCase } from "@/src/application/use-cases/module/DeleteModuleUseCase";
import { IModuleRepository } from "@/src/core/interfaces/repositories/IModuleRepository";
import { IAuthRepository } from "@/src/core/interfaces/repositories/IAuthRepository";
import { IProfileRepository } from "@/src/core/interfaces/repositories/IProfileRepository";
import { ICourseRepository } from "@/src/core/interfaces/repositories/ICourseRepository";
import { UserEntity } from "@/src/core/entities/User.entity";
import { ProfileEntity } from "@/src/core/entities/Profile.entity";

describe("DeleteModuleUseCase", () => {
  let mockModuleRepository: jest.Mocked<IModuleRepository>;
  let mockAuthRepository: jest.Mocked<IAuthRepository>;
  let mockProfileRepository: jest.Mocked<IProfileRepository>;
  let mockCourseRepository: jest.Mocked<ICourseRepository>;
  let deleteModuleUseCase: DeleteModuleUseCase;

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
      promoteToTeacher: jest.fn(),
      demoteToStudent: jest.fn(),
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
      isTeacherAssignedToVersion: jest.fn(),
    } as any;

    deleteModuleUseCase = new DeleteModuleUseCase(
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
    const moduleId = "module-123";
    const courseVersionId = "version-123";
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

    it("should delete module successfully when user is admin", async () => {
      const mockModule = {
        id: moduleId,
        courseId: "course-123",
        courseVersionId: courseVersionId,
        title: "Module to Delete",
        description: "Description",
        orderIndex: 1,
        content: "Content",
        isPublished: false,
        createdAt: new Date(),
        updatedAt: new Date(),
        versionId: courseVersionId,
        isAccessible: () => false,
      };

      mockModuleRepository.getModuleById.mockResolvedValue(mockModule);
      mockAuthRepository.getCurrentUser.mockResolvedValue(mockUser);
      mockProfileRepository.getProfileByUserId.mockResolvedValue(
        mockAdminProfile
      );
      mockModuleRepository.deleteModule.mockResolvedValue(undefined);

      const result = await deleteModuleUseCase.execute(moduleId);

      expect(result.success).toBe(true);
      expect(mockModuleRepository.deleteModule).toHaveBeenCalledWith(moduleId);
    });

    it("should return error when no user is authenticated", async () => {
      const mockModule = {
        id: moduleId,
        courseId: "course-123",
        courseVersionId: courseVersionId,
        title: "Module to Delete",
        description: "Description",
        orderIndex: 1,
        content: "Content",
        isPublished: false,
        createdAt: new Date(),
        updatedAt: new Date(),
        versionId: courseVersionId,
        isAccessible: () => false,
      };

      mockModuleRepository.getModuleById.mockResolvedValue(mockModule);
      mockAuthRepository.getCurrentUser.mockResolvedValue(null);

      const result = await deleteModuleUseCase.execute(moduleId);

      expect(result.success).toBe(false);
      expect(result.error).toBe("No hay usuario autenticado");
      expect(mockModuleRepository.deleteModule).not.toHaveBeenCalled();
    });

    it("should allow teacher to delete module if assigned to version", async () => {
      const mockModule = {
        id: moduleId,
        courseId: "course-123",
        courseVersionId: courseVersionId,
        title: "Module to Delete",
        description: "Description",
        orderIndex: 1,
        content: "Content",
        isPublished: false,
        createdAt: new Date(),
        updatedAt: new Date(),
        versionId: courseVersionId,
        isAccessible: () => false,
      };

      const teacherProfile = new ProfileEntity(
        "teacher-123",
        "teacher@example.com",
        "Teacher User",
        null,
        "teacher",
        new Date(),
        new Date()
      );

      const teacherUser = new UserEntity(
        "teacher-123",
        "teacher@example.com",
        "Teacher User"
      );

      mockModuleRepository.getModuleById.mockResolvedValue(mockModule);
      mockAuthRepository.getCurrentUser.mockResolvedValue(teacherUser);
      mockProfileRepository.getProfileByUserId.mockResolvedValue(
        teacherProfile
      );
      mockCourseRepository.isTeacherAssignedToVersion.mockResolvedValue(true);
      mockModuleRepository.deleteModule.mockResolvedValue(undefined);

      const result = await deleteModuleUseCase.execute(moduleId);

      expect(result.success).toBe(true);
      expect(
        mockCourseRepository.isTeacherAssignedToVersion
      ).toHaveBeenCalledWith(courseVersionId, "teacher-123");
      expect(mockModuleRepository.deleteModule).toHaveBeenCalledWith(moduleId);
    });

    it("should prevent teacher from deleting module if not assigned to version", async () => {
      const mockModule = {
        id: moduleId,
        courseId: "course-123",
        courseVersionId: courseVersionId,
        title: "Module to Delete",
        description: "Description",
        orderIndex: 1,
        content: "Content",
        isPublished: false,
        createdAt: new Date(),
        updatedAt: new Date(),
        versionId: courseVersionId,
        isAccessible: () => false,
      };

      const teacherProfile = new ProfileEntity(
        "teacher-123",
        "teacher@example.com",
        "Teacher User",
        null,
        "teacher",
        new Date(),
        new Date()
      );

      const teacherUser = new UserEntity(
        "teacher-123",
        "teacher@example.com",
        "Teacher User"
      );

      mockModuleRepository.getModuleById.mockResolvedValue(mockModule);
      mockAuthRepository.getCurrentUser.mockResolvedValue(teacherUser);
      mockProfileRepository.getProfileByUserId.mockResolvedValue(
        teacherProfile
      );
      mockCourseRepository.isTeacherAssignedToVersion.mockResolvedValue(false);

      const result = await deleteModuleUseCase.execute(moduleId);

      expect(result.success).toBe(false);
      expect(result.error).toBe("No tienes permisos para eliminar este módulo");
      expect(mockModuleRepository.deleteModule).not.toHaveBeenCalled();
    });

    it("should prevent student from deleting module", async () => {
      const mockModule = {
        id: moduleId,
        courseId: "course-123",
        courseVersionId: courseVersionId,
        title: "Module to Delete",
        description: "Description",
        orderIndex: 1,
        content: "Content",
        isPublished: false,
        createdAt: new Date(),
        updatedAt: new Date(),
        versionId: courseVersionId,
        isAccessible: () => false,
      };

      const studentProfile = new ProfileEntity(
        "student-123",
        "student@example.com",
        "Student User",
        null,
        "student",
        new Date(),
        new Date()
      );

      const studentUser = new UserEntity(
        "student-123",
        "student@example.com",
        "Student User"
      );

      mockModuleRepository.getModuleById.mockResolvedValue(mockModule);
      mockAuthRepository.getCurrentUser.mockResolvedValue(studentUser);
      mockProfileRepository.getProfileByUserId.mockResolvedValue(
        studentProfile
      );

      const result = await deleteModuleUseCase.execute(moduleId);

      expect(result.success).toBe(false);
      expect(result.error).toBe("No tienes permisos para eliminar módulos");
      expect(mockModuleRepository.deleteModule).not.toHaveBeenCalled();
    });

    it("should handle repository errors gracefully", async () => {
      const mockModule = {
        id: moduleId,
        courseId: "course-123",
        courseVersionId: courseVersionId,
        title: "Module to Delete",
        description: "Description",
        orderIndex: 1,
        content: "Content",
        isPublished: false,
        createdAt: new Date(),
        updatedAt: new Date(),
        versionId: courseVersionId,
        isAccessible: () => false,
      };

      mockModuleRepository.getModuleById.mockResolvedValue(mockModule);
      mockAuthRepository.getCurrentUser.mockResolvedValue(mockUser);
      mockProfileRepository.getProfileByUserId.mockResolvedValue(
        mockAdminProfile
      );
      mockModuleRepository.deleteModule.mockRejectedValue(
        new Error("Database error")
      );

      const result = await deleteModuleUseCase.execute(moduleId);

      expect(result.success).toBe(false);
      expect(result.error).toBe("Database error");
    });

    it("should handle unknown errors", async () => {
      const mockModule = {
        id: moduleId,
        courseId: "course-123",
        courseVersionId: courseVersionId,
        title: "Module to Delete",
        description: "Description",
        orderIndex: 1,
        content: "Content",
        isPublished: false,
        createdAt: new Date(),
        updatedAt: new Date(),
        versionId: courseVersionId,
        isAccessible: () => false,
      };

      mockModuleRepository.getModuleById.mockResolvedValue(mockModule);
      mockAuthRepository.getCurrentUser.mockResolvedValue(mockUser);
      mockProfileRepository.getProfileByUserId.mockResolvedValue(
        mockAdminProfile
      );
      mockModuleRepository.deleteModule.mockRejectedValue("Unknown error");

      const result = await deleteModuleUseCase.execute(moduleId);

      expect(result.success).toBe(false);
      expect(result.error).toBe("Error al eliminar módulo");
    });

    it("should return error when profile not found", async () => {
      const mockModule = {
        id: moduleId,
        courseId: "course-123",
        courseVersionId: courseVersionId,
        title: "Module to Delete",
        description: "Description",
        orderIndex: 1,
        content: "Content",
        isPublished: false,
        createdAt: new Date(),
        updatedAt: new Date(),
        versionId: courseVersionId,
        isAccessible: () => false,
      };

      mockModuleRepository.getModuleById.mockResolvedValue(mockModule);
      mockAuthRepository.getCurrentUser.mockResolvedValue(mockUser);
      mockProfileRepository.getProfileByUserId.mockResolvedValue(null);

      const result = await deleteModuleUseCase.execute(moduleId);

      expect(result.success).toBe(false);
      expect(result.error).toBe("Perfil no encontrado");
    });
  });
});
