import { DeleteResourceUseCase } from "@/src/application/use-cases/resource/DeleteResourceUseCase";
import { ICourseRepository } from "@/src/core/interfaces/repositories/ICourseRepository";
import { IAuthRepository } from "@/src/core/interfaces/repositories/IAuthRepository";
import { IProfileRepository } from "@/src/core/interfaces/repositories/IProfileRepository";
import * as storageActions from "@/src/presentation/actions/storage.actions";

declare const describe: any;
declare const beforeEach: any;
declare const it: any;
declare const expect: any;
declare const jest: any;

jest.mock("@/src/presentation/actions/storage.actions", () => ({
  deleteResourceFile: jest.fn(),
}));

describe("DeleteResourceUseCase", () => {
  let useCase: DeleteResourceUseCase;
  let mockCourseRepository: jest.Mocked<ICourseRepository>;
  let mockAuthRepository: jest.Mocked<IAuthRepository>;
  let mockProfileRepository: jest.Mocked<IProfileRepository>;

  beforeEach(() => {
    mockCourseRepository = {
      getResourceById: jest.fn(),
      getTopicById: jest.fn(),
      getCourseVersionById: jest.fn(),
      deleteResource: jest.fn(),
      isTeacherAssignedToVersion: jest.fn(),
    } as unknown as jest.Mocked<ICourseRepository>;

    mockAuthRepository = {
      getCurrentUser: jest.fn(),
    } as unknown as jest.Mocked<IAuthRepository>;

    mockProfileRepository = {
      getProfileByUserId: jest.fn(),
    } as unknown as jest.Mocked<IProfileRepository>;

    useCase = new DeleteResourceUseCase(
      mockCourseRepository,
      mockAuthRepository,
      mockProfileRepository
    );

    jest.clearAllMocks();
  });

  describe("when the resource has an associated file", () => {
    it("deletes the file from storage before removing the record", async () => {
      const now = new Date();
      const mockResource: any = {
        id: "resource-123",
        topicId: "topic-123",
        title: "Resource",
        description: null,
        resourceType: "pdf",
        fileUrl: "courses/course-123/resources/test-file.pdf",
        fileName: "test-file.pdf",
        fileSize: 1024,
        mimeType: "application/pdf",
        externalUrl: null,
        orderIndex: 1,
        createdAt: now,
        updatedAt: now,
      };

      const mockTopic: any = {
        id: "topic-123",
        courseVersionId: "version-123",
      };

      const mockVersion: any = {
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
      mockCourseRepository.getCourseVersionById.mockResolvedValue(mockVersion);
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
      expect(mockCourseRepository.deleteResource).toHaveBeenCalledWith(
        "resource-123"
      );
    });

    it("logs a warning and continues when storage deletion fails", async () => {
      const mockResource: any = {
        id: "resource-123",
        topicId: "topic-123",
        fileUrl: "courses/course-123/resources/test-file.pdf",
      };

      const mockTopic: any = {
        id: "topic-123",
        courseVersionId: "version-123",
      };

      const mockVersion: any = {
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
      mockCourseRepository.getCourseVersionById.mockResolvedValue(mockVersion);
      mockAuthRepository.getCurrentUser.mockResolvedValue(mockUser);
      mockProfileRepository.getProfileByUserId.mockResolvedValue(mockProfile);
      (storageActions.deleteResourceFile as jest.Mock).mockResolvedValue({
        success: false,
        error: "storage error",
      });

      const consoleWarnSpy = jest.spyOn(console, "warn").mockImplementation();

      const result = await useCase.execute("resource-123");

      expect(result.success).toBe(true);
      expect(consoleWarnSpy).toHaveBeenCalledWith(
        expect.stringContaining("No se pudo eliminar el archivo del storage")
      );
      expect(mockCourseRepository.deleteResource).toHaveBeenCalledWith(
        "resource-123"
      );

      consoleWarnSpy.mockRestore();
    });
  });

  describe("when the resource does not have a file", () => {
    it("removes only the record", async () => {
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
      expect(mockCourseRepository.deleteResource).toHaveBeenCalledWith(
        "resource-123"
      );
    });
  });
});
