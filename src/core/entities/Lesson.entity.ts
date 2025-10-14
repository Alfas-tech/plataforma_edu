import { LessonData } from "../types/course.types";

export class LessonEntity {
  constructor(
    public readonly id: string,
    public readonly moduleId: string,
    public readonly title: string,
    public readonly content: string | null,
    public readonly orderIndex: number,
    public readonly durationMinutes: number | null,
    public readonly isPublished: boolean,
    public readonly createdAt: Date,
    public readonly updatedAt: Date
  ) {}

  static fromDatabase(data: LessonData): LessonEntity {
    return new LessonEntity(
      data.id,
      data.module_id,
      data.title,
      data.content,
      data.order_index,
      data.duration_minutes,
      data.is_published,
      new Date(data.created_at),
      new Date(data.updated_at)
    );
  }

  isAccessible(): boolean {
    return this.isPublished;
  }

  getDurationFormatted(): string {
    if (!this.durationMinutes) return "Duración no especificada";

    const hours = Math.floor(this.durationMinutes / 60);
    const minutes = this.durationMinutes % 60;

    if (hours > 0 && minutes > 0) {
      return `${hours}h ${minutes}min`;
    } else if (hours > 0) {
      return `${hours}h`;
    } else {
      return `${minutes}min`;
    }
  }
}
