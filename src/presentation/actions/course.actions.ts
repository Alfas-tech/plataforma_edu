"use server";

import { revalidatePath, revalidateTag } from "next/cache";
import {
  ArchiveCourseVersionUseCase,
  AssignTeacherToCourseVersionUseCase,
  CreateCourseDraftUseCase,
  CreateCourseUseCase,
  DeleteCourseUseCase,
  GetAllCoursesUseCase,
  GetCourseVersionAssignmentsUseCase,
  GetTeacherCoursesUseCase,
  PublishCourseVersionUseCase,
  RemoveTeacherFromCourseVersionUseCase,
  UpdateCourseDraftUseCase,
  UpdateCourseUseCase,
} from "@/src/application/use-cases/course";
import { GetCourseWithTeachersUseCase } from "@/src/application/use-cases/course/GetCourseWithTeachersUseCase";
import { SupabaseCourseRepository } from "@/src/infrastructure/repositories/SupabaseCourseRepository";
import { SupabaseAuthRepository } from "@/src/infrastructure/repositories/SupabaseAuthRepository";
import { SupabaseProfileRepository } from "@/src/infrastructure/repositories/SupabaseProfileRepository";
import { CourseEntity } from "@/src/core/entities/Course.entity";
import { CourseVersionEntity } from "@/src/core/entities/CourseVersion.entity";
import { ProfileEntity } from "@/src/core/entities/Profile.entity";
import type { CreateCourseDraftRequest } from "@/src/application/use-cases/course/CreateCourseDraftUseCase";
import type { PublishCourseVersionRequest } from "@/src/application/use-cases/course/PublishCourseVersionUseCase";
import type { ArchiveCourseVersionRequest } from "@/src/application/use-cases/course/ArchiveCourseVersionUseCase";
import type {
  CourseOverview,
  CourseVersionOverview,
} from "@/src/presentation/types/course";
import type {
  CreateCourseInput,
  UpdateCourseInput,
  UpdateCourseDraftInput,
} from "@/src/core/types/course.types";

const courseRepository = new SupabaseCourseRepository();
const authRepository = new SupabaseAuthRepository();
const profileRepository = new SupabaseProfileRepository();

function mapVersionToOverview(
  version: CourseVersionEntity
): CourseVersionOverview {
  const label = version.versionLabel;
  const summary = version.summary;
  const isPublished = version.isActive();

  return {
    id: version.id,
    versionNumber: version.versionNumber,
    title: version.title,
    description: version.description,
    status: version.status,
    startDate: version.startDate ? version.startDate.toISOString() : null,
    endDate: version.endDate ? version.endDate.toISOString() : null,
    publishedAt: version.publishedAt ? version.publishedAt.toISOString() : null,
    publishedBy: version.publishedBy,
    createdAt: version.createdAt.toISOString(),
    updatedAt: version.updatedAt.toISOString(),
    label,
    summary,
    branchId: null,
    branchName: null,
    isPublished,
  };
}

function mapCourseToOverview(course: CourseEntity): CourseOverview {
  const activeVersion = course.activeVersion
    ? mapVersionToOverview(course.activeVersion)
    : null;
  const draftVersion = course.draftVersion
    ? mapVersionToOverview(course.draftVersion)
    : null;
  const archivedVersions = course.archivedVersions.map(mapVersionToOverview);
  const hasActiveVersion = course.hasActiveVersion();
  const summary =
    activeVersion?.description ?? draftVersion?.description ?? null;
  const lastUpdatedAt = course.updatedAt.toISOString();
  const visibilitySource = hasActiveVersion ? "version" : "hidden";

  return {
    id: course.id,
    name: course.name,
    description: course.description,
    createdAt: course.createdAt.toISOString(),
    updatedAt: course.updatedAt.toISOString(),
    activeVersion,
    draftVersion,
    archivedVersions,
    hasActiveVersion,
    hasDraft: course.hasDraft(),
    canEditCourse: true,
    title: course.name,
    summary,
    visibilityOverride: false,
    visibilitySource,
    isVisibleForStudents: hasActiveVersion,
    lastUpdatedAt,
    defaultBranch: null,
    branches: [],
    pendingMergeRequests: [],
  };
}

function revalidateCourses(): void {
  revalidateTag("admin-courses");
  revalidatePath("/dashboard/admin");
  revalidatePath("/dashboard/admin/courses");
  revalidatePath("/dashboard/teacher");
}

function revalidateCourseDetails(courseId: string): void {
  revalidatePath(`/dashboard/admin/courses/${courseId}/teachers`);
  revalidatePath(`/dashboard/admin/courses/${courseId}/content`);
}

