import { SupabaseLessonRepository } from "@/src/infrastructure/repositories/SupabaseLessonRepository";
import { createClient } from "@/src/infrastructure/supabase/server";
import { LessonEntity } from "@/src/core/entities/Lesson.entity";

jest.mock("@/src/infrastructure/supabase/server", () => ({
  createClient: jest.fn(),
}));

describe("SupabaseLessonRepository", () => {
  let repository: SupabaseLessonRepository;
  let mockSupabase: any;

  beforeEach(() => {
    mockSupabase = {
      from: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      insert: jest.fn().mockReturnThis(),
      update: jest.fn().mockReturnThis(),
      delete: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      single: jest.fn().mockResolvedValue({ data: null, error: null }),
      order: jest.fn().mockReturnThis(),
    };

    (createClient as jest.Mock).mockReturnValue(mockSupabase);
    repository = new SupabaseLessonRepository();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("getLessonsByModuleId", () => {
    it("should return lessons for a module", async () => {
      const mockLessons = [
        {
          id: "lesson-1",
          module_id: "module-1",
          title: "Lesson 1",
          content: "Content",
          order_index: 1,
          duration_minutes: 30,
          is_published: true,
          created_at: "2024-01-01",
          updated_at: "2024-01-01",
        },
      ];

      mockSupabase.order.mockResolvedValue({ data: mockLessons, error: null });

      const result = await repository.getLessonsByModuleId("module-1");

      expect(result).toHaveLength(1);
      expect(result[0]).toBeInstanceOf(LessonEntity);
      expect(result[0].title).toBe("Lesson 1");
    });

    it("should return empty array when no lessons found", async () => {
      mockSupabase.order.mockResolvedValue({ data: [], error: null });

      const result = await repository.getLessonsByModuleId("module-1");

      expect(result).toEqual([]);
    });

    it("should return empty array when query fails", async () => {
      mockSupabase.order.mockResolvedValue({
        data: null,
        error: { message: "Query failed" },
      });

      const result = await repository.getLessonsByModuleId("module-1");
      expect(result).toEqual([]);
    });
  });

  describe("getLessonById", () => {
    it("should return lesson by id", async () => {
      const mockLesson = {
        id: "lesson-1",
        module_id: "module-1",
        title: "Lesson 1",
        content: "Content",
        order_index: 1,
        duration_minutes: 30,
        is_published: true,
        created_at: "2024-01-01",
        updated_at: "2024-01-01",
      };

      mockSupabase.single.mockResolvedValue({ data: mockLesson, error: null });

      const result = await repository.getLessonById("lesson-1");

      expect(result).not.toBeNull();
      expect(result?.id).toBe("lesson-1");
    });

    it("should return null when lesson not found", async () => {
      mockSupabase.single.mockResolvedValue({ data: null, error: null });

      const result = await repository.getLessonById("non-existent");

      expect(result).toBeNull();
    });
  });

  describe("createLesson", () => {
    it("should create a new lesson", async () => {
      const lessonData = {
        module_id: "module-1",
        title: "New Lesson",
        content: "Content",
        order_index: 1,
        duration_minutes: 45,
        is_published: false,
      };

      const mockCreatedLesson = {
        id: "lesson-1",
        ...lessonData,
        created_at: "2024-01-01",
        updated_at: "2024-01-01",
      };

      mockSupabase.single.mockResolvedValue({
        data: mockCreatedLesson,
        error: null,
      });

      const result = await repository.createLesson(lessonData);

      expect(result).toBeInstanceOf(LessonEntity);
      expect(result.title).toBe("New Lesson");
    });

    it("should throw error when creation fails", async () => {
      mockSupabase.single.mockResolvedValue({
        data: null,
        error: { message: "Creation failed" },
      });

      await expect(
        repository.createLesson({
          module_id: "module-1",
          title: "New Lesson",
          content: "Content",
          order_index: 1,
        })
      ).rejects.toThrow("Error al crear lección");
    });
  });

  describe("updateLesson", () => {
    it("should update lesson", async () => {
      const updateData = {
        title: "Updated Lesson",
        is_published: true,
      };

      const mockUpdatedLesson = {
        id: "lesson-1",
        module_id: "module-1",
        ...updateData,
        content: "Content",
        order_index: 1,
        duration_minutes: 30,
        created_at: "2024-01-01",
        updated_at: "2024-01-02",
      };

      mockSupabase.single.mockResolvedValue({
        data: mockUpdatedLesson,
        error: null,
      });

      const result = await repository.updateLesson("lesson-1", updateData);

      expect(result).toBeInstanceOf(LessonEntity);
      expect(result.title).toBe("Updated Lesson");
    });

    it("should throw error when update fails", async () => {
      mockSupabase.single.mockResolvedValue({
        data: null,
        error: { message: "Update failed" },
      });

      await expect(
        repository.updateLesson("lesson-1", { title: "New Title" })
      ).rejects.toThrow();
    });
  });

  describe("deleteLesson", () => {
    it("should delete lesson", async () => {
      mockSupabase.eq.mockResolvedValue({ data: {}, error: null });

      await expect(repository.deleteLesson("lesson-1")).resolves.not.toThrow();
    });

    it("should throw error when delete fails", async () => {
      mockSupabase.eq.mockResolvedValue({
        data: null,
        error: { message: "Delete failed" },
      });

      await expect(repository.deleteLesson("lesson-1")).rejects.toThrow(
        "Error al eliminar lección"
      );
    });
  });
});
