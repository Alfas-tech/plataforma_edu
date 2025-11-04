import { GetAllCoursesUseCase } from "@/src/application/use-cases/course/GetAllCoursesUseCase";
import { ICourseRepository } from "@/src/core/interfaces/repositories/ICourseRepository";
import { CourseEntity } from "@/src/core/entities/Course.entity";

declare const describe: any;
declare const beforeEach: any;
declare const afterEach: any;
declare const it: any;
declare const expect: any;
declare const jest: any;

describe("GetAllCoursesUseCase", () => {
  let mockCourseRepository: any;
  let getAllCoursesUseCase: GetAllCoursesUseCase;

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
      getCourseTeachers: jest.fn(),
      getTeacherCourses: jest.fn(),
    };

    getAllCoursesUseCase = new GetAllCoursesUseCase(
      mockCourseRepository as ICourseRepository
    );
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("execute", () => {
    it("should return all courses successfully", async () => {
      const now = new Date();
      const mockCourses = [
        CourseEntity.fromDatabase(
          {
            id: "course-1",
            title: "Course 1",
            summary: "Summary 1",
            description: "Description 1",
            slug: "course-1",
            visibility_override: false,
            active_version_id: "version-1",
            created_by: "admin-1",
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
            created_by: "admin-1",
            reviewed_by: null,
            approved_at: now.toISOString(),
            created_at: now.toISOString(),
            updated_at: now.toISOString(),
          }
        ),
        CourseEntity.fromDatabase(
          {
            id: "course-2",
            title: "Course 2",
            summary: "Summary 2",
            description: "Description 2",
            slug: "course-2",
            visibility_override: false,
            active_version_id: "version-2",
            created_by: "admin-2",
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
            created_by: "admin-2",
            reviewed_by: null,
            approved_at: now.toISOString(),
            created_at: now.toISOString(),
            updated_at: now.toISOString(),
          }
        ),
      ];

      mockCourseRepository.getAllCourses.mockResolvedValue(mockCourses);

      const result = await getAllCoursesUseCase.execute();

      expect(result.success).toBe(true);
      expect(result.courses).toEqual(mockCourses);
      expect(result.courses).toHaveLength(2);
      expect(result.error).toBeUndefined();
      expect(mockCourseRepository.getAllCourses).toHaveBeenCalledTimes(1);
    });

    it("should return empty array when no courses exist", async () => {
      mockCourseRepository.getAllCourses.mockResolvedValue([]);

      const result = await getAllCoursesUseCase.execute();

      expect(result.success).toBe(true);
      expect(result.courses).toEqual([]);
      expect(result.courses).toHaveLength(0);
      expect(result.error).toBeUndefined();
    });

    it("should handle repository errors gracefully", async () => {
      mockCourseRepository.getAllCourses.mockRejectedValue(
        new Error("Database connection failed")
      );

      const result = await getAllCoursesUseCase.execute();

      expect(result.success).toBe(false);
      expect(result.error).toBe("Database connection failed");
      expect(result.courses).toBeUndefined();
    });

    it("should handle unknown errors", async () => {
      mockCourseRepository.getAllCourses.mockRejectedValue("Unknown error");

      const result = await getAllCoursesUseCase.execute();

      expect(result.success).toBe(false);
      expect(result.error).toBe("Error al obtener cursos");
      expect(result.courses).toBeUndefined();
    });
  });
});
