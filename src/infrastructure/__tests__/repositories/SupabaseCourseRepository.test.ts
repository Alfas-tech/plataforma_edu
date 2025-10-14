import { SupabaseCourseRepository } from "@/src/infrastructure/repositories/SupabaseCourseRepository";
import { createClient } from "@/src/infrastructure/supabase/server";
import { CourseEntity } from "@/src/core/entities/Course.entity";

// Mock Supabase client
jest.mock("@/src/infrastructure/supabase/server", () => ({
  createClient: jest.fn(),
}));

describe("SupabaseCourseRepository", () => {
  let repository: SupabaseCourseRepository;
  let mockSupabase: any;

  beforeEach(() => {
    // Create a proper chain mock
    const mockChain = {
      from: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      insert: jest.fn().mockReturnThis(),
      update: jest.fn().mockReturnThis(),
      delete: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      in: jest.fn().mockReturnThis(),
      single: jest.fn().mockResolvedValue({ data: null, error: null }),
      order: jest.fn().mockReturnThis(),
      rpc: jest.fn().mockResolvedValue({ data: null, error: null }),
      auth: {
        getUser: jest
          .fn()
          .mockResolvedValue({
            data: { user: { id: "user-123" } },
            error: null,
          }),
      },
    };

    mockSupabase = mockChain;
    (createClient as jest.Mock).mockReturnValue(mockSupabase);
    repository = new SupabaseCourseRepository();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("getAllCourses", () => {
    it("should return all courses", async () => {
      const mockCourses = [
        {
          id: "course-1",
          title: "Course 1",
          description: "Description 1",
          start_date: "2024-01-01",
          end_date: "2024-12-31",
          is_active: true,
          created_by: "admin-1",
          created_at: "2024-01-01",
          updated_at: "2024-01-01",
        },
      ];

      mockSupabase.order.mockResolvedValue({ data: mockCourses, error: null });

      const result = await repository.getAllCourses();

      expect(result).toHaveLength(1);
      expect(result[0]).toBeInstanceOf(CourseEntity);
      expect(result[0].title).toBe("Course 1");
      expect(mockSupabase.from).toHaveBeenCalledWith("courses");
    });

    it("should return empty array when database query fails", async () => {
      mockSupabase.order.mockResolvedValue({
        data: null,
        error: { message: "Database error" },
      });

      const result = await repository.getAllCourses();
      expect(result).toEqual([]);
    });
  });

  describe("getCourseById", () => {
    it("should return course by id", async () => {
      const mockCourse = {
        id: "course-1",
        title: "Course 1",
        description: "Description 1",
        start_date: "2024-01-01",
        end_date: "2024-12-31",
        is_active: true,
        created_by: "admin-1",
        created_at: "2024-01-01",
        updated_at: "2024-01-01",
      };

      mockSupabase.single.mockResolvedValue({ data: mockCourse, error: null });

      const result = await repository.getCourseById("course-1");

      expect(result).toBeInstanceOf(CourseEntity);
      expect(result?.id).toBe("course-1");
      expect(mockSupabase.eq).toHaveBeenCalledWith("id", "course-1");
    });

    it("should return null when course not found", async () => {
      mockSupabase.single.mockResolvedValue({ data: null, error: null });

      const result = await repository.getCourseById("non-existent");

      expect(result).toBeNull();
    });

    it("should return null when error occurs", async () => {
      mockSupabase.single.mockResolvedValue({
        data: null,
        error: { message: "Not found" },
      });

      const result = await repository.getCourseById("course-1");

      expect(result).toBeNull();
    });
  });

  describe("createCourse", () => {
    it("should create a new course", async () => {
      const courseData = {
        title: "New Course",
        description: "Description",
        start_date: "2024-01-01",
        end_date: "2024-12-31",
        is_active: true,
        created_by: "admin-1",
      };

      const mockCreatedCourse = {
        id: "course-1",
        ...courseData,
        created_at: "2024-01-01",
        updated_at: "2024-01-01",
      };

      mockSupabase.single.mockResolvedValue({
        data: mockCreatedCourse,
        error: null,
      });

      const result = await repository.createCourse(courseData);

      expect(result).toBeInstanceOf(CourseEntity);
      expect(result.title).toBe("New Course");
    });
  });

  describe("getCourseTeachers", () => {
    it("should return list of teacher IDs for a course", async () => {
      const mockTeachers = [
        { teacher_id: "teacher-1" },
        { teacher_id: "teacher-2" },
      ];

      mockSupabase.eq.mockResolvedValue({ data: mockTeachers, error: null });

      const result = await repository.getCourseTeachers("course-1");

      expect(result).toEqual(["teacher-1", "teacher-2"]);
      expect(mockSupabase.from).toHaveBeenCalledWith("course_teachers");
    });

    it("should return empty array when no teachers assigned", async () => {
      mockSupabase.eq.mockResolvedValue({ data: [], error: null });

      const result = await repository.getCourseTeachers("course-1");

      expect(result).toEqual([]);
    });

    it("should return empty array when query fails", async () => {
      mockSupabase.eq.mockResolvedValue({
        data: null,
        error: { message: "Query failed" },
      });

      const result = await repository.getCourseTeachers("course-1");
      expect(result).toEqual([]);
    });
  });

  describe("assignTeacher", () => {
    it("should assign teacher to course", async () => {
      mockSupabase.insert.mockResolvedValue({ data: {}, error: null });

      await expect(
        repository.assignTeacher("course-1", "teacher-1")
      ).resolves.not.toThrow();

      expect(mockSupabase.from).toHaveBeenCalledWith("course_teachers");
      expect(mockSupabase.insert).toHaveBeenCalledWith({
        course_id: "course-1",
        teacher_id: "teacher-1",
        assigned_by: "user-123",
      });
    });

    it("should throw error when assignment fails", async () => {
      mockSupabase.insert.mockResolvedValue({
        data: null,
        error: { message: "Assignment failed" },
      });

      await expect(
        repository.assignTeacher("course-1", "teacher-1")
      ).rejects.toThrow("Error al asignar docente");
    });
  });

  describe("removeTeacher", () => {
    it("should remove teacher from course", async () => {
      // Mock the chain: delete().eq().eq()
      const mockEqChain = {
        eq: jest.fn().mockResolvedValue({ data: {}, error: null }),
      };
      mockSupabase.eq.mockReturnValue(mockEqChain);

      await expect(
        repository.removeTeacher("course-1", "teacher-1")
      ).resolves.not.toThrow();

      expect(mockSupabase.from).toHaveBeenCalledWith("course_teachers");
    });

    it("should throw error when removal fails", async () => {
      const mockEqChain = {
        eq: jest.fn().mockResolvedValue({
          data: null,
          error: { message: "Removal failed" },
        }),
      };
      mockSupabase.eq.mockReturnValue(mockEqChain);

      await expect(
        repository.removeTeacher("course-1", "teacher-1")
      ).rejects.toThrow("Error al remover docente");
    });
  });

  describe("updateCourse", () => {
    it("should update course", async () => {
      const updateData = {
        title: "Updated Course",
        description: "Updated Description",
      };

      const mockUpdatedCourse = {
        id: "course-1",
        ...updateData,
        start_date: "2024-01-01",
        end_date: "2024-12-31",
        is_active: true,
        created_by: "admin-1",
        created_at: "2024-01-01",
        updated_at: "2024-01-02",
      };

      mockSupabase.single.mockResolvedValue({
        data: mockUpdatedCourse,
        error: null,
      });

      const result = await repository.updateCourse("course-1", updateData);

      expect(result).toBeInstanceOf(CourseEntity);
      expect(result.title).toBe("Updated Course");
      expect(mockSupabase.from).toHaveBeenCalledWith("courses");
    });

    it("should throw error when update fails", async () => {
      mockSupabase.single.mockResolvedValue({
        data: null,
        error: { message: "Update failed" },
      });

      await expect(
        repository.updateCourse("course-1", { title: "New Title" })
      ).rejects.toThrow("Error al actualizar el curso");
    });
  });

  describe("deleteCourse", () => {
    it("should delete course", async () => {
      mockSupabase.eq.mockResolvedValue({ data: {}, error: null });

      await expect(repository.deleteCourse("course-1")).resolves.not.toThrow();
      expect(mockSupabase.from).toHaveBeenCalledWith("courses");
    });

    it("should throw error when delete fails", async () => {
      mockSupabase.eq.mockResolvedValue({
        data: null,
        error: { message: "Delete failed" },
      });

      await expect(repository.deleteCourse("course-1")).rejects.toThrow(
        "Error al eliminar el curso"
      );
    });
  });

  describe("getActiveCourse", () => {
    it("should return active course when found", async () => {
      const mockCourse = {
        id: "course-1",
        title: "Active Course",
        description: "Description",
        start_date: "2024-01-01",
        end_date: "2024-12-31",
        is_active: true,
        created_by: "admin-1",
        created_at: "2024-01-01",
        updated_at: "2024-01-01",
      };

      mockSupabase.rpc.mockResolvedValue({ data: [mockCourse], error: null });

      const result = await repository.getActiveCourse();

      expect(result).toBeInstanceOf(CourseEntity);
      expect(result?.id).toBe("course-1");
      expect(mockSupabase.rpc).toHaveBeenCalledWith("get_active_course");
    });

    it("should return null when no active course found", async () => {
      mockSupabase.rpc.mockResolvedValue({ data: [], error: null });

      const result = await repository.getActiveCourse();

      expect(result).toBeNull();
    });

    it("should return null when rpc fails", async () => {
      mockSupabase.rpc.mockResolvedValue({
        data: null,
        error: { message: "RPC failed" },
      });

      const result = await repository.getActiveCourse();

      expect(result).toBeNull();
    });
  });

  describe("getTeacherCourses", () => {
    it("should return courses for a teacher", async () => {
      const mockCourseTeachers = [
        { course_id: "course-1" },
        { course_id: "course-2" },
      ];

      const mockCourses = [
        {
          id: "course-1",
          title: "Course 1",
          description: "Description 1",
          start_date: "2024-01-01",
          end_date: "2024-12-31",
          is_active: true,
          created_by: "admin-1",
          created_at: "2024-01-01",
          updated_at: "2024-01-01",
        },
        {
          id: "course-2",
          title: "Course 2",
          description: "Description 2",
          start_date: "2024-01-01",
          end_date: "2024-12-31",
          is_active: true,
          created_by: "admin-1",
          created_at: "2024-01-01",
          updated_at: "2024-01-01",
        },
      ];

      // First call for course_teachers
      mockSupabase.eq.mockResolvedValueOnce({
        data: mockCourseTeachers,
        error: null,
      });

      // Second call for courses
      mockSupabase.order.mockResolvedValueOnce({
        data: mockCourses,
        error: null,
      });

      const result = await repository.getTeacherCourses("teacher-1");

      expect(result).toHaveLength(2);
      expect(result[0]).toBeInstanceOf(CourseEntity);
      expect(result[0].title).toBe("Course 1");
    });

    it("should return empty array when teacher has no courses", async () => {
      mockSupabase.eq.mockResolvedValue({
        data: [],
        error: null,
      });

      const result = await repository.getTeacherCourses("teacher-1");

      expect(result).toEqual([]);
    });

    it("should throw error when fetching course_teachers fails", async () => {
      mockSupabase.eq.mockResolvedValue({
        data: null,
        error: { message: "Query failed" },
      });

      await expect(repository.getTeacherCourses("teacher-1")).rejects.toThrow(
        "Error al obtener cursos del docente"
      );
    });

    it("should throw error when fetching courses fails", async () => {
      mockSupabase.eq.mockResolvedValueOnce({
        data: [{ course_id: "course-1" }],
        error: null,
      });

      mockSupabase.order.mockResolvedValueOnce({
        data: null,
        error: { message: "Courses query failed" },
      });

      await expect(repository.getTeacherCourses("teacher-1")).rejects.toThrow(
        "Error al obtener cursos"
      );
    });

    it("should return empty array when courses data is null", async () => {
      mockSupabase.eq.mockResolvedValueOnce({
        data: [{ course_id: "course-1" }],
        error: null,
      });

      mockSupabase.order.mockResolvedValueOnce({
        data: null,
        error: null,
      });

      const result = await repository.getTeacherCourses("teacher-1");

      expect(result).toEqual([]);
    });
  });
});
