"use server";

import { revalidatePath, revalidateTag } from "next/cache";
import { GetAllCoursesUseCase } from "@/src/application/use-cases/course/GetAllCoursesUseCase";
import { CreateCourseUseCase } from "@/src/application/use-cases/course/CreateCourseUseCase";
import { UpdateCourseUseCase } from "@/src/application/use-cases/course/UpdateCourseUseCase";
import { DeleteCourseUseCase } from "@/src/application/use-cases/course/DeleteCourseUseCase";
import { AssignTeacherToCourseVersionUseCase } from "@/src/application/use-cases/course/AssignTeacherToCourseVersionUseCase";
import { RemoveTeacherFromCourseVersionUseCase } from "@/src/application/use-cases/course/RemoveTeacherFromCourseVersionUseCase";
import { GetCourseVersionAssignmentsUseCase } from "@/src/application/use-cases/course/GetCourseVersionAssignmentsUseCase";
import { GetTeacherCoursesUseCase } from "@/src/application/use-cases/course/GetTeacherCoursesUseCase";
import { CreateCourseBranchUseCase } from "@/src/application/use-cases/course/CreateCourseBranchUseCase";
import { GetCourseWithTeachersUseCase } from "@/src/application/use-cases/course/GetCourseWithTeachersUseCase";
import { CreateCourseMergeRequestUseCase } from "@/src/application/use-cases/course/CreateCourseMergeRequestUseCase";
import { ReviewCourseMergeRequestUseCase } from "@/src/application/use-cases/course/ReviewCourseMergeRequestUseCase";
import { MergeCourseBranchUseCase } from "@/src/application/use-cases/course/MergeCourseBranchUseCase";
import { DeleteCourseBranchUseCase } from "@/src/application/use-cases/course/DeleteCourseBranchUseCase";
import { SupabaseCourseRepository } from "@/src/infrastructure/repositories/SupabaseCourseRepository";
import { SupabaseCourseBranchingRepository } from "@/src/infrastructure/repositories/SupabaseCourseBranchingRepository";
import { SupabaseAuthRepository } from "@/src/infrastructure/repositories/SupabaseAuthRepository";
import { SupabaseProfileRepository } from "@/src/infrastructure/repositories/SupabaseProfileRepository";
import { CourseEntity } from "@/src/core/entities/Course.entity";
import { CourseBranchEntity } from "@/src/core/entities/CourseBranch.entity";
import { ProfileEntity } from "@/src/core/entities/Profile.entity";
import {
  CreateCourseBranchInput,
  CreateCourseInput,
  CreateCourseMergeRequestInput,
  DeleteCourseBranchInput,
  MergeCourseBranchInput,
  ReviewCourseMergeRequestInput,
  UpdateCourseInput,
} from "@/src/core/types/course.types";
import type {
  CourseOverview,
  CourseVisibilitySource,
} from "@/src/presentation/types/course";

const courseRepository = new SupabaseCourseRepository();
const courseBranchingRepository = new SupabaseCourseBranchingRepository();
const authRepository = new SupabaseAuthRepository();
const profileRepository = new SupabaseProfileRepository();

function getVisibilitySource(course: CourseEntity): CourseVisibilitySource {
  const version = course.getPrimaryVersion();

  if (version?.isPublishedAndVisible()) {
    return "version";
  }

  if (course.visibilityOverride) {
    return "override";
  }

  return "hidden";
}

function mapBranchToPresentation(
  branch: CourseBranchEntity,
  options?: { canManage?: boolean }
): CourseOverview["branches"][number] {
  return {
    id: branch.id,
    name: branch.name,
    description: branch.description,
    isDefault: branch.isDefault,
    parentBranchId: branch.parentBranchId,
    baseVersionId: branch.baseVersion?.id ?? branch.baseVersionId,
    baseVersionLabel: branch.baseVersion?.versionLabel ?? null,
    tipVersionId: branch.tipVersion?.id ?? null,
    tipVersionLabel: branch.tipVersion?.versionLabel ?? null,
    tipVersionStatus: branch.tipVersion?.status ?? null,
    tipVersionUpdatedAt: branch.tipVersion
      ? branch.tipVersion.updatedAt.toISOString()
      : null,
    updatedAt: branch.updatedAt.toISOString(),
    canManage: options?.canManage,
  };
}

