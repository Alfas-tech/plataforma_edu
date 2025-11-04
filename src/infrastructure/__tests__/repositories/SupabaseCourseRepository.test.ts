import { SupabaseCourseRepository } from "@/src/infrastructure/repositories/SupabaseCourseRepository";
import { createClient } from "@/src/infrastructure/supabase/server";
import { CourseEntity } from "@/src/core/entities/Course.entity";
import type {
  CourseData,
  CourseVersionData,
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

  beforeEach(() => {
    mockSupabase = {
      from: jest.fn().mockImplementation(() => {
        throw new Error("Unexpected table call");
      }),
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
});
