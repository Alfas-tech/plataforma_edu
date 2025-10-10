import { StudentProgressData } from '../types/course.types';

export class StudentProgressEntity {
  constructor(
    public readonly id: string,
    public readonly studentId: string,
    public readonly lessonId: string,
    public readonly completed: boolean,
    public readonly completedAt: Date | null,
    public readonly timeSpentMinutes: number
  ) {}

  static fromDatabase(data: StudentProgressData): StudentProgressEntity {
    return new StudentProgressEntity(
      data.id,
      data.student_id,
      data.lesson_id,
      data.completed,
      data.completed_at ? new Date(data.completed_at) : null,
      data.time_spent_minutes
    );
  }

  isCompleted(): boolean {
    return this.completed;
  }

  getTimeSpentFormatted(): string {
    if (this.timeSpentMinutes === 0) return 'Sin tiempo registrado';

    const hours = Math.floor(this.timeSpentMinutes / 60);
    const minutes = this.timeSpentMinutes % 60;

    if (hours > 0 && minutes > 0) {
      return `${hours}h ${minutes}min`;
    } else if (hours > 0) {
      return `${hours}h`;
    } else {
      return `${minutes}min`;
    }
  }
}