function mapCourseToPresentation(
  course: CourseEntity,
  options?: { manageableBranchIds?: Iterable<string> }
): CourseOverview {
  const version = course.getPrimaryVersion();
  const visibilitySource = getVisibilitySource(course);
  const isVisibleForStudents = visibilitySource !== "hidden";
  const hasActiveVersion = course.hasActiveVersion();
  const createdAt = course.createdAt.toISOString();
  const lastUpdatedAt = (version?.updatedAt ?? course.updatedAt).toISOString();

  const manageableSet = options?.manageableBranchIds
    ? new Set(options.manageableBranchIds)
    : new Set<string>();
  const shouldAnnotateManagement = Boolean(options?.manageableBranchIds);

  const branchNameById = new Map<string, string>();
  const branchTipVersionMap = new Map<string, string>();
  const versionLabelById = new Map<string, string>();

  course.branches.forEach((branch) => {
    branchNameById.set(branch.id, branch.name);
    if (branch.tipVersion) {
      branchTipVersionMap.set(branch.id, branch.tipVersion.versionLabel);
      versionLabelById.set(
        branch.tipVersion.id,
        branch.tipVersion.versionLabel
      );
    }
    if (branch.baseVersion) {
      versionLabelById.set(
        branch.baseVersion.id,
        branch.baseVersion.versionLabel
      );
    }
  });

  if (course.defaultBranch) {
    branchNameById.set(course.defaultBranch.id, course.defaultBranch.name);
    if (course.defaultBranch.tipVersion) {
      branchTipVersionMap.set(
        course.defaultBranch.id,
        course.defaultBranch.tipVersion.versionLabel
      );
      versionLabelById.set(
        course.defaultBranch.tipVersion.id,
        course.defaultBranch.tipVersion.versionLabel
      );
    }
    if (course.defaultBranch.baseVersion) {
      versionLabelById.set(
        course.defaultBranch.baseVersion.id,
        course.defaultBranch.baseVersion.versionLabel
      );
    }
  }

  const activeVersion = version
    ? {
        id: version.id,
        label: version.versionLabel,
        summary: version.summary,
        status: version.status,
        isActive: version.isActive,
        isPublished: version.isPublished,
        approvedAt: version.approvedAt
          ? version.approvedAt.toISOString()
          : null,
        createdAt: version.createdAt.toISOString(),
        updatedAt: version.updatedAt.toISOString(),
        branchId: version.branchId,
        branchName: version.branchId
          ? (branchNameById.get(version.branchId) ?? null)
          : null,
      }
    : null;

  if (activeVersion) {
    versionLabelById.set(activeVersion.id, activeVersion.label);
  }

  const branches = course.branches.map((branch) =>
    mapBranchToPresentation(branch, {
      canManage: shouldAnnotateManagement
        ? manageableSet.has(branch.id)
        : undefined,
    })
  );

  const defaultBranch = course.defaultBranch
    ? mapBranchToPresentation(course.defaultBranch, {
        canManage: shouldAnnotateManagement
          ? manageableSet.has(course.defaultBranch.id)
          : undefined,
      })
    : null;

  const branchNameFallback = (branchId: string) =>
    branchNameById.get(branchId) ?? "Desconocida";

  const pendingMergeRequests = course.pendingMergeRequests.map((mr) => ({
    id: mr.id,
    title: mr.title,
    summary: mr.summary,
    status: mr.status,
    sourceBranchId: mr.sourceBranchId,
    sourceBranchName: branchNameFallback(mr.sourceBranchId),
    sourceVersionId: mr.sourceVersionId,
    sourceVersionLabel:
      versionLabelById.get(mr.sourceVersionId) ??
      branchTipVersionMap.get(mr.sourceBranchId) ??
      mr.sourceVersionId,
    targetBranchId: mr.targetBranchId,
    targetBranchName: branchNameFallback(mr.targetBranchId),
    targetVersionId: mr.targetVersionId,
    targetVersionLabel: mr.targetVersionId
      ? (versionLabelById.get(mr.targetVersionId) ??
        branchTipVersionMap.get(mr.targetBranchId) ??
        mr.targetVersionId)
      : null,
    openedAt: mr.openedAt.toISOString(),
    openedById: mr.openedBy,
    openedByName: null,
    openedByEmail: null,
    openedByAvatarUrl: null,
    reviewerId: mr.reviewerId,
    reviewerName: null,
    reviewerEmail: null,
    reviewerAvatarUrl: null,
    closedAt: mr.closedAt ? mr.closedAt.toISOString() : null,
    mergedAt: mr.mergedAt ? mr.mergedAt.toISOString() : null,
  }));

  const computedCanEditCourse = options?.manageableBranchIds
    ? course.defaultBranch
      ? manageableSet.has(course.defaultBranch.id)
      : manageableSet.size > 0
    : undefined;

  return {
    id: course.id,
    title: course.title,
    summary: course.summary,
    description: course.description,
    slug: course.slug,
    visibilityOverride: course.visibilityOverride,
    isVisibleForStudents,
    visibilitySource,
    hasActiveVersion,
    createdAt,
    lastUpdatedAt,
    activeVersion,
    defaultBranch,
    branches,
    pendingMergeRequests,
    canEditCourse: computedCanEditCourse,
  };
}

