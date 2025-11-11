import { IStudentRepository } from "@/src/core/interfaces/repositories/IStudentRepository";
import {
  CourseWithTopicsData,
  MarkTopicResult,
  ResourceSummary,
  StudentTopicProgress,
  TopicWithResources,
} from "@/src/core/types/student.types";
import { createClient } from "@/src/infrastructure/supabase/server";

const TABLES = {
  courses: "courses",
  versions: "course_versions",
  topics: "topics",
  resources: "resources",
  topicProgress: "student_progress",
} as const;

export class SupabaseStudentRepository implements IStudentRepository {
  async getCourseWithTopicsAndResources(
    courseId: string,
    studentId: string
  ): Promise<CourseWithTopicsData> {
    const supabase = createClient();

    const { data: courseRow, error: courseError } = await supabase
      .from(TABLES.courses)
      .select("*")
      .eq("id", courseId)
      .single();

    if (courseError || !courseRow) {
      throw new Error(courseError?.message ?? "Curso no encontrado");
    }

    const activeVersionId = courseRow.active_version_id;
    if (!activeVersionId) {
      throw new Error("El curso no tiene una versión activa");
    }

    const { data: versionRow, error: versionError } = await supabase
      .from(TABLES.versions)
      .select("*")
      .eq("id", activeVersionId)
      .single();

    if (versionError || !versionRow) {
      throw new Error(
        versionError?.message ?? "No se encontró la versión activa del curso"
      );
    }

    const { data: topicsData, error: topicsError } = await supabase
      .from(TABLES.topics)
      .select("*")
      .eq("course_version_id", activeVersionId)
      .order("order_index", { ascending: true });

    if (topicsError) {
      throw new Error(topicsError.message);
    }

    const topicsRows = (topicsData ?? []) as {
      id: string;
      course_version_id: string;
      title: string;
      description: string | null;
      order_index: number;
    }[];

    const topicIds = topicsRows.map((topic) => topic.id);

    let resourcesByTopic = new Map<string, ResourceSummary[]>();
    if (topicIds.length > 0) {
      const { data: resourcesData, error: resourcesError } = await supabase
        .from(TABLES.resources)
        .select("*")
        .in("topic_id", topicIds)
        .order("order_index", { ascending: true });

      if (resourcesError) {
        throw new Error(resourcesError.message);
      }

      const resources = (resourcesData ?? []).map((resource) => ({
        id: resource.id as string,
        topicId: resource.topic_id as string,
        title: resource.title as string,
        description: (resource.description as string | null) ?? null,
        resourceType: resource.resource_type as string,
        fileUrl: (resource.file_url as string | null) ?? null,
        fileName: (resource.file_name as string | null) ?? null,
        mimeType: (resource.mime_type as string | null) ?? null,
        externalUrl: (resource.external_url as string | null) ?? null,
        orderIndex: resource.order_index as number,
      }));

      resourcesByTopic = this.groupResourcesByTopic(resources);
    }

    const topics: TopicWithResources[] = topicsRows.map((topic) => ({
      id: topic.id,
      courseVersionId: topic.course_version_id,
      title: topic.title,
      description: topic.description,
      orderIndex: topic.order_index,
      resources: resourcesByTopic.get(topic.id) ?? [],
    }));

    const progress = await this.getTopicProgress(supabase, studentId, topicIds);

    return {
      course: {
        id: courseRow.id,
        name: courseRow.name ?? courseRow.title ?? "",
        description: courseRow.description,
        activeVersionId: courseRow.active_version_id,
      },
      version: {
        id: versionRow.id,
        title: versionRow.title,
        summary: versionRow.description,
        status: versionRow.status,
      },
      topics,
      progress,
    };
  }

  async getStudentTopicProgress(
    studentId: string
  ): Promise<StudentTopicProgress[]> {
    const supabase = createClient();
    return this.getTopicProgress(supabase, studentId);
  }

  async markTopicComplete(
    topicId: string,
    studentId: string
  ): Promise<MarkTopicResult> {
    const supabase = createClient();

    const now = new Date().toISOString();

    const { data: existing, error: fetchError } = await supabase
      .from(TABLES.topicProgress)
      .select("id")
      .eq("student_id", studentId)
      .eq("topic_id", topicId)
      .single();

    if (fetchError && fetchError.code !== "PGRST116") {
      return { success: false, error: fetchError.message };
    }

    const payload = {
      student_id: studentId,
      topic_id: topicId,
      completed: true,
      completed_at: now,
      last_accessed_at: now,
    };

    if (existing) {
      const { error } = await supabase
        .from(TABLES.topicProgress)
        .update(payload)
        .eq("id", existing.id);

      if (error) {
        return { success: false, error: error.message };
      }
    } else {
      const { error } = await supabase
        .from(TABLES.topicProgress)
        .insert(payload);

      if (error) {
        return { success: false, error: error.message };
      }
    }

    return { success: true };
  }

  async markTopicIncomplete(
    topicId: string,
    studentId: string
  ): Promise<MarkTopicResult> {
    const supabase = createClient();

    const { error } = await supabase
      .from(TABLES.topicProgress)
      .update({
        completed: false,
        completed_at: null,
        last_accessed_at: new Date().toISOString(),
      })
      .eq("student_id", studentId)
      .eq("topic_id", topicId);

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true };
  }

  private groupResourcesByTopic(
    resources: ResourceSummary[]
  ): Map<string, ResourceSummary[]> {
    const map = new Map<string, ResourceSummary[]>();

    resources.forEach((resource) => {
      const list = map.get(resource.topicId) ?? [];
      list.push(resource);
      map.set(resource.topicId, list);
    });

    return map;
  }

  private async getTopicProgress(
    supabase: ReturnType<typeof createClient>,
    studentId: string,
    topicIds?: readonly string[]
  ): Promise<StudentTopicProgress[]> {
    let query = supabase
      .from(TABLES.topicProgress)
      .select("*")
      .eq("student_id", studentId);

    if (topicIds && topicIds.length > 0) {
      query = query.in("topic_id", topicIds);
    }

    const { data, error } = await query;

    if (error) {
      throw new Error(error.message);
    }

    return (data ?? []).map((record) => ({
      studentId: record.student_id,
      topicId: record.topic_id,
      completed: record.completed,
      completedAt: record.completed_at,
    }));
  }
}
