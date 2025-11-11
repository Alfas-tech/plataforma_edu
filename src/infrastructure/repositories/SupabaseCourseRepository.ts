import {
  CourseWithVersions,
  ICourseRepository,
} from "@/src/core/interfaces/repositories/ICourseRepository";
import { CourseEntity } from "@/src/core/entities/Course.entity";
import { CourseVersionEntity } from "@/src/core/entities/CourseVersion.entity";
import { CourseTopicEntity } from "@/src/core/entities/CourseTopic.entity";
import { CourseResourceEntity } from "@/src/core/entities/CourseResource.entity";
import { CourseGroupEntity } from "@/src/core/entities/CourseGroup.entity";
import { CourseGroupStudentEntity } from "@/src/core/entities/CourseGroupStudent.entity";
import {
  AddResourceInput,
  AddStudentToGroupInput,
  AssignGroupTeacherInput,
  ArchiveCourseVersionInput,
  CreateCourseDraftInput,
  CreateCourseInput,
  CreateGroupInput,
  CreateTopicInput,
  CourseData,
  CourseVersionData,
  GroupData,
  GroupStudentData,
  PublishCourseVersionInput,
  ReorderTopicInput,
  ResourceData,
  TopicData,
  UpdateCourseDraftInput,
  UpdateCourseInput,
  UpdateResourceInput,
  UpdateTopicInput,
} from "@/src/core/types/course.types";
import { createClient } from "@/src/infrastructure/supabase/server";

const TABLES = {
  courses: "courses",
  courseVersions: "course_versions",
  courseTopics: "topics",
  courseResources: "resources",
  courseGroups: "groups",
  courseGroupStudents: "group_students",
} as const;

type SupabaseClient = ReturnType<typeof createClient>;

type CourseRow = CourseData;

type CourseVersionRow = CourseVersionData;
type TopicRow = TopicData;
type ResourceRow = ResourceData;
type GroupRow = GroupData;
type GroupStudentRow = GroupStudentData;

export class SupabaseCourseRepository implements ICourseRepository {
  async getAllCourses(): Promise<CourseEntity[]> {
    const supabase = createClient();

    const { data, error } = await supabase
      .from(TABLES.courses)
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      throw new Error(error.message || "Error al obtener cursos");
    }

    const courseRows = (data ?? []) as CourseRow[];
    const versionsByCourse = await this.getVersionsByCourseIds(
      supabase,
      courseRows.map((course) => course.id)
    );

