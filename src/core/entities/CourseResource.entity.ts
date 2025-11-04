import { ResourceData, ResourceType } from "../types/course.types";

export class CourseResourceEntity {
  constructor(
    public readonly id: string,
    public readonly topicId: string,
    public readonly title: string,
    public readonly description: string | null,
    public readonly resourceType: ResourceType,
    public readonly fileUrl: string | null,
    public readonly fileName: string | null,
    public readonly fileSize: number | null,
    public readonly mimeType: string | null,
    public readonly externalUrl: string | null,
    public readonly orderIndex: number,
    public readonly createdAt: Date,
    public readonly updatedAt: Date
  ) {}

  static fromDatabase(data: ResourceData): CourseResourceEntity {
    return new CourseResourceEntity(
      data.id,
      data.topic_id,
      data.title,
      data.description,
      data.resource_type,
      data.file_url,
      data.file_name,
      data.file_size,
      data.mime_type,
      data.external_url,
      data.order_index,
      new Date(data.created_at),
      new Date(data.updated_at)
    );
  }

  isExternal(): boolean {
    return this.resourceType === "link";
  }

  hasFile(): boolean {
    return this.fileUrl !== null;
  }
}