async function enrichMergeRequestParticipants(
  courses: CourseOverview[]
): Promise<CourseOverview[]> {
  const userIds = new Set<string>();

  courses.forEach((course) => {
    course.pendingMergeRequests.forEach((mr) => {
      if (mr.openedById) {
        userIds.add(mr.openedById);
      }
      if (mr.reviewerId) {
        userIds.add(mr.reviewerId);
      }
    });
  });

  if (userIds.size === 0) {
    return courses;
  }

  const profiles = await Promise.all(
    Array.from(userIds).map(async (id) => {
      const profile = await profileRepository.getProfileByUserId(id);
      return profile ? { id, profile } : null;
    })
  );

  const profileById = new Map<string, ProfileEntity>();

  profiles.forEach((entry) => {
    if (entry) {
      profileById.set(entry.id, entry.profile);
    }
  });

  return courses.map((course) => ({
    ...course,
    pendingMergeRequests: course.pendingMergeRequests.map((mr) => {
      const author = mr.openedById
        ? (profileById.get(mr.openedById) ?? null)
        : null;
      const reviewer = mr.reviewerId
        ? (profileById.get(mr.reviewerId) ?? null)
        : null;

      return {
        ...mr,
        openedByName: author?.getDisplayName() ?? mr.openedByName,
        openedByEmail: author?.email ?? mr.openedByEmail,
        openedByAvatarUrl: author?.avatarUrl ?? mr.openedByAvatarUrl,
        reviewerName: reviewer?.getDisplayName() ?? mr.reviewerName,
        reviewerEmail: reviewer?.email ?? mr.reviewerEmail,
        reviewerAvatarUrl: reviewer?.avatarUrl ?? mr.reviewerAvatarUrl,
      };
    }),
  }));
}

async function enrichCourseMergeRequests(
  course: CourseOverview
): Promise<CourseOverview> {
  const [enriched] = await enrichMergeRequestParticipants([course]);
  return enriched;
}

export async function getAllCourses() {
  const getAllCoursesUseCase = new GetAllCoursesUseCase(courseRepository);

  try {
    const result = await getAllCoursesUseCase.execute();

    if (!result.success || !result.courses) {
      return { error: result.error || "Error al obtener cursos" };
    }

    const courseOverviews = await enrichMergeRequestParticipants(
  result.courses.map((course) => mapCourseToPresentation(course))
    );

    return { courses: courseOverviews };
  } catch (error) {
    console.error("getAllCourses action error", error);
    return {
      error:
        error instanceof Error
          ? error.message
          : "Error inesperado al obtener cursos",
    };
  }
}

export async function createCourse(input: CreateCourseInput) {
  const createCourseUseCase = new CreateCourseUseCase(
    courseRepository,
    authRepository,
    profileRepository
  );

  const result = await createCourseUseCase.execute(input);

  if (!result.success) {
    return { error: result.error || "Error al crear curso" };
  }

  revalidateTag("admin-courses");
  revalidatePath("/dashboard/admin");
  revalidatePath("/dashboard/admin/courses");

  return { success: true };
}

export async function updateCourse(courseId: string, input: UpdateCourseInput) {
  const updateCourseUseCase = new UpdateCourseUseCase(
    courseRepository,
    authRepository,
    profileRepository
  );

  const result = await updateCourseUseCase.execute(courseId, input);

  if (!result.success) {
    return { error: result.error || "Error al actualizar curso" };
  }

  revalidateTag("admin-courses");
  revalidatePath("/dashboard/admin");
  revalidatePath("/dashboard/admin/courses");
  revalidatePath("/dashboard/teacher");

  return { success: true };
}

export async function deleteCourse(courseId: string) {
  const deleteCourseUseCase = new DeleteCourseUseCase(
    courseRepository,
    authRepository,
    profileRepository
  );

  const result = await deleteCourseUseCase.execute(courseId);

  if (!result.success) {
    return { error: result.error || "Error al eliminar curso" };
  }

  revalidateTag("admin-courses");
  revalidatePath("/dashboard/admin");
  revalidatePath("/dashboard/admin/courses");

  return { success: true };
}

