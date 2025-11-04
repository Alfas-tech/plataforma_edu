import { DeleteResourceUseCase } from "../DeleteResourceUseCase";
import { ICourseRepository } from "@/src/core/interfaces/repositories/ICourseRepository";
import { IAuthRepository } from "@/src/core/interfaces/repositories/IAuthRepository";
import { IProfileRepository } from "@/src/core/interfaces/repositories/IProfileRepository";
import * as storageActions from "@/src/presentation/actions/storage.actions";

// Mock de las actions de storage
jest.mock("@/src/presentation/actions/storage.actions", () => ({
  deleteResourceFile: jest.fn(),
}));

describe("DeleteResourceUseCase - Eliminación de archivos", () => {
  let useCase: DeleteResourceUseCase;
  let mockCourseRepository: jest.Mocked<ICourseRepository>;
  let mockAuthRepository: jest.Mocked<IAuthRepository>;
  let mockProfileRepository: jest.Mocked<IProfileRepository>;

  beforeEach(() => {
    // Crear mocks de los repositorios
    mockCourseRepository = {
      getResourceById: jest.fn(),
      getTopicById: jest.fn(),
      getCourseVersionById: jest.fn(),
      deleteResource: jest.fn(),
      isTeacherAssignedToVersion: jest.fn(),
    } as any;

    mockAuthRepository = {
      getCurrentUser: jest.fn(),
    } as any;

    mockProfileRepository = {
      getProfileByUserId: jest.fn(),
    } as any;

    useCase = new DeleteResourceUseCase(
      mockCourseRepository,
      mockAuthRepository,
      mockProfileRepository
    );

    // Reset mocks
    jest.clearAllMocks();
  });

  describe("cuando el recurso tiene archivo asociado", () => {
    it("debe eliminar el archivo del bucket antes de eliminar el registro", async () => {
      // Mock de recurso con archivo
      const mockResource: any = {
        id: "resource-123",
        topicId: "topic-123",
        title: "Test Resource",
        description: null,
        resourceType: "pdf",
        fileUrl: "courses/course-123/resources/test-file.pdf",
        fileName: "test-file.pdf",
        fileSize: 1024,
        mimeType: "application/pdf",
        externalUrl: null,
        orderIndex: 1,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const mockTopic: any = {
        id: "topic-123",
        courseVersionId: "version-123",
      };

      const mockCourseVersion: any = {
        id: "version-123",
        courseId: "course-123",
      };

      const mockUser: any = { id: "user-123", email: "test@example.com" };
      const mockProfile: any = {
        id: "profile-123",
        userId: "user-123",
        role: "admin",
        isAdmin: () => true,
        isTeacher: () => false,
        isEditor: () => false,
        isStudent: () => false,
      };

      mockCourseRepository.getResourceById.mockResolvedValue(mockResource);
      mockCourseRepository.getTopicById.mockResolvedValue(mockTopic);
      mockCourseRepository.getCourseVersionById.mockResolvedValue(mockCourseVersion);
      mockAuthRepository.getCurrentUser.mockResolvedValue(mockUser);
      mockProfileRepository.getProfileByUserId.mockResolvedValue(mockProfile);
      (storageActions.deleteResourceFile as jest.Mock).mockResolvedValue({
        success: true,
      });

      const result = await useCase.execute("resource-123");

      expect(result.success).toBe(true);
      expect(storageActions.deleteResourceFile).toHaveBeenCalledWith(
        "courses/course-123/resources/test-file.pdf",
        "course-123"
      );
      expect(mockCourseRepository.deleteResource).toHaveBeenCalledWith("resource-123");
    });

    it("debe continuar eliminando el recurso aunque falle la eliminación del archivo", async () => {
      const mockResource: any = {
        id: "resource-123",
        topicId: "topic-123",
        fileUrl: "courses/course-123/resources/test-file.pdf",
      };

      const mockTopic: any = {
        id: "topic-123",
        courseVersionId: "version-123",
      };

      const mockCourseVersion: any = {
        id: "version-123",
        courseId: "course-123",
      };

      const mockUser: any = { id: "user-123" };
      const mockProfile: any = {
        id: "profile-123",
        role: "admin",
        isAdmin: () => true,
        isTeacher: () => false,
        isEditor: () => false,
      };

      mockCourseRepository.getResourceById.mockResolvedValue(mockResource);
      mockCourseRepository.getTopicById.mockResolvedValue(mockTopic);
      mockCourseRepository.getCourseVersionById.mockResolvedValue(mockCourseVersion);
      mockAuthRepository.getCurrentUser.mockResolvedValue(mockUser);
      mockProfileRepository.getProfileByUserId.mockResolvedValue(mockProfile);
      (storageActions.deleteResourceFile as jest.Mock).mockResolvedValue({
        success: false,
        error: "Error de storage",
      });

      const consoleWarnSpy = jest.spyOn(console, "warn").mockImplementation();

      const result = await useCase.execute("resource-123");

      expect(result.success).toBe(true);
      expect(consoleWarnSpy).toHaveBeenCalledWith(
        expect.stringContaining("No se pudo eliminar el archivo del storage")
      );
      expect(mockCourseRepository.deleteResource).toHaveBeenCalledWith("resource-123");

      consoleWarnSpy.mockRestore();
    });
  });

  describe("cuando el recurso NO tiene archivo asociado", () => {
    it("debe eliminar solo el registro sin intentar eliminar archivo", async () => {
      const mockResource: any = {
        id: "resource-123",
        topicId: "topic-123",
        resourceType: "link",
        fileUrl: null,
        externalUrl: "https://example.com",
      };

      const mockTopic: any = {
        id: "topic-123",
        courseVersionId: "version-123",
      };

      const mockUser: any = { id: "user-123" };
      const mockProfile: any = {
        id: "profile-123",
        role: "admin",
        isAdmin: () => true,
        isTeacher: () => false,
        isEditor: () => false,
      };

      mockCourseRepository.getResourceById.mockResolvedValue(mockResource);
      mockCourseRepository.getTopicById.mockResolvedValue(mockTopic);
      mockAuthRepository.getCurrentUser.mockResolvedValue(mockUser);
      mockProfileRepository.getProfileByUserId.mockResolvedValue(mockProfile);

      const result = await useCase.execute("resource-123");

      expect(result.success).toBe(true);
      expect(storageActions.deleteResourceFile).not.toHaveBeenCalled();
      expect(mockCourseRepository.deleteResource).toHaveBeenCalledWith("resource-123");
    });
  });
});
