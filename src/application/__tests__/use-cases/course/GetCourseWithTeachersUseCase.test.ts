import { GetCourseWithTeachersUseCase } from "@/src/application/use-cases/course/GetCourseWithTeachersUseCase";
import { ICourseRepository } from "@/src/core/interfaces/repositories/ICourseRepository";
import { IProfileRepository } from "@/src/core/interfaces/repositories/IProfileRepository";
import { CourseEntity } from "@/src/core/entities/Course.entity";
import { ProfileEntity } from "@/src/core/entities/Profile.entity";

describe("GetCourseWithTeachersUseCase", () => {
  let mockCourseRepository: jest.Mocked<ICourseRepository>;
  let mockProfileRepository: jest.Mocked<IProfileRepository>;
  let getCourseWithTeachersUseCase: GetCourseWithTeachersUseCase;

  beforeEach(() => {
    mockCourseRepository = {
      createCourse: jest.fn(),
      getAllCourses: jest.fn(),
      getCourseById: jest.fn(),
      updateCourse: jest.fn(),
      deleteCourse: jest.fn(),
      assignTeacher: jest.fn(),
      removeTeacher: jest.fn(),
      getCourseWithTeachers: jest.fn(),
      getTeacherCourses: jest.fn(),
      getCourseTeachers: jest.fn(),
      getActiveCourse: jest.fn(),
    } as any;

    mockProfileRepository = {
      getProfileByUserId: jest.fn(),
      getProfileByEmail: jest.fn(),
      getAllStudents: jest.fn(),
      getAllTeachers: jest.fn(),
      getAllProfiles: jest.fn(),
      updateProfile: jest.fn(),
      updateRole: jest.fn(),
      promoteToTeacher: jest.fn(),
      demoteToStudent: jest.fn(),
    } as any;

    getCourseWithTeachersUseCase = new GetCourseWithTeachersUseCase(
      mockCourseRepository,
      mockProfileRepository
    );
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("execute", () => {
    const courseId = "course-123";
    const mockCourse = new CourseEntity(
      courseId,
      "Test Course",
      "Course Description",
      new Date("2024-01-01"),
      new Date("2024-12-31"),
      true,
      "admin-123",
      new Date(),
      new Date()
    );

    const mockTeacher1 = new ProfileEntity(
      "teacher-1",
      "teacher1@example.com",
      "Teacher One",
      null,
      "teacher",
      new Date(),
      new Date()
    );

    const mockTeacher2 = new ProfileEntity(
      "teacher-2",
      "teacher2@example.com",
      "Teacher Two",
      null,
      "teacher",
      new Date(),
      new Date()
    );

    it("should return course with teachers successfully", async () => {
      mockCourseRepository.getCourseById.mockResolvedValue(mockCourse);
      mockCourseRepository.getCourseTeachers.mockResolvedValue([
        "teacher-1",
        "teacher-2",
      ]);
      mockProfileRepository.getProfileByUserId
        .mockResolvedValueOnce(mockTeacher1)
        .mockResolvedValueOnce(mockTeacher2);

      const result = await getCourseWithTeachersUseCase.execute(courseId);

      expect(result.success).toBe(true);
      expect(result.data?.course).toEqual(mockCourse);
      expect(result.data?.teachers).toHaveLength(2);
      expect(result.data?.teachers).toContain(mockTeacher1);
      expect(result.data?.teachers).toContain(mockTeacher2);
    });

    it("should return course with empty teachers array when no teachers assigned", async () => {
      mockCourseRepository.getCourseById.mockResolvedValue(mockCourse);
      mockCourseRepository.getCourseTeachers.mockResolvedValue([]);

      const result = await getCourseWithTeachersUseCase.execute(courseId);

      expect(result.success).toBe(true);
      expect(result.data?.course).toEqual(mockCourse);
      expect(result.data?.teachers).toHaveLength(0);
    });

    it("should filter out teachers with no profile", async () => {
      mockCourseRepository.getCourseById.mockResolvedValue(mockCourse);
      mockCourseRepository.getCourseTeachers.mockResolvedValue([
        "teacher-1",
        "teacher-2",
        "teacher-3",
      ]);
      mockProfileRepository.getProfileByUserId
        .mockResolvedValueOnce(mockTeacher1)
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce(mockTeacher2);

      const result = await getCourseWithTeachersUseCase.execute(courseId);

      expect(result.success).toBe(true);
      expect(result.data?.teachers).toHaveLength(2);
      expect(result.data?.teachers).toContain(mockTeacher1);
      expect(result.data?.teachers).toContain(mockTeacher2);
    });

    it("should return error when course not found", async () => {
      mockCourseRepository.getCourseById.mockResolvedValue(null);

      const result = await getCourseWithTeachersUseCase.execute(courseId);

      expect(result.success).toBe(false);
      expect(result.error).toBe("Curso no encontrado");
    });

    it("should handle repository errors gracefully", async () => {
      mockCourseRepository.getCourseById.mockRejectedValue(
        new Error("Database error")
      );

      const result = await getCourseWithTeachersUseCase.execute(courseId);

      expect(result.success).toBe(false);
      expect(result.error).toBe("Database error");
    });

    it("should handle unknown errors", async () => {
      mockCourseRepository.getCourseById.mockRejectedValue("Unknown error");

      const result = await getCourseWithTeachersUseCase.execute(courseId);

      expect(result.success).toBe(false);
      expect(result.error).toBe("Error al obtener curso");
    });
  });
});
