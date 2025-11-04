import { GetTeacherCoursesUseCase } from "@/src/application/use-cases/course/GetTeacherCoursesUseCase";
import { ICourseRepository } from "@/src/core/interfaces/repositories/ICourseRepository";
import { CourseEntity } from "@/src/core/entities/Course.entity";

declare const describe: any;
declare const beforeEach: any;
declare const afterEach: any;
declare const it: any;
declare const expect: any;
declare const jest: any;

describe("GetTeacherCoursesUseCase", () => {
  let mockCourseRepository: any;
  let getTeacherCoursesUseCase: GetTeacherCoursesUseCase;

  beforeEach(() => {
    mockCourseRepository = {
      getActiveCourse: jest.fn(),
      getCourseById: jest.fn(),
      createCourse: jest.fn(),
      getAllCourses: jest.fn(),
      updateCourse: jest.fn(),
      deleteCourse: jest.fn(),
      assignTeacher: jest.fn(),
      removeTeacher: jest.fn(),
      getTeacherCourses: jest.fn(),
      getCourseTeachers: jest.fn(),
    };

    getTeacherCoursesUseCase = new GetTeacherCoursesUseCase(
      mockCourseRepository as ICourseRepository
    );
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("execute", () => {
    const teacherId = "teacher-123";
    const now = new Date();

    const mockCourse1 = CourseEntity.fromDatabase(
      {
        id: "course-1",
        title: "Course 1",
        summary: "Summary 1",
        description: "Description 1",
        slug: "course-1",
        visibility_override: false,
        active_version_id: "version-1",
        created_by: "admin-123",
        created_at: now.toISOString(),
        updated_at: now.toISOString(),
      },
      {
        id: "version-1",
        course_id: "course-1",
        version_label: "v1.0.0",
        summary: "Summary 1",
        status: "published",
        is_active: true,
        is_published: true,
        based_on_version_id: null,
        created_by: "admin-123",
        reviewed_by: null,
        approved_at: now.toISOString(),
        created_at: now.toISOString(),
        updated_at: now.toISOString(),
      }
    );

    const mockCourse2 = CourseEntity.fromDatabase(
      {
        id: "course-2",
        title: "Course 2",
        summary: "Summary 2",
        description: "Description 2",
        slug: "course-2",
        visibility_override: false,
        active_version_id: "version-2",
        created_by: "admin-123",
        created_at: now.toISOString(),
        updated_at: now.toISOString(),
      },
      {
        id: "version-2",
        course_id: "course-2",
        version_label: "v1.1.0",
        summary: "Summary 2",
        status: "published",
        is_active: true,
        is_published: true,
        based_on_version_id: null,
        created_by: "admin-123",
        reviewed_by: null,
        approved_at: now.toISOString(),
        created_at: now.toISOString(),
        updated_at: now.toISOString(),
      }
    );

    it("should return all courses for teacher", async () => {
      mockCourseRepository.getTeacherCourses.mockResolvedValue([
        mockCourse1,
        mockCourse2,
      ]);

      const result = await getTeacherCoursesUseCase.execute(teacherId);

      expect(result.success).toBe(true);
      expect(result.courses).toHaveLength(2);
      expect(result.courses).toContain(mockCourse1);
      expect(result.courses).toContain(mockCourse2);
      expect(mockCourseRepository.getTeacherCourses).toHaveBeenCalledWith(
        teacherId
      );
    });

    it("should return empty array when teacher has no courses", async () => {
      mockCourseRepository.getTeacherCourses.mockResolvedValue([]);

      const result = await getTeacherCoursesUseCase.execute(teacherId);

      expect(result.success).toBe(true);
      expect(result.courses).toHaveLength(0);
    });

    it("should handle repository errors gracefully", async () => {
      mockCourseRepository.getTeacherCourses.mockRejectedValue(
        new Error("Database error")
      );

      const result = await getTeacherCoursesUseCase.execute(teacherId);

      expect(result.success).toBe(false);
      expect(result.error).toBe("Database error");
    });

    it("should handle unknown errors", async () => {
      mockCourseRepository.getTeacherCourses.mockRejectedValue("Unknown error");

      const result = await getTeacherCoursesUseCase.execute(teacherId);

      expect(result.success).toBe(false);
      expect(result.error).toBe("Error al obtener cursos del docente");
    });
  });
});
