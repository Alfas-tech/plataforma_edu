import { TopicData } from "../types/course.types";

export class CourseTopicEntity {
  constructor(
    public readonly id: string,
    public readonly courseVersionId: string,
    public readonly title: string,
    public readonly description: string | null,
    public readonly orderIndex: number,
    public readonly createdAt: Date,
    public readonly updatedAt: Date
  ) {}

  static fromDatabase(data: TopicData): CourseTopicEntity {
    return new CourseTopicEntity(
      data.id,
      data.course_version_id,
      data.title,
      data.description,
      data.order_index,
      new Date(data.created_at),
      new Date(data.updated_at)
    );
  }

  withOrder(orderIndex: number): CourseTopicEntity {
    return new CourseTopicEntity(
      this.id,
      this.courseVersionId,
      this.title,
      this.description,
      orderIndex,
      this.createdAt,
      this.updatedAt
    );
  }
}
