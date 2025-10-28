import { GetCourseWithModulesAndLessonsUseCase } from "@/src/application/use-cases/student/GetCourseWithModulesAndLessonsUseCase";
import { IStudentRepository } from "@/src/core/interfaces/repositories/IStudentRepository";
import {
  CourseWithModulesData,
  ModuleWithLessons,
  LessonWithProgress,
  StudentProgress,
} from "@/src/core/types/student.types";

describe("GetCourseWithModulesAndLessonsUseCase", () => {
  let mockStudentRepository: jest.Mocked<IStudentRepository>;
  let useCase: GetCourseWithModulesAndLessonsUseCase;

  beforeEach(() => {
    mockStudentRepository = {
      getCourseWithModulesAndLessons: jest.fn(),
      getStudentProgress: jest.fn(),
      markLessonComplete: jest.fn(),
      markLessonIncomplete: jest.fn(),
    };

    useCase = new GetCourseWithModulesAndLessonsUseCase(mockStudentRepository);
  });

  it("should successfully get course with modules, lessons, and progress", async () => {
    const courseId = "course-123";
    const studentId = "student-456";

    const mockLesson: LessonWithProgress = {
      id: "lesson-1",
      moduleId: "module-1",
      title: "Introduction to Python",
      content: "Python basics",
      orderIndex: 1,
      durationMinutes: 30,
      isPublished: true,
    };

    const mockModule: ModuleWithLessons = {
      id: "module-1",
      courseId: "course-123",
      courseVersionId: "version-1",
      title: "Module 1",
      description: "First module",
      orderIndex: 1,
      isPublished: true,
      lessons: [mockLesson],
    };

    const mockProgress: StudentProgress = {
      studentId: "student-456",
      lessonId: "lesson-1",
      completed: true,
      completedAt: "2025-10-28T10:00:00Z",
    };

    const mockCourseData: CourseWithModulesData = {
      course: {
        id: "course-123",
        title: "Python Programming",
        description: "Learn Python",
        activeVersionId: "version-1",
      },
      modules: [mockModule],
      progress: [mockProgress],
    };

    mockStudentRepository.getCourseWithModulesAndLessons.mockResolvedValue(
      mockCourseData
    );

    const result = await useCase.execute(courseId, studentId);

    expect(result.success).toBe(true);
    expect(result.data).toBeDefined();
    expect(result.data?.course.title).toBe("Python Programming");
    expect(result.data?.modules).toHaveLength(1);
    expect(result.data?.modules[0].lessons[0].completed).toBe(true);
    expect(
      mockStudentRepository.getCourseWithModulesAndLessons
    ).toHaveBeenCalledWith(courseId, studentId);
  });

  it("should merge progress correctly with lessons", async () => {
    const courseId = "course-123";
    const studentId = "student-456";

    const mockLesson1: LessonWithProgress = {
      id: "lesson-1",
      moduleId: "module-1",
      title: "Lesson 1",
      content: null,
      orderIndex: 1,
      durationMinutes: 20,
      isPublished: true,
    };

    const mockLesson2: LessonWithProgress = {
      id: "lesson-2",
      moduleId: "module-1",
      title: "Lesson 2",
      content: null,
      orderIndex: 2,
      durationMinutes: 25,
      isPublished: true,
    };

    const mockModule: ModuleWithLessons = {
      id: "module-1",
      courseId: "course-123",
      courseVersionId: "version-1",
      title: "Module 1",
      description: null,
      orderIndex: 1,
      isPublished: true,
      lessons: [mockLesson1, mockLesson2],
    };

    const mockProgress: StudentProgress[] = [
      {
        studentId: "student-456",
        lessonId: "lesson-1",
        completed: true,
        completedAt: "2025-10-28T10:00:00Z",
      },
      // lesson-2 has no progress
    ];

    const mockCourseData: CourseWithModulesData = {
      course: {
        id: "course-123",
        title: "Course",
        description: null,
        activeVersionId: "version-1",
      },
      modules: [mockModule],
      progress: mockProgress,
    };

    mockStudentRepository.getCourseWithModulesAndLessons.mockResolvedValue(
      mockCourseData
    );

    const result = await useCase.execute(courseId, studentId);

    expect(result.success).toBe(true);
    expect(result.data?.modules[0].lessons[0].completed).toBe(true);
    expect(result.data?.modules[0].lessons[1].completed).toBe(false);
  });

  it("should return error when repository throws exception", async () => {
    const courseId = "course-123";
    const studentId = "student-456";

    mockStudentRepository.getCourseWithModulesAndLessons.mockRejectedValue(
      new Error("Database connection failed")
    );

    const result = await useCase.execute(courseId, studentId);

    expect(result.success).toBe(false);
    expect(result.error).toBe("Database connection failed");
    expect(result.data).toBeUndefined();
  });

  it("should handle empty modules array", async () => {
    const courseId = "course-123";
    const studentId = "student-456";

    const mockCourseData: CourseWithModulesData = {
      course: {
        id: "course-123",
        title: "Empty Course",
        description: null,
        activeVersionId: "version-1",
      },
      modules: [],
      progress: [],
    };

    mockStudentRepository.getCourseWithModulesAndLessons.mockResolvedValue(
      mockCourseData
    );

    const result = await useCase.execute(courseId, studentId);

    expect(result.success).toBe(true);
    expect(result.data?.modules).toHaveLength(0);
  });

  it("should handle unknown error type", async () => {
    const courseId = "course-123";
    const studentId = "student-456";

    mockStudentRepository.getCourseWithModulesAndLessons.mockRejectedValue(
      "Unknown error"
    );

    const result = await useCase.execute(courseId, studentId);

    expect(result.success).toBe(false);
    expect(result.error).toBe("Error al obtener curso");
  });
});