export async function getAllCourses() {
  const useCase = new GetAllCoursesUseCase(courseRepository);

  try {
    const result = await useCase.execute();

    if (!result.success || !result.courses) {
      return { error: result.error || "Error al obtener cursos" };
    }

    const courses = result.courses.map(mapCourseToOverview);
    return { courses };
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
  const useCase = new CreateCourseUseCase(
    courseRepository,
    authRepository,
    profileRepository
  );

  const result = await useCase.execute(input);

  if (!result.success) {
    return { error: result.error || "Error al crear curso" };
  }

  revalidateCourses();
  return { success: true };
}

export async function updateCourse(courseId: string, input: UpdateCourseInput) {
  const useCase = new UpdateCourseUseCase(
    courseRepository,
    authRepository,
    profileRepository
  );

  const result = await useCase.execute(courseId, input);

  if (!result.success) {
    return { error: result.error || "Error al actualizar curso" };
  }

  revalidateCourses();
  revalidateCourseDetails(courseId);
  return { success: true };
}

export async function deleteCourse(courseId: string) {
  const useCase = new DeleteCourseUseCase(
    courseRepository,
    authRepository,
    profileRepository
  );

  const result = await useCase.execute(courseId);

  if (!result.success) {
    return { error: result.error || "Error al eliminar curso" };
  }

  revalidateCourses();
  revalidateCourseDetails(courseId);
  return { success: true };
}

export async function createCourseDraft(input: CreateCourseDraftRequest) {
  const useCase = new CreateCourseDraftUseCase(
    courseRepository,
    authRepository,
    profileRepository
  );

  const result = await useCase.execute(input);

  if (!result.success || !result.draft) {
    return {
      error: result.error || "Error al crear el borrador del curso",
    };
  }

  revalidateCourses();
  revalidateCourseDetails(result.draft.courseId);
  return { draft: mapVersionToOverview(result.draft) };
}

export async function updateCourseDraft(
  versionId: string,
  updates: UpdateCourseDraftInput
) {
  const useCase = new UpdateCourseDraftUseCase(
    courseRepository,
    authRepository,
    profileRepository
  );

  const result = await useCase.execute(versionId, updates);

  if (!result.success || !result.draft) {
    return {
      error: result.error || "Error al actualizar el borrador",
    };
  }

  revalidateCourses();
  revalidateCourseDetails(result.draft.courseId);
  return { draft: mapVersionToOverview(result.draft) };
}

export async function getDraftById(draftId: string) {
  try {
    const currentUser = await authRepository.getCurrentUser();
    if (!currentUser) {
      return { error: "No autenticado" };
    }

    const draft = await courseRepository.getCourseVersionById(draftId);
    if (!draft) {
      return { error: "Borrador no encontrado" };
    }

    if (draft.status !== "draft") {
      return { error: "La versión no es un borrador" };
    }

    return {
      draft: {
        id: draft.id,
        title: draft.title,
        description: draft.description,
        courseId: draft.courseId,
      },
    };
  } catch (error) {
    return {
      error:
        error instanceof Error ? error.message : "Error al obtener borrador",
    };
  }
}

export async function publishCourseVersion(input: PublishCourseVersionRequest) {
  const useCase = new PublishCourseVersionUseCase(
    courseRepository,
    authRepository,
    profileRepository
  );

  const result = await useCase.execute(input);

  if (!result.success || !result.course) {
    return {
      error: result.error || "Error al publicar la versión del curso",
    };
  }

  revalidateCourses();
  revalidateCourseDetails(result.course.id);
  return { course: mapCourseToOverview(result.course) };
}

export async function archiveCourseVersion(input: ArchiveCourseVersionRequest) {
  const useCase = new ArchiveCourseVersionUseCase(
    courseRepository,
    authRepository,
    profileRepository
  );

  const result = await useCase.execute(input);

  if (!result.success || !result.course) {
    return {
      error: result.error || "Error al archivar la versión del curso",
    };
  }

  revalidateCourses();
  revalidateCourseDetails(result.course.id);
  return { course: mapCourseToOverview(result.course) };
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

  const course = mapCourseToOverview(result.data.course);
  const teachers = result.data.teachers.map((teacher: ProfileEntity) => ({
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
  const useCase = new AssignTeacherToCourseVersionUseCase(
    courseRepository,
    authRepository,
    profileRepository
  );

  const result = await useCase.execute(courseId, courseVersionId, teacherId);

  if (!result.success) {
    return {
      error: result.error || "Error al asignar docente a la versión",
    };
  }

  revalidateCourses();
  revalidateCourseDetails(courseId);
  return { success: true };
}

export async function removeTeacherFromCourseVersion(
  courseId: string,
  courseVersionId: string,
  teacherId: string
) {
  const useCase = new RemoveTeacherFromCourseVersionUseCase(
    courseRepository,
    authRepository,
    profileRepository
  );

  const result = await useCase.execute(courseId, courseVersionId, teacherId);

  if (!result.success) {
    return {
      error: result.error || "Error al remover docente de la versión",
    };
  }

  revalidateCourses();
  revalidateCourseDetails(courseId);
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
    versionNumber: version.versionNumber,
    title: version.title,
    description: version.description,
    status: version.status,
    isDraft: version.isDraft(),
    isActive: version.isActive(),
    isArchived: version.isArchived(),
    startDate: version.startDate ? version.startDate.toISOString() : null,
    endDate: version.endDate ? version.endDate.toISOString() : null,
    createdAt: version.createdAt.toISOString(),
    updatedAt: version.updatedAt.toISOString(),
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
    course: mapCourseToOverview(result.course),
    versions,
  };
}

export async function getTeacherCourses(teacherId: string) {
  const useCase = new GetTeacherCoursesUseCase(courseRepository);

  const result = await useCase.execute(teacherId);

  if (result.success && result.courses) {
    const courses = result.courses.map(mapCourseToOverview);
    return { courses };
  }

  return { error: result.error || "Error al obtener cursos" };
}
