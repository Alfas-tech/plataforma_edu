import { StudentProgressData } from "../types/course.types";

export class StudentProgressEntity {
  constructor(
    public readonly id: string,
    public readonly studentId: string,
    public readonly topicId: string,
    public readonly completed: boolean,
    public readonly completedAt: Date | null,
    public readonly lastAccessedAt: Date
  ) {}

  static fromDatabase(data: StudentProgressData): StudentProgressEntity {
    return new StudentProgressEntity(
      data.id,
      data.student_id,
      data.topic_id,
      data.completed,
      data.completed_at ? new Date(data.completed_at) : null,
      new Date(data.last_accessed_at)
    );
  }

  isCompleted(): boolean {
    return this.completed;
  }
}
