import { SupabaseModuleRepository } from "@/src/infrastructure/repositories/SupabaseModuleRepository";
import { createClient } from "@/src/infrastructure/supabase/server";
import { CourseModuleEntity } from "@/src/core/entities/CourseModule.entity";

jest.mock("@/src/infrastructure/supabase/server", () => ({
  createClient: jest.fn(),
}));

describe("SupabaseModuleRepository", () => {
  let repository: SupabaseModuleRepository;
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
    repository = new SupabaseModuleRepository();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("getModulesByCourseId", () => {
    it("should return modules for a course", async () => {
      const mockModules = [
        {
          id: "module-1",
          course_id: "course-1",
          title: "Module 1",
          description: "Description",
          order_index: 1,
          content: "Content",
          is_published: true,
          created_at: "2024-01-01",
          updated_at: "2024-01-01",
        },
      ];

      mockSupabase.order.mockResolvedValue({ data: mockModules, error: null });

      const result = await repository.getModulesByCourseId("course-1");

      expect(result).toHaveLength(1);
      expect(result[0]).toBeInstanceOf(CourseModuleEntity);
      expect(result[0].title).toBe("Module 1");
    });

    it("should return empty array when no modules found", async () => {
      mockSupabase.order.mockResolvedValue({ data: [], error: null });

      const result = await repository.getModulesByCourseId("course-1");

      expect(result).toEqual([]);
    });

    it("should return empty array when query fails", async () => {
      mockSupabase.order.mockResolvedValue({
        data: null,
        error: { message: "Query failed" },
      });

      const result = await repository.getModulesByCourseId("course-1");
      expect(result).toEqual([]);
    });
  });

  describe("getModuleById", () => {
    it("should return module by id", async () => {
      const mockModule = {
        id: "module-1",
        course_id: "course-1",
        title: "Module 1",
        description: "Description",
        order_index: 1,
        content: "Content",
        is_published: true,
        created_at: "2024-01-01",
        updated_at: "2024-01-01",
      };

      mockSupabase.single.mockResolvedValue({ data: mockModule, error: null });

      const result = await repository.getModuleById("module-1");

      expect(result).not.toBeNull();
      expect(result?.id).toBe("module-1");
    });

    it("should return null when module not found", async () => {
      mockSupabase.single.mockResolvedValue({ data: null, error: null });

      const result = await repository.getModuleById("non-existent");

      expect(result).toBeNull();
    });
  });

  describe("createModule", () => {
    it("should create a new module", async () => {
      const moduleData = {
        course_id: "course-1",
        title: "New Module",
        description: "Description",
        order_index: 1,
        content: "Content",
        is_published: false,
      };

      const mockCreatedModule = {
        id: "module-1",
        ...moduleData,
        created_at: "2024-01-01",
        updated_at: "2024-01-01",
      };

      mockSupabase.single.mockResolvedValue({
        data: mockCreatedModule,
        error: null,
      });

      const result = await repository.createModule(moduleData);

      expect(result).toBeInstanceOf(CourseModuleEntity);
      expect(result.title).toBe("New Module");
    });

    it("should throw error when creation fails", async () => {
      mockSupabase.single.mockResolvedValue({
        data: null,
        error: { message: "Creation failed" },
      });

      await expect(
        repository.createModule({
          course_id: "course-1",
          title: "New Module",
          order_index: 1,
        })
      ).rejects.toThrow("Error al crear módulo");
    });
  });

  describe("updateModule", () => {
    it("should update module", async () => {
      const updateData = {
        title: "Updated Module",
        is_published: true,
      };

      const mockUpdatedModule = {
        id: "module-1",
        course_id: "course-1",
        ...updateData,
        description: "Description",
        order_index: 1,
        content: "Content",
        created_at: "2024-01-01",
        updated_at: "2024-01-02",
      };

      mockSupabase.single.mockResolvedValue({
        data: mockUpdatedModule,
        error: null,
      });

      const result = await repository.updateModule("module-1", updateData);

      expect(result).toBeInstanceOf(CourseModuleEntity);
      expect(result.title).toBe("Updated Module");
    });

    it("should throw error when update fails", async () => {
      mockSupabase.single.mockResolvedValue({
        data: null,
        error: { message: "Update failed" },
      });

      await expect(
        repository.updateModule("module-1", { title: "New Title" })
      ).rejects.toThrow();
    });
  });

  describe("deleteModule", () => {
    it("should delete module", async () => {
      mockSupabase.eq.mockResolvedValue({ data: {}, error: null });

      await expect(repository.deleteModule("module-1")).resolves.not.toThrow();
    });

    it("should throw error when delete fails", async () => {
      mockSupabase.eq.mockResolvedValue({
        data: null,
        error: { message: "Delete failed" },
      });

      await expect(repository.deleteModule("module-1")).rejects.toThrow(
        "Error al eliminar módulo"
      );
    });
  });
});
