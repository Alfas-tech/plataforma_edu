import { SupabaseStudentRepository } from "@/src/infrastructure/repositories/SupabaseStudentRepository";
import { createClient } from "@/src/infrastructure/supabase/server";

// Mock Supabase client
jest.mock("@/src/infrastructure/supabase/server", () => ({
  createClient: jest.fn(),
}));

describe("SupabaseStudentRepository", () => {
  let repository: SupabaseStudentRepository;
  let mockSupabase: any;

  beforeEach(() => {
    // Create a more comprehensive mock
    const createMockChain = () => ({
      from: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      single: jest.fn().mockReturnThis(),
      insert: jest.fn().mockReturnThis(),
      update: jest.fn().mockReturnThis(),
      order: jest.fn().mockReturnThis(),
    });

    mockSupabase = createMockChain();

    (createClient as jest.Mock).mockReturnValue(mockSupabase);
    repository = new SupabaseStudentRepository();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("getCourseWithModulesAndLessons", () => {
    it("should successfully get course with modules and lessons", async () => {
      const courseId = "course-123";
      const studentId = "student-456";

      // Reset mock for clean state
      jest.clearAllMocks();
      
      let callCount = 0;
      
      // Create separate mocks for each database call
      (createClient as jest.Mock).mockReturnValue({
        from: jest.fn().mockImplementation((table) => {
          callCount++;
          
          // First call: courses
          if (callCount === 1) {
            return {
              select: jest.fn().mockReturnValue({
                eq: jest.fn().mockReturnValue({
                  single: jest.fn().mockResolvedValue({
                    data: {
                      id: "course-123",
                      title: "Python Programming",
                      description: "Learn Python",
                      active_version_id: "version-1",
                    },
                    error: null,
                  }),
                }),
              }),
            };
          }
          
          // Second call: modules
          if (callCount === 2) {
            return {
              select: jest.fn().mockReturnValue({
                eq: jest.fn().mockReturnValue({
                  eq: jest.fn().mockReturnValue({
                    eq: jest.fn().mockReturnValue({
                      order: jest.fn().mockResolvedValue({
                        data: [
                          {
                            id: "module-1",
                            course_id: "course-123",
                            course_version_id: "version-1",
                            title: "Module 1",
                            description: "First module",
                            order_index: 1,
                            is_published: true,
                          },
                        ],
                        error: null,
                      }),
                    }),
                  }),
                }),
              }),
            };
          }
          
          // Third call: lessons
          if (callCount === 3) {
            return {
              select: jest.fn().mockReturnValue({
                eq: jest.fn().mockReturnValue({
                  eq: jest.fn().mockReturnValue({
                    order: jest.fn().mockResolvedValue({
                      data: [
                        {
                          id: "lesson-1",
                          module_id: "module-1",
                          title: "Lesson 1",
                          content: "Content",
                          order_index: 1,
                          duration_minutes: 30,
                          is_published: true,
                        },
                      ],
                      error: null,
                    }),
                  }),
                }),
              }),
            };
          }
          
          // Fourth call: progress
          if (callCount === 4) {
            return {
              select: jest.fn().mockReturnValue({
                eq: jest.fn().mockResolvedValue({
                  data: [
                    {
                      student_id: "student-456",
                      lesson_id: "lesson-1",
                      completed: true,
                      completed_at: "2025-10-28T10:00:00Z",
                    },
                  ],
                  error: null,
                }),
              }),
            };
          }
          
          return {
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnThis(),
          };
        }),
      });

      repository = new SupabaseStudentRepository();
      const result = await repository.getCourseWithModulesAndLessons(
        courseId,
        studentId
      );

      expect(result.course.id).toBe("course-123");
      expect(result.course.title).toBe("Python Programming");
      expect(result.modules).toHaveLength(1);
      expect(result.modules[0].title).toBe("Module 1");
      expect(result.modules[0].lessons).toHaveLength(1);
      expect(result.modules[0].lessons[0].title).toBe("Lesson 1");
      expect(result.progress).toHaveLength(1);
      expect(result.progress[0].completed).toBe(true);
    });

    it("should convert snake_case to camelCase", async () => {
      const courseId = "course-123";
      const studentId = "student-456";

      jest.clearAllMocks();
      let callCount = 0;

      (createClient as jest.Mock).mockReturnValue({
        from: jest.fn().mockImplementation((table) => {
          callCount++;
          
          if (callCount === 1) {
            return {
              select: jest.fn().mockReturnValue({
                eq: jest.fn().mockReturnValue({
                  single: jest.fn().mockResolvedValue({
                    data: {
                      id: "course-123",
                      title: "Course",
                      description: null,
                      active_version_id: "version-1",
                    },
                    error: null,
                  }),
                }),
              }),
            };
          }
          
          if (callCount === 2) {
            return {
              select: jest.fn().mockReturnValue({
                eq: jest.fn().mockReturnValue({
                  eq: jest.fn().mockReturnValue({
                    eq: jest.fn().mockReturnValue({
                      order: jest.fn().mockResolvedValue({
                        data: [
                          {
                            id: "module-1",
                            course_id: "course-123",
                            course_version_id: "version-1",
                            title: "Module",
                            description: null,
                            order_index: 1,
                            is_published: true,
                          },
                        ],
                        error: null,
                      }),
                    }),
                  }),
                }),
              }),
            };
          }
          
          if (callCount === 3) {
            return {
              select: jest.fn().mockReturnValue({
                eq: jest.fn().mockReturnValue({
                  eq: jest.fn().mockReturnValue({
                    order: jest.fn().mockResolvedValue({
                      data: [
                        {
                          id: "lesson-1",
                          module_id: "module-1",
                          title: "Lesson",
                          content: null,
                          order_index: 1,
                          duration_minutes: 20,
                          is_published: true,
                        },
                      ],
                      error: null,
                    }),
                  }),
                }),
              }),
            };
          }
          
          if (callCount === 4) {
            return {
              select: jest.fn().mockReturnValue({
                eq: jest.fn().mockResolvedValue({
                  data: [],
                  error: null,
                }),
              }),
            };
          }
          
          return {
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnThis(),
          };
        }),
      });

      repository = new SupabaseStudentRepository();
      const result = await repository.getCourseWithModulesAndLessons(
        courseId,
        studentId
      );

      // Verify camelCase conversion
      expect(result.course.activeVersionId).toBe("version-1");
      expect(result.modules[0].courseId).toBe("course-123");
      expect(result.modules[0].courseVersionId).toBe("version-1");
      expect(result.modules[0].orderIndex).toBe(1);
      expect(result.modules[0].isPublished).toBe(true);
      expect(result.modules[0].lessons[0].moduleId).toBe("module-1");
      expect(result.modules[0].lessons[0].orderIndex).toBe(1);
      expect(result.modules[0].lessons[0].durationMinutes).toBe(20);
      expect(result.modules[0].lessons[0].isPublished).toBe(true);
    });

    it("should throw error when course not found", async () => {
      const courseId = "invalid-course";
      const studentId = "student-456";

      mockSupabase.single.mockResolvedValueOnce({
        data: null,
        error: { message: "Course not found" },
      });

      await expect(
        repository.getCourseWithModulesAndLessons(courseId, studentId)
      ).rejects.toThrow("Course not found");
    });

    it("should throw error when course has no active version", async () => {
      const courseId = "course-123";
      const studentId = "student-456";

      mockSupabase.single.mockResolvedValueOnce({
        data: {
          id: "course-123",
          title: "Course",
          description: null,
          active_version_id: null,
        },
        error: null,
      });

      await expect(
        repository.getCourseWithModulesAndLessons(courseId, studentId)
      ).rejects.toThrow("El curso no tiene una versión activa");
    });
  });

  describe("getStudentProgress", () => {
    it("should get all progress for a student", async () => {
      const studentId = "student-456";

      mockSupabase.eq.mockResolvedValueOnce({
        data: [
          {
            student_id: "student-456",
            lesson_id: "lesson-1",
            completed: true,
            completed_at: "2025-10-28T10:00:00Z",
          },
          {
            student_id: "student-456",
            lesson_id: "lesson-2",
            completed: false,
            completed_at: null,
          },
        ],
        error: null,
      });

      const result = await repository.getStudentProgress(studentId);

      expect(result).toHaveLength(2);
      expect(result[0].studentId).toBe("student-456");
      expect(result[0].lessonId).toBe("lesson-1");
      expect(result[0].completed).toBe(true);
      expect(result[1].completed).toBe(false);
    });

    it("should throw error when database query fails", async () => {
      const studentId = "student-456";

      mockSupabase.eq.mockResolvedValueOnce({
        data: null,
        error: { message: "Database error" },
      });

      await expect(repository.getStudentProgress(studentId)).rejects.toThrow(
        "Database error"
      );
    });
  });

  describe("markLessonComplete", () => {
    it("should insert new progress when it doesn't exist", async () => {
      const lessonId = "lesson-123";
      const studentId = "student-456";

      jest.clearAllMocks();

      // No existing progress
      const mockClient = {
        from: jest.fn().mockReturnValue({
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                single: jest.fn().mockResolvedValue({
                  data: null,
                  error: null,
                }),
              }),
            }),
          }),
          insert: jest.fn().mockResolvedValue({
            error: null,
          }),
        }),
      };

      (createClient as jest.Mock).mockReturnValue(mockClient);
      repository = new SupabaseStudentRepository();

      const result = await repository.markLessonComplete(lessonId, studentId);

      expect(result.success).toBe(true);
    });

    it("should update existing progress", async () => {
      const lessonId = "lesson-123";
      const studentId = "student-456";

      jest.clearAllMocks();

      let callCount = 0;
      const mockClient = {
        from: jest.fn().mockImplementation(() => {
          callCount++;
          
          // First call: check existing progress
          if (callCount === 1) {
            return {
              select: jest.fn().mockReturnValue({
                eq: jest.fn().mockReturnValue({
                  eq: jest.fn().mockReturnValue({
                    single: jest.fn().mockResolvedValue({
                      data: {
                        student_id: "student-456",
                        lesson_id: "lesson-123",
                        completed: false,
                        completed_at: null,
                      },
                      error: null,
                    }),
                  }),
                }),
              }),
            };
          }
          
          // Second call: update
          if (callCount === 2) {
            return {
              update: jest.fn().mockReturnValue({
                eq: jest.fn().mockReturnValue({
                  eq: jest.fn().mockResolvedValue({
                    error: null,
                  }),
                }),
              }),
            };
          }
        }),
      };

      (createClient as jest.Mock).mockReturnValue(mockClient);
      repository = new SupabaseStudentRepository();

      const result = await repository.markLessonComplete(lessonId, studentId);

      expect(result.success).toBe(true);
    });

    it("should return error when insert fails", async () => {
      const lessonId = "lesson-123";
      const studentId = "student-456";

      jest.clearAllMocks();

      const mockClient = {
        from: jest.fn().mockReturnValue({
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                single: jest.fn().mockResolvedValue({
                  data: null,
                  error: null,
                }),
              }),
            }),
          }),
          insert: jest.fn().mockResolvedValue({
            error: { message: "Insert failed" },
          }),
        }),
      };

      (createClient as jest.Mock).mockReturnValue(mockClient);
      repository = new SupabaseStudentRepository();

      const result = await repository.markLessonComplete(lessonId, studentId);

      expect(result.success).toBe(false);
      expect(result.error).toBe("Insert failed");
    });
  });

  describe("markLessonIncomplete", () => {
    it("should update lesson to incomplete", async () => {
      const lessonId = "lesson-123";
      const studentId = "student-456";

      jest.clearAllMocks();

      const mockClient = {
        from: jest.fn().mockReturnValue({
          update: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              eq: jest.fn().mockResolvedValue({
                error: null,
              }),
            }),
          }),
        }),
      };

      (createClient as jest.Mock).mockReturnValue(mockClient);
      repository = new SupabaseStudentRepository();

      const result = await repository.markLessonIncomplete(lessonId, studentId);

      expect(result.success).toBe(true);
    });

    it("should return error when update fails", async () => {
      const lessonId = "lesson-123";
      const studentId = "student-456";

      jest.clearAllMocks();

      const mockClient = {
        from: jest.fn().mockReturnValue({
          update: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              eq: jest.fn().mockResolvedValue({
                error: { message: "Update failed" },
              }),
            }),
          }),
        }),
      };

      (createClient as jest.Mock).mockReturnValue(mockClient);
      repository = new SupabaseStudentRepository();

      const result = await repository.markLessonIncomplete(lessonId, studentId);

      expect(result.success).toBe(false);
      expect(result.error).toBe("Update failed");
    });
  });
});
