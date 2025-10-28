import { IStudentRepository } from "@/src/core/interfaces/repositories/IStudentRepository";
import {
  CourseWithModulesData,
  StudentProgress,
  MarkLessonResult,
  ModuleWithLessons,
  LessonWithProgress,
} from "@/src/core/types/student.types";
import { createClient } from "@/src/infrastructure/supabase/server";

/**
 * Supabase implementation of IStudentRepository
 * Handles all student-related database operations
 */
export class SupabaseStudentRepository implements IStudentRepository {
  async getCourseWithModulesAndLessons(
    courseId: string,
    studentId: string
  ): Promise<CourseWithModulesData> {
    const supabase = createClient();

    // Get course
    const { data: courseData, error: courseError } = await supabase
      .from("courses")
      .select("*")
      .eq("id", courseId)
      .single();

    if (courseError || !courseData) {
      throw new Error(courseError?.message || "Curso no encontrado");
    }

    // Ensure course has an active version
    const activeVersionId = courseData.active_version_id;
    if (!activeVersionId) {
      throw new Error("El curso no tiene una versión activa");
    }

    // Get published modules for the active version
    const { data: modulesData, error: modulesError } = await supabase
      .from("course_modules")
      .select("*")
      .eq("course_id", courseId)
      .eq("course_version_id", activeVersionId)
      .eq("is_published", true)
      .order("order_index", { ascending: true });

    if (modulesError) {
      throw new Error(modulesError.message);
    }

    // Get lessons for each module with progress
    const modulesWithLessons: ModuleWithLessons[] = await Promise.all(
      (modulesData || []).map(async (module) => {
        const { data: lessonsData, error: lessonsError } = await supabase
          .from("lessons")
          .select("*")
          .eq("module_id", module.id)
          .eq("is_published", true)
          .order("order_index", { ascending: true });

        if (lessonsError) {
          throw new Error(lessonsError.message);
        }

        // Convert to camelCase
        const lessons: LessonWithProgress[] = (lessonsData || []).map((lesson) => ({
          id: lesson.id,
          moduleId: lesson.module_id,
          title: lesson.title,
          content: lesson.content,
          orderIndex: lesson.order_index,
          durationMinutes: lesson.duration_minutes,
          isPublished: lesson.is_published,
        }));

        return {
          id: module.id,
          courseId: module.course_id,
          courseVersionId: module.course_version_id,
          title: module.title,
          description: module.description,
          orderIndex: module.order_index,
          isPublished: module.is_published,
          lessons,
        };
      })
    );

    // Get student progress
    const { data: progressData, error: progressError } = await supabase
      .from("student_progress")
      .select("*")
      .eq("student_id", studentId);

    if (progressError) {
      throw new Error(progressError.message);
    }

    // Convert progress to camelCase
    const progress: StudentProgress[] = (progressData || []).map((p) => ({
      studentId: p.student_id,
      lessonId: p.lesson_id,
      completed: p.completed,
      completedAt: p.completed_at,
    }));

    return {
      course: {
        id: courseData.id,
        title: courseData.title,
        description: courseData.description,
        activeVersionId: courseData.active_version_id,
      },
      modules: modulesWithLessons,
      progress,
    };
  }

  async getStudentProgress(studentId: string): Promise<StudentProgress[]> {
    const supabase = createClient();

    const { data, error } = await supabase
      .from("student_progress")
      .select("*")
      .eq("student_id", studentId);

    if (error) {
      throw new Error(error.message);
    }

    // Convert to camelCase
    return (data || []).map((p) => ({
      studentId: p.student_id,
      lessonId: p.lesson_id,
      completed: p.completed,
      completedAt: p.completed_at,
    }));
  }

  async markLessonComplete(
    lessonId: string,
    studentId: string
  ): Promise<MarkLessonResult> {
    try {
      const supabase = createClient();

      // Check if progress already exists
      const { data: existing } = await supabase
        .from("student_progress")
        .select("*")
        .eq("student_id", studentId)
        .eq("lesson_id", lessonId)
        .single();

      if (existing) {
        // Update existing
        const { error } = await supabase
          .from("student_progress")
          .update({
            completed: true,
            completed_at: new Date().toISOString(),
          })
          .eq("student_id", studentId)
          .eq("lesson_id", lessonId);

        if (error) {
          return { success: false, error: error.message };
        }
      } else {
        // Insert new
        const { error } = await supabase.from("student_progress").insert({
          student_id: studentId,
          lesson_id: lessonId,
          completed: true,
          completed_at: new Date().toISOString(),
        });

        if (error) {
          return { success: false, error: error.message };
        }
      }

      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Error desconocido",
      };
    }
  }

  async markLessonIncomplete(
    lessonId: string,
    studentId: string
  ): Promise<MarkLessonResult> {
    try {
      const supabase = createClient();

      const { error } = await supabase
        .from("student_progress")
        .update({
          completed: false,
          completed_at: null,
        })
        .eq("student_id", studentId)
        .eq("lesson_id", lessonId);

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Error desconocido",
      };
    }
  }
}
