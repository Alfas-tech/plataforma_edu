/// <reference types="jest" />
import { CourseResourceEntity } from "@/src/core/entities/CourseResource.entity";
import type { ResourceData } from "@/src/core/types/course.types";

declare const describe: any;
declare const it: any;
declare const expect: any;

describe("CourseResourceEntity", () => {
  const baseResourceData: ResourceData = {
    id: "resource-789",
    topic_id: "topic-123",
    title: "Documento PDF",
    description: "Un archivo informativo",
    resource_type: "pdf",
    file_url: "courses/course-123/resources/info.pdf",
    file_name: "info.pdf",
    file_size: 1024,
    mime_type: "application/pdf",
    external_url: null,
    order_index: 2,
    created_at: "2025-01-03T09:00:00.000Z",
    updated_at: "2025-01-04T11:00:00.000Z",
  };

  describe("fromDatabase", () => {
    it("maps database fields to entity properties", () => {
      const entity = CourseResourceEntity.fromDatabase(baseResourceData);

      expect(entity.id).toBe(baseResourceData.id);
      expect(entity.topicId).toBe(baseResourceData.topic_id);
      expect(entity.title).toBe(baseResourceData.title);
      expect(entity.resourceType).toBe(baseResourceData.resource_type);
      expect(entity.fileUrl).toBe(baseResourceData.file_url);
      expect(entity.fileName).toBe(baseResourceData.file_name);
      expect(entity.fileSize).toBe(baseResourceData.file_size);
      expect(entity.mimeType).toBe(baseResourceData.mime_type);
      expect(entity.externalUrl).toBeNull();
      expect(entity.orderIndex).toBe(baseResourceData.order_index);
      expect(entity.createdAt).toEqual(new Date(baseResourceData.created_at));
      expect(entity.updatedAt).toEqual(new Date(baseResourceData.updated_at));
    });
  });

  describe("hasFile", () => {
    it("returns true when the resource has a file url", () => {
      const entity = CourseResourceEntity.fromDatabase(baseResourceData);

      expect(entity.hasFile()).toBe(true);
    });

    it("returns false when there is no file url", () => {
      const entity = CourseResourceEntity.fromDatabase({
        ...baseResourceData,
        file_url: null,
        file_name: null,
      });

      expect(entity.hasFile()).toBe(false);
    });
  });

  describe("isExternal", () => {
    it("returns true when the resource is a link", () => {
      const entity = CourseResourceEntity.fromDatabase({
        ...baseResourceData,
        resource_type: "link",
        external_url: "https://example.com",
        file_url: null,
      });

      expect(entity.isExternal()).toBe(true);
    });

    it("returns false for non-link resource types", () => {
      const entity = CourseResourceEntity.fromDatabase(baseResourceData);

      expect(entity.isExternal()).toBe(false);
    });
  });
});
