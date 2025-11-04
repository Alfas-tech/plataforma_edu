"use server";

import { revalidatePath } from "next/cache";
import { getCurrentProfile } from "./profile.actions";
import { SupabaseStudentRepository } from "@/src/infrastructure/repositories/SupabaseStudentRepository";
import { GetCourseContentUseCase } from "@/src/application/use-cases/student/GetCourseContentUseCase";
import { MarkTopicCompleteUseCase } from "@/src/application/use-cases/student/MarkTopicCompleteUseCase";
import { MarkTopicIncompleteUseCase } from "@/src/application/use-cases/student/MarkTopicIncompleteUseCase";

// Initialize repository
const studentRepository = new SupabaseStudentRepository();

/**
 * Server Action: Get course content (topics/resources) and student progress
 */
export async function getCourseContent(courseId: string) {
  try {
    const profileResult = await getCurrentProfile();
    if ("error" in profileResult) {
      return { error: "No autenticado" };
    }

    const { profile } = profileResult;

    if (!profile.isStudent) {
      return { error: "Solo estudiantes pueden acceder a este contenido" };
    }

    const useCase = new GetCourseContentUseCase(studentRepository);
    const result = await useCase.execute(courseId, profile.id);

    if (!result.success || !result.data) {
      return { error: result.error || "Error al obtener curso" };
    }

    return {
      course: result.data.course,
      version: result.data.version,
      topics: result.data.topics,
      progress: result.data.progress,
    };
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : "Error al obtener curso",
    };
  }
}

/**
 * Server Action: Mark a topic as completed
 */
export async function markTopicComplete(topicId: string) {
  try {
    const profileResult = await getCurrentProfile();
    if ("error" in profileResult) {
      return { error: "No autenticado" };
    }

    const { profile } = profileResult;

    if (!profile.isStudent) {
      return {
        error: "Solo estudiantes pueden marcar tópicos como completados",
      };
    }

    const useCase = new MarkTopicCompleteUseCase(studentRepository);
    const result = await useCase.execute(topicId, profile.id);

    if (!result.success) {
      return { error: result.error || "Error al marcar tópico" };
    }

    revalidatePath("/dashboard/student");
    return { success: true };
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : "Error al marcar tópico",
    };
  }
}

/**
 * Server Action: Mark a topic as incomplete
 */
export async function markTopicIncomplete(topicId: string) {
  try {
    const profileResult = await getCurrentProfile();
    if ("error" in profileResult) {
      return { error: "No autenticado" };
    }

    const { profile } = profileResult;

    if (!profile.isStudent) {
      return { error: "Solo estudiantes pueden actualizar su progreso" };
    }

    const useCase = new MarkTopicIncompleteUseCase(studentRepository);
    const result = await useCase.execute(topicId, profile.id);

    if (!result.success) {
      return { error: result.error || "Error al actualizar tópico" };
    }

    revalidatePath("/dashboard/student");
    return { success: true };
  } catch (error) {
    return {
      error:
        error instanceof Error ? error.message : "Error al actualizar tópico",
    };
  }
}

/**
 * Server Action: Get student topic progress
 */
export async function getStudentTopicProgress(studentId: string) {
  try {
    const progress = await studentRepository.getStudentTopicProgress(studentId);
    return { progress };
  } catch (error) {
    return {
      error:
        error instanceof Error ? error.message : "Error al obtener progreso",
    };
  }
}

// LEGACY EXPORTS ------------------------------------------------------------

export async function getCourseWithModulesAndLessons(courseId: string) {
  return getCourseContent(courseId);
}

export async function markLessonComplete(topicId: string) {
  return markTopicComplete(topicId);
}

export async function markLessonIncomplete(topicId: string) {
  return markTopicIncomplete(topicId);
}

export async function getStudentProgress(studentId: string) {
  return getStudentTopicProgress(studentId);
}
