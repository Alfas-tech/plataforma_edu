/// <reference types="jest" />
import { CourseTopicEntity } from "@/src/core/entities/CourseTopic.entity";
import type { TopicData } from "@/src/core/types/course.types";

declare const describe: any;
declare const it: any;
declare const expect: any;

describe("CourseTopicEntity", () => {
  const baseTopicData: TopicData = {
    id: "topic-123",
    course_version_id: "version-456",
    title: "Introducción",
    description: "Descripción inicial",
    order_index: 3,
    created_at: "2025-01-01T10:00:00.000Z",
    updated_at: "2025-01-02T12:00:00.000Z",
  };

  describe("fromDatabase", () => {
    it("creates an entity with mapped properties", () => {
      const entity = CourseTopicEntity.fromDatabase(baseTopicData);

      expect(entity.id).toBe(baseTopicData.id);
      expect(entity.courseVersionId).toBe(baseTopicData.course_version_id);
      expect(entity.title).toBe(baseTopicData.title);
      expect(entity.description).toBe(baseTopicData.description);
      expect(entity.orderIndex).toBe(baseTopicData.order_index);
      expect(entity.createdAt).toEqual(new Date(baseTopicData.created_at));
      expect(entity.updatedAt).toEqual(new Date(baseTopicData.updated_at));
    });
  });

  describe("withOrder", () => {
    it("returns a new entity instance with the updated order index", () => {
      const original = CourseTopicEntity.fromDatabase(baseTopicData);
      const reordered = original.withOrder(7);

      expect(reordered).not.toBe(original);
      expect(reordered.orderIndex).toBe(7);
      expect(reordered.id).toBe(original.id);
      expect(reordered.title).toBe(original.title);
      expect(reordered.createdAt).toEqual(original.createdAt);
    });
  });
});
