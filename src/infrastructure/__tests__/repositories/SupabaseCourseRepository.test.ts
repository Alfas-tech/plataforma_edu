import { SupabaseCourseRepository } from "@/src/infrastructure/repositories/SupabaseCourseRepository";
import { createClient } from "@/src/infrastructure/supabase/server";
import { CourseEntity } from "@/src/core/entities/Course.entity";
import { CourseTopicEntity } from "@/src/core/entities/CourseTopic.entity";
import { CourseResourceEntity } from "@/src/core/entities/CourseResource.entity";
import type {
  CourseData,
  CourseVersionData,
  TopicData,
  ResourceData,
} from "@/src/core/types/course.types";

jest.mock("@/src/infrastructure/supabase/server", () => ({
  createClient: jest.fn(),
}));

describe("SupabaseCourseRepository", () => {
  let repository: SupabaseCourseRepository;
  let mockSupabase: any;

  const success = <T>(data: T) => ({ data, error: null });
  const failure = (message: string) => ({
    data: null,
    error: { message },
  });

  const createChainableBuilder = () => {
    const builder: any = {
      __result: success(null),
      select: jest.fn().mockImplementation(() => builder),
      insert: jest.fn().mockImplementation(() => builder),
      update: jest.fn().mockImplementation(() => builder),
      delete: jest.fn().mockImplementation(() => builder),
      eq: jest.fn().mockImplementation(() => builder),
      neq: jest.fn().mockImplementation(() => builder),
      in: jest.fn().mockImplementation(() => builder),
      not: jest.fn().mockImplementation(() => builder),
      order: jest.fn().mockImplementation(() => builder),
      limit: jest
        .fn()
        .mockImplementation(() => Promise.resolve(builder.__result)),
      single: jest
        .fn()
        .mockImplementation(() => Promise.resolve(builder.__result)),
      maybeSingle: jest
        .fn()
        .mockImplementation(() => Promise.resolve(builder.__result)),
      then: (resolve: any, reject?: any) =>
        Promise.resolve(builder.__result).then(resolve, reject),
      setResult: (result: any) => {
        builder.__result = result;
        return builder;
      },
    };

    return builder;
  };

  const createCourseRow = (
    overrides: Partial<CourseData> = {}
  ): CourseData => ({
    id: "course-1",
    name: "Course 1",
    description: "Description",
    active_version_id: "version-1",
    created_by: "admin-1",
    created_at: "2024-01-01T00:00:00.000Z",
    updated_at: "2024-01-01T00:00:00.000Z",
    ...overrides,
  });

  const createVersionRow = (
    overrides: Partial<CourseVersionData> = {}
  ): CourseVersionData => ({
    id: "version-1",
    course_id: "course-1",
    version_number: 1,
    title: "v1.0.0",
    description: "Initial version",
    content: null,
    status: "active",
    start_date: null,
    end_date: null,
    published_at: "2024-01-01T00:00:00.000Z",
    published_by: "admin-1",
    created_at: "2024-01-01T00:00:00.000Z",
    updated_at: "2024-01-01T00:00:00.000Z",
    ...overrides,
  });

  const createTopicRow = (
    overrides: Partial<TopicData> = {}
  ): TopicData => ({
    id: "topic-1",
    course_version_id: "version-1",
    title: "Topic 1",
    description: "Topic description",
    order_index: 1,
    created_at: "2024-01-01T00:00:00.000Z",
    updated_at: "2024-01-01T00:00:00.000Z",
    ...overrides,
  });

  const createResourceRow = (
    overrides: Partial<ResourceData> = {}
  ): ResourceData => ({
    id: "resource-1",
    topic_id: "topic-1",
    title: "Resource 1",
    description: "Resource description",
    resource_type: "pdf",
    file_url: "https://example.com/file.pdf",
    file_name: "file.pdf",
    file_size: 1024,
    mime_type: "application/pdf",
    external_url: null,
    order_index: 1,
    created_at: "2024-01-01T00:00:00.000Z",
    updated_at: "2024-01-01T00:00:00.000Z",
    ...overrides,
  });

  beforeEach(() => {
    mockSupabase = {
      from: jest.fn().mockImplementation(() => {
        throw new Error("Unexpected table call");
      }),
      rpc: jest.fn(),
      auth: {
        getUser: jest
          .fn()
          .mockResolvedValue(success({ user: { id: "user-123" } })),
      },
    };

    (createClient as jest.Mock).mockReturnValue(mockSupabase);
    repository = new SupabaseCourseRepository();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("getAllCourses", () => {
    it("returns mapped courses", async () => {
      const courseRow = createCourseRow();
      const versionRow = createVersionRow();

      const coursesBuilder = createChainableBuilder();
      coursesBuilder.select.mockReturnValue(coursesBuilder);
      coursesBuilder.order.mockImplementation(() =>
        coursesBuilder.setResult(success([courseRow]))
      );

      const versionsBuilder = createChainableBuilder();
      versionsBuilder.select.mockReturnValue(versionsBuilder);
      versionsBuilder.in.mockImplementation(() =>
        versionsBuilder.setResult(success([versionRow]))
      );

      const branchesBuilder = createChainableBuilder();
      branchesBuilder.select.mockReturnValue(branchesBuilder);
      branchesBuilder.in.mockImplementation(() =>
        branchesBuilder.setResult(success([]))
      );

      const mergeRequestsBuilder = createChainableBuilder();
      mergeRequestsBuilder.select.mockReturnValue(mergeRequestsBuilder);
      mergeRequestsBuilder.in.mockImplementation(() =>
        mergeRequestsBuilder.setResult(success([]))
      );

      mockSupabase.from
        .mockImplementationOnce((table: string) => {
          expect(table).toBe("courses");
          return coursesBuilder;
        })
        .mockImplementationOnce((table: string) => {
          expect(table).toBe("course_versions");
          return versionsBuilder;
        })
        .mockImplementationOnce((table: string) => {
          expect(table).toBe("course_branches");
          return branchesBuilder;
        })
        .mockImplementationOnce((table: string) => {
          expect(table).toBe("course_merge_requests");
          return mergeRequestsBuilder;
        });

      const result = await repository.getAllCourses();

      expect(result).toHaveLength(1);
      expect(result[0]).toBeInstanceOf(CourseEntity);
      expect(result[0].activeVersion?.id).toBe("version-1");
    });

    it("throws when supabase returns an error", async () => {
      const coursesBuilder = createChainableBuilder();
      coursesBuilder.select.mockReturnValue(coursesBuilder);
      coursesBuilder.order.mockImplementation(() =>
        coursesBuilder.setResult(failure("Database error"))
      );

      mockSupabase.from.mockImplementationOnce(() => coursesBuilder);

      const consoleSpy = jest.spyOn(console, "error").mockImplementation();

      await expect(repository.getAllCourses()).rejects.toThrow(
        "Database error"
      );

      consoleSpy.mockRestore();
    });
  });

  describe("getCourseById", () => {
    it("returns a course when found", async () => {
      const courseRow = createCourseRow();
      const versionRow = createVersionRow();

      const coursesBuilder = createChainableBuilder();
      coursesBuilder.select.mockReturnValue(coursesBuilder);
      coursesBuilder.eq.mockImplementation((column: string, value: string) => {
        expect(column).toBe("id");
        expect(value).toBe(courseRow.id);
        return coursesBuilder.setResult(success(courseRow));
      });

      const versionsBuilder = createChainableBuilder();
      versionsBuilder.select.mockReturnValue(versionsBuilder);
      versionsBuilder.in.mockReturnValue(versionsBuilder);
      versionsBuilder.order.mockImplementation(() =>
        versionsBuilder.setResult(success([versionRow]))
      );

      mockSupabase.from
        .mockImplementationOnce((table: string) => {
          expect(table).toBe("courses");
          return coursesBuilder;
        })
        .mockImplementationOnce((table: string) => {
          expect(table).toBe("course_versions");
          return versionsBuilder;
        });

      const course = await repository.getCourseById(courseRow.id);

      expect(course).toBeInstanceOf(CourseEntity);
      expect(course?.id).toBe(courseRow.id);
      expect(course?.activeVersion?.title).toBe("v1.0.0");
    });

    it("returns null when course is not found", async () => {
      const coursesBuilder = createChainableBuilder();
      coursesBuilder.select.mockReturnValue(coursesBuilder);
      coursesBuilder.eq.mockImplementation(() =>
        coursesBuilder.setResult(success(null))
      );

      mockSupabase.from.mockImplementationOnce(() => coursesBuilder);

      const course = await repository.getCourseById("missing-course");

      expect(course).toBeNull();
    });
  });

  describe("createCourse", () => {
    it("creates a course with initial version", async () => {
      const initialCourseRow = createCourseRow({
        id: "course-new",
        name: "New Course",
        active_version_id: null,
      });

      const createdVersionRow = createVersionRow({
        id: "version-new",
        course_id: "course-new",
      });

      const coursesInsertBuilder = createChainableBuilder();
      coursesInsertBuilder.insert = jest
        .fn()
        .mockImplementation((payload: Record<string, unknown>) => {
          expect(payload.name).toBe("New Course");
          return coursesInsertBuilder;
        });
      coursesInsertBuilder.select.mockReturnValue(coursesInsertBuilder);
      coursesInsertBuilder.single.mockImplementation(() =>
        Promise.resolve(success(initialCourseRow))
      );

      // Mock for getNextVersionNumber - returns null (no existing versions)
      const versionNumberBuilder = createChainableBuilder();
      versionNumberBuilder.select.mockReturnValue(versionNumberBuilder);
      versionNumberBuilder.eq.mockReturnValue(versionNumberBuilder);
      versionNumberBuilder.order.mockReturnValue(versionNumberBuilder);
      versionNumberBuilder.limit.mockReturnValue(versionNumberBuilder);
      versionNumberBuilder.maybeSingle.mockImplementation(() =>
        Promise.resolve(success(null))
      );

      const versionInsertBuilder = createChainableBuilder();
      versionInsertBuilder.insert = jest
        .fn()
        .mockReturnValue(versionInsertBuilder);
      versionInsertBuilder.select.mockReturnValue(versionInsertBuilder);
      versionInsertBuilder.single.mockImplementation(() =>
        Promise.resolve(success(createdVersionRow))
      );

      const coursesUpdateBuilder = createChainableBuilder();
      coursesUpdateBuilder.update.mockReturnValue(coursesUpdateBuilder);
      coursesUpdateBuilder.eq.mockImplementation(
        (column: string, value: string) => {
          expect(column).toBe("id");
          expect(value).toBe("course-new");
          return coursesUpdateBuilder.setResult(success(null));
        }
      );

      const versionsListBuilder = createChainableBuilder();
      versionsListBuilder.select.mockReturnValue(versionsListBuilder);
      versionsListBuilder.in.mockReturnValue(versionsListBuilder);
      versionsListBuilder.order.mockImplementation(() =>
        versionsListBuilder.setResult(success([createdVersionRow]))
      );

      mockSupabase.from
        .mockImplementationOnce((table: string) => {
          expect(table).toBe("courses");
          return coursesInsertBuilder;
        })
        .mockImplementationOnce((table: string) => {
          expect(table).toBe("course_versions");
          return versionNumberBuilder;
        })
        .mockImplementationOnce((table: string) => {
          expect(table).toBe("course_versions");
          return versionInsertBuilder;
        })
        .mockImplementationOnce((table: string) => {
          expect(table).toBe("courses");
          return coursesUpdateBuilder;
        })
        .mockImplementationOnce((table: string) => {
          expect(table).toBe("course_versions");
          return versionsListBuilder;
        });

      const course = await repository.createCourse({
        name: "New Course",
        description: "Description",
        draft: {
          title: "v1.0.0",
          description: "Initial version",
        },
      });

      expect(course).toBeInstanceOf(CourseEntity);
      expect(course.activeVersion?.id).toBe("version-new");
    });

    it("throws when initial version cannot be created", async () => {
      const initialCourseRow = createCourseRow({
        id: "course-new",
        active_version_id: null,
      });

      const coursesInsertBuilder = createChainableBuilder();
      coursesInsertBuilder.insert = jest
        .fn()
        .mockReturnValue(coursesInsertBuilder);
      coursesInsertBuilder.select.mockReturnValue(coursesInsertBuilder);
      coursesInsertBuilder.single.mockImplementation(() =>
        Promise.resolve(success(initialCourseRow))
      );

      // Mock for getNextVersionNumber
      const versionNumberBuilder = createChainableBuilder();
      versionNumberBuilder.select.mockReturnValue(versionNumberBuilder);
      versionNumberBuilder.eq.mockReturnValue(versionNumberBuilder);
      versionNumberBuilder.order.mockReturnValue(versionNumberBuilder);
      versionNumberBuilder.limit.mockReturnValue(versionNumberBuilder);
      versionNumberBuilder.maybeSingle.mockImplementation(() =>
        Promise.resolve(success(null))
      );

      const versionInsertBuilder = createChainableBuilder();
      versionInsertBuilder.insert = jest
        .fn()
        .mockReturnValue(versionInsertBuilder);
      versionInsertBuilder.select.mockReturnValue(versionInsertBuilder);
      versionInsertBuilder.single.mockImplementation(() =>
        Promise.resolve(failure("version failed"))
      );

      mockSupabase.from
        .mockImplementationOnce(() => coursesInsertBuilder)
        .mockImplementationOnce(() => versionNumberBuilder)
        .mockImplementationOnce(() => versionInsertBuilder);

      await expect(
        repository.createCourse({
          name: "New Course",
          draft: {
            title: "v1.0.0",
          },
        })
      ).rejects.toThrow("version failed");
    });
  });

  describe("updateCourse", () => {
    it("throws when course does not exist", async () => {
      const coursesBuilder = createChainableBuilder();
      coursesBuilder.select.mockReturnValue(coursesBuilder);
      coursesBuilder.eq.mockReturnValue(coursesBuilder);
      coursesBuilder.maybeSingle.mockImplementation(() =>
        coursesBuilder.setResult(success(null))
      );

      mockSupabase.from.mockImplementationOnce(() => coursesBuilder);

      await expect(
        repository.updateCourse("missing", { name: "New" })
      ).rejects.toThrow("Curso no encontrado");
    });
  });

  describe("deleteCourse", () => {
    it("removes course", async () => {
      const deleteBuilder = createChainableBuilder();
      deleteBuilder.delete.mockReturnValue(deleteBuilder);
      deleteBuilder.eq.mockImplementation(() =>
        deleteBuilder.setResult(success(null))
      );

      mockSupabase.from.mockImplementationOnce(() => deleteBuilder);

      await expect(repository.deleteCourse("course-1")).resolves.not.toThrow();
    });

    it("throws when deletion fails", async () => {
      const deleteBuilder = createChainableBuilder();
      deleteBuilder.delete.mockReturnValue(deleteBuilder);
      deleteBuilder.eq.mockImplementation(() =>
        deleteBuilder.setResult(failure("Cannot delete"))
      );

      mockSupabase.from.mockImplementationOnce(() => deleteBuilder);

      await expect(repository.deleteCourse("course-1")).rejects.toThrow(
        "Cannot delete"
      );
    });
  });

  describe("assignTeacherToVersion", () => {
    it("should throw error indicating to use groups instead", async () => {
      await expect(
        repository.assignTeacherToVersion("course-1", "version-1", "teacher-1")
      ).rejects.toThrow("Los profesores se asignan a grupos");
    });
  });

  describe("removeTeacherFromVersion", () => {
    it("should throw error indicating to use groups instead", async () => {
      await expect(
        repository.removeTeacherFromVersion(
          "course-1",
          "version-1",
          "teacher-1"
        )
      ).rejects.toThrow("Los profesores se asignan a grupos");
    });
  });

  describe("getCourseTeachers", () => {
    it("returns teacher ids across course versions", async () => {
      const versionsBuilder = createChainableBuilder();
      versionsBuilder.select.mockReturnValue(versionsBuilder);
      versionsBuilder.eq.mockImplementation((column: string, value: string) => {
        expect(column).toBe("course_id");
        expect(value).toBe("course-1");
        return versionsBuilder.setResult(
          success([{ id: "version-1" }, { id: "version-2" }])
        );
      });

      const assignmentsBuilder = createChainableBuilder();
      assignmentsBuilder.select.mockReturnValue(assignmentsBuilder);
      assignmentsBuilder.in.mockImplementation(
        (column: string, values: string[]) => {
          expect(column).toBe("course_version_id");
          expect(values).toEqual(["version-1", "version-2"]);
          return assignmentsBuilder.setResult(
            success([
              { teacher_id: "t1" },
              { teacher_id: "t2" },
              { teacher_id: "t1" },
            ])
          );
        }
      );

      mockSupabase.from
        .mockImplementationOnce((table: string) => {
          expect(table).toBe("course_versions");
          return versionsBuilder;
        })
        .mockImplementationOnce((table: string) => {
          expect(table).toBe("groups");
          return assignmentsBuilder;
        });

      const teachers = await repository.getCourseTeachers("course-1");

      expect(teachers).toEqual(["t1", "t2"]);
    });

    it("throws when version lookup fails", async () => {
      const versionsBuilder = createChainableBuilder();
      versionsBuilder.select.mockReturnValue(versionsBuilder);
      versionsBuilder.eq.mockImplementation(() =>
        versionsBuilder.setResult(failure("boom"))
      );

      mockSupabase.from.mockImplementationOnce(() => versionsBuilder);

      await expect(repository.getCourseTeachers("course-1")).rejects.toThrow(
        "boom"
      );
    });

    it("throws when assignments lookup fails", async () => {
      const versionsBuilder = createChainableBuilder();
      versionsBuilder.select.mockReturnValue(versionsBuilder);
      versionsBuilder.eq.mockImplementation(() =>
        versionsBuilder.setResult(success([{ id: "version-1" }]))
      );

      const assignmentsBuilder = createChainableBuilder();
      assignmentsBuilder.select.mockReturnValue(assignmentsBuilder);
      assignmentsBuilder.in.mockReturnValue(assignmentsBuilder);
      assignmentsBuilder.not = jest.fn().mockImplementation(() =>
        assignmentsBuilder.setResult(failure("boom"))
      );

      mockSupabase.from
        .mockImplementationOnce(() => versionsBuilder)
        .mockImplementationOnce(() => assignmentsBuilder);

      await expect(repository.getCourseTeachers("course-1")).rejects.toThrow(
        "boom"
      );
    });
  });

  // Remove getActiveCourse tests as the method no longer exists
  // describe("getActiveCourse", () => { ... });

  describe("getTeacherCourses", () => {
    it("returns courses assigned to teacher via groups", async () => {
      const courseRow = createCourseRow();
      const versionRow = createVersionRow();

      // Mock for groups query (step 1)
      const groupsBuilder = createChainableBuilder();
      groupsBuilder.select.mockReturnValue(groupsBuilder);
      groupsBuilder.eq.mockImplementation(() =>
        groupsBuilder.setResult(
          success([{ course_version_id: versionRow.id }])
        )
      );

      // Mock for course_versions query (step 2 - to get course_id from version_id)
      const versionsBuilder = createChainableBuilder();
      versionsBuilder.select.mockReturnValue(versionsBuilder);
      versionsBuilder.in.mockImplementation(() =>
        versionsBuilder.setResult(
          success([{ course_id: courseRow.id }])
        )
      );

      // Mock for courses query (step 3)
      const coursesBuilder = createChainableBuilder();
      coursesBuilder.select.mockReturnValue(coursesBuilder);
      coursesBuilder.in.mockImplementation(() =>
        coursesBuilder.setResult(success([courseRow]))
      );

      // Mock for course_versions query (step 4 - get versions for mapping)
      const versionsForMappingBuilder = createChainableBuilder();
      versionsForMappingBuilder.select.mockReturnValue(versionsForMappingBuilder);
      versionsForMappingBuilder.in.mockReturnValue(versionsForMappingBuilder);
      versionsForMappingBuilder.order.mockImplementation(() =>
        versionsForMappingBuilder.setResult(success([versionRow]))
      );

      // Setup mocks in the order they are called
      mockSupabase.from
        .mockImplementationOnce(() => groupsBuilder) // groups
        .mockImplementationOnce(() => versionsBuilder) // course_versions (to get course_id)
        .mockImplementationOnce(() => coursesBuilder) // courses
        .mockImplementationOnce(() => versionsForMappingBuilder); // course_versions (for mapping)

      const courses = await repository.getTeacherCourses("teacher-1");

      expect(courses).toHaveLength(1);
      expect(courses[0]).toBeInstanceOf(CourseEntity);
    });

    it("returns empty array when teacher has no groups", async () => {
      const groupsBuilder = createChainableBuilder();
      groupsBuilder.select.mockReturnValue(groupsBuilder);
      groupsBuilder.eq.mockImplementation(() =>
        groupsBuilder.setResult(success([]))
      );

      mockSupabase.from.mockImplementationOnce(() => groupsBuilder);

      const courses = await repository.getTeacherCourses("teacher-1");

      expect(courses).toHaveLength(0);
    });

    it("throws when groups query fails", async () => {
      const groupsBuilder = createChainableBuilder();
      groupsBuilder.select.mockReturnValue(groupsBuilder);
      groupsBuilder.eq.mockImplementation(() =>
        groupsBuilder.setResult(failure("boom"))
      );

      mockSupabase.from.mockImplementationOnce(() => groupsBuilder);

      await expect(repository.getTeacherCourses("teacher-1")).rejects.toThrow(
        "boom"
      );
    });
  });

  describe("listTopics", () => {
    it("returns mapped topics ordered by index", async () => {
      const topicRows = [
        createTopicRow({ id: "topic-1", order_index: 1 }),
        createTopicRow({ id: "topic-2", order_index: 2 }),
      ];

      const topicsBuilder = createChainableBuilder();
      topicsBuilder.select.mockReturnValue(topicsBuilder);
      topicsBuilder.eq.mockImplementation((column: string, value: string) => {
        expect(column).toBe("course_version_id");
        expect(value).toBe("version-123");
        return topicsBuilder;
      });
      topicsBuilder.order.mockImplementation((
        column: string,
        options: { ascending: boolean }
      ) => {
        expect(column).toBe("order_index");
        expect(options).toEqual({ ascending: true });
        return topicsBuilder.setResult(success(topicRows));
      });

      mockSupabase.from.mockImplementationOnce((table: string) => {
        expect(table).toBe("topics");
        return topicsBuilder;
      });

      const result = await repository.listTopics("version-123");

      expect(result).toHaveLength(2);
      expect(result[0]).toBeInstanceOf(CourseTopicEntity);
      expect(result.map((topic) => topic.orderIndex)).toEqual([1, 2]);
    });

    it("throws when supabase returns an error", async () => {
      const topicsBuilder = createChainableBuilder();
      topicsBuilder.select.mockReturnValue(topicsBuilder);
      topicsBuilder.eq.mockReturnValue(topicsBuilder);
      topicsBuilder.order.mockImplementation(() =>
        topicsBuilder.setResult(failure("topic error"))
      );

      mockSupabase.from.mockImplementationOnce(() => topicsBuilder);

      await expect(repository.listTopics("version-123")).rejects.toThrow(
        "topic error"
      );
    });
  });

  describe("createTopic", () => {
    it("creates a topic using next order index when not provided", async () => {
      const topicRow = createTopicRow({ id: "topic-new", order_index: 3 });
      const getNextOrderSpy = jest
        .spyOn(repository as any, "getNextOrder")
        .mockResolvedValue(3);

      const topicsBuilder = createChainableBuilder();
      topicsBuilder.insert = jest.fn().mockImplementation((payload) => {
        expect(payload).toMatchObject({
          course_version_id: "version-123",
          title: "New Topic",
          description: null,
          order_index: 3,
        });
        return topicsBuilder;
      });
      topicsBuilder.select.mockReturnValue(topicsBuilder);
      topicsBuilder.single.mockImplementation(() =>
        Promise.resolve(success(topicRow))
      );

      mockSupabase.from.mockImplementationOnce((table: string) => {
        expect(table).toBe("topics");
        return topicsBuilder;
      });

      const topic = await repository.createTopic({
        courseVersionId: "version-123",
        title: "New Topic",
        createdBy: "user-1",
      });

      expect(getNextOrderSpy).toHaveBeenCalledWith(
        mockSupabase,
        "topics",
        "order_index",
        "course_version_id",
        "version-123",
        undefined
      );
      expect(topic).toBeInstanceOf(CourseTopicEntity);
      expect(topic.orderIndex).toBe(3);

      getNextOrderSpy.mockRestore();
    });

    it("throws when insertion fails", async () => {
      const getNextOrderSpy = jest
        .spyOn(repository as any, "getNextOrder")
        .mockResolvedValue(1);

      const topicsBuilder = createChainableBuilder();
      topicsBuilder.insert = jest.fn().mockReturnValue(topicsBuilder);
      topicsBuilder.select.mockReturnValue(topicsBuilder);
      topicsBuilder.single.mockImplementation(() =>
        Promise.resolve(failure("create topic error"))
      );

      mockSupabase.from.mockImplementationOnce(() => topicsBuilder);

      await expect(
        repository.createTopic({
          courseVersionId: "version-123",
          title: "Bad Topic",
          createdBy: "user-1",
        })
      ).rejects.toThrow("create topic error");

      getNextOrderSpy.mockRestore();
    });
  });

  describe("reorderTopics", () => {
    it("invokes batch RPC when available", async () => {
      mockSupabase.rpc.mockResolvedValue({ data: null, error: null });

      await repository.reorderTopics("version-123", [
        { topicId: "topic-1", orderIndex: 2 },
        { topicId: "topic-2", orderIndex: 5 },
      ]);

      expect(mockSupabase.rpc).toHaveBeenCalledWith(
        "reorder_topics_batch",
        expect.objectContaining({
          p_course_version_id: "version-123",
          p_topic_ids: ["topic-1", "topic-2"],
          p_order_indices: [2, 5],
        })
      );
    });

    it("falls back to sequential updates when RPC fails", async () => {
      mockSupabase.rpc.mockResolvedValue({
        data: null,
        error: { message: "missing function" },
      });

      const warnSpy = jest.spyOn(console, "warn").mockImplementation();

      const orders = [
        { topicId: "topic-1", orderIndex: 3 },
        { topicId: "topic-2", orderIndex: 4 },
      ];
      let callIndex = 0;

      mockSupabase.from.mockImplementation((table: string) => {
        expect(table).toBe("topics");
        const builder = createChainableBuilder();
        const current = orders[callIndex++];

        builder.update = jest.fn().mockImplementation((payload) => {
          expect(payload).toEqual({ order_index: current.orderIndex });
          return builder;
        });

        let eqCalls = 0;
        builder.eq = jest.fn().mockImplementation((column: string, value: string) => {
          eqCalls += 1;
          if (eqCalls === 1) {
            expect(column).toBe("id");
            expect(value).toBe(current.topicId);
            return builder;
          }
          expect(column).toBe("course_version_id");
          expect(value).toBe("version-123");
          return builder.setResult(success(null));
        });

        return builder;
      });

      await repository.reorderTopics("version-123", orders);

      expect(mockSupabase.rpc).toHaveBeenCalled();
      expect(mockSupabase.from).toHaveBeenCalledTimes(orders.length);

      warnSpy.mockRestore();
    });
  });

  describe("listResources", () => {
    it("returns mapped resources ordered by index", async () => {
      const resourceRows = [
        createResourceRow({ id: "res-1", order_index: 1 }),
        createResourceRow({ id: "res-2", order_index: 2 }),
      ];

      const resourcesBuilder = createChainableBuilder();
      resourcesBuilder.select.mockReturnValue(resourcesBuilder);
      resourcesBuilder.eq.mockImplementation((column: string, value: string) => {
        expect(column).toBe("topic_id");
        expect(value).toBe("topic-123");
        return resourcesBuilder;
      });
      resourcesBuilder.order.mockImplementation((
        column: string,
        options: { ascending: boolean }
      ) => {
        expect(column).toBe("order_index");
        expect(options).toEqual({ ascending: true });
        return resourcesBuilder.setResult(success(resourceRows));
      });

      mockSupabase.from.mockImplementationOnce((table: string) => {
        expect(table).toBe("resources");
        return resourcesBuilder;
      });

      const result = await repository.listResources("topic-123");

      expect(result).toHaveLength(2);
      expect(result[0]).toBeInstanceOf(CourseResourceEntity);
      expect(result.map((resource) => resource.orderIndex)).toEqual([1, 2]);
    });

    it("throws when supabase returns an error", async () => {
      const resourcesBuilder = createChainableBuilder();
      resourcesBuilder.select.mockReturnValue(resourcesBuilder);
      resourcesBuilder.eq.mockReturnValue(resourcesBuilder);
      resourcesBuilder.order.mockImplementation(() =>
        resourcesBuilder.setResult(failure("resource error"))
      );

      mockSupabase.from.mockImplementationOnce(() => resourcesBuilder);

      await expect(repository.listResources("topic-123")).rejects.toThrow(
        "resource error"
      );
    });
  });

  describe("addResource", () => {
    it("creates a resource using next order index when not provided", async () => {
      const resourceRow = createResourceRow({ id: "resource-new", order_index: 4 });
      const getNextOrderSpy = jest
        .spyOn(repository as any, "getNextOrder")
        .mockResolvedValue(4);

      const resourcesBuilder = createChainableBuilder();
      resourcesBuilder.insert = jest.fn().mockImplementation((payload) => {
        expect(payload).toMatchObject({
          topic_id: "topic-123",
          title: "Video",
          resource_type: "video",
          order_index: 4,
        });
        return resourcesBuilder;
      });
      resourcesBuilder.select.mockReturnValue(resourcesBuilder);
      resourcesBuilder.single.mockImplementation(() =>
        Promise.resolve(success(resourceRow))
      );

      mockSupabase.from.mockImplementationOnce((table: string) => {
        expect(table).toBe("resources");
        return resourcesBuilder;
      });

      const resource = await repository.addResource({
        topicId: "topic-123",
        title: "Video",
        resourceType: "video",
        createdBy: "user-1",
      });

      expect(getNextOrderSpy).toHaveBeenCalledWith(
        mockSupabase,
        "resources",
        "order_index",
        "topic_id",
        "topic-123",
        undefined
      );
      expect(resource).toBeInstanceOf(CourseResourceEntity);
      expect(resource.orderIndex).toBe(4);

      getNextOrderSpy.mockRestore();
    });

    it("throws when insertion fails", async () => {
      const getNextOrderSpy = jest
        .spyOn(repository as any, "getNextOrder")
        .mockResolvedValue(2);

      const resourcesBuilder = createChainableBuilder();
      resourcesBuilder.insert = jest.fn().mockReturnValue(resourcesBuilder);
      resourcesBuilder.select.mockReturnValue(resourcesBuilder);
      resourcesBuilder.single.mockImplementation(() =>
        Promise.resolve(failure("resource create error"))
      );

      mockSupabase.from.mockImplementationOnce(() => resourcesBuilder);

      await expect(
        repository.addResource({
          topicId: "topic-123",
          title: "Document",
          resourceType: "document",
          createdBy: "user-1",
        })
      ).rejects.toThrow("resource create error");

      getNextOrderSpy.mockRestore();
    });
  });

  describe("reorderResources", () => {
    it("invokes batch RPC when available", async () => {
      mockSupabase.rpc.mockResolvedValue({ data: null, error: null });
      const logSpy = jest.spyOn(console, "log").mockImplementation();

      await repository.reorderResources("topic-123", [
        { resourceId: "res-1", orderIndex: 9 },
        { resourceId: "res-2", orderIndex: 10 },
      ]);

      expect(mockSupabase.rpc).toHaveBeenCalledWith(
        "reorder_resources_batch",
        expect.objectContaining({
          p_topic_id: "topic-123",
          p_resource_ids: ["res-1", "res-2"],
          p_order_indices: [9, 10],
        })
      );

      logSpy.mockRestore();
    });

    it("falls back to sequential updates when RPC fails", async () => {
      mockSupabase.rpc.mockResolvedValue({
        data: null,
        error: { message: "missing function" },
      });

      const logSpy = jest.spyOn(console, "log").mockImplementation();
      const warnSpy = jest.spyOn(console, "warn").mockImplementation();

      const orders = [
        { resourceId: "res-1", orderIndex: 3 },
        { resourceId: "res-2", orderIndex: 7 },
      ];
      let callIndex = 0;

      mockSupabase.from.mockImplementation((table: string) => {
        expect(table).toBe("resources");
        const builder = createChainableBuilder();
        const current = orders[callIndex++];

        builder.update = jest.fn().mockImplementation((payload) => {
          expect(payload).toEqual({ order_index: current.orderIndex });
          return builder;
        });

        let eqCalls = 0;
        builder.eq = jest.fn().mockImplementation((column: string, value: string | number) => {
          eqCalls += 1;
          if (eqCalls === 1) {
            expect(column).toBe("id");
            expect(value).toBe(current.resourceId);
            return builder;
          }
          expect(column).toBe("topic_id");
          expect(value).toBe("topic-123");
          return builder.setResult(success(null));
        });

        return builder;
      });

      await repository.reorderResources("topic-123", orders);

      expect(mockSupabase.rpc).toHaveBeenCalled();
      expect(mockSupabase.from).toHaveBeenCalledTimes(orders.length);

      logSpy.mockRestore();
      warnSpy.mockRestore();
    });
  });
});
