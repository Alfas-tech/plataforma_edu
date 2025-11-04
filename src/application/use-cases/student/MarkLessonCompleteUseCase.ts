import { MarkTopicResult } from "@/src/core/types/student.types";
import { MarkTopicCompleteUseCase } from "./MarkTopicCompleteUseCase";

/**
 * @deprecated Usa MarkTopicCompleteUseCase
 */
export class MarkLessonCompleteUseCase {
  constructor(private readonly delegate: MarkTopicCompleteUseCase) {}

  execute(topicId: string, studentId: string): Promise<MarkTopicResult> {
    return this.delegate.execute(topicId, studentId);
  }
}
