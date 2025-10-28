import { IStudentRepository } from "@/src/core/interfaces/repositories/IStudentRepository";
import { MarkLessonResult } from "@/src/core/types/student.types";

/**
 * Use Case: Mark a lesson as completed
 * Business logic for updating student progress
 */
export class MarkLessonCompleteUseCase {
  constructor(private readonly studentRepository: IStudentRepository) {}

  async execute(
    lessonId: string,
    studentId: string
  ): Promise<MarkLessonResult> {
    try {
      const result = await this.studentRepository.markLessonComplete(
        lessonId,
        studentId
      );

      if (!result.success) {
        return {
          success: false,
          error: result.error || "Error al marcar lección como completada",
        };
      }

      return { success: true };
    } catch (error) {
      return {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Error al marcar lección como completada",
      };
    }
  }
}
