import { SupabaseStudentRepository } from "@/src/infrastructure/repositories/SupabaseStudentRepository";
import { createClient } from "@/src/infrastructure/supabase/server";

jest.mock("@/src/infrastructure/supabase/server", () => ({
  createClient: jest.fn(),
}));

const mockCreateClient = createClient as jest.Mock;

type QueryResult<T> = {
  data: T;
  error: Record<string, unknown> | null;
};

const createSingleQuery = <T>(result: QueryResult<T>) => {
  const single = jest.fn().mockResolvedValue(result);
  const eq = jest.fn().mockReturnValue({ single });
  const select = jest.fn().mockReturnValue({ eq });

  return { select };
};

const createTopicsQuery = (result: QueryResult<any[]>) => {
  const order = jest.fn().mockResolvedValue(result);
  const eq = jest.fn().mockReturnValue({ order });
  const select = jest.fn().mockReturnValue({ eq });

  return { select };
};

const createResourcesQuery = (result: QueryResult<any[]>) => {
  const order = jest.fn().mockResolvedValue(result);
  const inFilter = jest.fn().mockReturnValue({ order });
  const select = jest.fn().mockReturnValue({ in: inFilter });

  return { select };
};

const createTopicProgressQuery = (result: QueryResult<any[]>) => {
  const promise = Promise.resolve(result);

  const awaitable: any = {
    in: jest.fn().mockReturnValue(Promise.resolve(result)),
    then: promise.then.bind(promise),
    catch: promise.catch.bind(promise),
    finally: promise.finally.bind(promise),
  };

  const eq = jest.fn().mockReturnValue(awaitable);
  const select = jest.fn().mockReturnValue({ eq });

  return { select };
};

const createSupabaseMock = (
  stubs: Record<string, () => Record<string, unknown>>
) => ({
  from: jest.fn().mockImplementation((table: string) => {
    const factory = stubs[table];
    if (!factory) {
      throw new Error(`Unexpected table: ${table}`);
    }
    return factory();
  }),
});

