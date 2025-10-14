import { GetAllCoursesUseCase } from "@/src/application/use-cases/course/GetAllCoursesUseCase";
import { ICourseRepository } from "@/src/core/interfaces/repositories/ICourseRepository";
import { CourseEntity } from "@/src/core/entities/Course.entity";

describe("GetAllCoursesUseCase", () => {
  let mockCourseRepository: jest.Mocked<ICourseRepository>;
  let getAllCoursesUseCase: GetAllCoursesUseCase;

  beforeEach(() => {
    mockCourseRepository = {
      createCourse: jest.fn(),
      getAllCourses: jest.fn(),
      getCourseById: jest.fn(),
      updateCourse: jest.fn(),
      deleteCourse: jest.fn(),
      assignTeacherToCourse: jest.fn(),
      removeTeacherFromCourse: jest.fn(),
      getCourseWithTeachers: jest.fn(),
      getTeacherCourses: jest.fn(),
    } as jest.Mocked<ICourseRepository>;

    getAllCoursesUseCase = new GetAllCoursesUseCase(mockCourseRepository);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("execute", () => {
    it("should return all courses successfully", async () => {
      const mockCourses = [
        new CourseEntity(
          "course-1",
          "Course 1",
          "Description 1",
          new Date("2025-01-01"),
          new Date("2025-06-30"),
          true,
          new Date(),
          new Date()
        ),
        new CourseEntity(
          "course-2",
          "Course 2",
          "Description 2",
          new Date("2025-07-01"),
          new Date("2025-12-31"),
          true,
          new Date(),
          new Date()
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