export async function createCourseBranch(input: CreateCourseBranchInput) {
  const useCase = new CreateCourseBranchUseCase(courseBranchingRepository);

  const result = await useCase.execute(input);

  if (!result.success || !result.course) {
    return {
      error: result.error || "Error al crear la rama del curso",
    };
  }

  revalidateTag("admin-courses");
  revalidatePath("/dashboard/admin");
  revalidatePath("/dashboard/admin/courses");
  revalidatePath("/dashboard/teacher");

  return {
    success: true,
    course: await enrichCourseMergeRequests(
      mapCourseToPresentation(result.course)
    ),
  };
}

export async function createCourseMergeRequest(
  input: CreateCourseMergeRequestInput
) {
  const useCase = new CreateCourseMergeRequestUseCase(
    courseBranchingRepository
  );

  const result = await useCase.execute(input);

  if (!result.success || !result.course) {
    return {
      error: result.error || "Error al crear la solicitud de fusión del curso",
    };
  }

  revalidateTag("admin-courses");
  revalidatePath("/dashboard/admin");
  revalidatePath("/dashboard/admin/courses");
  revalidatePath("/dashboard/teacher");

  return {
    success: true,
    course: await enrichCourseMergeRequests(
      mapCourseToPresentation(result.course)
    ),
  };
}

export async function reviewCourseMergeRequest(
  input: ReviewCourseMergeRequestInput
) {
  const useCase = new ReviewCourseMergeRequestUseCase(
    courseBranchingRepository
  );

  const result = await useCase.execute(input);

  if (!result.success || !result.course) {
    return {
      error: result.error || "Error al actualizar la solicitud de fusión",
    };
  }

  revalidateTag("admin-courses");
  revalidatePath("/dashboard/admin");
  revalidatePath("/dashboard/admin/courses");
  revalidatePath("/dashboard/teacher");

  return {
    success: true,
    course: await enrichCourseMergeRequests(
      mapCourseToPresentation(result.course)
    ),
  };
}

export async function mergeCourseBranch(input: MergeCourseBranchInput) {
  const useCase = new MergeCourseBranchUseCase(courseBranchingRepository);

  const result = await useCase.execute(input);

  if (!result.success || !result.course) {
    return {
      error: result.error || "Error al fusionar la rama",
    };
  }

  revalidateTag("admin-courses");
  revalidatePath("/dashboard/admin");
  revalidatePath("/dashboard/admin/courses");
  revalidatePath("/dashboard/teacher");

  return {
    success: true,
    course: await enrichCourseMergeRequests(
      mapCourseToPresentation(result.course)
    ),
  };
}

export async function deleteCourseBranch(input: DeleteCourseBranchInput) {
  const useCase = new DeleteCourseBranchUseCase(courseBranchingRepository);

  const result = await useCase.execute(input);

  if (!result.success || !result.course) {
    return {
      error: result.error || "Error al eliminar la rama",
    };
  }

  revalidateTag("admin-courses");
  revalidatePath("/dashboard/admin");
  revalidatePath("/dashboard/admin/courses");
  revalidatePath(`/dashboard/admin/courses/${input.courseId}/teachers`);
  revalidatePath(`/dashboard/admin/courses/${input.courseId}/content`);

  return {
    success: true,
    course: await enrichCourseMergeRequests(
      mapCourseToPresentation(result.course)
    ),
  };
}

export async function getCourseWithTeachers(courseId: string) {
  const useCase = new GetCourseWithTeachersUseCase(
    courseRepository,
    profileRepository
  );

  const result = await useCase.execute(courseId);

  if (!result.success || !result.data) {
    return {
      error: result.error || "Error al obtener el curso",
    };
  }

  const course = await enrichCourseMergeRequests(
    mapCourseToPresentation(result.data.course)
  );

  const teachers = result.data.teachers.map((teacher) => ({
    id: teacher.id,
    email: teacher.email,
    fullName: teacher.fullName,
    avatarUrl: teacher.avatarUrl,
    displayName: teacher.getDisplayName(),
  }));

  return {
    course,
    teachers,
  };
}

export async function assignTeacherToCourseVersion(
  courseId: string,
  courseVersionId: string,
  teacherId: string
) {
  const assignTeacherUseCase = new AssignTeacherToCourseVersionUseCase(
    courseRepository,
    authRepository,
    profileRepository
  );

  const result = await assignTeacherUseCase.execute(
    courseId,
    courseVersionId,
    teacherId
  );

  if (!result.success) {
    return {
      error: result.error || "Error al asignar docente a la versión",
    };
  }

  revalidateTag("admin-courses");
  revalidatePath("/dashboard/admin");
  revalidatePath("/dashboard/admin/courses");
  revalidatePath(`/dashboard/admin/courses/${courseId}/teachers`);
  revalidatePath(`/dashboard/admin/courses/${courseId}/content`);
  revalidatePath("/dashboard/teacher");

  return { success: true };
}

