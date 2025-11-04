import { MarkTopicResult } from "@/src/core/types/student.types";
import { MarkTopicIncompleteUseCase } from "./MarkTopicIncompleteUseCase";

/**
 * @deprecated Usa MarkTopicIncompleteUseCase
 */
export class MarkLessonIncompleteUseCase {
  constructor(private readonly delegate: MarkTopicIncompleteUseCase) {}

  execute(topicId: string, studentId: string): Promise<MarkTopicResult> {
    return this.delegate.execute(topicId, studentId);
  }
}