describe("SupabaseStudentRepository", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("getCourseWithTopicsAndResources", () => {
    const courseId = "course-123";
    const studentId = "student-456";

    it("returns course data with topics, resources, and progress", async () => {
      const courseRow = {
        id: courseId,
        name: "Python",
        description: "Learn Python",
        active_version_id: "version-1",
      };

      const versionRow = {
        id: "version-1",
        title: "Version 1",
        description: "Summary",
        status: "published",
      };

      const topicRows = [
        {
          id: "topic-1",
          course_version_id: "version-1",
          title: "Introduccion",
          description: "Overview",
          order_index: 1,
        },
      ];

      const resourceRows = [
        {
          id: "resource-1",
          topic_id: "topic-1",
          title: "Video",
          description: "Watch this",
          resource_type: "video",
          file_url: null,
          external_url: "https://example.com",
          order_index: 1,
        },
      ];

      const progressRows = [
        {
          student_id: studentId,
          topic_id: "topic-1",
          completed: true,
          completed_at: "2024-08-01T12:00:00.000Z",
        },
      ];

      mockCreateClient.mockReturnValue(
        createSupabaseMock({
          courses: () => createSingleQuery({ data: courseRow, error: null }),
          course_versions: () =>
            createSingleQuery({ data: versionRow, error: null }),
          course_topics: () =>
            createTopicsQuery({ data: topicRows, error: null }),
          course_resources: () =>
            createResourcesQuery({ data: resourceRows, error: null }),
          student_progress: () =>
            createTopicProgressQuery({ data: progressRows, error: null }),
        })
      );

      const repository = new SupabaseStudentRepository();
      const result = await repository.getCourseWithTopicsAndResources(
        courseId,
        studentId
      );

      expect(result.course.id).toBe(courseId);
      expect(result.version.id).toBe("version-1");
      expect(result.topics).toHaveLength(1);
      expect(result.topics[0].resources).toHaveLength(1);
      expect(result.progress).toHaveLength(1);
      expect(result.progress[0].topicId).toBe("topic-1");
    });

    it("throws when the course does not exist", async () => {
      mockCreateClient.mockReturnValue(
        createSupabaseMock({
          courses: () =>
            createSingleQuery({
              data: null,
              error: { message: "Course not found" },
            }),
        })
      );

      const repository = new SupabaseStudentRepository();

      await expect(
        repository.getCourseWithTopicsAndResources(courseId, studentId)
      ).rejects.toThrow("Course not found");
    });

    it("throws when the course has no active version", async () => {
      mockCreateClient.mockReturnValue(
        createSupabaseMock({
          courses: () =>
            createSingleQuery({
              data: {
                id: courseId,
                name: "Python",
                description: null,
                active_version_id: null,
              },
              error: null,
            }),
        })
      );

      const repository = new SupabaseStudentRepository();

      await expect(
        repository.getCourseWithTopicsAndResources(courseId, studentId)
      ).rejects.toThrow("El curso no tiene una versión activa");
    });
  });

  describe("getStudentTopicProgress", () => {
    const studentId = "student-456";

    it("returns topic progress records", async () => {
      const progressRows = [
        {
          student_id: studentId,
          topic_id: "topic-1",
          completed: true,
          completed_at: "2024-08-01T12:00:00.000Z",
        },
        {
          student_id: studentId,
          topic_id: "topic-2",
          completed: false,
          completed_at: null,
        },
      ];

      mockCreateClient.mockReturnValue(
        createSupabaseMock({
          student_progress: () =>
            createTopicProgressQuery({ data: progressRows, error: null }),
        })
      );

      const repository = new SupabaseStudentRepository();
      const result = await repository.getStudentTopicProgress(studentId);

      expect(result).toHaveLength(2);
      expect(result[0]).toMatchObject({
        studentId,
        topicId: "topic-1",
        completed: true,
      });
      expect(result[1].completed).toBe(false);
    });

    it("throws when the database query fails", async () => {
      mockCreateClient.mockReturnValue(
        createSupabaseMock({
          student_progress: () =>
            createTopicProgressQuery({
              data: [],
              error: { message: "Database error" },
            }),
        })
      );

      const repository = new SupabaseStudentRepository();

      await expect(
        repository.getStudentTopicProgress(studentId)
      ).rejects.toThrow("Database error");
    });
  });

  describe("markTopicComplete", () => {
    const topicId = "topic-123";
    const studentId = "student-456";

    it("inserts progress when record does not exist", async () => {
      const selectChain = jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: null,
              error: { code: "PGRST116" },
            }),
          }),
        }),
      });

      const insert = jest.fn().mockResolvedValue({ error: null });
      const update = jest.fn();

      mockCreateClient.mockReturnValue({
        from: jest.fn().mockImplementation((table: string) => {
          if (table !== "student_progress") {
            throw new Error(`Unexpected table: ${table}`);
          }
          return { select: selectChain, insert, update };
        }),
      });

      const repository = new SupabaseStudentRepository();
      const result = await repository.markTopicComplete(topicId, studentId);

      expect(result).toEqual({ success: true });
      expect(insert).toHaveBeenCalledWith(
        expect.objectContaining({
          student_id: studentId,
          topic_id: topicId,
          completed: true,
        })
      );
    });

    it("updates progress when record exists", async () => {
      const selectChain = jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: { id: "progress-1" },
              error: null,
            }),
          }),
        }),
      });

      const updateEq = jest.fn().mockResolvedValue({ error: null });
      const update = jest.fn().mockReturnValue({ eq: updateEq });

      mockCreateClient.mockReturnValue({
        from: jest.fn().mockImplementation((table: string) => {
          if (table !== "student_progress") {
            throw new Error(`Unexpected table: ${table}`);
          }
          return { select: selectChain, insert: jest.fn(), update };
        }),
      });

      const repository = new SupabaseStudentRepository();
      const result = await repository.markTopicComplete(topicId, studentId);

      expect(result.success).toBe(true);
      expect(update).toHaveBeenCalledTimes(1);
      expect(updateEq).toHaveBeenCalledWith("id", "progress-1");
    });

    it("returns an error when insert fails", async () => {
      const selectChain = jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: null,
              error: { code: "PGRST116" },
            }),
          }),
        }),
      });

      const insert = jest.fn().mockResolvedValue({
        error: { message: "Insert failed" },
      });

      mockCreateClient.mockReturnValue({
        from: jest.fn().mockImplementation((table: string) => {
          if (table !== "student_progress") {
            throw new Error(`Unexpected table: ${table}`);
          }
          return { select: selectChain, insert, update: jest.fn() };
        }),
      });

      const repository = new SupabaseStudentRepository();
      const result = await repository.markTopicComplete(topicId, studentId);

      expect(result).toEqual({ success: false, error: "Insert failed" });
    });
  });

  describe("markTopicIncomplete", () => {
    const topicId = "topic-123";
    const studentId = "student-456";

    it("marks a topic as incomplete", async () => {
      const finalEq = jest.fn().mockResolvedValue({ error: null });
      const firstEq = jest.fn().mockReturnValue({ eq: finalEq });
      const update = jest.fn().mockReturnValue({ eq: firstEq });

      mockCreateClient.mockReturnValue({
        from: jest.fn().mockImplementation((table: string) => {
          if (table !== "student_progress") {
            throw new Error(`Unexpected table: ${table}`);
          }
          return { update };
        }),
      });

      const repository = new SupabaseStudentRepository();
      const result = await repository.markTopicIncomplete(topicId, studentId);

      expect(result).toEqual({ success: true });
      expect(update).toHaveBeenCalledWith(
        expect.objectContaining({ completed: false })
      );
    });

    it("returns an error when the update fails", async () => {
      const finalEq = jest.fn().mockResolvedValue({
        error: { message: "Update failed" },
      });
      const firstEq = jest.fn().mockReturnValue({ eq: finalEq });
      const update = jest.fn().mockReturnValue({ eq: firstEq });

      mockCreateClient.mockReturnValue({
        from: jest.fn().mockImplementation((table: string) => {
          if (table !== "student_progress") {
            throw new Error(`Unexpected table: ${table}`);
          }
          return { update };
        }),
      });

      const repository = new SupabaseStudentRepository();
      const result = await repository.markTopicIncomplete(topicId, studentId);

      expect(result).toEqual({ success: false, error: "Update failed" });
    });
  });
});
