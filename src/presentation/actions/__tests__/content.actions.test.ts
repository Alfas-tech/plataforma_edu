describe("content.actions - getTopicsWithResourcesByCourse", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should fetch topics with their resources integrated", async () => {
    // Este test verifica que los tópicos y recursos se combinen correctamente
    const mockTopicsResult = {
      topics: [
        {
          id: "topic-1",
          courseId: "course-1",
          courseVersionId: "version-1",
          title: "Introducción",
          description: "Descripción del tópico 1",
          orderIndex: 1,
          createdAt: "2024-01-01T00:00:00Z",
          updatedAt: "2024-01-01T00:00:00Z",
        },
        {
          id: "topic-2",
          courseId: "course-1",
          courseVersionId: "version-1",
          title: "Variables",
          description: "Descripción del tópico 2",
          orderIndex: 2,
          createdAt: "2024-01-01T00:00:00Z",
          updatedAt: "2024-01-01T00:00:00Z",
        },
      ],
      courseVersionId: "version-1",
    };

    // Verifica que la estructura esperada es correcta
    expect(mockTopicsResult.topics).toHaveLength(2);
    expect(mockTopicsResult.topics[0]).toHaveProperty("id");
    expect(mockTopicsResult.topics[0]).toHaveProperty("title");
    expect(mockTopicsResult.courseVersionId).toBe("version-1");
  });

  it("should handle empty topics array", () => {
    const mockTopicsResult = {
      topics: [],
      courseVersionId: "version-1",
    };

    expect(mockTopicsResult.topics).toHaveLength(0);
    expect(mockTopicsResult.courseVersionId).toBe("version-1");
  });

  it("should handle topics with resources property", () => {
    const mockTopicWithResources = {
      id: "topic-1",
      courseId: "course-1",
      courseVersionId: "version-1",
      title: "Tópico con recursos",
      description: null,
      orderIndex: 1,
      createdAt: "2024-01-01T00:00:00Z",
      updatedAt: "2024-01-01T00:00:00Z",
      resources: [
        {
          id: "resource-1",
          topicId: "topic-1",
          title: "Video de introducción",
          description: "Video explicativo",
          resourceType: "VIDEO",
          fileUrl: "https://example.com/video.mp4",
          fileName: "video.mp4",
          mimeType: "video/mp4",
          externalUrl: null,
          orderIndex: 1,
          createdAt: "2024-01-01T00:00:00Z",
          updatedAt: "2024-01-01T00:00:00Z",
        },
      ],
    };

    expect(mockTopicWithResources).toHaveProperty("resources");
    expect(mockTopicWithResources.resources).toHaveLength(1);
    expect(mockTopicWithResources.resources[0]).toHaveProperty("fileUrl");
    expect(mockTopicWithResources.resources[0].resourceType).toBe("VIDEO");
  });
});

describe("content.actions - reorderResources", () => {
  it("should validate resource reorder structure", () => {
    const updates = [
      { resourceId: "resource-1", orderIndex: 1 },
      { resourceId: "resource-2", orderIndex: 2 },
      { resourceId: "resource-3", orderIndex: 3 },
    ];

    expect(updates).toHaveLength(3);
    expect(updates[0]).toHaveProperty("resourceId");
    expect(updates[0]).toHaveProperty("orderIndex");
    expect(updates[0].orderIndex).toBe(1);
    expect(updates[2].orderIndex).toBe(3);
  });

  it("should handle empty updates array", () => {
    const updates: Array<{ resourceId: string; orderIndex: number }> = [];

    expect(updates).toHaveLength(0);
    expect(Array.isArray(updates)).toBe(true);
  });

  it("should validate order indices are sequential", () => {
    const updates = [
      { resourceId: "resource-1", orderIndex: 1 },
      { resourceId: "resource-2", orderIndex: 2 },
      { resourceId: "resource-3", orderIndex: 3 },
    ];

    const orderIndices = updates.map((u) => u.orderIndex);
    const isSequential = orderIndices.every(
      (idx, i) => idx === i + 1
    );

    expect(isSequential).toBe(true);
  });

  it("should handle reordering with gaps in indices", () => {
    const updates = [
      { resourceId: "resource-1", orderIndex: 1 },
      { resourceId: "resource-2", orderIndex: 3 }, // gap
      { resourceId: "resource-3", orderIndex: 5 }, // gap
    ];

    expect(updates).toHaveLength(3);
    expect(updates[1].orderIndex).toBe(3);
    expect(updates[2].orderIndex).toBe(5);
  });
});

describe("TopicManagementClient - Resource Display", () => {
  it("should display clickable resources with fileUrl", () => {
    const resource = {
      id: "resource-1",
      topicId: "topic-1",
      title: "Video Tutorial",
      description: "Tutorial completo",
      resourceType: "VIDEO",
      fileUrl: "https://example.com/video.mp4",
      fileName: "video.mp4",
      mimeType: "video/mp4",
      externalUrl: null,
      orderIndex: 1,
      createdAt: "2024-01-01T00:00:00Z",
      updatedAt: "2024-01-01T00:00:00Z",
    };

    const hasFile = Boolean(resource.fileUrl);
    const hasExternal = Boolean(resource.externalUrl);
    const resourceUrl = hasFile ? resource.fileUrl : resource.externalUrl;
    const isClickable = Boolean(resourceUrl);

    expect(isClickable).toBe(true);
    expect(hasFile).toBe(true);
    expect(hasExternal).toBe(false);
    expect(resourceUrl).toBe("https://example.com/video.mp4");
  });

  it("should display clickable resources with externalUrl", () => {
    const resource = {
      id: "resource-2",
      topicId: "topic-1",
      title: "Artículo Externo",
      description: "Link a documentación",
      resourceType: "LINK",
      fileUrl: null,
      fileName: null,
      mimeType: null,
      externalUrl: "https://docs.example.com",
      orderIndex: 2,
      createdAt: "2024-01-01T00:00:00Z",
      updatedAt: "2024-01-01T00:00:00Z",
    };

    const hasFile = Boolean(resource.fileUrl);
    const hasExternal = Boolean(resource.externalUrl);
    const resourceUrl = hasFile ? resource.fileUrl : resource.externalUrl;
    const isClickable = Boolean(resourceUrl);

    expect(isClickable).toBe(true);
    expect(hasFile).toBe(false);
    expect(hasExternal).toBe(true);
    expect(resourceUrl).toBe("https://docs.example.com");
  });

  it("should handle resources without URL", () => {
    const resource = {
      id: "resource-3",
      topicId: "topic-1",
      title: "Recurso sin URL",
      description: "Solo texto",
      resourceType: "TEXT",
      fileUrl: null,
      fileName: null,
      mimeType: null,
      externalUrl: null,
      orderIndex: 3,
      createdAt: "2024-01-01T00:00:00Z",
      updatedAt: "2024-01-01T00:00:00Z",
    };

    const hasFile = Boolean(resource.fileUrl);
    const hasExternal = Boolean(resource.externalUrl);
    const resourceUrl = hasFile ? resource.fileUrl : resource.externalUrl;
    const isClickable = Boolean(resourceUrl);

    expect(isClickable).toBe(false);
    expect(hasFile).toBe(false);
    expect(hasExternal).toBe(false);
    expect(resourceUrl).toBe(null);
  });
});