    return courseRows.map((row) => this.mapCourse(row, versionsByCourse));
  }

  async getCourseById(courseId: string): Promise<CourseEntity | null> {
    const supabase = createClient();

    const { data, error } = await supabase
      .from(TABLES.courses)
      .select("*")
      .eq("id", courseId)
      .maybeSingle();

    if (error) {
      throw new Error(error.message || "Error al obtener el curso");
    }

    if (!data) {
      return null;
    }

    const courseRow = data as CourseRow;
    const versionsByCourse = await this.getVersionsByCourseIds(supabase, [
      courseId,
    ]);

    return this.mapCourse(courseRow, versionsByCourse);
  }

  async getCourseWithVersions(
    courseId: string
  ): Promise<CourseWithVersions | null> {
    const course = await this.getCourseById(courseId);
    if (!course) {
      return null;
    }

    return {
      course,
      versions: Array.from(course.versions),
    };
  }

  async getCourseVersionById(
    versionId: string
  ): Promise<CourseVersionEntity | null> {
    const supabase = createClient();

    const { data, error } = await supabase
      .from(TABLES.courseVersions)
      .select("*")
      .eq("id", versionId)
      .maybeSingle();

    if (error) {
      throw new Error(error.message || "Error al obtener la versión");
    }

    if (!data) {
      return null;
    }

    return CourseVersionEntity.fromDatabase(data as CourseVersionRow);
  }

  async createCourse(input: CreateCourseInput): Promise<CourseEntity> {
    const supabase = createClient();
    const userId = await this.requireCurrentUserId(supabase);

    const payload: Partial<CourseRow> = {
      name: input.name.trim(),
      description: input.description ?? null,
      created_by: userId,
    };

    const { data, error } = await supabase
      .from(TABLES.courses)
      .insert(payload)
      .select("*")
      .single();

    if (error) {
      throw new Error(error.message || "Error al crear el curso");
    }

    const courseRow = data as CourseRow;

    let draftVersion: CourseVersionRow | null = null;

    if (input.draft) {
      draftVersion = await this.createDraftForCourseCreation(
        supabase,
        courseRow.id,
        input.draft
      );
    }

    return CourseEntity.fromDatabase(courseRow, {
      versions: draftVersion ? [draftVersion] : [],
    });
  }

  async updateCourse(
    courseId: string,
    input: UpdateCourseInput
  ): Promise<CourseEntity> {
    const supabase = createClient();

    const current = await this.getCourseById(courseId);
    if (!current) {
      throw new Error("Curso no encontrado");
    }

    if (input.activeVersionId) {
      const version = await this.getCourseVersionById(input.activeVersionId);
      if (!version || version.courseId !== courseId) {
        throw new Error("La versión seleccionada no pertenece al curso");
      }
    }

    const updates: Record<string, unknown> = {};

    if (typeof input.name !== "undefined") {
      updates.name = input.name.trim();
    }

    if (typeof input.description !== "undefined") {
      updates.description = input.description ?? null;
    }

    if (typeof input.activeVersionId !== "undefined") {
      updates.active_version_id = input.activeVersionId;
    }

    if (Object.keys(updates).length === 0) {
      return current;
    }

    const { data, error } = await supabase
      .from(TABLES.courses)
      .update(updates)
      .eq("id", courseId)
      .select("*")
      .single();

    if (error) {
      throw new Error(error.message || "Error al actualizar el curso");
    }

    const updated = data as CourseRow;
    const versionsByCourse = await this.getVersionsByCourseIds(supabase, [
      courseId,
    ]);

    return this.mapCourse(updated, versionsByCourse);
  }

  async deleteCourse(courseId: string): Promise<void> {
    const supabase = createClient();

    const { error } = await supabase
      .from(TABLES.courses)
      .delete()
      .eq("id", courseId);

    if (error) {
      throw new Error(error.message || "Error al eliminar el curso");
    }
  }

  async createDraftVersion(
    input: CreateCourseDraftInput
  ): Promise<CourseVersionEntity> {
    const supabase = createClient();

    const course = await this.getCourseById(input.courseId);
    if (!course) {
      throw new Error("Curso no encontrado");
    }

    const payload = await this.buildVersionPayload(supabase, input.courseId, {
      title: input.title,
      description: input.description ?? null,
      content: input.content ?? null,
      startDate: input.startDate ?? null,
      endDate: input.endDate ?? null,
      status: "draft",
    });

    const { data, error } = await supabase
      .from(TABLES.courseVersions)
      .insert(payload)
      .select("*")
      .single();

    if (error) {
      throw new Error(error.message || "Error al crear la versión");
    }

    return CourseVersionEntity.fromDatabase(data as CourseVersionRow);
  }

  async updateDraftVersion(
    versionId: string,
    input: UpdateCourseDraftInput
  ): Promise<CourseVersionEntity> {
    const supabase = createClient();

    const existing = await this.getCourseVersionById(versionId);
    if (!existing) {
      throw new Error("Versión no encontrada");
    }

    if (!existing.isDraft()) {
      throw new Error("Solo se pueden editar versiones en borrador");
    }

    const updates: Record<string, unknown> = {};

    if (typeof input.title !== "undefined") {
      updates.title = input.title;
    }

    if (typeof input.description !== "undefined") {
      updates.description = input.description ?? null;
    }

    if (typeof input.content !== "undefined") {
      updates.content = input.content ?? null;
    }

    if (typeof input.startDate !== "undefined") {
      updates.start_date = input.startDate ?? null;
    }

    if (typeof input.endDate !== "undefined") {
      updates.end_date = input.endDate ?? null;
    }

    if (Object.keys(updates).length === 0) {
      return existing;
    }

    const { data, error } = await supabase
      .from(TABLES.courseVersions)
      .update(updates)
      .eq("id", versionId)
      .select("*")
      .single();

    if (error) {
      throw new Error(
        error.message || "Error al actualizar la versión del curso"
      );
    }

    return CourseVersionEntity.fromDatabase(data as CourseVersionRow);
  }

  async publishCourseVersion(
    input: PublishCourseVersionInput
  ): Promise<CourseEntity> {
    const supabase = createClient();

    const version = await this.getCourseVersionById(input.versionId);
    if (!version) {
      throw new Error("Versión no encontrada");
    }

    // Get the course to verify if there is a previous active version
    const course = await this.getCourseById(version.courseId);
    if (!course) {
      throw new Error("Curso no encontrado");
    }

    // If there is a previous active version, archive it first
    if (course.activeVersion && course.activeVersion.id !== version.id) {
      const { error: archiveError } = await supabase
        .from(TABLES.courseVersions)
        .update({ status: "archived" })
        .eq("id", course.activeVersion.id);

      if (archiveError) {
        throw new Error(
          archiveError.message || "Error al archivar la versión anterior"
        );
      }
    }

    // Publish the new version
    const updates: Record<string, unknown> = {
      status: "active",
      published_at: new Date().toISOString(),
      published_by: input.publishedBy,
      start_date: input.startDate ?? null,
      end_date: input.endDate ?? null,
    };

    const { error: versionError } = await supabase
      .from(TABLES.courseVersions)
      .update(updates)
      .eq("id", version.id);

    if (versionError) {
      throw new Error(versionError.message || "Error al publicar la versión");
    }

    // Update the course to point to the new active version
    const { error: courseError } = await supabase
      .from(TABLES.courses)
      .update({ active_version_id: version.id })
      .eq("id", version.courseId);

    if (courseError) {
      throw new Error(
        courseError.message || "Error al activar la versión publicada"
      );
    }

    const updatedCourse = await this.getCourseById(version.courseId);
    if (!updatedCourse) {
      throw new Error("Curso no encontrado después de publicar la versión");
    }

    return updatedCourse;
  }

  async archiveCourseVersion(
    input: ArchiveCourseVersionInput
  ): Promise<CourseEntity> {
    const supabase = createClient();

    const version = await this.getCourseVersionById(input.versionId);
    if (!version) {
      throw new Error("Versión no encontrada");
    }

    const { error: versionError } = await supabase
      .from(TABLES.courseVersions)
      .update({ status: "archived" })
      .eq("id", version.id);

    if (versionError) {
      throw new Error(versionError.message || "Error al archivar la versión");
    }

    if (version.isActive()) {
      const { error: courseError } = await supabase
        .from(TABLES.courses)
        .update({ active_version_id: null })
        .eq("id", version.courseId);

      if (courseError) {
        throw new Error(
          courseError.message ||
            "Error al actualizar el curso después de archivar la versión"
        );
      }
    }

    const updatedCourse = await this.getCourseById(version.courseId);
    if (!updatedCourse) {
      throw new Error("Curso no encontrado después de archivar la versión");
    }

    return updatedCourse;
  }

  async assignTeacherToVersion(
    courseId: string,
    courseVersionId: string,
    teacherId: string
  ): Promise<void> {
    // NOTE: In the current DB schema, teachers are assigned to GROUPS, not to versions.
    // This function remains as a stub for compatibility but does nothing.
    // To assign teachers, use assignTeacherToGroup instead of this function.
    throw new Error(
      "Los profesores se asignan a grupos, no a versiones. Use assignTeacherToGroup() en su lugar."
    );
  }

  async removeTeacherFromVersion(
    courseId: string,
    courseVersionId: string,
    teacherId: string
  ): Promise<void> {
    // NOTE: In the current DB schema, teachers are assigned to GROUPS, not to versions.
    throw new Error(
      "Los profesores se asignan a grupos, no a versiones. Use la gestión de grupos."
    );
  }

  async getCourseTeachers(courseId: string): Promise<string[]> {
    // NOTE: In the current DB schema, teachers are assigned to GROUPS within active versions.
    // This function returns all unique teachers assigned to any group of any version of the course.
    const supabase = createClient();

    // Get all versions of the course
    const { data: versions, error: versionsError } = await supabase
      .from(TABLES.courseVersions)
      .select("id")
      .eq("course_id", courseId);

    if (versionsError) {
      throw new Error(
        versionsError.message || "Error al obtener versiones del curso"
      );
    }

    if (!versions || versions.length === 0) {
      return [];
    }

    const versionIds = versions.map((v) => v.id);

    // Get all groups from those versions
    const { data: groups, error: groupsError } = await supabase
      .from(TABLES.courseGroups)
      .select("teacher_id")
      .in("course_version_id", versionIds)
      .not("teacher_id", "is", null);

    if (groupsError) {
      throw new Error(
        groupsError.message || "Error al obtener profesores del curso"
      );
    }

    const teacherIds = new Set<string>();
    (groups ?? []).forEach((row) => {
      const value = row.teacher_id as string | null;
      if (value) {
        teacherIds.add(value);
      }
    });

    return Array.from(teacherIds);
  }

  async getVersionTeachers(courseVersionId: string): Promise<string[]> {
    // NOTE: Gets all teachers assigned to groups of this version
    const supabase = createClient();

    const { data, error } = await supabase
      .from(TABLES.courseGroups)
      .select("teacher_id")
      .eq("course_version_id", courseVersionId)
      .not("teacher_id", "is", null);

    if (error) {
      throw new Error(
        error.message || "Error al obtener docentes de la versión"
      );
    }

    return (data ?? [])
      .map((row) => row.teacher_id as string | null)
      .filter((id): id is string => Boolean(id));
  }

  async getCourseVersionAssignments(
    courseId: string
  ): Promise<Array<{ version: CourseVersionEntity; teacherIds: string[] }>> {
    const supabase = createClient();

    const versionsByCourse = await this.getVersionsByCourseIds(supabase, [
      courseId,
    ]);

    const versionRows = versionsByCourse.get(courseId) ?? [];
    if (versionRows.length === 0) {
      return [];
    }

    const versionIds = versionRows.map((version) => version.id);

    // Get teachers from groups by version
    const { data, error } = await supabase
      .from(TABLES.courseGroups)
      .select("course_version_id, teacher_id")
      .in("course_version_id", versionIds)
      .not("teacher_id", "is", null);

    if (error) {
      throw new Error(
        error.message || "Error al obtener asignaciones de docentes"
      );
    }

    const teacherIdsByVersion = new Map<string, Set<string>>();

    (data ?? []).forEach((row) => {
      const versionId = row.course_version_id as string;
      const teacherId = row.teacher_id as string | null;
      if (!teacherId) {
        return;
      }
      if (!teacherIdsByVersion.has(versionId)) {
        teacherIdsByVersion.set(versionId, new Set());
      }
      teacherIdsByVersion.get(versionId)!.add(teacherId);
    });

    return versionRows.map((row) => ({
      version: CourseVersionEntity.fromDatabase(row),
      teacherIds: Array.from(teacherIdsByVersion.get(row.id) ?? new Set()),
    }));
  }

  async isTeacherAssignedToVersion(
    courseVersionId: string,
    teacherId: string
  ): Promise<boolean> {
    // NOTE: Verifies if the teacher is assigned to any group of this version
    const supabase = createClient();

    const { data, error } = await supabase
      .from(TABLES.courseGroups)
      .select("id")
      .eq("course_version_id", courseVersionId)
      .eq("teacher_id", teacherId)
      .maybeSingle();

    if (error && error.code !== "PGRST116") {
      throw new Error(
        error.message || "Error al validar asignación de docente"
      );
    }

    return Boolean(data);
  }

  async getTeacherCourses(teacherId: string): Promise<CourseEntity[]> {
    // NOTE: Gets courses where the teacher is assigned to any group
    const supabase = createClient();

    // Get all versions where the teacher has assigned groups
    const { data: groups, error: groupsError } = await supabase
      .from(TABLES.courseGroups)
      .select("course_version_id")
      .eq("teacher_id", teacherId);

    if (groupsError) {
      throw new Error(
        groupsError.message || "Error al obtener cursos del docente"
      );
    }

    if (!groups || groups.length === 0) {
      return [];
    }

    const versionIds = Array.from(
      new Set(groups.map((g) => g.course_version_id as string))
    );

    // Get the course_id from those versions
    const { data: versions, error: versionsError } = await supabase
      .from(TABLES.courseVersions)
      .select("course_id")
      .in("id", versionIds);

    if (versionsError) {
      throw new Error(
        versionsError.message || "Error al obtener cursos del docente"
      );
    }

    const courseIds = Array.from(
      new Set(
        (versions ?? [])
          .map((row) => row.course_id as string | null)
          .filter((id): id is string => Boolean(id))
      )
    );

    if (courseIds.length === 0) {
      return [];
    }

    const coursesMap = await this.fetchCoursesByIds(supabase, courseIds);
    return courseIds
      .map((id) => coursesMap.get(id))
      .filter((course): course is CourseEntity => Boolean(course));
  }

  async listTopics(courseVersionId: string): Promise<CourseTopicEntity[]> {
    const supabase = createClient();

    const { data, error } = await supabase
      .from(TABLES.courseTopics)
      .select("*")
      .eq("course_version_id", courseVersionId)
      .order("order_index", { ascending: true });

    if (error) {
      throw new Error(error.message || "Error al obtener tópicos");
    }

    return (data ?? []).map((row) =>
      CourseTopicEntity.fromDatabase(row as TopicRow)
    );
  }

  async getTopicById(topicId: string): Promise<CourseTopicEntity | null> {
    const supabase = createClient();

    const { data, error } = await supabase
      .from(TABLES.courseTopics)
      .select("*")
      .eq("id", topicId)
      .maybeSingle();

    if (error) {
      throw new Error(error.message || "Error al obtener el tópico");
    }

    if (!data) {
      return null;
    }

    return CourseTopicEntity.fromDatabase(data as TopicRow);
  }

  async createTopic(input: CreateTopicInput): Promise<CourseTopicEntity> {
    const supabase = createClient();

    const orderIndex = await this.getNextOrder(
      supabase,
      TABLES.courseTopics,
      "order_index",
      "course_version_id",
      input.courseVersionId,
      input.orderIndex
    );

    const { data, error } = await supabase
      .from(TABLES.courseTopics)
      .insert({
        course_version_id: input.courseVersionId,
        title: input.title,
        description: input.description ?? null,
        order_index: orderIndex,
      })
      .select("*")
      .single();

    if (error) {
      throw new Error(error.message || "Error al crear el tópico");
    }

    return CourseTopicEntity.fromDatabase(data as TopicRow);
  }

  async updateTopic(
    topicId: string,
    input: UpdateTopicInput
  ): Promise<CourseTopicEntity> {
    const supabase = createClient();

    const updates: Record<string, unknown> = {};

    if (typeof input.title !== "undefined") {
      updates.title = input.title;
    }

    if (typeof input.description !== "undefined") {
      updates.description = input.description ?? null;
    }

    if (Object.keys(updates).length === 0) {
      const existing = await this.getTopicById(topicId);
      if (!existing) {
        throw new Error("Tópico no encontrado");
      }
      return existing;
    }

    const { data, error } = await supabase
      .from(TABLES.courseTopics)
      .update(updates)
      .eq("id", topicId)
      .select("*")
      .single();

    if (error) {
      throw new Error(error.message || "Error al actualizar el tópico");
    }

    return CourseTopicEntity.fromDatabase(data as TopicRow);
  }

  async reorderTopics(
    courseVersionId: string,
    order: ReorderTopicInput[]
  ): Promise<void> {
    if (order.length === 0) {
      return;
    }

    const supabase = createClient();

    // Build a SQL CASE statement to update all in a single query
    // This prevents unique constraint violations because everything is updated atomically
    const whenClauses = order
      .map(
        ({ topicId, orderIndex }) => `WHEN id = '${topicId}' THEN ${orderIndex}`
      )
      .join(" ");

    const topicIds = order.map(({ topicId }) => topicId);

    // Execute atomic update with raw SQL
    const { error } = await supabase.rpc("reorder_topics_batch", {
      p_course_version_id: courseVersionId,
      p_topic_ids: topicIds,
      p_order_indices: order.map((o) => o.orderIndex),
    });

    if (error) {
      // If the RPC function doesn't exist, try individual updates as fallback
      // but using a transaction so it's atomic
      console.warn("RPC reorder_topics_batch no disponible, usando fallback");

      for (const { topicId, orderIndex } of order) {
        const { error: updateError } = await supabase
          .from(TABLES.courseTopics)
          .update({ order_index: orderIndex })
          .eq("id", topicId)
          .eq("course_version_id", courseVersionId);

        if (updateError) {
          throw new Error(
            updateError.message || `Error al reordenar tópico ${topicId}`
          );
        }
      }
    }
  }

  async deleteTopic(topicId: string): Promise<void> {
    const supabase = createClient();

    const { error } = await supabase
      .from(TABLES.courseTopics)
      .delete()
      .eq("id", topicId);

    if (error) {
      throw new Error(error.message || "Error al eliminar el tópico");
    }
  }

  async reorderResources(
    topicId: string,
    order: Array<{ resourceId: string; orderIndex: number }>
  ): Promise<void> {
    const supabase = createClient();

    // Log para debug
    console.log("🔄 Reordenando recursos:", {
      topicId,
      count: order.length,
      newOrder: order
        .map((o) => `${o.resourceId.slice(0, 8)}... → ${o.orderIndex}`)
        .join(", "),
    });

    const resourceIds = order.map(({ resourceId }) => resourceId);

    // Execute atomic update with RPC function
    const { error } = await supabase.rpc("reorder_resources_batch", {
      p_topic_id: topicId,
      p_resource_ids: resourceIds,
      p_order_indices: order.map((o) => o.orderIndex),
    });

    if (error) {
      // If the RPC function doesn't exist, try individual updates as fallback
      console.warn(
        "RPC reorder_resources_batch no disponible, usando fallback"
      );

      for (const { resourceId, orderIndex } of order) {
        const { error: updateError } = await supabase
          .from(TABLES.courseResources)
          .update({ order_index: orderIndex })
          .eq("id", resourceId)
          .eq("topic_id", topicId);

        if (updateError) {
          throw new Error(
            updateError.message || `Error al reordenar recurso ${resourceId}`
          );
        }
      }
    }
  }

  async listResources(topicId: string): Promise<CourseResourceEntity[]> {
    const supabase = createClient();

    const { data, error } = await supabase
      .from(TABLES.courseResources)
      .select("*")
      .eq("topic_id", topicId)
      .order("order_index", { ascending: true });

    if (error) {
      throw new Error(error.message || "Error al obtener recursos");
    }

    return (data ?? []).map((row) =>
      CourseResourceEntity.fromDatabase(row as ResourceRow)
    );
  }

  async getResourceById(
    resourceId: string
  ): Promise<CourseResourceEntity | null> {
    const supabase = createClient();

    const { data, error } = await supabase
      .from(TABLES.courseResources)
      .select("*")
      .eq("id", resourceId)
      .maybeSingle();

    if (error) {
      throw new Error(error.message || "Error al obtener el recurso");
    }

    if (!data) {
      return null;
    }

    return CourseResourceEntity.fromDatabase(data as ResourceRow);
  }

  async addResource(input: AddResourceInput): Promise<CourseResourceEntity> {
    const supabase = createClient();

    const orderIndex = await this.getNextOrder(
      supabase,
      TABLES.courseResources,
      "order_index",
      "topic_id",
      input.topicId,
      input.orderIndex
    );

    const { data, error } = await supabase
      .from(TABLES.courseResources)
      .insert({
        topic_id: input.topicId,
        title: input.title,
        description: input.description ?? null,
        resource_type: input.resourceType,
        file_url: input.fileUrl ?? null,
        file_name: input.fileName ?? null,
        file_size: input.fileSize ?? null,
        mime_type: input.mimeType ?? null,
        external_url: input.externalUrl ?? null,
        order_index: orderIndex,
      })
      .select("*")
      .single();

    if (error) {
      throw new Error(error.message || "Error al crear el recurso");
    }

    return CourseResourceEntity.fromDatabase(data as ResourceRow);
  }

  async updateResource(
    resourceId: string,
    input: UpdateResourceInput
  ): Promise<CourseResourceEntity> {
    const supabase = createClient();

    const updates: Record<string, unknown> = {};

    if (typeof input.title !== "undefined") {
      updates.title = input.title;
    }

    if (typeof input.description !== "undefined") {
      updates.description = input.description ?? null;
    }

    if (typeof input.resourceType !== "undefined") {
      updates.resource_type = input.resourceType;
    }

    if (typeof input.fileUrl !== "undefined") {
      updates.file_url = input.fileUrl ?? null;
    }

    if (typeof input.fileName !== "undefined") {
      updates.file_name = input.fileName ?? null;
    }

    if (typeof input.fileSize !== "undefined") {
      updates.file_size = input.fileSize ?? null;
    }

    if (typeof input.mimeType !== "undefined") {
      updates.mime_type = input.mimeType ?? null;
    }

    if (typeof input.externalUrl !== "undefined") {
      updates.external_url = input.externalUrl ?? null;
    }

    if (Object.keys(updates).length === 0) {
      const existing = await this.getResourceById(resourceId);
      if (!existing) {
        throw new Error("Recurso no encontrado");
      }
      return existing;
    }

    const { data, error } = await supabase
      .from(TABLES.courseResources)
      .update(updates)
      .eq("id", resourceId)
      .select("*")
      .single();

    if (error) {
      throw new Error(error.message || "Error al actualizar el recurso");
    }

    return CourseResourceEntity.fromDatabase(data as ResourceRow);
  }

  async deleteResource(resourceId: string): Promise<void> {
    const supabase = createClient();

    const { error } = await supabase
      .from(TABLES.courseResources)
      .delete()
      .eq("id", resourceId);

    if (error) {
      throw new Error(error.message || "Error al eliminar el recurso");
    }
  }

  async listGroups(courseVersionId: string): Promise<CourseGroupEntity[]> {
    const supabase = createClient();

    const { data, error } = await supabase
      .from(TABLES.courseGroups)
      .select("*")
      .eq("course_version_id", courseVersionId)
      .order("created_at", { ascending: true });

    if (error) {
      throw new Error(error.message || "Error al obtener los grupos del curso");
    }

    const groupRows = (data ?? []) as GroupRow[];
    const studentsByGroup = await this.getGroupStudents(
      supabase,
      groupRows.map((group) => group.id)
    );

    return groupRows.map((group) =>
      CourseGroupEntity.fromDatabase(group, {
        students: studentsByGroup.get(group.id) ?? [],
      })
    );
  }

  async createGroup(input: CreateGroupInput): Promise<CourseGroupEntity> {
    const supabase = createClient();

    const { data, error } = await supabase
      .from(TABLES.courseGroups)
      .insert({
        course_version_id: input.courseVersionId,
        name: input.name,
        teacher_id: input.teacherId ?? null,
      })
      .select("*")
      .single();

    if (error) {
      throw new Error(error.message || "Error al crear el grupo");
    }

    return CourseGroupEntity.fromDatabase(data as GroupRow);
  }

  async assignGroupTeacher(
    input: AssignGroupTeacherInput
  ): Promise<CourseGroupEntity> {
    const supabase = createClient();

    const { data, error } = await supabase
      .from(TABLES.courseGroups)
      .update({ teacher_id: input.teacherId })
      .eq("id", input.groupId)
      .select("*")
      .single();

    if (error) {
      throw new Error(error.message || "Error al asignar docente al grupo");
    }

    return CourseGroupEntity.fromDatabase(data as GroupRow);
  }

  async addStudentToGroup(
    input: AddStudentToGroupInput
  ): Promise<CourseGroupStudentEntity> {
    const supabase = createClient();

    const { data, error } = await supabase
      .from(TABLES.courseGroupStudents)
      .insert({
        group_id: input.groupId,
        student_id: input.studentId,
        enrolled_at: new Date().toISOString(),
      })
      .select("*")
      .single();

    if (error) {
      throw new Error(error.message || "Error al agregar estudiante al grupo");
    }

    return CourseGroupStudentEntity.fromDatabase(data as GroupStudentRow);
  }

  async removeStudentFromGroup(
    groupId: string,
    studentId: string
  ): Promise<void> {
    const supabase = createClient();

    const { error } = await supabase
      .from(TABLES.courseGroupStudents)
      .delete()
      .eq("group_id", groupId)
      .eq("student_id", studentId);

    if (error) {
      throw new Error(
        error.message || "Error al eliminar estudiante del grupo"
      );
    }
  }

  private async requireCurrentUserId(client: SupabaseClient): Promise<string> {
    const { data, error } = await client.auth.getUser();
    if (error) {
      throw new Error(error.message || "No se pudo obtener el usuario");
    }
    const userId = data.user?.id;
    if (!userId) {
      throw new Error("Usuario no autenticado");
    }
    return userId;
  }

  private async fetchCoursesByIds(
    client: SupabaseClient,
    ids: readonly string[]
  ): Promise<Map<string, CourseEntity>> {
    const result = new Map<string, CourseEntity>();

    if (ids.length === 0) {
      return result;
    }

    const { data, error } = await client
      .from(TABLES.courses)
      .select("*")
      .in("id", ids);

    if (error) {
      throw new Error(error.message || "Error al obtener cursos");
    }

    const versionsByCourse = await this.getVersionsByCourseIds(client, ids);

    (data ?? []).forEach((row) => {
      const courseRow = row as CourseRow;
      result.set(courseRow.id, this.mapCourse(courseRow, versionsByCourse));
    });

    return result;
  }

  private mapCourse(
    row: CourseRow,
    versionsByCourse: Map<string, CourseVersionRow[]>
  ): CourseEntity {
    const versions = versionsByCourse.get(row.id) ?? [];

    return CourseEntity.fromDatabase(row, {
      versions,
    });
  }

  private async createDraftForCourseCreation(
    client: SupabaseClient,
    courseId: string,
    draft: NonNullable<CreateCourseInput["draft"]>
  ): Promise<CourseVersionRow> {
    const title = draft.title?.trim();
    const payload = await this.buildVersionPayload(client, courseId, {
      title: title && title.length > 0 ? title : "Borrador inicial",
      description: draft.description ?? null,
      content: draft.content ?? null,
      startDate: null,
      endDate: null,
      status: "draft",
    });

    const { data, error } = await client
      .from(TABLES.courseVersions)
      .insert(payload)
      .select("*")
      .single();

    if (error) {
      throw new Error(
        error.message || "Error al crear la versión en borrador del curso"
      );
    }

    return data as CourseVersionRow;
  }

  private async getVersionsByCourseIds(
    client: SupabaseClient,
    courseIds: readonly string[]
  ): Promise<Map<string, CourseVersionRow[]>> {
    const result = new Map<string, CourseVersionRow[]>();

    if (courseIds.length === 0) {
      return result;
    }

    const { data, error } = await client
      .from(TABLES.courseVersions)
      .select("*")
      .in("course_id", courseIds)
      .order("version_number", { ascending: true });

    if (error) {
      throw new Error(error.message || "Error al obtener versiones del curso");
    }

    (data ?? []).forEach((row) => {
      const record = row as CourseVersionRow;
      if (!result.has(record.course_id)) {
        result.set(record.course_id, []);
      }
      result.get(record.course_id)!.push(record);
    });

    return result;
  }

  private async buildVersionPayload(
    client: SupabaseClient,
    courseId: string,
    options: {
      title: string;
      description: string | null;
      content: string | null;
      startDate: string | null;
      endDate: string | null;
      status: "draft" | "active" | "archived";
      publishedBy?: string | null;
      publishedAt?: string | null;
    }
  ): Promise<Record<string, unknown>> {
    const versionNumber = await this.getNextVersionNumber(client, courseId);

    return {
      course_id: courseId,
      version_number: versionNumber,
      title: options.title,
      description: options.description,
      content: options.content,
      status: options.status,
      start_date: options.startDate,
      end_date: options.endDate,
      published_by: options.publishedBy ?? null,
      published_at: options.publishedAt ?? null,
    };
  }

  private async getNextVersionNumber(
    client: SupabaseClient,
    courseId: string
  ): Promise<number> {
    const { data, error } = await client
      .from(TABLES.courseVersions)
      .select("version_number")
      .eq("course_id", courseId)
      .order("version_number", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error && error.code !== "PGRST116") {
      throw new Error(
        error.message || "Error al calcular el número de versión"
      );
    }

    const current = data?.version_number as number | undefined;
    return typeof current === "number" ? current + 1 : 1;
  }

  private async getNextOrder(
    client: SupabaseClient,
    table: string,
    orderColumn: string,
    filterColumn: string,
    filterValue: string,
    provided?: number
  ): Promise<number> {
    if (typeof provided === "number") {
      return provided;
    }

    const { data, error } = await client
      .from(table)
      .select(orderColumn)
      .eq(filterColumn, filterValue)
      .order(orderColumn, { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error && error.code !== "PGRST116") {
      throw new Error(error.message || "Error al calcular el orden");
    }

    const record = data as Record<string, number | null> | null;
    const current = record ? (record[orderColumn] ?? undefined) : undefined;
    return typeof current === "number" ? current + 1 : 1;
  }

  private async getGroupStudents(
    client: SupabaseClient,
    groupIds: readonly string[]
  ): Promise<Map<string, GroupStudentRow[]>> {
    const result = new Map<string, GroupStudentRow[]>();

    if (groupIds.length === 0) {
      return result;
    }

    const { data, error } = await client
      .from(TABLES.courseGroupStudents)
      .select("*")
      .in("group_id", groupIds);

    if (error) {
      throw new Error(
        error.message || "Error al obtener estudiantes del grupo"
      );
    }

    (data ?? []).forEach((row) => {
      const record = row as GroupStudentRow;
      if (!result.has(record.group_id)) {
        result.set(record.group_id, []);
      }
      result.get(record.group_id)!.push(record);
    });

    return result;
  }
}
