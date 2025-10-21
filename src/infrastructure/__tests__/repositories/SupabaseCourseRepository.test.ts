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
      order: jest.fn().mockImplementation(() => builder),
      limit: jest.fn().mockImplementation(() =>
        Promise.resolve(builder.__result)
      ),
      single: jest.fn().mockImplementation(() =>
        Promise.resolve(builder.__result)
      ),
      maybeSingle: jest.fn().mockImplementation(() =>
        Promise.resolve(builder.__result)
      ),
      then: (resolve: any, reject?: any) =>
        Promise.resolve(builder.__result).then(resolve, reject),
      setResult: (result: any) => {
        builder.__result = result;
        return builder;
      },
    };

    return builder;
  };

  const createCourseRow = (overrides: Partial<CourseData> = {}): CourseData => ({
    id: "course-1",
    title: "Course 1",
    summary: "Summary",
    description: "Description",
    slug: "course-1",
    visibility_override: false,
    active_version_id: "version-1",
    default_branch_id: null,
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
    branch_id: null,
    version_label: "v1.0.0",
    summary: "Initial version",
    status: "published",
    is_active: true,
    is_published: true,
    is_tip: true,
    parent_version_id: null,
    merged_into_version_id: null,
    merge_request_id: null,
    based_on_version_id: null,
    created_by: "admin-1",
    reviewed_by: null,
    approved_at: null,
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
        getUser: jest.fn().mockResolvedValue(
          success({ user: { id: "user-123" } })
        ),
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

      await expect(repository.getAllCourses()).rejects.toThrow("Database error");

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
      versionsBuilder.eq.mockImplementation((column: string, value: string) => {
        expect(column).toBe("id");
        expect(value).toBe(courseRow.active_version_id);
        return versionsBuilder.setResult(success(versionRow));
      });

      const branchesBuilder = createChainableBuilder();
      branchesBuilder.select.mockReturnValue(branchesBuilder);
      branchesBuilder.eq.mockImplementation((column: string, value: string) => {
        expect(column).toBe("course_id");
        expect(value).toBe(courseRow.id);
        return branchesBuilder.setResult(success([]));
      });

      const mergeRequestsBuilder = createChainableBuilder();
      mergeRequestsBuilder.select.mockReturnValue(mergeRequestsBuilder);
      mergeRequestsBuilder.eq.mockImplementation(() => mergeRequestsBuilder);
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

      const course = await repository.getCourseById(courseRow.id);

      expect(course).toBeInstanceOf(CourseEntity);
      expect(course?.id).toBe(courseRow.id);
      expect(course?.activeVersion?.versionLabel).toBe("v1.0.0");
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
        title: "New Course",
        slug: "new-course",
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
          expect(payload.title).toBe("New Course");
          expect(payload.slug).toBe("new-course");
          return coursesInsertBuilder;
        });
      coursesInsertBuilder.select.mockReturnValue(coursesInsertBuilder);
      coursesInsertBuilder.single.mockImplementation(() =>
        Promise.resolve(success(initialCourseRow))
      );

      const versionInsertBuilder = createChainableBuilder();
      versionInsertBuilder.insert = jest.fn().mockReturnValue(versionInsertBuilder);
      versionInsertBuilder.select.mockReturnValue(versionInsertBuilder);
      versionInsertBuilder.single.mockImplementation(() =>
        Promise.resolve(success(createdVersionRow))
      );

      const coursesUpdateBuilder = createChainableBuilder();
      coursesUpdateBuilder.update.mockReturnValue(coursesUpdateBuilder);
      coursesUpdateBuilder.eq.mockImplementation((column: string, value: string) => {
        expect(column).toBe("id");
        expect(value).toBe("course-new");
        return coursesUpdateBuilder.setResult(success(null));
      });

      mockSupabase.from
        .mockImplementationOnce((table: string) => {
          expect(table).toBe("courses");
          return coursesInsertBuilder;
        })
        .mockImplementationOnce((table: string) => {
          expect(table).toBe("course_versions");
          return versionInsertBuilder;
        })
        .mockImplementationOnce((table: string) => {
          expect(table).toBe("courses");
          return coursesUpdateBuilder;
        });

      const course = await repository.createCourse({
        title: "New Course",
        summary: "Summary",
        description: "Description",
        initialVersionLabel: "v1.0.0",
      });

      expect(course).toBeInstanceOf(CourseEntity);
      expect(course.slug).toBe("new-course");
      expect(course.activeVersion?.id).toBe("version-new");
    });

    it("throws when initial version cannot be created", async () => {
      const initialCourseRow = createCourseRow({
        id: "course-new",
        slug: "new-course",
        active_version_id: null,
      });

      const coursesInsertBuilder = createChainableBuilder();
      coursesInsertBuilder.insert = jest.fn().mockReturnValue(coursesInsertBuilder);
      coursesInsertBuilder.select.mockReturnValue(coursesInsertBuilder);
      coursesInsertBuilder.single.mockImplementation(() =>
        Promise.resolve(success(initialCourseRow))
      );

      const versionInsertBuilder = createChainableBuilder();
      versionInsertBuilder.insert = jest.fn().mockReturnValue(versionInsertBuilder);
      versionInsertBuilder.select.mockReturnValue(versionInsertBuilder);
      versionInsertBuilder.single.mockImplementation(() =>
        Promise.resolve(failure("version failed"))
      );

      mockSupabase.from
        .mockImplementationOnce(() => coursesInsertBuilder)
        .mockImplementationOnce(() => versionInsertBuilder);

      await expect(
        repository.createCourse({
          title: "New Course",
        })
      ).rejects.toThrow("version failed");
    });
  });

  describe("updateCourse", () => {
    it("throws when course does not exist", async () => {
      const coursesBuilder = createChainableBuilder();
      coursesBuilder.select.mockReturnValue(coursesBuilder);
      coursesBuilder.eq.mockImplementation(() =>
        coursesBuilder.setResult(failure("Not found"))
      );

      mockSupabase.from.mockImplementationOnce(() => coursesBuilder);

      await expect(
        repository.updateCourse("missing", { title: "New" })
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
        "Error al eliminar el curso"
      );
    });
  });

  describe("assignTeacher", () => {
    it("assigns teacher to course", async () => {
      const insertBuilder = {
        insert: jest.fn().mockResolvedValue(success(null)),
      };

      mockSupabase.from.mockImplementationOnce((table: string) => {
        expect(table).toBe("course_teachers");
        return insertBuilder;
      });

      await expect(
        repository.assignTeacher("course-1", "teacher-1")
      ).resolves.not.toThrow();

      expect(insertBuilder.insert).toHaveBeenCalledWith({
        course_id: "course-1",
        teacher_id: "teacher-1",
        assigned_by: "user-123",
      });
    });

    it("throws when assignment fails", async () => {
      const insertBuilder = {
        insert: jest.fn().mockResolvedValue(failure("Insert failed")),
      };

      mockSupabase.from.mockImplementationOnce(() => insertBuilder);

      await expect(
        repository.assignTeacher("course-1", "teacher-1")
      ).rejects.toThrow("Error al asignar docente");
    });
  });

  describe("removeTeacher", () => {
    it("removes teacher from course", async () => {
      const deleteBuilder = createChainableBuilder().setResult(success(null));
      deleteBuilder.delete.mockReturnValue(deleteBuilder);
      deleteBuilder.eq.mockImplementation(() => deleteBuilder);

      mockSupabase.from.mockImplementationOnce(() => deleteBuilder);

      await expect(
        repository.removeTeacher("course-1", "teacher-1")
      ).resolves.not.toThrow();
    });

    it("throws when removal fails", async () => {
      const deleteBuilder = createChainableBuilder().setResult(failure("fail"));
      deleteBuilder.delete.mockReturnValue(deleteBuilder);
      deleteBuilder.eq.mockImplementation(() => deleteBuilder);

      mockSupabase.from.mockImplementationOnce(() => deleteBuilder);

      await expect(
        repository.removeTeacher("course-1", "teacher-1")
      ).rejects.toThrow("Error al remover docente");
    });
  });

  describe("getCourseTeachers", () => {
    it("returns teacher ids", async () => {
      const selectBuilder = createChainableBuilder();
      selectBuilder.select.mockReturnValue(selectBuilder);
      selectBuilder.eq.mockImplementation(() =>
        selectBuilder.setResult(success([
          { teacher_id: "t1" },
          { teacher_id: "t2" },
        ]))
      );

      mockSupabase.from.mockImplementationOnce(() => selectBuilder);

      const teachers = await repository.getCourseTeachers("course-1");

      expect(teachers).toEqual(["t1", "t2"]);
    });

    it("returns empty array on error", async () => {
      const selectBuilder = createChainableBuilder();
      selectBuilder.select.mockReturnValue(selectBuilder);
      selectBuilder.eq.mockImplementation(() =>
        selectBuilder.setResult(failure("boom"))
      );

      mockSupabase.from.mockImplementationOnce(() => selectBuilder);

      const teachers = await repository.getCourseTeachers("course-1");

      expect(teachers).toEqual([]);
    });
  });

  describe("getActiveCourse", () => {
    it("returns active course when available", async () => {
      const courseRow = createCourseRow();
      const versionRow = createVersionRow();

      const builder = createChainableBuilder();
      builder.select.mockReturnValue(builder);
      builder.eq.mockImplementation(() => builder);
      builder.order.mockImplementation(() => builder);
      builder.limit.mockImplementation(() =>
        Promise.resolve(
          success([
            {
              ...versionRow,
              course: courseRow,
            },
          ])
        )
      );

      mockSupabase.from.mockImplementationOnce((table: string) => {
        expect(table).toBe("course_versions");
        return builder;
      });

      const course = await repository.getActiveCourse();

      expect(course).toBeInstanceOf(CourseEntity);
      expect(course?.id).toBe(courseRow.id);
    });

    it("returns null when no active course is found", async () => {
      const builder = createChainableBuilder();
      builder.select.mockReturnValue(builder);
      builder.eq.mockImplementation(() => builder);
      builder.order.mockImplementation(() => builder);
      builder.limit.mockImplementation(() => Promise.resolve(success([])));

      mockSupabase.from.mockImplementationOnce(() => builder);

      const course = await repository.getActiveCourse();

      expect(course).toBeNull();
    });
  });

  describe("getTeacherCourses", () => {
    it("returns courses assigned to teacher", async () => {
      const courseRow = createCourseRow();
      const versionRow = createVersionRow();

      const teacherCoursesBuilder = createChainableBuilder();
      teacherCoursesBuilder.select.mockReturnValue(teacherCoursesBuilder);
      teacherCoursesBuilder.eq.mockImplementation((column: string, value: string) => {
        expect(column).toBe("teacher_id");
        expect(value).toBe("teacher-1");
        return teacherCoursesBuilder.setResult(
          success([{ course_id: courseRow.id }])
        );
      });

      const coursesBuilder = createChainableBuilder();
      coursesBuilder.select.mockReturnValue(coursesBuilder);
      coursesBuilder.in.mockImplementation(() => coursesBuilder);
      coursesBuilder.order.mockImplementation(() =>
        coursesBuilder.setResult(success([courseRow]))
      );

      const versionsBuilder = createChainableBuilder();
      versionsBuilder.select.mockReturnValue(versionsBuilder);
      versionsBuilder.in.mockImplementation(() =>
        versionsBuilder.setResult(success([versionRow]))
      );

      mockSupabase.from
        .mockImplementationOnce((table: string) => {
          expect(table).toBe("course_teachers");
          return teacherCoursesBuilder;
        })
        .mockImplementationOnce((table: string) => {
          expect(table).toBe("courses");
          return coursesBuilder;
        })
        .mockImplementationOnce((table: string) => {
          expect(table).toBe("course_versions");
          return versionsBuilder;
        });

      const courses = await repository.getTeacherCourses("teacher-1");

      expect(courses).toHaveLength(1);
      expect(courses[0]).toBeInstanceOf(CourseEntity);
    });

    it("throws when course teacher query fails", async () => {
      const teacherCoursesBuilder = createChainableBuilder();
      teacherCoursesBuilder.select.mockReturnValue(teacherCoursesBuilder);
      teacherCoursesBuilder.eq.mockImplementation(() =>
        teacherCoursesBuilder.setResult(failure("boom"))
      );

      mockSupabase.from.mockImplementationOnce(() => teacherCoursesBuilder);

      await expect(
        repository.getTeacherCourses("teacher-1")
      ).rejects.toThrow("Error al obtener cursos del docente");
    });
  });
});
