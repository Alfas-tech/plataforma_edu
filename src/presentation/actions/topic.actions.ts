"use server";

import { revalidatePath } from "next/cache";
import { SupabaseCourseRepository } from "@/src/infrastructure/repositories/SupabaseCourseRepository";
import { SupabaseAuthRepository } from "@/src/infrastructure/repositories/SupabaseAuthRepository";
import type {
  CreateTopicInput,
  UpdateTopicInput,
} from "@/src/core/types/course.types";

const courseRepository = new SupabaseCourseRepository();
const authRepository = new SupabaseAuthRepository();

export async function getTopicsByVersion(versionId: string) {
  try {
    const topics = await courseRepository.listTopics(versionId);
    return {
      topics: topics.map((topic) => ({
        id: topic.id,
        title: topic.title,
        description: topic.description,
        orderIndex: topic.orderIndex,
      })),
    };
  } catch (error) {
    return {
      error:
        error instanceof Error ? error.message : "Error al obtener tópicos",
    };
  }
}

export async function createTopic(input: Omit<CreateTopicInput, "createdBy">) {
  try {
    const currentUser = await authRepository.getCurrentUser();
    if (!currentUser) {
      return { error: "No autenticado" };
    }

    const topic = await courseRepository.createTopic({
      ...input,
      createdBy: currentUser.id,
    });
    revalidatePath("/dashboard/admin/courses");

    return {
      topic: {
        id: topic.id,
        title: topic.title,
        description: topic.description,
        orderIndex: topic.orderIndex,
      },
    };
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : "Error al crear tópico",
    };
  }
}

export async function updateTopic(topicId: string, input: UpdateTopicInput) {
  try {
    const currentUser = await authRepository.getCurrentUser();
    if (!currentUser) {
      return { error: "No autenticado" };
    }

    const topic = await courseRepository.updateTopic(topicId, input);
    revalidatePath("/dashboard/admin/courses");

    return {
      topic: {
        id: topic.id,
        title: topic.title,
        description: topic.description,
        orderIndex: topic.orderIndex,
      },
    };
  } catch (error) {
    return {
      error:
        error instanceof Error ? error.message : "Error al actualizar tópico",
    };
  }
}

export async function deleteTopic(topicId: string) {
  try {
    const currentUser = await authRepository.getCurrentUser();
    if (!currentUser) {
      return { error: "No autenticado" };
    }

    await courseRepository.deleteTopic(topicId);
    revalidatePath("/dashboard/admin/courses");

    return { success: true };
  } catch (error) {
    return {
      error:
        error instanceof Error ? error.message : "Error al eliminar tópico",
    };
  }
}
