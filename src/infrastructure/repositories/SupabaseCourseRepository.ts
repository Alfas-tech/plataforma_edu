import { ICourseRepository } from "@/src/core/interfaces/repositories/ICourseRepository";
import { CourseEntity } from "@/src/core/entities/Course.entity";
import { CourseVersionEntity } from "@/src/core/entities/CourseVersion.entity";
import {
  CourseBranchData,
  CourseData,
  CourseMergeRequestData,
  CourseVersionData,
  CreateCourseInput,
  UpdateCourseInput,
} from "@/src/core/types/course.types";
import { createClient } from "@/src/infrastructure/supabase/server";

export class SupabaseCourseRepository implements ICourseRepository {
  private slugify(value: string): string {
    return value
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .substring(0, 80);
  }

  async getActiveCourse(): Promise<CourseEntity | null> {
    const supabase = createClient();

    const { data, error } = await supabase
      .from("course_versions")
      .select("*, course:courses(*)")
      .eq("is_active", true)
      .eq("is_published", true)
      .order("updated_at", { ascending: false })
      .limit(1);

    if (error || !data || data.length === 0) {
      return null;
    }

    const versionRow = data[0] as CourseVersionData & {
      course: CourseData;
    };

    return CourseEntity.fromDatabase(versionRow.course, versionRow);
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

    let activeVersion: CourseVersionData | null = null;

    if (data.active_version_id) {
      const { data: versionData } = await supabase
        .from("course_versions")
        .select("*")
        .eq("id", data.active_version_id)
        .single();

      activeVersion = (versionData as CourseVersionData) ?? null;
    }

    const courseRow = data as CourseData;

    const { data: branchesData } = await supabase
      .from("course_branches")
      .select("*")
      .eq("course_id", id);

    const branchRows = (branchesData as CourseBranchData[]) ?? [];

    const branchBaseVersionByBranch = new Map<
      string,
      CourseVersionData | null
    >();
    const branchTipVersionByBranch = new Map<
      string,
      CourseVersionData | null
    >();
    const branchTipTeacherIdsByBranch = new Map<string, string[]>();
    const branchTeacherIdsByBranch = new Map<string, string[]>();

    let defaultBranchRow: CourseBranchData | null = null;

    if (branchRows.length > 0) {
      const branchIds = branchRows.map((branch) => branch.id);
      const baseVersionIds = branchRows
        .map((branch) => branch.base_version_id)
        .filter((versionId): versionId is string => Boolean(versionId));

      defaultBranchRow = branchRows.find((branch) => branch.is_default) ?? null;
      const defaultBranchId = defaultBranchRow?.id ?? null;

      let baseVersionsMap = new Map<string, CourseVersionData>();

      if (baseVersionIds.length > 0) {
        const { data: baseVersionsData } = await supabase
          .from("course_versions")
          .select("*")
          .in("id", baseVersionIds);

        if (baseVersionsData) {
          baseVersionsMap = new Map(
            (baseVersionsData as CourseVersionData[]).map((version) => [
              version.id,
              version,
            ])
          );
        }
      }

      let tipVersionsMap = new Map<string, CourseVersionData>();
      let tipAssignmentsByVersionId = new Map<string, string[]>();

      if (branchIds.length > 0) {
        const { data: tipVersionsData } = await supabase
          .from("course_versions")
          .select("*")
          .in("branch_id", branchIds)
          .eq("is_tip", true);

        if (tipVersionsData) {
          const tipVersionRows = (
            tipVersionsData as CourseVersionData[]
          ).filter((version) => Boolean(version.branch_id));

          tipVersionsMap = new Map(
            tipVersionRows.map((version) => [
              version.branch_id as string,
              version,
            ])
          );

          const tipVersionIds = tipVersionRows.map((version) => version.id);

          if (tipVersionIds.length > 0) {
            const { data: tipAssignmentsData, error: tipAssignmentsError } =
              await supabase
                .from("course_version_teachers")
                .select("course_version_id, teacher_id")
                .in("course_version_id", tipVersionIds);

            if (tipAssignmentsError) {
              throw new Error(
                tipAssignmentsError.message ||
                  "Error al obtener docentes asignados a las versiones"
              );
            }

            if (tipAssignmentsData) {
              const assignmentMap = new Map<string, string[]>();

              (
                tipAssignmentsData as {
                  course_version_id: string;
                  teacher_id: string;
                }[]
              ).forEach((row) => {
                if (!assignmentMap.has(row.course_version_id)) {
                  assignmentMap.set(row.course_version_id, []);
                }
                assignmentMap.get(row.course_version_id)!.push(row.teacher_id);
              });

              tipAssignmentsByVersionId = assignmentMap;
            }
          }
        }
      }

      const branchAssignments = new Map<string, Set<string>>();

      const { data: courseTeacherRows, error: courseTeacherError } =
        await supabase
          .from("course_teachers")
          .select("teacher_id")
          .eq("course_id", id);

      if (courseTeacherError) {
        throw new Error(
          courseTeacherError.message ||
            "Error al obtener docentes asignados al curso"
        );
      }

      const fallbackBranchId = defaultBranchId ?? branchRows[0]?.id ?? null;

      (
        courseTeacherRows as { teacher_id: string | null }[] | null
      )?.forEach((row) => {
        if (!fallbackBranchId || !row?.teacher_id) {
          return;
        }

        if (!branchAssignments.has(fallbackBranchId)) {
          branchAssignments.set(fallbackBranchId, new Set());
        }

        branchAssignments.get(fallbackBranchId)!.add(row.teacher_id);
      });

      const { data: branchVersionRows, error: branchVersionError } =
        await supabase
          .from("course_versions")
          .select("id, branch_id")
          .eq("course_id", id);

      if (branchVersionError) {
        throw new Error(
          branchVersionError.message ||
            "Error al obtener versiones asociadas a las ediciones"
        );
      }

      const versionToBranch = new Map<string, string>();
      const versionIds: string[] = [];

      (
        branchVersionRows as { id: string; branch_id: string | null }[] | null
      )?.forEach((row) => {
        const branchId = row.branch_id ?? defaultBranchId ?? null;

        if (!branchId) {
          return;
        }

        versionToBranch.set(row.id, branchId);
        versionIds.push(row.id);
      });

      if (versionIds.length > 0) {
        const { data: allAssignmentsRows, error: allAssignmentsError } =
          await supabase
            .from("course_version_teachers")
            .select("course_version_id, teacher_id")
            .in("course_version_id", versionIds);

        if (allAssignmentsError) {
          throw new Error(
            allAssignmentsError.message ||
              "Error al obtener docentes asignados por edición"
          );
        }

        (
          allAssignmentsRows as {
            course_version_id: string;
            teacher_id: string;
          }[] | null
        )?.forEach((assignment) => {
          const branchId = versionToBranch.get(assignment.course_version_id);
          if (!branchId || !assignment.teacher_id) {
            return;
          }

          if (!branchAssignments.has(branchId)) {
            branchAssignments.set(branchId, new Set());
          }

          branchAssignments.get(branchId)!.add(assignment.teacher_id);
        });
      }

      branchRows.forEach((branch) => {
        branchBaseVersionByBranch.set(
          branch.id,
          branch.base_version_id
            ? (baseVersionsMap.get(branch.base_version_id) ?? null)
            : null
        );

        const tipVersion = tipVersionsMap.get(branch.id) ?? null;
        branchTipVersionByBranch.set(branch.id, tipVersion);

        const teacherIds = tipVersion
          ? tipAssignmentsByVersionId.get(tipVersion.id) ?? []
          : [];

        branchTipTeacherIdsByBranch.set(branch.id, teacherIds);

        branchTeacherIdsByBranch.set(
          branch.id,
          Array.from(branchAssignments.get(branch.id) ?? new Set())
        );
      });
    }

    const { data: mergeRequestsData } = await supabase
      .from("course_merge_requests")
      .select("*")
      .eq("course_id", id)
      .in("status", ["open", "approved"]);

    const mergeRequestRows =
      (mergeRequestsData as CourseMergeRequestData[]) ?? [];

    const extras = {
      defaultBranch: defaultBranchRow,
      branches: branchRows,
      branchBaseVersions: Object.fromEntries(
        branchRows.map((branch) => [
          branch.id,
          branchBaseVersionByBranch.get(branch.id) ?? null,
        ])
      ),
      branchTipVersions: Object.fromEntries(
        branchRows.map((branch) => [
          branch.id,
          branchTipVersionByBranch.get(branch.id) ?? null,
        ])
      ),
      branchTipTeacherIds: Object.fromEntries(
        branchRows.map((branch) => [
          branch.id,
          branchTipTeacherIdsByBranch.get(branch.id) ?? [],
        ])
      ),
      branchTeacherIds: Object.fromEntries(
        branchRows.map((branch) => [
          branch.id,
          branchTeacherIdsByBranch.get(branch.id) ?? [],
        ])
      ),
      mergeRequests: mergeRequestRows,
    };

    return CourseEntity.fromDatabase(courseRow, activeVersion, extras);
  }

