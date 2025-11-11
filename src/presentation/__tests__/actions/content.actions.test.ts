const topicUseCaseMocks = {
  getTopicsExecute: jest.fn(),
  createTopicExecute: jest.fn(),
  updateTopicExecute: jest.fn(),
  deleteTopicExecute: jest.fn(),
};

const resourceUseCaseMocks = {
  getResourcesExecute: jest.fn(),
  createResourceExecute: jest.fn(),
  updateResourceExecute: jest.fn(),
  deleteResourceExecute: jest.fn(),
};

const mockGetTopicsExecute = topicUseCaseMocks.getTopicsExecute;
const mockCreateTopicExecute = topicUseCaseMocks.createTopicExecute;
const mockUpdateTopicExecute = topicUseCaseMocks.updateTopicExecute;
const mockDeleteTopicExecute = topicUseCaseMocks.deleteTopicExecute;

const mockGetResourcesExecute = resourceUseCaseMocks.getResourcesExecute;
const mockCreateResourceExecute = resourceUseCaseMocks.createResourceExecute;
const mockUpdateResourceExecute = resourceUseCaseMocks.updateResourceExecute;
const mockDeleteResourceExecute = resourceUseCaseMocks.deleteResourceExecute;

jest.mock("next/cache", () => ({
  revalidatePath: jest.fn(),
}));

jest.mock("@/src/application/use-cases/topic", () => {
  const actual = jest.requireActual("@/src/application/use-cases/topic");

  return {
    ...actual,
    GetTopicsByCourseUseCase: jest.fn(() => ({
      execute: topicUseCaseMocks.getTopicsExecute,
    })),
    CreateTopicUseCase: jest.fn(() => ({
      execute: topicUseCaseMocks.createTopicExecute,
    })),
    UpdateTopicUseCase: jest.fn(() => ({
      execute: topicUseCaseMocks.updateTopicExecute,
    })),
    DeleteTopicUseCase: jest.fn(() => ({
      execute: topicUseCaseMocks.deleteTopicExecute,
    })),
  };
});

jest.mock("@/src/application/use-cases/resource", () => {
  const actual = jest.requireActual("@/src/application/use-cases/resource");

  return {
    ...actual,
    GetResourcesByTopicUseCase: jest.fn(() => ({
      execute: resourceUseCaseMocks.getResourcesExecute,
    })),
    CreateResourceUseCase: jest.fn(() => ({
      execute: resourceUseCaseMocks.createResourceExecute,
    })),
    UpdateResourceUseCase: jest.fn(() => ({
      execute: resourceUseCaseMocks.updateResourceExecute,
    })),
    DeleteResourceUseCase: jest.fn(() => ({
      execute: resourceUseCaseMocks.deleteResourceExecute,
    })),
  };
});

jest.mock("@/src/infrastructure/repositories/SupabaseCourseRepository", () => {
  const reorderTopics = jest.fn();
  const reorderResources = jest.fn();

  return {
    SupabaseCourseRepository: jest.fn(() => ({
      reorderTopics,
      reorderResources,
    })),
    __mockCourseRepository: {
      reorderTopics,
      reorderResources,
    },
  };
});

const { __mockCourseRepository: courseRepositoryMocks } = jest.requireMock(
  "@/src/infrastructure/repositories/SupabaseCourseRepository"
) as {
  __mockCourseRepository: {
    reorderTopics: jest.Mock;
    reorderResources: jest.Mock;
  };
};

const mockReorderTopics = courseRepositoryMocks.reorderTopics;
const mockReorderResources = courseRepositoryMocks.reorderResources;

jest.mock("@/src/infrastructure/repositories/SupabaseAuthRepository", () => ({
  SupabaseAuthRepository: jest.fn(() => ({})),
}));

jest.mock(
  "@/src/infrastructure/repositories/SupabaseProfileRepository",
  () => ({
    SupabaseProfileRepository: jest.fn(() => ({})),
  })
);

import { revalidatePath } from "next/cache";

import {
  createResource,
  createTopic,
  deleteResource,
  deleteTopic,
  getResourcesByTopic,
  getTopicsByCourse,
  getTopicsWithResourcesByCourse,
  reorderResources,
  reorderTopics,
  updateResource,
  updateTopic,
} from "@/src/presentation/actions/content.actions";

const revalidatePathMock = revalidatePath as jest.MockedFunction<
  typeof revalidatePath
>;

const revalidateTargets = [
  "/dashboard/admin",
  "/dashboard/teacher",
  "/dashboard/student",
];

