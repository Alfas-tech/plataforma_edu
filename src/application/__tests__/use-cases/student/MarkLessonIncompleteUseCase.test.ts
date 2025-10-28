import { MarkLessonIncompleteUseCase } from "@/src/application/use-cases/student/MarkLessonIncompleteUseCase";
import { IStudentRepository } from "@/src/core/interfaces/repositories/IStudentRepository";
import { MarkLessonResult } from "@/src/core/types/student.types";

describe("MarkLessonIncompleteUseCase", () => {
  let mockStudentRepository: jest.Mocked<IStudentRepository>;
  let useCase: MarkLessonIncompleteUseCase;

  beforeEach(() => {
    mockStudentRepository = {
      getCourseWithModulesAndLessons: jest.fn(),
      getStudentProgress: jest.fn(),
      markLessonComplete: jest.fn(),
      markLessonIncomplete: jest.fn(),
    };

    useCase = new MarkLessonIncompleteUseCase(mockStudentRepository);
  });

  it("should successfully mark a lesson as incomplete", async () => {
    const lessonId = "lesson-123";
    const studentId = "student-456";

    const mockResult: MarkLessonResult = {
      success: true,
    };

    mockStudentRepository.markLessonIncomplete.mockResolvedValue(mockResult);

    const result = await useCase.execute(lessonId, studentId);

    expect(result.success).toBe(true);
    expect(result.error).toBeUndefined();
    expect(mockStudentRepository.markLessonIncomplete).toHaveBeenCalledWith(
      lessonId,
      studentId
    );
  });

  it("should return error when repository fails", async () => {
    const lessonId = "lesson-123";
    const studentId = "student-456";

    const mockResult: MarkLessonResult = {
      success: false,
      error: "Failed to update database",
    };

    mockStudentRepository.markLessonIncomplete.mockResolvedValue(mockResult);

    const result = await useCase.execute(lessonId, studentId);

    expect(result.success).toBe(false);
    expect(result.error).toBe("Failed to update database");
  });

  it("should return default error message when repository error is undefined", async () => {
    const lessonId = "lesson-123";
    const studentId = "student-456";

    const mockResult: MarkLessonResult = {
      success: false,
      error: undefined,
    };

    mockStudentRepository.markLessonIncomplete.mockResolvedValue(mockResult);

    const result = await useCase.execute(lessonId, studentId);

    expect(result.success).toBe(false);
    expect(result.error).toBe("Error al marcar lección como no completada");
  });

  it("should handle repository throwing an exception", async () => {
    const lessonId = "lesson-123";
    const studentId = "student-456";

    mockStudentRepository.markLessonIncomplete.mockRejectedValue(
      new Error("Network error")
    );

    const result = await useCase.execute(lessonId, studentId);

    expect(result.success).toBe(false);
    expect(result.error).toBe("Network error");
  });

  it("should handle unknown error type from repository", async () => {
    const lessonId = "lesson-123";
    const studentId = "student-456";

    mockStudentRepository.markLessonIncomplete.mockRejectedValue("Unknown");

    const result = await useCase.execute(lessonId, studentId);

    expect(result.success).toBe(false);
    expect(result.error).toBe("Error al marcar lección como no completada");
  });
});
