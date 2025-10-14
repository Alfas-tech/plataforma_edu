import { ICourseRepository } from "@/src/core/interfaces/repositories/ICourseRepository";
import { CourseEntity } from "@/src/core/entities/Course.entity";
import {
  CreateCourseInput,
  UpdateCourseInput,
  CourseData,
} from "@/src/core/types/course.types";
import { createClient } from "@/src/infrastructure/supabase/server";

export class SupabaseCourseRepository implements ICourseRepository {
  async getActiveCourse(): Promise<CourseEntity | null> {
    const supabase = createClient();

    const { data, error } = await supabase.rpc("get_active_course");

    if (error || !data || data.length === 0) {
      return null;
    }

    return CourseEntity.fromDatabase(data[0]);
  }

  async getCourseById(id: string): Promise<CourseEntity | null> {
    const supabase = createClient();

    const { data, error } = await supabase
      .from("courses")
      .select("*")
      .eq("id", id)
      .single();

    if (error || !data) {
      return null;
    }

    return CourseEntity.fromDatabase(data);
  }

  async getAllCourses(): Promise<CourseEntity[]> {
    const supabase = createClient();

    const { data, error } = await supabase
      .from("courses")
      .select("*")
      .order("start_date", { ascending: false });

    if (error || !data) {
      return [];
    }

    return data.map((course) => CourseEntity.fromDatabase(course));
  }

  async createCourse(input: CreateCourseInput): Promise<CourseEntity> {
    const supabase = createClient();

    const { data, error } = await supabase
      .from("courses")
      .insert({
        title: input.title,
        description: input.description,
        start_date: input.start_date,
        end_date: input.end_date,
        created_by: (await supabase.auth.getUser()).data.user?.id,
      })
      .select()
      .single();

    if (error || !data) {
      throw new Error("Error al crear el curso");
    }

    return CourseEntity.fromDatabase(data);
  }

  async updateCourse(
    id: string,
    input: UpdateCourseInput
  ): Promise<CourseEntity> {
    const supabase = createClient();

    const { data, error } = await supabase
      .from("courses")
      .update({
        ...input,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .select()
      .single();

    if (error || !data) {
      throw new Error("Error al actualizar el curso");
    }

    return CourseEntity.fromDatabase(data);
  }

  async deleteCourse(id: string): Promise<void> {
    const supabase = createClient();

    const { error } = await supabase.from("courses").delete().eq("id", id);

    if (error) {
      throw new Error("Error al eliminar el curso");
    }
  }

  async assignTeacher(courseId: string, teacherId: string): Promise<void> {
    const supabase = createClient();

    const { error } = await supabase.from("course_teachers").insert({
      course_id: courseId,
      teacher_id: teacherId,
      assigned_by: (await supabase.auth.getUser()).data.user?.id,
    });

    if (error) {
      throw new Error("Error al asignar docente");
    }
  }

  async removeTeacher(courseId: string, teacherId: string): Promise<void> {
    const supabase = createClient();

    const { error } = await supabase
      .from("course_teachers")
      .delete()
      .eq("course_id", courseId)
      .eq("teacher_id", teacherId);

    if (error) {
      throw new Error("Error al remover docente");
    }
  }

  async getCourseTeachers(courseId: string): Promise<string[]> {
    const supabase = createClient();

    const { data, error } = await supabase
      .from("course_teachers")
      .select("teacher_id")
      .eq("course_id", courseId);

    if (error || !data) {
      return [];
    }

    return data.map((ct) => ct.teacher_id);
  }

  async getTeacherCourses(teacherId: string): Promise<CourseEntity[]> {
    const supabase = createClient();

    // Get course IDs where teacher is assigned
    const { data: courseTeachersData, error: ctError } = await supabase
      .from("course_teachers")
      .select("course_id")
      .eq("teacher_id", teacherId);

    if (ctError) {
      throw new Error("Error al obtener cursos del docente");
    }

    if (!courseTeachersData || courseTeachersData.length === 0) {
      return [];
    }

    const courseIds = courseTeachersData.map((item) => item.course_id);

    // Get courses
    const { data, error } = await supabase
      .from("courses")
      .select("*")
      .in("id", courseIds)
      .order("start_date", { ascending: false });

    if (error) {
      throw new Error("Error al obtener cursos");
    }

    if (!data) return [];

    return data.map((courseData: CourseData) =>
      CourseEntity.fromDatabase(courseData)
    );
  }
}
