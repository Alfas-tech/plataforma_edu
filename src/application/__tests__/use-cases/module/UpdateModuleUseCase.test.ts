import { UpdateModuleUseCase } from "@/src/application/use-cases/module/UpdateModuleUseCase";
import { IModuleRepository } from "@/src/core/interfaces/repositories/IModuleRepository";
import { IAuthRepository } from "@/src/core/interfaces/repositories/IAuthRepository";
import { IProfileRepository } from "@/src/core/interfaces/repositories/IProfileRepository";
import { ICourseRepository } from "@/src/core/interfaces/repositories/ICourseRepository";
import { CourseModuleEntity } from "@/src/core/entities/CourseModule.entity";
import { UserEntity } from "@/src/core/entities/User.entity";
import { ProfileEntity } from "@/src/core/entities/Profile.entity";

declare const describe: any;
declare const beforeEach: any;
declare const afterEach: any;
declare const it: any;
declare const expect: any;
declare const jest: any;

describe("UpdateModuleUseCase", () => {
  let mockModuleRepository: any;
  let mockAuthRepository: any;
  let mockProfileRepository: any;
  let mockCourseRepository: any;
  let updateModuleUseCase: UpdateModuleUseCase;

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

    updateModuleUseCase = new UpdateModuleUseCase(
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
    const moduleId = "module-123";
    const validInput = {
      title: "Updated Module",
      description: "Updated Description",
      content: "Updated Content",
      is_published: true,
    };

    const mockUser = new UserEntity(
      "user-123",
      "admin@example.com",
      "Admin User"
    );
    const mockAdminProfile = new ProfileEntity(
      "user-123",
      "admin@example.com",
      "Admin User",
      null,
      "admin",
      new Date(),
      new Date()
    );

    const mockModule = {
      id: moduleId,
      courseId: "course-123",
      courseVersionId: "version-123",
      title: "Old Module",
      description: "Old Description",
      orderIndex: 1,
      content: "Old Content",
      isPublished: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    it("should update module successfully when user is admin", async () => {
      const updatedModule = new CourseModuleEntity(
        moduleId,
        "course-123",
        "version-123",
        "Updated Module",
        "Updated Description",
        1,
        "Updated Content",
        true,
        new Date(),
        new Date()
      );

      mockModuleRepository.getModuleById.mockResolvedValue(mockModule);
      mockAuthRepository.getCurrentUser.mockResolvedValue(mockUser);
      mockProfileRepository.getProfileByUserId.mockResolvedValue(
        mockAdminProfile
      );
      mockModuleRepository.updateModule.mockResolvedValue(updatedModule);

      const result = await updateModuleUseCase.execute(moduleId, validInput);

      expect(result.success).toBe(true);
      expect(result.module).toEqual(updatedModule);
      expect(mockModuleRepository.updateModule).toHaveBeenCalledWith(
        moduleId,
        validInput
      );
    });

    it("should update module successfully when user is assigned teacher", async () => {
      const teacherProfile = new ProfileEntity(
        "user-123",
        "teacher@example.com",
        "Teacher User",
        null,
        "teacher",
        new Date(),
        new Date()
      );

      const updatedModule = new CourseModuleEntity(
        moduleId,
        "course-123",
        "version-123",
        "Updated Module",
        "Updated Description",
        1,
        "Updated Content",
        true,
        new Date(),
        new Date()
      );

      mockModuleRepository.getModuleById.mockResolvedValue(mockModule);
      mockAuthRepository.getCurrentUser.mockResolvedValue(mockUser);
      mockProfileRepository.getProfileByUserId.mockResolvedValue(
        teacherProfile
      );
      mockCourseRepository.isTeacherAssignedToVersion.mockResolvedValue(true);
      mockModuleRepository.updateModule.mockResolvedValue(updatedModule);

      const result = await updateModuleUseCase.execute(moduleId, validInput);

      expect(result.success).toBe(true);
      expect(result.module).toEqual(updatedModule);
      expect(
        mockCourseRepository.isTeacherAssignedToVersion
      ).toHaveBeenCalledWith("version-123", mockUser.id);
    });

    it("should return error when module not found", async () => {
      mockModuleRepository.getModuleById.mockResolvedValue(null);

      const result = await updateModuleUseCase.execute(moduleId, validInput);

      expect(result.success).toBe(false);
      expect(result.error).toBe("Módulo no encontrado");
      expect(mockModuleRepository.updateModule).not.toHaveBeenCalled();
    });

    it("should return error when no user is authenticated", async () => {
      mockModuleRepository.getModuleById.mockResolvedValue(mockModule);
      mockAuthRepository.getCurrentUser.mockResolvedValue(null);

      const result = await updateModuleUseCase.execute(moduleId, validInput);

      expect(result.success).toBe(false);
      expect(result.error).toBe("No hay usuario autenticado");
      expect(mockModuleRepository.updateModule).not.toHaveBeenCalled();
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

      mockModuleRepository.getModuleById.mockResolvedValue(mockModule);
      mockAuthRepository.getCurrentUser.mockResolvedValue(mockUser);
      mockProfileRepository.getProfileByUserId.mockResolvedValue(
        studentProfile
      );

      const result = await updateModuleUseCase.execute(moduleId, validInput);

      expect(result.success).toBe(false);
      expect(result.error).toBe("No tienes permisos para editar módulos");
      expect(mockModuleRepository.updateModule).not.toHaveBeenCalled();
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

      mockModuleRepository.getModuleById.mockResolvedValue(mockModule);
      mockAuthRepository.getCurrentUser.mockResolvedValue(mockUser);
      mockProfileRepository.getProfileByUserId.mockResolvedValue(
        teacherProfile
      );
      mockCourseRepository.isTeacherAssignedToVersion.mockResolvedValue(false);

      const result = await updateModuleUseCase.execute(moduleId, validInput);

      expect(result.success).toBe(false);
      expect(result.error).toBe("No estás asignado a esta versión del curso");
      expect(mockModuleRepository.updateModule).not.toHaveBeenCalled();
    });

    it("should handle repository errors gracefully", async () => {
      mockModuleRepository.getModuleById.mockResolvedValue(mockModule);
      mockAuthRepository.getCurrentUser.mockResolvedValue(mockUser);
      mockProfileRepository.getProfileByUserId.mockResolvedValue(
        mockAdminProfile
      );
      mockModuleRepository.updateModule.mockRejectedValue(
        new Error("Database error")
      );

      const result = await updateModuleUseCase.execute(moduleId, validInput);

      expect(result.success).toBe(false);
      expect(result.error).toBe("Database error");
    });

    it("should handle unknown errors", async () => {
      mockModuleRepository.getModuleById.mockResolvedValue(mockModule);
      mockAuthRepository.getCurrentUser.mockResolvedValue(mockUser);
      mockProfileRepository.getProfileByUserId.mockResolvedValue(
        mockAdminProfile
      );
      mockModuleRepository.updateModule.mockRejectedValue("Unknown error");

      const result = await updateModuleUseCase.execute(moduleId, validInput);

      expect(result.success).toBe(false);
      expect(result.error).toBe("Error al actualizar módulo");
    });

    it("should handle order_index change - moving up", async () => {
      const module1 = { ...mockModule, id: "mod-1", orderIndex: 1 };
      const module2 = { ...mockModule, id: "mod-2", orderIndex: 2 };
      const module3 = { ...mockModule, id: "mod-3", orderIndex: 3 };
      const module4 = { ...mockModule, id: moduleId, orderIndex: 4 };

      const inputWithOrder = { ...validInput, order_index: 2 };

      mockModuleRepository.getModuleById.mockResolvedValue(module4);
      mockAuthRepository.getCurrentUser.mockResolvedValue(mockUser);
      mockProfileRepository.getProfileByUserId.mockResolvedValue(
        mockAdminProfile
      );
      mockModuleRepository.getModulesByCourseId.mockResolvedValue([
        module1,
        module2,
        module3,
        module4,
      ]);
      mockModuleRepository.updateModule.mockResolvedValue({} as any);

      const result = await updateModuleUseCase.execute(
        moduleId,
        inputWithOrder
      );

      expect(result.success).toBe(true);
      expect(mockModuleRepository.updateModule).toHaveBeenCalledTimes(3); // 2 shifts + 1 final update
    });

    it("should handle order_index change - moving down", async () => {
      const module1 = { ...mockModule, id: moduleId, orderIndex: 1 };
      const module2 = { ...mockModule, id: "mod-2", orderIndex: 2 };
      const module3 = { ...mockModule, id: "mod-3", orderIndex: 3 };
      const module4 = { ...mockModule, id: "mod-4", orderIndex: 4 };

      const inputWithOrder = { ...validInput, order_index: 3 };

      mockModuleRepository.getModuleById.mockResolvedValue(module1);
      mockAuthRepository.getCurrentUser.mockResolvedValue(mockUser);
      mockProfileRepository.getProfileByUserId.mockResolvedValue(
        mockAdminProfile
      );
      mockModuleRepository.getModulesByCourseId.mockResolvedValue([
        module1,
        module2,
        module3,
        module4,
      ]);
      mockModuleRepository.updateModule.mockResolvedValue({} as any);

      const result = await updateModuleUseCase.execute(
        moduleId,
        inputWithOrder
      );

      expect(result.success).toBe(true);
      expect(mockModuleRepository.updateModule).toHaveBeenCalledTimes(3); // 2 shifts + 1 final update
    });

    it("should return error when order_index is out of bounds - too low", async () => {
      const inputWithOrder = { ...validInput, order_index: 0 };

      mockModuleRepository.getModuleById.mockResolvedValue(mockModule);
      mockAuthRepository.getCurrentUser.mockResolvedValue(mockUser);
      mockProfileRepository.getProfileByUserId.mockResolvedValue(
        mockAdminProfile
      );
      mockModuleRepository.getModulesByCourseId.mockResolvedValue([mockModule]);

      const result = await updateModuleUseCase.execute(
        moduleId,
        inputWithOrder
      );

      expect(result.success).toBe(false);
      expect(result.error).toBe("El orden debe estar entre 1 y 1");
    });

    it("should return error when order_index is out of bounds - too high", async () => {
      const inputWithOrder = { ...validInput, order_index: 10 };

      mockModuleRepository.getModuleById.mockResolvedValue(mockModule);
      mockAuthRepository.getCurrentUser.mockResolvedValue(mockUser);
      mockProfileRepository.getProfileByUserId.mockResolvedValue(
        mockAdminProfile
      );
      mockModuleRepository.getModulesByCourseId.mockResolvedValue([mockModule]);

      const result = await updateModuleUseCase.execute(
        moduleId,
        inputWithOrder
      );

      expect(result.success).toBe(false);
      expect(result.error).toBe("El orden debe estar entre 1 y 1");
    });

    it("should return error when profile not found", async () => {
      mockModuleRepository.getModuleById.mockResolvedValue(mockModule);
      mockAuthRepository.getCurrentUser.mockResolvedValue(mockUser);
      mockProfileRepository.getProfileByUserId.mockResolvedValue(null);

      const result = await updateModuleUseCase.execute(moduleId, validInput);

      expect(result.success).toBe(false);
      expect(result.error).toBe("Perfil no encontrado");
    });
  });
});
