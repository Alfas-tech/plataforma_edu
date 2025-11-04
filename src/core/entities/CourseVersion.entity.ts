import { CourseStatus, CourseVersionData } from "@/src/core/types/course.types";

export class CourseVersionEntity {
  constructor(
    public readonly id: string,
    public readonly courseId: string,
    public readonly versionNumber: number,
    public readonly title: string,
    public readonly description: string | null,
    public readonly content: string | null,
    public readonly status: CourseStatus,
    public readonly startDate: Date | null,
    public readonly endDate: Date | null,
    public readonly publishedAt: Date | null,
    public readonly publishedBy: string | null,
    public readonly createdAt: Date,
    public readonly updatedAt: Date
  ) {}

  static fromDatabase(data: CourseVersionData): CourseVersionEntity {
    return new CourseVersionEntity(
      data.id,
      data.course_id,
      data.version_number,
      data.title,
      data.description,
      data.content,
      data.status,
      data.start_date ? new Date(data.start_date) : null,
      data.end_date ? new Date(data.end_date) : null,
      data.published_at ? new Date(data.published_at) : null,
      data.published_by,
      new Date(data.created_at),
      new Date(data.updated_at)
    );
  }

  isDraft(): boolean {
    return this.status === "draft";
  }

  isActive(): boolean {
    return this.status === "active";
  }

  isArchived(): boolean {
    return this.status === "archived";
  }

  get versionLabel(): string {
    if (this.title) {
      return this.title;
    }
    return `v${this.versionNumber}`;
  }

  get summary(): string | null {
    return this.description;
  }

  isPublished(): boolean {
    return this.status === "active";
  }
}
