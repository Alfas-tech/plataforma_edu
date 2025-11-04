import { IStudentRepository } from "@/src/core/interfaces/repositories/IStudentRepository";
import { MarkTopicResult } from "@/src/core/types/student.types";

/**
 * Use Case: Mark a topic as completed for the current student
 */
export class MarkTopicCompleteUseCase {
  constructor(private readonly studentRepository: IStudentRepository) {}

  async execute(topicId: string, studentId: string): Promise<MarkTopicResult> {
    try {
      const result = await this.studentRepository.markTopicComplete(
        topicId,
        studentId
      );

      if (!result.success) {
        return {
          success: false,
          error: result.error ?? "Error al marcar el tópico como completado",
        };
      }

      return { success: true };
    } catch (error) {
      return {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Error al marcar el tópico como completado",
      };
    }
  }
}
