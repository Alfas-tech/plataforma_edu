import { IStudentRepository } from "@/src/core/interfaces/repositories/IStudentRepository";
import { MarkLessonResult } from "@/src/core/types/student.types";

/**
 * Use Case: Mark a lesson as incomplete
 * Business logic for updating student progress
 */
export class MarkLessonIncompleteUseCase {
  constructor(private readonly studentRepository: IStudentRepository) {}

  async execute(lessonId: string, studentId: string): Promise<MarkLessonResult> {
    try {
      const result = await this.studentRepository.markLessonIncomplete(
        lessonId,
        studentId
      );

      if (!result.success) {
        return {
          success: false,
          error: result.error || "Error al marcar lección como no completada",
        };
      }

      return { success: true };
    } catch (error) {
      return {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Error al marcar lección como no completada",
      };
    }
  }
}