export async function removeTeacherFromCourseVersion(
  courseId: string,
  courseVersionId: string,
  teacherId: string
) {
  const removeTeacherUseCase = new RemoveTeacherFromCourseVersionUseCase(
    courseRepository,
    authRepository,
    profileRepository
  );

  const result = await removeTeacherUseCase.execute(
    courseId,
    courseVersionId,
    teacherId
  );

  if (!result.success) {
    return {
      error: result.error || "Error al remover docente de la versión",
    };
  }

  revalidateTag("admin-courses");
  revalidatePath("/dashboard/admin");
  revalidatePath("/dashboard/admin/courses");
  revalidatePath(`/dashboard/admin/courses/${courseId}/teachers`);
  revalidatePath(`/dashboard/admin/courses/${courseId}/content`);
  revalidatePath("/dashboard/teacher");

  return { success: true };
}

export async function getCourseVersionAssignments(courseId: string) {
  const useCase = new GetCourseVersionAssignmentsUseCase(
    courseRepository,
    authRepository,
    profileRepository
  );

  const result = await useCase.execute(courseId);

  if (!result.success || !result.course || !result.assignments) {
    return {
      error: result.error || "Error al obtener las versiones del curso",
    };
  }

  const courseOverview = await enrichCourseMergeRequests(
    mapCourseToPresentation(result.course)
  );

  const branchNameById = new Map<string, string>();

  if (courseOverview.defaultBranch) {
    branchNameById.set(
      courseOverview.defaultBranch.id,
      courseOverview.defaultBranch.name
    );
  }

  courseOverview.branches.forEach((branch) => {
    branchNameById.set(branch.id, branch.name);
  });

  const teacherIdSet = new Set<string>();
  result.assignments.forEach((assignment) => {
    assignment.teacherIds.forEach((id) => teacherIdSet.add(id));
  });

  const teacherProfiles = await Promise.all(
    Array.from(teacherIdSet).map(async (id) => {
      const profile = await profileRepository.getProfileByUserId(id);
      return profile ? { id, profile } : null;
    })
  );

  const profileById = new Map<string, ProfileEntity>();
  teacherProfiles.forEach((entry) => {
    if (entry) {
      profileById.set(entry.id, entry.profile);
    }
  });

  const versions = result.assignments.map(({ version, teacherIds }) => ({
    id: version.id,
    label: version.versionLabel,
    summary: version.summary,
    status: version.status,
    isActive: version.isActive,
    isPublished: version.isPublished,
    isTip: version.isTip,
    createdAt: version.createdAt.toISOString(),
    updatedAt: version.updatedAt.toISOString(),
    branchId: version.branchId,
    branchName: version.branchId
      ? (branchNameById.get(version.branchId) ?? null)
      : null,
    teacherIds,
    teachers: teacherIds
      .map((id) => profileById.get(id))
      .filter((profile): profile is ProfileEntity => Boolean(profile))
      .map((profile) => ({
        id: profile.id,
        email: profile.email,
        fullName: profile.fullName,
        avatarUrl: profile.avatarUrl,
        displayName: profile.getDisplayName(),
      })),
  }));

  return {
    course: courseOverview,
    versions,
  };
}

export async function getTeacherCourses(teacherId: string) {
  const useCase = new GetTeacherCoursesUseCase(courseRepository);

  const result = await useCase.execute(teacherId);

  if (result.success && result.courses) {
    const courses = await Promise.all(
      result.courses.map(async (course) => {
        const manageableBranchIds = new Set<string>();

        const branchHasTeacher = (branch: typeof course.defaultBranch) => {
          if (!branch) {
            return false;
          }

          const tipAssignments = branch.tipVersionTeacherIds.includes(
            teacherId
          );
          const branchAssignments = branch.assignedTeacherIds.includes(
            teacherId
          );

          return tipAssignments || branchAssignments;
        };

        if (branchHasTeacher(course.defaultBranch)) {
          manageableBranchIds.add(course.defaultBranch!.id);
        }

        course.branches.forEach((branch) => {
          if (branchHasTeacher(branch)) {
            manageableBranchIds.add(branch.id);
          }
        });

        const overview = mapCourseToPresentation(course, {
          manageableBranchIds,
        });

        // El docente puede editar el curso si está asignado a nivel de curso o a cualquier versión
        const canEditCourse = manageableBranchIds.size > 0;

        return enrichCourseMergeRequests({
          ...overview,
          canEditCourse,
        });
      })
    );

    return { courses };
  }

  return { error: result.error || "Error al obtener cursos" };
}
