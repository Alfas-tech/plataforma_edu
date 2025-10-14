import { CourseModuleData } from "../types/course.types";

export class CourseModuleEntity {
  constructor(
    public readonly id: string,
    public readonly courseId: string,
    public readonly title: string,
    public readonly description: string | null,
    public readonly orderIndex: number,
    public readonly content: string | null,
    public readonly isPublished: boolean,
    public readonly createdAt: Date,
    public readonly updatedAt: Date
  ) {}

  static fromDatabase(data: CourseModuleData): CourseModuleEntity {
    return new CourseModuleEntity(
      data.id,
      data.course_id,
      data.title,
      data.description,
      data.order_index,
      data.content,
      data.is_published,
      new Date(data.created_at),
      new Date(data.updated_at)
    );
  }

  isAccessible(): boolean {
    return this.isPublished;
  }
}