  async getCourseVersionById(
    versionId: string
  ): Promise<CourseVersionEntity | null> {
    const supabase = createClient();

    const { data, error } = await supabase
      .from("course_versions")
      .select("*")
      .eq("id", versionId)
      .single();

    if (error || !data) {
      return null;
    }

    return CourseVersionEntity.fromDatabase(data as CourseVersionData);
  }

  async getAllCourses(): Promise<CourseEntity[]> {
    const supabase = createClient();

    const { data, error } = await supabase
      .from("courses")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Supabase getAllCourses error", error);
      throw new Error(error.message || "Error al obtener cursos");
    }

    if (!data) {
      return [];
    }

    const courses = data as CourseData[];
    const courseIds = courses.map((course) => course.id);
    const activeVersionIds = courses
      .map((course) => course.active_version_id)
      .filter((id): id is string => Boolean(id));

    let versionsMap = new Map<string, CourseVersionData>();

    if (activeVersionIds.length > 0) {
      const { data: versionsData } = await supabase
        .from("course_versions")
        .select("*")
        .in("id", activeVersionIds);

      if (versionsData) {
        versionsMap = new Map(
          (versionsData as CourseVersionData[]).map((version) => [
            version.id,
            version,
          ])
        );
      }
    }

    const branchesByCourse = new Map<string, CourseBranchData[]>();
    const branchBaseVersionByBranch = new Map<
      string,
      CourseVersionData | null
    >();
    const branchTipVersionByBranch = new Map<
      string,
      CourseVersionData | null
    >();
    const branchTipTeacherIdsByBranch = new Map<string, string[]>();
    const branchTeacherIdsByBranch = new Map<string, string[]>();
    const defaultBranchByCourse = new Map<string, CourseBranchData>();
    const mergeRequestsByCourse = new Map<string, CourseMergeRequestData[]>();

