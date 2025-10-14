import { CourseData } from "../types/course.types";

export class CourseEntity {
  constructor(
    public readonly id: string,
    public readonly title: string,
    public readonly description: string | null,
    public readonly startDate: Date,
    public readonly endDate: Date,
    public readonly isActive: boolean,
    public readonly createdBy: string | null,
    public readonly createdAt: Date,
    public readonly updatedAt: Date
  ) {}

  static fromDatabase(data: CourseData): CourseEntity {
    return new CourseEntity(
      data.id,
      data.title,
      data.description,
      new Date(data.start_date),
      new Date(data.end_date),
      data.is_active,
      data.created_by,
      new Date(data.created_at),
      new Date(data.updated_at)
    );
  }

  isCurrentlyActive(): boolean {
    const now = new Date();
    return this.isActive && this.startDate <= now && this.endDate >= now;
  }

  hasStarted(): boolean {
    return new Date() >= this.startDate;
  }

  hasEnded(): boolean {
    return new Date() > this.endDate;
  }

  getDaysRemaining(): number {
    const now = new Date();
    const diffTime = this.endDate.getTime() - now.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }

  getDaysUntilStart(): number {
    const now = new Date();
    const diffTime = this.startDate.getTime() - now.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }

  getStatus(): "upcoming" | "active" | "ended" {
    if (!this.hasStarted()) return "upcoming";
    if (this.hasEnded()) return "ended";
    return "active";
  }
}
