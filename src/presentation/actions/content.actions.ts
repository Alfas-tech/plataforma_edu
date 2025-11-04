"use server";

import { revalidatePath } from "next/cache";
import {
  CreateTopicParams,
  CreateTopicUseCase,
  DeleteTopicUseCase,
  GetTopicsByCourseUseCase,
  UpdateTopicUseCase,
} from "@/src/application/use-cases/topic";
import {
  CreateResourceParams,
  CreateResourceUseCase,
  DeleteResourceUseCase,
  GetResourcesByTopicUseCase,
  UpdateResourceUseCase,
} from "@/src/application/use-cases/resource";
import { SupabaseCourseRepository } from "@/src/infrastructure/repositories/SupabaseCourseRepository";
import { SupabaseAuthRepository } from "@/src/infrastructure/repositories/SupabaseAuthRepository";
import { SupabaseProfileRepository } from "@/src/infrastructure/repositories/SupabaseProfileRepository";

const courseRepository = new SupabaseCourseRepository();
const authRepository = new SupabaseAuthRepository();
const profileRepository = new SupabaseProfileRepository();

// ============================================
// TOPIC ACTIONS
// ============================================

export async function getTopicsByCourse(
  courseId: string,
  options?: { courseVersionId?: string }
) {
  const useCase = new GetTopicsByCourseUseCase(
    courseRepository,
    authRepository,
    profileRepository
  );

  const result = await useCase.execute(courseId, options);

  if (!result.success || !result.topics) {
    return { error: result.error || "Error al obtener tópicos" };
  }

  const topics = result.topics.map((topic) => ({
    id: topic.id,
    courseId,
    courseVersionId: topic.courseVersionId,
    title: topic.title,
    description: topic.description,
    orderIndex: topic.orderIndex,
    createdAt: topic.createdAt.toISOString(),
    updatedAt: topic.updatedAt.toISOString(),
  }));

  return { topics, courseVersionId: result.courseVersionId };
}

export async function createTopic(input: CreateTopicParams) {
  const useCase = new CreateTopicUseCase(
    courseRepository,
    authRepository,
    profileRepository
  );

  const result = await useCase.execute(input);

  if (!result.success) {
    return { error: result.error || "Error al crear tópico" };
  }

  revalidatePath("/dashboard/admin");
  revalidatePath("/dashboard/teacher");
  revalidatePath("/dashboard/student");

  return { success: true };
}

export async function updateTopic(
  topicId: string,
  data: Parameters<UpdateTopicUseCase["execute"]>[1]
) {
  const useCase = new UpdateTopicUseCase(
    courseRepository,
    authRepository,
    profileRepository
  );

  const result = await useCase.execute(topicId, data);

  if (!result.success) {
    return { error: result.error || "Error al actualizar tópico" };
  }

  revalidatePath("/dashboard/admin");
  revalidatePath("/dashboard/teacher");
  revalidatePath("/dashboard/student");

  return { success: true };
}

export async function reorderTopics(
  courseVersionId: string,
  updates: Array<{ topicId: string; orderIndex: number }>
) {
  try {
    await courseRepository.reorderTopics(courseVersionId, updates);

    revalidatePath("/dashboard/admin");
    revalidatePath("/dashboard/teacher");
    revalidatePath("/dashboard/student");

    return { success: true };
  } catch (error) {
    return { 
      error: error instanceof Error ? error.message : "Error al reordenar tópicos" 
    };
  }
}

export async function deleteTopic(topicId: string) {
  const useCase = new DeleteTopicUseCase(
    courseRepository,
    authRepository,
    profileRepository
  );

  const result = await useCase.execute(topicId);

  if (!result.success) {
    return { error: result.error || "Error al eliminar tópico" };
  }

  revalidatePath("/dashboard/admin");
  revalidatePath("/dashboard/teacher");
  revalidatePath("/dashboard/student");

  return { success: true };
}

// ============================================
// RESOURCE ACTIONS
// ============================================

export async function getResourcesByTopic(topicId: string) {
  const useCase = new GetResourcesByTopicUseCase(
    courseRepository,
    authRepository,
    profileRepository
  );

  const result = await useCase.execute(topicId);

  if (!result.success || !result.resources) {
    return { error: result.error || "Error al obtener recursos" };
  }

  const resources = result.resources.map((resource) => ({
    id: resource.id,
    topicId: resource.topicId,
    title: resource.title,
    description: resource.description,
    resourceType: resource.resourceType,
    fileUrl: resource.fileUrl,
    fileName: resource.fileName,
    fileSize: resource.fileSize,
    mimeType: resource.mimeType,
    externalUrl: resource.externalUrl,
    orderIndex: resource.orderIndex,
    createdAt: resource.createdAt.toISOString(),
    updatedAt: resource.updatedAt.toISOString(),
  }));

  const topic = result.topic
    ? {
        id: result.topic.id,
        courseVersionId: result.topic.courseVersionId,
        title: result.topic.title,
        description: result.topic.description,
        orderIndex: result.topic.orderIndex,
        createdAt: result.topic.createdAt.toISOString(),
        updatedAt: result.topic.updatedAt.toISOString(),
      }
    : undefined;

  return { resources, topic };
}

export async function createResource(input: CreateResourceParams) {
  const useCase = new CreateResourceUseCase(
    courseRepository,
    authRepository,
    profileRepository
  );

  const result = await useCase.execute(input);

  if (!result.success) {
    return { error: result.error || "Error al crear recurso" };
  }

  revalidatePath("/dashboard/admin");
  revalidatePath("/dashboard/teacher");
  revalidatePath("/dashboard/student");

  return { success: true };
}

export async function updateResource(
  resourceId: string,
  data: Parameters<UpdateResourceUseCase["execute"]>[1]
) {
  const useCase = new UpdateResourceUseCase(
    courseRepository,
    authRepository,
    profileRepository
  );

  const result = await useCase.execute(resourceId, data);

  if (!result.success) {
    return { error: result.error || "Error al actualizar recurso" };
  }

  revalidatePath("/dashboard/admin");
  revalidatePath("/dashboard/teacher");
  revalidatePath("/dashboard/student");

  return { success: true };
}

export async function deleteResource(resourceId: string) {
  const useCase = new DeleteResourceUseCase(
    courseRepository,
    authRepository,
    profileRepository
  );

  const result = await useCase.execute(resourceId);

  if (!result.success) {
    return { error: result.error || "Error al eliminar recurso" };
  }

  revalidatePath("/dashboard/admin");
  revalidatePath("/dashboard/teacher");
  revalidatePath("/dashboard/student");

  return { success: true };
}

// LEGACY EXPORTS ------------------------------------------------------------

export const getModulesByCourse = getTopicsByCourse;
export const createModule = createTopic;
export const updateModule = updateTopic;
export const deleteModule = deleteTopic;

export const getLessonsByModule = getResourcesByTopic;
export const createLesson = createResource;
export const updateLesson = updateResource;
export const deleteLesson = deleteResource;