    if (courseIds.length > 0) {
      const { data: branchesData } = await supabase
        .from("course_branches")
        .select("*")
        .in("course_id", courseIds);

      const branchRows = (branchesData as CourseBranchData[]) ?? [];

      if (branchRows.length > 0) {
        const branchIds = branchRows.map((branch) => branch.id);
        const baseVersionIds = branchRows
          .map((branch) => branch.base_version_id)
          .filter((id): id is string => Boolean(id));

        const defaultBranchIdByCourse = new Map<string, string>();
        branchRows.forEach((branch) => {
          if (branch.is_default) {
            defaultBranchByCourse.set(branch.course_id, branch);
            defaultBranchIdByCourse.set(branch.course_id, branch.id);
          }
        });

        const courseTeacherAssignments = new Map<string, Set<string>>();

        const { data: courseTeacherRows, error: courseTeacherError } =
          await supabase
            .from("course_teachers")
            .select("course_id, teacher_id")
            .in("course_id", courseIds);

        if (courseTeacherError) {
          throw new Error(
            courseTeacherError.message ||
              "Error al obtener docentes asignados al curso"
          );
        }

        (
          courseTeacherRows as {
            course_id: string;
            teacher_id: string | null;
          }[] | null
        )?.forEach((row) => {
          if (!row?.course_id || !row.teacher_id) {
            return;
          }

          if (!courseTeacherAssignments.has(row.course_id)) {
            courseTeacherAssignments.set(row.course_id, new Set());
          }

          courseTeacherAssignments.get(row.course_id)!.add(row.teacher_id);
        });

        let baseVersionsMap = new Map<string, CourseVersionData>();

        if (baseVersionIds.length > 0) {
          const { data: baseVersionsData } = await supabase
            .from("course_versions")
            .select("*")
            .in("id", baseVersionIds);

          if (baseVersionsData) {
            baseVersionsMap = new Map(
              (baseVersionsData as CourseVersionData[]).map((version) => [
                version.id,
                version,
              ])
            );
          }
        }

        let tipVersionsMap = new Map<string, CourseVersionData>();
        let tipAssignmentsByVersionId = new Map<string, string[]>();

        if (branchIds.length > 0) {
          const { data: tipVersionsData } = await supabase
            .from("course_versions")
            .select("*")
            .in("branch_id", branchIds)
            .eq("is_tip", true);

          if (tipVersionsData) {
            const tipVersionRows = (
              tipVersionsData as CourseVersionData[]
            ).filter((version) => Boolean(version.branch_id));

            tipVersionsMap = new Map(
              tipVersionRows.map((version) => [
                version.branch_id as string,
                version,
              ])
            );

            const tipVersionIds = tipVersionRows.map((version) => version.id);

            if (tipVersionIds.length > 0) {
              const { data: tipAssignmentsData, error: tipAssignmentsError } =
                await supabase
                  .from("course_version_teachers")
                  .select("course_version_id, teacher_id")
                  .in("course_version_id", tipVersionIds);

              if (tipAssignmentsError) {
                throw new Error(
                  tipAssignmentsError.message ||
                    "Error al obtener docentes asignados a las versiones"
                );
              }

              if (tipAssignmentsData) {
                const assignmentMap = new Map<string, string[]>();

                (
                  tipAssignmentsData as {
                    course_version_id: string;
                    teacher_id: string;
                  }[]
                ).forEach((row) => {
                  if (!assignmentMap.has(row.course_version_id)) {
                    assignmentMap.set(row.course_version_id, []);
                  }
                  assignmentMap.get(row.course_version_id)!.push(row.teacher_id);
                });

                tipAssignmentsByVersionId = assignmentMap;
              }
            }
          }
        }

        const branchAssignments = new Map<string, Set<string>>();

        const courseIdsForBranches = Array.from(
          new Set(branchRows.map((branch) => branch.course_id))
        );

        if (courseIdsForBranches.length > 0) {
          const { data: branchVersionRows, error: branchVersionError } =
            await supabase
              .from("course_versions")
              .select("id, branch_id, course_id")
              .in("course_id", courseIdsForBranches);

          if (branchVersionError) {
            throw new Error(
              branchVersionError.message ||
                "Error al obtener versiones asociadas a las ediciones"
            );
          }

          const versionToBranch = new Map<string, string>();
          const versionIds: string[] = [];

          (
            branchVersionRows as {
              id: string;
              branch_id: string | null;
              course_id: string;
            }[] | null
          )?.forEach((row) => {
            const branchId =
              row.branch_id ??
              defaultBranchIdByCourse.get(row.course_id) ??
              null;

            if (!branchId) {
              return;
            }

            versionToBranch.set(row.id, branchId);
            versionIds.push(row.id);
          });

          if (versionIds.length > 0) {
            const { data: assignmentRows, error: assignmentsError } =
              await supabase
                .from("course_version_teachers")
                .select("course_version_id, teacher_id")
                .in("course_version_id", versionIds);

            if (assignmentsError) {
              throw new Error(
                assignmentsError.message ||
                  "Error al obtener asignaciones de docentes por edición"
              );
            }

            (
              assignmentRows as {
                course_version_id: string;
                teacher_id: string;
              }[] | null
            )?.forEach((row) => {
              const branchId = versionToBranch.get(row.course_version_id);
              if (!branchId || !row.teacher_id) {
                return;
              }

              if (!branchAssignments.has(branchId)) {
                branchAssignments.set(branchId, new Set());
              }

              branchAssignments.get(branchId)!.add(row.teacher_id);
            });
          }
        }

        branchRows.forEach((branch) => {
          if (!branchesByCourse.has(branch.course_id)) {
            branchesByCourse.set(branch.course_id, []);
          }

          branchesByCourse.get(branch.course_id)!.push(branch);

          if (branch.is_default && !defaultBranchByCourse.has(branch.course_id)) {
            defaultBranchByCourse.set(branch.course_id, branch);
          }

          branchBaseVersionByBranch.set(
            branch.id,
            branch.base_version_id
              ? (baseVersionsMap.get(branch.base_version_id) ?? null)
              : null
          );

          const tipVersion = tipVersionsMap.get(branch.id) ?? null;
          branchTipVersionByBranch.set(branch.id, tipVersion);

          const teacherIds = tipVersion
            ? tipAssignmentsByVersionId.get(tipVersion.id) ?? []
            : [];

          branchTipTeacherIdsByBranch.set(branch.id, teacherIds);

          const courseLevelAssignments = courseTeacherAssignments.get(
            branch.course_id
          );

          if (courseLevelAssignments && courseLevelAssignments.size > 0) {
            if (!branchAssignments.has(branch.id)) {
              branchAssignments.set(branch.id, new Set());
            }

            courseLevelAssignments.forEach((teacherId: string) => {
              branchAssignments.get(branch.id)!.add(teacherId);
            });
          }

          branchTeacherIdsByBranch.set(
            branch.id,
            Array.from(branchAssignments.get(branch.id) ?? new Set())
          );
        });
      }

      const { data: mergeRequestsData } = await supabase
        .from("course_merge_requests")
        .select("*")
        .in("course_id", courseIds)
        .in("status", ["open", "approved"]);

      if (mergeRequestsData) {
        (mergeRequestsData as CourseMergeRequestData[]).forEach((mr) => {
          if (!mergeRequestsByCourse.has(mr.course_id)) {
            mergeRequestsByCourse.set(mr.course_id, []);
          }

          mergeRequestsByCourse.get(mr.course_id)!.push(mr);
        });
      }
    }