describe("content.actions", () => {
  beforeEach(() => {
    revalidatePathMock.mockReset();
    mockGetTopicsExecute.mockReset();
    mockCreateTopicExecute.mockReset();
    mockUpdateTopicExecute.mockReset();
    mockDeleteTopicExecute.mockReset();
    mockGetResourcesExecute.mockReset();
    mockCreateResourceExecute.mockReset();
    mockUpdateResourceExecute.mockReset();
    mockDeleteResourceExecute.mockReset();
    mockReorderTopics.mockReset();
    mockReorderResources.mockReset();
  });

  describe("getTopicsByCourse", () => {
    it("returns normalized topics when use case succeeds", async () => {
      const createdAt = new Date("2024-01-01T00:00:00Z");
      const updatedAt = new Date("2024-01-02T00:00:00Z");

      mockGetTopicsExecute.mockResolvedValue({
        success: true,
        topics: [
          {
            id: "topic-1",
            courseVersionId: "version-1",
            title: "Introducción",
            description: "Descripción",
            orderIndex: 1,
            createdAt,
            updatedAt,
          },
        ],
        courseVersionId: "version-1",
      });

      const result = await getTopicsByCourse("course-1", {
        courseVersionId: "version-1",
      });

      expect(mockGetTopicsExecute).toHaveBeenCalledWith("course-1", {
        courseVersionId: "version-1",
      });
      expect(result).toEqual({
        topics: [
          {
            id: "topic-1",
            courseId: "course-1",
            courseVersionId: "version-1",
            title: "Introducción",
            description: "Descripción",
            orderIndex: 1,
            createdAt: createdAt.toISOString(),
            updatedAt: updatedAt.toISOString(),
          },
        ],
        courseVersionId: "version-1",
      });
      expect(revalidatePathMock).not.toHaveBeenCalled();
    });

    it("returns an error when use case fails", async () => {
      mockGetTopicsExecute.mockResolvedValue({
        success: false,
        error: "Error al obtener tópicos",
      });

      const result = await getTopicsByCourse("course-1");

      expect(result).toEqual({ error: "Error al obtener tópicos" });
      expect(revalidatePathMock).not.toHaveBeenCalled();
    });
  });

  describe("getResourcesByTopic", () => {
    it("returns normalized resources and topic data", async () => {
      const createdAt = new Date("2024-02-01T00:00:00Z");
      const updatedAt = new Date("2024-02-02T00:00:00Z");

      mockGetResourcesExecute.mockResolvedValue({
        success: true,
        resources: [
          {
            id: "resource-1",
            topicId: "topic-1",
            title: "Video",
            description: "Video intro",
            resourceType: "VIDEO",
            fileUrl: "https://example.com/video.mp4",
            fileName: "video.mp4",
            fileSize: 1024,
            mimeType: "video/mp4",
            externalUrl: null,
            orderIndex: 1,
            createdAt,
            updatedAt,
          },
        ],
        topic: {
          id: "topic-1",
          courseVersionId: "version-1",
          title: "Introducción",
          description: "Descripción",
          orderIndex: 1,
          createdAt,
          updatedAt,
        },
      });

      const result = await getResourcesByTopic("topic-1");

      expect(mockGetResourcesExecute).toHaveBeenCalledWith("topic-1");
      expect(result).toEqual({
        resources: [
          {
            id: "resource-1",
            topicId: "topic-1",
            title: "Video",
            description: "Video intro",
            resourceType: "VIDEO",
            fileUrl: "https://example.com/video.mp4",
            fileName: "video.mp4",
            fileSize: 1024,
            mimeType: "video/mp4",
            externalUrl: null,
            orderIndex: 1,
            createdAt: createdAt.toISOString(),
            updatedAt: updatedAt.toISOString(),
          },
        ],
        topic: {
          id: "topic-1",
          courseVersionId: "version-1",
          title: "Introducción",
          description: "Descripción",
          orderIndex: 1,
          createdAt: createdAt.toISOString(),
          updatedAt: updatedAt.toISOString(),
        },
      });
      expect(revalidatePathMock).not.toHaveBeenCalled();
    });

    it("returns an error when use case fails", async () => {
      mockGetResourcesExecute.mockResolvedValue({
        success: false,
        error: "Error al obtener recursos",
      });

      const result = await getResourcesByTopic("topic-1");

      expect(result).toEqual({ error: "Error al obtener recursos" });
    });
  });

  describe("createTopic", () => {
    it("revalidates dashboard routes on success", async () => {
      mockCreateTopicExecute.mockResolvedValue({ success: true });

      const result = await createTopic({
        courseId: "course-1",
        title: "Nuevo tópico",
      });

      expect(result).toEqual({ success: true });
      expect(revalidatePathMock).toHaveBeenCalledTimes(3);
      expect(revalidatePathMock.mock.calls.flat()).toEqual(revalidateTargets);
    });

    it("returns error without revalidation on failure", async () => {
      mockCreateTopicExecute.mockResolvedValue({
        success: false,
        error: "No se pudo crear",
      });

      const result = await createTopic({
        courseId: "course-1",
        title: "Nuevo tópico",
      });

      expect(result).toEqual({ error: "No se pudo crear" });
      expect(revalidatePathMock).not.toHaveBeenCalled();
    });
  });

  describe("updateTopic", () => {
    it("returns success and revalidates routes", async () => {
      mockUpdateTopicExecute.mockResolvedValue({ success: true });

      const result = await updateTopic("topic-1", { title: "Actualizado" });

      expect(result).toEqual({ success: true });
      expect(revalidatePathMock).toHaveBeenCalledTimes(3);
    });

    it("returns error when use case fails", async () => {
      mockUpdateTopicExecute.mockResolvedValue({
        success: false,
        error: "No se pudo actualizar",
      });

      const result = await updateTopic("topic-1", { title: "Actualizado" });

      expect(result).toEqual({ error: "No se pudo actualizar" });
      expect(revalidatePathMock).not.toHaveBeenCalled();
    });
  });

  describe("reorderTopics", () => {
    it("delegates to repository and revalidates on success", async () => {
      mockReorderTopics.mockResolvedValue(undefined);

      const updates = [
        { topicId: "topic-1", orderIndex: 1 },
        { topicId: "topic-2", orderIndex: 2 },
      ];

      const result = await reorderTopics("version-1", updates);

      expect(mockReorderTopics).toHaveBeenCalledWith("version-1", updates);
      expect(result).toEqual({ success: true });
      expect(revalidatePathMock).toHaveBeenCalledTimes(3);
    });

    it("returns error details when repository throws", async () => {
      mockReorderTopics.mockRejectedValue(new Error("No se pudo reordenar"));

      const result = await reorderTopics("version-1", []);

      expect(result).toEqual({ error: "No se pudo reordenar" });
      expect(revalidatePathMock).not.toHaveBeenCalled();
    });
  });

  describe("deleteTopic", () => {
    it("revalidates routes on successful deletion", async () => {
      mockDeleteTopicExecute.mockResolvedValue({ success: true });

      const result = await deleteTopic("topic-1");

      expect(result).toEqual({ success: true });
      expect(revalidatePathMock).toHaveBeenCalledTimes(3);
    });

    it("returns error without revalidation on failure", async () => {
      mockDeleteTopicExecute.mockResolvedValue({
        success: false,
        error: "No se pudo eliminar",
      });

      const result = await deleteTopic("topic-1");

      expect(result).toEqual({ error: "No se pudo eliminar" });
      expect(revalidatePathMock).not.toHaveBeenCalled();
    });
  });

  describe("createResource", () => {
    it("revalidates routes on success", async () => {
      mockCreateResourceExecute.mockResolvedValue({ success: true });

      const result = await createResource({
        topicId: "topic-1",
        title: "Nuevo recurso",
        resourceType: "VIDEO",
      } as any);

      expect(result).toEqual({ success: true });
      expect(revalidatePathMock).toHaveBeenCalledTimes(3);
    });

    it("returns error when use case fails", async () => {
      mockCreateResourceExecute.mockResolvedValue({
        success: false,
        error: "No se pudo crear recurso",
      });

      const result = await createResource({
        topicId: "topic-1",
        title: "Nuevo recurso",
        resourceType: "VIDEO",
      } as any);

      expect(result).toEqual({ error: "No se pudo crear recurso" });
      expect(revalidatePathMock).not.toHaveBeenCalled();
    });
  });

  describe("updateResource", () => {
    it("returns success and revalidates routes", async () => {
      mockUpdateResourceExecute.mockResolvedValue({ success: true });

      const result = await updateResource("resource-1", {
        title: "Actualizado",
      } as any);

      expect(result).toEqual({ success: true });
      expect(revalidatePathMock).toHaveBeenCalledTimes(3);
    });

    it("returns error when use case fails", async () => {
      mockUpdateResourceExecute.mockResolvedValue({
        success: false,
        error: "No se pudo actualizar recurso",
      });

      const result = await updateResource("resource-1", {
        title: "Actualizado",
      } as any);

      expect(result).toEqual({ error: "No se pudo actualizar recurso" });
      expect(revalidatePathMock).not.toHaveBeenCalled();
    });
  });

  describe("reorderResources", () => {
    it("delegates to repository and revalidates on success", async () => {
      mockReorderResources.mockResolvedValue(undefined);

      const updates = [{ resourceId: "resource-1", orderIndex: 1 }];

      const result = await reorderResources("topic-1", updates);

      expect(mockReorderResources).toHaveBeenCalledWith("topic-1", updates);
      expect(result).toEqual({ success: true });
      expect(revalidatePathMock).toHaveBeenCalledTimes(3);
    });

    it("returns error details when repository throws", async () => {
      mockReorderResources.mockRejectedValue(
        new Error("No se pudo reordenar recursos")
      );

      const result = await reorderResources("topic-1", []);

      expect(result).toEqual({ error: "No se pudo reordenar recursos" });
      expect(revalidatePathMock).not.toHaveBeenCalled();
    });
  });

  describe("deleteResource", () => {
    it("revalidates routes on successful deletion", async () => {
      mockDeleteResourceExecute.mockResolvedValue({ success: true });

      const result = await deleteResource("resource-1");

      expect(result).toEqual({ success: true });
      expect(revalidatePathMock).toHaveBeenCalledTimes(3);
    });

    it("returns error without revalidation on failure", async () => {
      mockDeleteResourceExecute.mockResolvedValue({
        success: false,
        error: "No se pudo eliminar recurso",
      });

      const result = await deleteResource("resource-1");

      expect(result).toEqual({ error: "No se pudo eliminar recurso" });
      expect(revalidatePathMock).not.toHaveBeenCalled();
    });
  });

  describe("getTopicsWithResourcesByCourse", () => {
    it("combines topics and resources when both requests succeed", async () => {
      const topicCreatedAt = new Date("2024-03-01T00:00:00Z");
      const topicUpdatedAt = new Date("2024-03-01T01:00:00Z");
      const resourceCreatedAt = new Date("2024-03-02T00:00:00Z");
      const resourceUpdatedAt = new Date("2024-03-02T01:00:00Z");

      mockGetTopicsExecute.mockResolvedValue({
        success: true,
        topics: [
          {
            id: "topic-1",
            courseVersionId: "version-1",
            title: "Tema 1",
            description: "Descripción",
            orderIndex: 1,
            createdAt: topicCreatedAt,
            updatedAt: topicUpdatedAt,
          },
        ],
        courseVersionId: "version-1",
      });

      mockGetResourcesExecute.mockResolvedValue({
        success: true,
        resources: [
          {
            id: "resource-1",
            topicId: "topic-1",
            title: "Recurso",
            description: null,
            resourceType: "VIDEO",
            fileUrl: null,
            fileName: null,
            fileSize: null,
            mimeType: null,
            externalUrl: "https://example.com",
            orderIndex: 1,
            createdAt: resourceCreatedAt,
            updatedAt: resourceUpdatedAt,
          },
        ],
      });

      const result = await getTopicsWithResourcesByCourse("course-1");

      expect(mockGetTopicsExecute).toHaveBeenCalledTimes(1);
      expect(mockGetResourcesExecute).toHaveBeenCalledWith("topic-1");
      expect(result).toEqual({
        topics: [
          {
            id: "topic-1",
            courseId: "course-1",
            courseVersionId: "version-1",
            title: "Tema 1",
            description: "Descripción",
            orderIndex: 1,
            createdAt: topicCreatedAt.toISOString(),
            updatedAt: topicUpdatedAt.toISOString(),
            resources: [
              {
                id: "resource-1",
                topicId: "topic-1",
                title: "Recurso",
                description: null,
                resourceType: "VIDEO",
                fileUrl: null,
                fileName: null,
                fileSize: null,
                mimeType: null,
                externalUrl: "https://example.com",
                orderIndex: 1,
                createdAt: resourceCreatedAt.toISOString(),
                updatedAt: resourceUpdatedAt.toISOString(),
              },
            ],
          },
        ],
        courseVersionId: "version-1",
      });
    });

    it("propagates error when topic retrieval fails", async () => {
      mockGetTopicsExecute.mockResolvedValue({
        success: false,
        error: "No se pudieron cargar los tópicos",
      });

      const result = await getTopicsWithResourcesByCourse("course-1");

      expect(result).toEqual({ error: "No se pudieron cargar los tópicos" });
      expect(mockGetResourcesExecute).not.toHaveBeenCalled();
    });

    it("returns topics with empty resource arrays when resource fetch fails", async () => {
      const createdAt = new Date("2024-04-01T00:00:00Z");
      const updatedAt = new Date("2024-04-01T00:30:00Z");

      mockGetTopicsExecute.mockResolvedValue({
        success: true,
        topics: [
          {
            id: "topic-1",
            courseVersionId: "version-9",
            title: "Tema",
            description: null,
            orderIndex: 1,
            createdAt,
            updatedAt,
          },
        ],
        courseVersionId: "version-9",
      });

      mockGetResourcesExecute.mockResolvedValue({
        error: "falló",
      });

      const result = await getTopicsWithResourcesByCourse("course-1");

      expect(result).toEqual({
        topics: [
          {
            id: "topic-1",
            courseId: "course-1",
            courseVersionId: "version-9",
            title: "Tema",
            description: null,
            orderIndex: 1,
            createdAt: createdAt.toISOString(),
            updatedAt: updatedAt.toISOString(),
            resources: [],
          },
        ],
        courseVersionId: "version-9",
      });
    });
  });
});
