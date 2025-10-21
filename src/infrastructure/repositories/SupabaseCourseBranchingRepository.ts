import { CourseEntity } from "@/src/core/entities/Course.entity";
import {
  CourseBranchData,
  CourseMergeRequestData,
  CourseMergeRequestStatus,
  CourseModuleData,
  CourseVersionData,
  CourseVersionStatus,
  CreateCourseBranchInput,
  CreateCourseMergeRequestInput,
  DeleteCourseBranchInput,
  LessonData,
  MergeCourseBranchInput,
  ReviewCourseMergeRequestInput,
} from "@/src/core/types/course.types";
import { ICourseBranchingRepository } from "@/src/core/interfaces/repositories/ICourseBranchingRepository";
import { ICourseRepository } from "@/src/core/interfaces/repositories/ICourseRepository";
import { SupabaseCourseRepository } from "@/src/infrastructure/repositories/SupabaseCourseRepository";
import { createClient } from "@/src/infrastructure/supabase/server";

export class SupabaseCourseBranchingRepository
  implements ICourseBranchingRepository
{
  constructor(
    private readonly courseRepository: ICourseRepository =
      new SupabaseCourseRepository()
  ) {}

  async createCourseBranch(
    input: CreateCourseBranchInput
  ): Promise<CourseEntity> {
    const supabase = createClient();
    const authUser = (await supabase.auth.getUser()).data.user;
    const userId = authUser?.id ?? null;

    const branchName = input.branchName.trim();
    if (!branchName) {
      throw new Error("El nombre de la rama es obligatorio");
    }

    const desiredLabel = input.newVersionLabel.trim();
    if (!desiredLabel) {
      throw new Error("La etiqueta de la nueva versión es obligatoria");
    }

    const { data: baseVersionData, error: baseVersionError } = await supabase
      .from("course_versions")
      .select("*")
      .eq("id", input.baseVersionId)
      .single();

    if (baseVersionError || !baseVersionData) {
      throw new Error("No se encontró la versión base seleccionada");
    }

    const baseVersion = baseVersionData as CourseVersionData;

    if (baseVersion.course_id !== input.courseId) {
      throw new Error("La versión base seleccionada no pertenece al curso");
    }

    const { data: existingBranch } = await supabase
      .from("course_branches")
      .select("id")
      .eq("course_id", input.courseId)
      .eq("name", branchName)
      .maybeSingle();

    if (existingBranch) {
      throw new Error("Ya existe una rama con ese nombre en el curso");
    }

    const { data: branchData, error: branchError } = await supabase
      .from("course_branches")
      .insert({
        course_id: input.courseId,
        name: branchName,
        description: input.description ?? null,
        parent_branch_id: baseVersion.branch_id,
        base_version_id: baseVersion.id,
        created_by: userId,
        is_default: false,
      })
      .select()
      .single();

    if (branchError || !branchData) {
      const message = branchError?.message ?? "Error al crear la rama";
      throw new Error(message);
    }

    const versionLabel = await this.ensureUniqueVersionLabel(
      supabase,
      input.courseId,
      desiredLabel
    );

    const { data: newVersionData, error: newVersionError } = await supabase
      .from("course_versions")
      .insert({
        course_id: input.courseId,
        branch_id: branchData.id,
    parent_version_id: baseVersion.id,
    based_on_version_id: baseVersion.id,
        version_label: versionLabel,
    summary: baseVersion.summary,
        status: "draft" satisfies CourseVersionStatus,
        is_active: false,
        is_published: false,
        is_tip: true,
        created_by: userId,
      })
      .select()
      .single();

    if (newVersionError || !newVersionData) {
      const message =
        newVersionError?.message || "Error al crear la versión de la rama";
      throw new Error(message);
    }

    await this.cloneModulesAndLessons(
      supabase,
      baseVersion.id,
      newVersionData.id,
      input.courseId
    );

    return this.loadCourseOrThrow(
      input.courseId,
      "Curso no encontrado después de crear la rama"
    );
  }

  async createCourseMergeRequest(
    input: CreateCourseMergeRequestInput
  ): Promise<CourseEntity> {
    const supabase = createClient();
    const authUser = (await supabase.auth.getUser()).data.user;
    const userId = authUser?.id ?? null;

    if (input.sourceBranchId === input.targetBranchId) {
      throw new Error("La rama de origen y destino deben ser distintas");
    }

    const sourceBranch = await this.getBranchById(
      supabase,
      input.sourceBranchId
    );
    const targetBranch = await this.getBranchById(
      supabase,
      input.targetBranchId
    );

    if (sourceBranch.course_id !== input.courseId) {
      throw new Error("La rama de origen no pertenece al curso");
    }
    if (targetBranch.course_id !== input.courseId) {
      throw new Error("La rama de destino no pertenece al curso");
    }

    const sourceVersion = await this.getBranchTipVersion(
      supabase,
      input.sourceBranchId
    );

    if (!sourceVersion) {
      throw new Error("La rama de origen no tiene una versión activa para fusionar");
    }

    const targetVersion = await this.getBranchTipVersion(
      supabase,
      input.targetBranchId
    );

    const { data: mergeRequestData, error: mergeRequestError } =
      await supabase
        .from("course_merge_requests")
        .insert({
          course_id: input.courseId,
          source_branch_id: input.sourceBranchId,
          target_branch_id: input.targetBranchId,
          source_version_id: sourceVersion.id,
          target_version_id: targetVersion?.id ?? null,
          title: input.title,
          summary: input.summary ?? null,
          status: "open" satisfies CourseMergeRequestStatus,
          opened_by: userId,
        })
        .select()
        .single();

    if (mergeRequestError || !mergeRequestData) {
      throw new Error(
        mergeRequestError?.message || "Error al crear la solicitud de fusión"
      );
    }

    await supabase
      .from("course_versions")
      .update({ merge_request_id: mergeRequestData.id })
      .eq("id", sourceVersion.id);

    return this.loadCourseOrThrow(
      input.courseId,
      "Curso no encontrado después de registrar la solicitud"
    );
  }

  async reviewCourseMergeRequest(
    input: ReviewCourseMergeRequestInput
  ): Promise<CourseEntity> {
    const supabase = createClient();
    const authUser = (await supabase.auth.getUser()).data.user;
    const reviewerId = authUser?.id ?? null;

    const mergeRequest = await this.getMergeRequestById(
      supabase,
      input.mergeRequestId
    );

    if (mergeRequest.status === "merged") {
      throw new Error("La solicitud ya fue fusionada");
    }

    if (mergeRequest.status === "rejected") {
      throw new Error("La solicitud ya fue rechazada");
    }

    const decisionStatus: CourseMergeRequestStatus =
      input.decision === "approve" ? "approved" : "rejected";

    const updatePayload: Record<string, unknown> = {
      status: decisionStatus,
      reviewer_id: reviewerId,
    };

    if (decisionStatus === "rejected") {
      updatePayload.closed_at = new Date().toISOString();
    }

    const { error: updateError } = await supabase
      .from("course_merge_requests")
      .update(updatePayload)
      .eq("id", mergeRequest.id);

    if (updateError) {
      throw new Error(updateError.message || "Error al actualizar la solicitud");
    }

    if (decisionStatus === "rejected") {
      await supabase
        .from("course_versions")
        .update({ merge_request_id: null })
        .eq("id", mergeRequest.source_version_id);
    }

    return this.loadCourseOrThrow(
      mergeRequest.course_id,
      "Curso no encontrado después de actualizar la solicitud"
    );
  }

  async mergeCourseBranch(
    input: MergeCourseBranchInput
  ): Promise<CourseEntity> {
    const supabase = createClient();
    const authUser = (await supabase.auth.getUser()).data.user;
    const reviewerId = authUser?.id ?? null;

    const mergeRequest = await this.getMergeRequestById(
      supabase,
      input.mergeRequestId
    );

    if (mergeRequest.status === "merged") {
      throw new Error("La solicitud ya fue fusionada");
    }

    if (mergeRequest.status === "rejected") {
      throw new Error("La solicitud fue rechazada y no puede fusionarse");
    }

    const sourceBranch = await this.getBranchById(
      supabase,
      mergeRequest.source_branch_id
    );
    const targetBranch = await this.getBranchById(
      supabase,
      mergeRequest.target_branch_id
    );

    const sourceVersion = await this.getBranchTipVersion(
      supabase,
      mergeRequest.source_branch_id
    );

    if (!sourceVersion) {
      throw new Error("La rama de origen no tiene una versión lista para fusionar");
    }

    const targetTip = await this.getBranchTipVersion(
      supabase,
      mergeRequest.target_branch_id
    );

    if (targetTip) {
      await supabase
        .from("course_versions")
        .update({ is_tip: false })
        .eq("id", targetTip.id);
    }

    const desiredLabel = sourceVersion.version_label;
    const versionLabel = await this.ensureUniqueVersionLabel(
      supabase,
      mergeRequest.course_id,
      desiredLabel
    );

    const isDefaultTarget = targetBranch.is_default;

    const { data: newVersionData, error: newVersionError } = await supabase
      .from("course_versions")
      .insert({
        course_id: mergeRequest.course_id,
        branch_id: mergeRequest.target_branch_id,
        parent_version_id: targetTip?.id ?? sourceVersion.id,
        based_on_version_id: sourceVersion.id,
        merged_into_version_id: null,
        merge_request_id: null,
        version_label: versionLabel,
        summary: sourceVersion.summary,
  status: (isDefaultTarget ? "published" : sourceVersion.status) satisfies CourseVersionStatus,
        is_active: isDefaultTarget ? true : sourceVersion.is_active,
        is_published: isDefaultTarget ? true : sourceVersion.is_published,
        is_tip: true,
        created_by: sourceVersion.created_by,
        reviewed_by: reviewerId,
        approved_at: isDefaultTarget ? new Date().toISOString() : sourceVersion.approved_at,
      })
      .select()
      .single();

    if (newVersionError || !newVersionData) {
      throw new Error(
        newVersionError?.message || "Error al crear la versión fusionada"
      );
    }

    await this.cloneModulesAndLessons(
      supabase,
      sourceVersion.id,
      newVersionData.id,
      mergeRequest.course_id
    );

    await supabase
      .from("course_versions")
      .update({
        merge_request_id: null,
        merged_into_version_id: newVersionData.id,
      })
      .eq("id", sourceVersion.id);

    if (isDefaultTarget) {
      await supabase
        .from("courses")
        .update({ active_version_id: newVersionData.id })
        .eq("id", mergeRequest.course_id);
    }

    const { error: mrUpdateError } = await supabase
      .from("course_merge_requests")
      .update({
        status: "merged",
        reviewer_id: reviewerId,
        closed_at: new Date().toISOString(),
        merged_at: new Date().toISOString(),
        target_version_id: newVersionData.id,
      })
      .eq("id", mergeRequest.id);

    if (mrUpdateError) {
      throw new Error(
        mrUpdateError.message || "Error al actualizar la solicitud fusionada"
      );
    }

    return this.loadCourseOrThrow(
      mergeRequest.course_id,
      "Curso no encontrado después de fusionar la rama"
    );
  }

  async deleteCourseBranch(
    input: DeleteCourseBranchInput
  ): Promise<CourseEntity> {
    const supabase = createClient();
    const branch = await this.getBranchById(supabase, input.branchId);

    if (branch.course_id !== input.courseId) {
      throw new Error("La rama no pertenece al curso indicado");
    }

    if (branch.is_default) {
      throw new Error("No se puede eliminar la rama principal");
    }

    const { count: childCount, error: childError } = await supabase
      .from("course_branches")
      .select("id", { count: "exact", head: true })
      .eq("parent_branch_id", input.branchId);

    if (childError) {
      throw new Error(
        childError.message || "Error al validar dependencias de la rama"
      );
    }

    if ((childCount ?? 0) > 0) {
      throw new Error("No se puede eliminar una rama que tiene derivadas");
    }

    const { data: versionsData, error: versionsError } = await supabase
      .from("course_versions")
      .select("id")
      .eq("branch_id", input.branchId);

    if (versionsError) {
      throw new Error(
        versionsError.message || "Error al obtener las versiones de la rama"
      );
    }

    const versionIds = (versionsData ?? []).map(
      (version: { id: string }) => version.id
    );

    if (versionIds.length > 0) {
      const { data: courseRow, error: courseError } = await supabase
        .from("courses")
        .select("active_version_id")
        .eq("id", branch.course_id)
        .single();

      if (courseError) {
        throw new Error(
          courseError.message || "Error al validar la versión activa"
        );
      }

      if (
        courseRow?.active_version_id &&
        versionIds.includes(courseRow.active_version_id)
      ) {
        throw new Error(
          "No se puede eliminar una rama que contiene la versión activa del curso"
        );
      }

      const { data: moduleRows, error: modulesError } = await supabase
        .from("course_modules")
        .select("id")
        .in("course_version_id", versionIds);

      if (modulesError) {
        throw new Error(
          modulesError.message || "Error al obtener los módulos de la rama"
        );
      }

      const moduleIds = (moduleRows ?? []).map(
        (module: { id: string }) => module.id
      );

      if (moduleIds.length > 0) {
        const { error: deleteLessonsError } = await supabase
          .from("lessons")
          .delete()
          .in("module_id", moduleIds);

        if (deleteLessonsError) {
          throw new Error(
            deleteLessonsError.message ||
              "Error al eliminar las lecciones de la rama"
          );
        }

        const { error: deleteModulesError } = await supabase
          .from("course_modules")
          .delete()
          .in("id", moduleIds);

        if (deleteModulesError) {
          throw new Error(
            deleteModulesError.message ||
              "Error al eliminar los módulos de la rama"
          );
        }
      }

      const { error: deleteVersionsError } = await supabase
        .from("course_versions")
        .delete()
        .in("id", versionIds);

      if (deleteVersionsError) {
        throw new Error(
          deleteVersionsError.message ||
            "Error al eliminar las versiones de la rama"
        );
      }
    }

    const { error: deleteBranchError } = await supabase
      .from("course_branches")
      .delete()
      .eq("id", input.branchId);

    if (deleteBranchError) {
      throw new Error(
        deleteBranchError.message || "Error al eliminar la rama"
      );
    }

    return this.loadCourseOrThrow(
      branch.course_id,
      "Curso no encontrado después de eliminar la rama"
    );
  }

  private async loadCourseOrThrow(
    courseId: string,
    errorMessage: string
  ): Promise<CourseEntity> {
    const course = await this.courseRepository.getCourseById(courseId);

    if (!course) {
      throw new Error(errorMessage);
    }

    return course;
  }

  private async getBranchById(
    supabase: ReturnType<typeof createClient>,
    branchId: string
  ): Promise<CourseBranchData> {
    const { data, error } = await supabase
      .from("course_branches")
      .select("*")
      .eq("id", branchId)
      .single();

    if (error || !data) {
      throw new Error("No se encontró la rama seleccionada");
    }

    return data as CourseBranchData;
  }

  private async getBranchTipVersion(
    supabase: ReturnType<typeof createClient>,
    branchId: string
  ): Promise<CourseVersionData | null> {
    const { data } = await supabase
      .from("course_versions")
      .select("*")
      .eq("branch_id", branchId)
      .eq("is_tip", true)
      .maybeSingle();

    return (data as CourseVersionData) ?? null;
  }

  private async getMergeRequestById(
    supabase: ReturnType<typeof createClient>,
    mergeRequestId: string
  ): Promise<CourseMergeRequestData> {
    const { data, error } = await supabase
      .from("course_merge_requests")
      .select("*")
      .eq("id", mergeRequestId)
      .single();

    if (error || !data) {
      throw new Error("No se encontró la solicitud de fusión");
    }

    return data as CourseMergeRequestData;
  }

  private async ensureUniqueVersionLabel(
    supabase: ReturnType<typeof createClient>,
    courseId: string,
    desiredLabel: string
  ): Promise<string> {
    let label = desiredLabel;
    let attempt = 1;

    while (true) {
      const { data } = await supabase
        .from("course_versions")
        .select("id")
        .eq("course_id", courseId)
        .eq("version_label", label)
        .maybeSingle();

      if (!data) {
        return label;
      }

      label = `${desiredLabel}-${attempt}`;
      attempt += 1;
    }
  }

  private async cloneModulesAndLessons(
    supabase: ReturnType<typeof createClient>,
    sourceVersionId: string,
    newVersionId: string,
    courseId: string
  ) {
    const { data: modulesData, error: modulesError } = await supabase
      .from("course_modules")
      .select("*")
      .eq("course_version_id", sourceVersionId)
      .order("order_index", { ascending: true });

    if (modulesError) {
      throw new Error(
        modulesError.message || "Error al duplicar módulos de la versión"
      );
    }

    const modules = (modulesData as CourseModuleData[]) ?? [];

    for (const module of modules) {
      const { data: createdModule, error: createModuleError } = await supabase
        .from("course_modules")
        .insert({
          course_id: courseId,
          course_version_id: newVersionId,
          title: module.title,
          description: module.description,
          order_index: module.order_index,
          content: module.content,
          is_published: module.is_published,
        })
        .select()
        .single();

      if (createModuleError || !createdModule) {
        throw new Error(
          createModuleError?.message || "Error al duplicar un módulo"
        );
      }

      const { data: lessonsData, error: lessonsError } = await supabase
        .from("lessons")
        .select("*")
        .eq("module_id", module.id)
        .order("order_index", { ascending: true });

      if (lessonsError) {
        throw new Error(
          lessonsError.message || "Error al duplicar las lecciones"
        );
      }

      if (!lessonsData || lessonsData.length === 0) {
        continue;
      }

      const lessonsInsert = (lessonsData as LessonData[]).map((lesson) => ({
        module_id: createdModule.id,
        title: lesson.title,
        content: lesson.content,
        order_index: lesson.order_index,
        duration_minutes: lesson.duration_minutes,
        is_published: lesson.is_published,
      }));

      const { error: insertLessonsError } = await supabase
        .from("lessons")
        .insert(lessonsInsert);

      if (insertLessonsError) {
        throw new Error(
          insertLessonsError.message ||
            "Error al crear las lecciones de la versión clonada"
        );
      }
    }
  }
}