    return courses.map((course) => {
      const branches = branchesByCourse.get(course.id) ?? [];

      const branchBaseVersionsRecord = Object.fromEntries(
        branches.map((branch) => [
          branch.id,
          branchBaseVersionByBranch.get(branch.id) ?? null,
        ])
      );

      const branchTipVersionsRecord = Object.fromEntries(
        branches.map((branch) => [
          branch.id,
          branchTipVersionByBranch.get(branch.id) ?? null,
        ])
      );

      const defaultBranch =
        defaultBranchByCourse.get(course.id) ??
        branches.find((branch) => branch.id === course.default_branch_id) ??
        null;

      return CourseEntity.fromDatabase(
        course,
        course.active_version_id
          ? (versionsMap.get(course.active_version_id) ?? null)
          : null,
        {
          defaultBranch,
          branches,
          branchBaseVersions: branchBaseVersionsRecord,
          branchTipVersions: branchTipVersionsRecord,
          branchTipTeacherIds: Object.fromEntries(
            branches.map((branch) => [
              branch.id,
              branchTipTeacherIdsByBranch.get(branch.id) ?? [],
            ])
          ),
          branchTeacherIds: Object.fromEntries(
            branches.map((branch) => [
              branch.id,
              branchTeacherIdsByBranch.get(branch.id) ?? [],
            ])
          ),
          mergeRequests: mergeRequestsByCourse.get(course.id) ?? [],
        }
      );
    });
  }

  async createCourse(input: CreateCourseInput): Promise<CourseEntity> {
    const supabase = createClient();
    const authUser = (await supabase.auth.getUser()).data.user;
    const userId = authUser?.id ?? null;

    const summary = input.summary ?? input.description ?? null;

    const slugBase = this.slugify(input.title);
    let slug = slugBase;
    let attempt = 1;
    let courseRow: CourseData | null = null;

    while (!courseRow) {
      const { data, error } = await supabase
        .from("courses")
        .insert({
          title: input.title,
          summary,
          description: input.description ?? null,
          slug,
          created_by: userId,
        })
        .select()
        .single();

      if (error) {
        if (error.code === "23505") {
          slug = `${slugBase}-${attempt}`;
          attempt += 1;
          continue;
        }
        throw new Error(error.message || "Error al crear el curso");
      }

      if (!data) {
        throw new Error("Error al crear el curso");
      }

      courseRow = data as CourseData;
    }

    const initialLabel = input.initialVersionLabel ?? "v1.0.0";
    const { data: versionData, error: versionError } = await supabase
      .from("course_versions")
      .insert({
        course_id: courseRow.id,
        version_label: initialLabel,
        summary: input.initialVersionSummary ?? summary,
        status: "published",
        is_active: true,
        is_published: true,
        created_by: userId,
      })
      .select()
      .single();

    if (versionError || !versionData) {
      throw new Error(
        versionError?.message || "Error al crear la versión inicial"
      );
    }

    const versionRow = versionData as CourseVersionData;

    const { error: updateError } = await supabase
      .from("courses")
      .update({ active_version_id: versionRow.id })
      .eq("id", courseRow.id);

    if (updateError) {
      throw new Error(updateError.message || "Error al vincular versión");
    }

    const updatedCourse: CourseData = {
      ...courseRow,
      active_version_id: versionRow.id,
      updated_at: new Date().toISOString(),
    };

    return CourseEntity.fromDatabase(updatedCourse, versionRow);
  }

  async updateCourse(
    id: string,
    input: UpdateCourseInput
  ): Promise<CourseEntity> {
    const supabase = createClient();

    const { data: existingData, error: fetchError } = await supabase
      .from("courses")
      .select("*")
      .eq("id", id)
      .single();

    if (fetchError || !existingData) {
      throw new Error("Curso no encontrado");
    }

    const original = existingData as CourseData;

    let slug = original.slug;
    const updates: Partial<CourseData> = {
      ...(input.title !== undefined ? { title: input.title } : {}),
      ...(input.summary !== undefined ? { summary: input.summary } : {}),
      ...(input.description !== undefined
        ? { description: input.description }
        : {}),
      ...(input.visibility_override !== undefined
        ? { visibility_override: input.visibility_override }
        : {}),
    };

    if (input.title && input.title !== original.title) {
      const slugBase = this.slugify(input.title);
      slug = slugBase;
      let attempt = 1;

      while (true) {
        const { data: slugCheck, error: slugError } = await supabase
          .from("courses")
          .select("id")
          .eq("slug", slug)
          .neq("id", id)
          .maybeSingle();

        if (slugError) {
          throw new Error(slugError.message || "Error al validar slug");
        }

        if (!slugCheck) {
          break;
        }

        slug = `${slugBase}-${attempt}`;
        attempt += 1;
      }

      updates.slug = slug;
    }

    if (Object.keys(updates).length > 0) {
      updates.updated_at = new Date().toISOString();
      const { error } = await supabase
        .from("courses")
        .update(updates)
        .eq("id", id);

      if (error) {
        throw new Error(error.message || "Error al actualizar el curso");
      }
    }

    const mergedCourse: CourseData = {
      ...original,
      ...updates,
      updated_at: updates.updated_at ?? original.updated_at,
    };

    let activeVersion: CourseVersionData | null = null;

    if (mergedCourse.active_version_id) {
      const { data: versionData } = await supabase
        .from("course_versions")
        .select("*")
        .eq("id", mergedCourse.active_version_id)
        .single();

      activeVersion = (versionData as CourseVersionData) ?? null;
    }

    return CourseEntity.fromDatabase(mergedCourse, activeVersion);
  }

  async deleteCourse(id: string): Promise<void> {
    const supabase = createClient();

    const { error } = await supabase.from("courses").delete().eq("id", id);

    if (error) {
      throw new Error("Error al eliminar el curso");
    }
  }

  async assignTeacherToVersion(
    _courseId: string,
    courseVersionId: string,
    teacherId: string
  ): Promise<void> {
    const supabase = createClient();
    const authUser = (await supabase.auth.getUser()).data.user;

    const { error } = await supabase.from("course_version_teachers").insert({
      course_version_id: courseVersionId,
      teacher_id: teacherId,
      assigned_by: authUser?.id ?? null,
    });

    if (error) {
      throw new Error(
        error.message || "Error al asignar docente a la versión del curso"
      );
    }
  }

  async removeTeacherFromVersion(
    _courseId: string,
    courseVersionId: string,
    teacherId: string
  ): Promise<void> {
    const supabase = createClient();

    const { error } = await supabase
      .from("course_version_teachers")
      .delete()
      .eq("course_version_id", courseVersionId)
      .eq("teacher_id", teacherId);

    if (error) {
      throw new Error(
        error.message || "Error al remover docente de la versión del curso"
      );
    }
  }

  async getCourseTeachers(courseId: string): Promise<string[]> {
    const supabase = createClient();

    const { data: versionsData, error: versionsError } = await supabase
      .from("course_versions")
      .select("id")
      .eq("course_id", courseId);

    if (versionsError) {
      throw new Error(
        versionsError.message || "Error al obtener versiones del curso"
      );
    }

    const versionIds = (versionsData ?? []).map((row) => row.id);

    if (versionIds.length === 0) {
      return [];
    }

    const { data: assignmentsData, error: assignmentsError } = await supabase
      .from("course_version_teachers")
      .select("teacher_id")
      .in("course_version_id", versionIds);

    if (assignmentsError) {
      throw new Error(
        assignmentsError.message || "Error al obtener docentes del curso"
      );
    }

    const teacherIds = new Set<string>();

    (assignmentsData ?? []).forEach((row) => {
      if (row.teacher_id) {
        teacherIds.add(row.teacher_id);
      }
    });

    return Array.from(teacherIds);
  }

  async getVersionTeachers(courseVersionId: string): Promise<string[]> {
    const supabase = createClient();

    const { data, error } = await supabase
      .from("course_version_teachers")
      .select("teacher_id")
      .eq("course_version_id", courseVersionId);

    if (error || !data) {
      return [];
    }

    return data.map((row) => row.teacher_id);
  }

  async getCourseVersionAssignments(
    courseId: string
  ): Promise<Array<{ version: CourseVersionEntity; teacherIds: string[] }>> {
    const supabase = createClient();

    const { data: versionsData, error: versionsError } = await supabase
      .from("course_versions")
      .select("*")
      .eq("course_id", courseId)
      .order("created_at", { ascending: true });

    if (versionsError) {
      throw new Error(
        versionsError.message ||
          "Error al obtener las versiones del curso para las asignaciones"
      );
    }

    const versionRows = (versionsData as CourseVersionData[]) ?? [];

    if (versionRows.length === 0) {
      return [];
    }

    const versionIds = versionRows.map((version) => version.id);

    const { data: assignmentsData, error: assignmentsError } = await supabase
      .from("course_version_teachers")
      .select("course_version_id, teacher_id")
      .in("course_version_id", versionIds);

    if (assignmentsError) {
      throw new Error(
        assignmentsError.message ||
          "Error al obtener las asignaciones de docentes por versión"
      );
    }

    const assignmentMap = new Map<string, string[]>();

    (
      assignmentsData as
        | { course_version_id: string; teacher_id: string }[]
        | null
    )?.forEach((row) => {
      if (!assignmentMap.has(row.course_version_id)) {
        assignmentMap.set(row.course_version_id, []);
      }
      assignmentMap.get(row.course_version_id)!.push(row.teacher_id);
    });

    return versionRows.map((version) => ({
      version: CourseVersionEntity.fromDatabase(version),
      teacherIds: assignmentMap.get(version.id) ?? [],
    }));
  }

  async isTeacherAssignedToVersion(
    courseVersionId: string,
    teacherId: string
  ): Promise<boolean> {
    const supabase = createClient();

    const { count, error } = await supabase
      .from("course_version_teachers")
      .select("id", { count: "exact", head: true })
      .eq("course_version_id", courseVersionId)
      .eq("teacher_id", teacherId);

    if (error) {
      throw new Error(
        error.message ||
          "Error al verificar la asignación del docente en la versión"
      );
    }

    return (count ?? 0) > 0;
  }

  async getTeacherCourses(teacherId: string): Promise<CourseEntity[]> {
    const supabase = createClient();

    const { data: versionAssignments, error: assignmentsError } = await supabase
      .from("course_version_teachers")
      .select("course_version_id")
      .eq("teacher_id", teacherId);

    if (assignmentsError) {
      throw new Error(
        assignmentsError.message ||
          "Error al obtener asignaciones de versiones para el docente"
      );
    }

    const assignedVersionIds = (versionAssignments ?? []).map(
      (row) => row.course_version_id
    );

    const assignedCourseIds = new Set<string>();

    if (assignedVersionIds.length > 0) {
      const { data: versionRows, error: versionsError } = await supabase
        .from("course_versions")
        .select("id, course_id")
        .in("id", assignedVersionIds);

      if (versionsError) {
        throw new Error(
          versionsError.message ||
            "Error al obtener información de las versiones asignadas"
        );
      }

      (
        versionRows as { id: string; course_id: string }[] | null
      )?.forEach((row) => {
        if (row?.course_id) {
          assignedCourseIds.add(row.course_id);
        }
      });
    }

    const { data: courseTeacherRows, error: courseTeachersError } =
      await supabase
        .from("course_teachers")
        .select("course_id")
        .eq("teacher_id", teacherId);

    if (courseTeachersError) {
      throw new Error(
        courseTeachersError.message ||
          "Error al obtener asignaciones de cursos para el docente"
      );
    }

    (
      courseTeacherRows as { course_id: string | null }[] | null
    )?.forEach((row) => {
      if (row?.course_id) {
        assignedCourseIds.add(row.course_id);
      }
    });

    if (assignedCourseIds.size === 0) {
      return [];
    }

    const courseIds = Array.from(assignedCourseIds);

    const { data, error } = await supabase
      .from("courses")
      .select("*")
      .in("id", courseIds)
      .order("created_at", { ascending: false });

    if (error) {
      throw new Error("Error al obtener cursos");
    }

    if (!data) return [];

    const courses = data as CourseData[];
    const versionIds = courses
      .map((course) => course.active_version_id)
      .filter((id): id is string => Boolean(id));

    let versionMap = new Map<string, CourseVersionData>();

    if (versionIds.length > 0) {
      const { data: versionData } = await supabase
        .from("course_versions")
        .select("*")
        .in("id", versionIds);

      if (versionData) {
        versionMap = new Map(
          (versionData as CourseVersionData[]).map((version) => [
            version.id,
            version,
          ])
        );
      }
    }

    const courseIdsList = courses.map((course) => course.id);

    const branchesByCourse = new Map<string, CourseBranchData[]>();
    const branchBaseVersionByBranch = new Map<
      string,
      CourseVersionData | null
    >();
    const branchTipVersionByBranch = new Map<
      string,
      CourseVersionData | null
    >();
    const branchTipTeacherIdsByBranch = new Map<string, string[]>();
    const branchTeacherIdsByBranch = new Map<string, string[]>();
    const defaultBranchByCourse = new Map<string, CourseBranchData>();
    const mergeRequestsByCourse = new Map<string, CourseMergeRequestData[]>();

    if (courseIdsList.length > 0) {
      const { data: branchesData } = await supabase
        .from("course_branches")
        .select("*")
        .in("course_id", courseIdsList);

      const branchRows = (branchesData as CourseBranchData[]) ?? [];

      if (branchRows.length > 0) {
        const branchIds = branchRows.map((branch) => branch.id);
        const baseVersionIds = branchRows
          .map((branch) => branch.base_version_id)
          .filter((id): id is string => Boolean(id));

        const defaultBranchIdByCourse = new Map<string, string>();
        branchRows.forEach((branch) => {
          if (branch.is_default) {
            defaultBranchByCourse.set(branch.course_id, branch);
            defaultBranchIdByCourse.set(branch.course_id, branch.id);
          }
        });

        const courseTeacherAssignments = new Map<string, Set<string>>();

        const { data: courseTeacherRows, error: courseTeacherError } =
          await supabase
            .from("course_teachers")
            .select("course_id, teacher_id")
            .in("course_id", courseIdsList);

        if (courseTeacherError) {
          throw new Error(
            courseTeacherError.message ||
              "Error al obtener docentes asignados al curso"
          );
        }

        (
          courseTeacherRows as {
            course_id: string;
            teacher_id: string | null;
          }[] | null
        )?.forEach((row) => {
          if (!row?.course_id || !row.teacher_id) {
            return;
          }

          if (!courseTeacherAssignments.has(row.course_id)) {
            courseTeacherAssignments.set(row.course_id, new Set());
          }

          courseTeacherAssignments.get(row.course_id)!.add(row.teacher_id);
        });

        let baseVersionsMap = new Map<string, CourseVersionData>();

        if (baseVersionIds.length > 0) {
          const { data: baseVersionsData } = await supabase
            .from("course_versions")
            .select("*")
            .in("id", baseVersionIds);

          if (baseVersionsData) {
            baseVersionsMap = new Map(
              (baseVersionsData as CourseVersionData[]).map((version) => [
                version.id,
                version,
              ])
            );
          }
        }

        let tipVersionsMap = new Map<string, CourseVersionData>();
        let tipAssignmentsByVersionId = new Map<string, string[]>();

        if (branchIds.length > 0) {
          const { data: tipVersionsData } = await supabase
            .from("course_versions")
            .select("*")
            .in("branch_id", branchIds)
            .eq("is_tip", true);

          if (tipVersionsData) {
            const tipVersionRows = (
              tipVersionsData as CourseVersionData[]
            ).filter((version) => Boolean(version.branch_id));

            tipVersionsMap = new Map(
              tipVersionRows.map((version) => [
                version.branch_id as string,
                version,
              ])
            );

            const tipVersionIds = tipVersionRows.map((version) => version.id);

            if (tipVersionIds.length > 0) {
              const { data: tipAssignmentsData, error: tipAssignmentsError } =
                await supabase
                  .from("course_version_teachers")
                  .select("course_version_id, teacher_id")
                  .in("course_version_id", tipVersionIds);

              if (tipAssignmentsError) {
                throw new Error(
                  tipAssignmentsError.message ||
                    "Error al obtener docentes asignados a las versiones"
                );
              }

              if (tipAssignmentsData) {
                const assignmentMap = new Map<string, string[]>();

                (
                  tipAssignmentsData as {
                    course_version_id: string;
                    teacher_id: string;
                  }[]
                ).forEach((row) => {
                  if (!assignmentMap.has(row.course_version_id)) {
                    assignmentMap.set(row.course_version_id, []);
                  }
                  assignmentMap.get(row.course_version_id)!.push(row.teacher_id);
                });

                tipAssignmentsByVersionId = assignmentMap;
              }
            }
          }
        }

        const branchAssignments = new Map<string, Set<string>>();

        const courseIdsForBranches = Array.from(
          new Set(branchRows.map((branch) => branch.course_id))
        );

        if (courseIdsForBranches.length > 0) {
          const { data: branchVersionRows, error: branchVersionError } =
            await supabase
              .from("course_versions")
              .select("id, branch_id, course_id")
              .in("course_id", courseIdsForBranches);

          if (branchVersionError) {
            throw new Error(
              branchVersionError.message ||
                "Error al obtener versiones asociadas a las ediciones"
            );
          }

          const versionToBranch = new Map<string, string>();
          const versionIds: string[] = [];

          (
            branchVersionRows as {
              id: string;
              branch_id: string | null;
              course_id: string;
            }[] | null
          )?.forEach((row) => {
            const branchId =
              row.branch_id ??
              defaultBranchIdByCourse.get(row.course_id) ??
              null;

            if (!branchId) {
              return;
            }

            versionToBranch.set(row.id, branchId);
            versionIds.push(row.id);
          });

          if (versionIds.length > 0) {
            const { data: assignmentRows, error: assignmentsError } =
              await supabase
                .from("course_version_teachers")
                .select("course_version_id, teacher_id")
                .in("course_version_id", versionIds);

            if (assignmentsError) {
              throw new Error(
                assignmentsError.message ||
                  "Error al obtener asignaciones de docentes por edición"
              );
            }

            (
              assignmentRows as {
                course_version_id: string;
                teacher_id: string;
              }[] | null
            )?.forEach((row) => {
              const branchId = versionToBranch.get(row.course_version_id);
              if (!branchId || !row.teacher_id) {
                return;
              }

              if (!branchAssignments.has(branchId)) {
                branchAssignments.set(branchId, new Set());
              }

              branchAssignments.get(branchId)!.add(row.teacher_id);
            });
          }
        }

        branchRows.forEach((branch) => {
          if (!branchesByCourse.has(branch.course_id)) {
            branchesByCourse.set(branch.course_id, []);
          }

          branchesByCourse.get(branch.course_id)!.push(branch);

          branchBaseVersionByBranch.set(
            branch.id,
            branch.base_version_id
              ? (baseVersionsMap.get(branch.base_version_id) ?? null)
              : null
          );

          const tipVersion = tipVersionsMap.get(branch.id) ?? null;
          branchTipVersionByBranch.set(branch.id, tipVersion);

          const teacherIds = tipVersion
            ? tipAssignmentsByVersionId.get(tipVersion.id) ?? []
            : [];

          branchTipTeacherIdsByBranch.set(branch.id, teacherIds);

          const courseLevelAssignments = courseTeacherAssignments.get(
            branch.course_id
          );

          if (courseLevelAssignments && courseLevelAssignments.size > 0) {
            if (!branchAssignments.has(branch.id)) {
              branchAssignments.set(branch.id, new Set());
            }

            courseLevelAssignments.forEach((teacherId: string) => {
              branchAssignments.get(branch.id)!.add(teacherId);
            });
          }

          branchTeacherIdsByBranch.set(
            branch.id,
            Array.from(branchAssignments.get(branch.id) ?? new Set())
          );
        });
      }

      const { data: mergeRequestsData } = await supabase
        .from("course_merge_requests")
        .select("*")
        .in("course_id", courseIdsList)
        .in("status", ["open", "approved"]);

      if (mergeRequestsData) {
        (mergeRequestsData as CourseMergeRequestData[]).forEach((mr) => {
          if (!mergeRequestsByCourse.has(mr.course_id)) {
            mergeRequestsByCourse.set(mr.course_id, []);
          }

          mergeRequestsByCourse.get(mr.course_id)!.push(mr);
        });
      }
    }

    return courses.map((course) => {
      const branches = branchesByCourse.get(course.id) ?? [];

      const branchBaseVersionsRecord = Object.fromEntries(
        branches.map((branch) => [
          branch.id,
          branchBaseVersionByBranch.get(branch.id) ?? null,
        ])
      );

      const branchTipVersionsRecord = Object.fromEntries(
        branches.map((branch) => [
          branch.id,
          branchTipVersionByBranch.get(branch.id) ?? null,
        ])
      );

      const defaultBranch =
        defaultBranchByCourse.get(course.id) ??
        branches.find((branch) => branch.id === course.default_branch_id) ??
        null;

      return CourseEntity.fromDatabase(
        course,
        course.active_version_id
          ? (versionMap.get(course.active_version_id) ?? null)
          : null,
        {
          defaultBranch,
          branches,
          branchBaseVersions: branchBaseVersionsRecord,
          branchTipVersions: branchTipVersionsRecord,
          branchTipTeacherIds: Object.fromEntries(
            branches.map((branch) => [
              branch.id,
              branchTipTeacherIdsByBranch.get(branch.id) ?? [],
            ])
          ),
          branchTeacherIds: Object.fromEntries(
            branches.map((branch) => [
              branch.id,
              branchTeacherIdsByBranch.get(branch.id) ?? [],
            ])
          ),
          mergeRequests: mergeRequestsByCourse.get(course.id) ?? [],
        }
      );
    });
  }
}
