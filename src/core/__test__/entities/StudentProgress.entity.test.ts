import { StudentProgressEntity } from "@/src/core/entities/StudentProgress.entity";
import { StudentProgressData } from "@/src/core/types/course.types";

describe("StudentProgressEntity", () => {
  describe("constructor", () => {
    it("should create a StudentProgressEntity with all properties", () => {
      const completedAt = new Date("2024-01-15");
      const lastAccessedAt = new Date("2024-01-15T14:00:00Z");

      const progress = new StudentProgressEntity(
        "progress-1",
        "student-1",
        "topic-1",
        true,
        completedAt,
        lastAccessedAt
      );

      expect(progress.id).toBe("progress-1");
      expect(progress.studentId).toBe("student-1");
      expect(progress.topicId).toBe("topic-1");
      expect(progress.completed).toBe(true);
      expect(progress.completedAt).toBe(completedAt);
      expect(progress.lastAccessedAt).toBe(lastAccessedAt);
    });

    it("should create a StudentProgressEntity with null completedAt", () => {
      const lastAccessedAt = new Date("2024-01-15T14:00:00Z");

      const progress = new StudentProgressEntity(
        "progress-1",
        "student-1",
        "topic-1",
        false,
        null,
        lastAccessedAt
      );

      expect(progress.completed).toBe(false);
      expect(progress.completedAt).toBeNull();
      expect(progress.lastAccessedAt).toBe(lastAccessedAt);
    });
  });

  describe("fromDatabase", () => {
    it("should create StudentProgressEntity from database data with completed_at", () => {
      const data: StudentProgressData = {
        id: "progress-1",
        student_id: "student-1",
        topic_id: "topic-1",
        completed: true,
        completed_at: "2024-01-15T10:30:00Z",
        last_accessed_at: "2024-01-15T14:00:00Z",
      };

      const progress = StudentProgressEntity.fromDatabase(data);

      expect(progress.id).toBe("progress-1");
      expect(progress.studentId).toBe("student-1");
      expect(progress.topicId).toBe("topic-1");
      expect(progress.completed).toBe(true);
      expect(progress.completedAt).toBeInstanceOf(Date);
      expect(progress.completedAt?.toISOString()).toBe(
        "2024-01-15T10:30:00.000Z"
      );
      expect(progress.lastAccessedAt).toBeInstanceOf(Date);
    });

    it("should create StudentProgressEntity from database data with null completed_at", () => {
      const data: StudentProgressData = {
        id: "progress-2",
        student_id: "student-2",
        topic_id: "topic-2",
        completed: false,
        completed_at: null,
        last_accessed_at: "2024-01-15T14:00:00Z",
      };

      const progress = StudentProgressEntity.fromDatabase(data);

      expect(progress.id).toBe("progress-2");
      expect(progress.completed).toBe(false);
      expect(progress.completedAt).toBeNull();
      expect(progress.lastAccessedAt).toBeInstanceOf(Date);
    });
  });

  describe("isCompleted", () => {
    it("should return true when progress is completed", () => {
      const progress = new StudentProgressEntity(
        "progress-1",
        "student-1",
        "topic-1",
        true,
        new Date(),
        new Date()
      );

      expect(progress.isCompleted()).toBe(true);
    });

    it("should return false when progress is not completed", () => {
      const progress = new StudentProgressEntity(
        "progress-1",
        "student-1",
        "topic-1",
        false,
        null,
        new Date()
      );

      expect(progress.isCompleted()).toBe(false);
    });
  });
});
