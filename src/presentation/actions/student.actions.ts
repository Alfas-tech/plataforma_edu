"use server";

import { revalidatePath } from "next/cache";
import { getCurrentProfile } from "./profile.actions";
import { SupabaseStudentRepository } from "@/src/infrastructure/repositories/SupabaseStudentRepository";
import { GetCourseWithModulesAndLessonsUseCase } from "@/src/application/use-cases/student/GetCourseWithModulesAndLessonsUseCase";
import { MarkLessonCompleteUseCase } from "@/src/application/use-cases/student/MarkLessonCompleteUseCase";
import { MarkLessonIncompleteUseCase } from "@/src/application/use-cases/student/MarkLessonIncompleteUseCase";

// Initialize repository
const studentRepository = new SupabaseStudentRepository();

/**
 * Server Action: Get course with modules, lessons, and student progress
 */
export async function getCourseWithModulesAndLessons(courseId: string) {
  try {
    const profileResult = await getCurrentProfile();
    if ("error" in profileResult) {
      return { error: "No autenticado" };
    }

    const { profile } = profileResult;

    if (!profile.isStudent) {
      return { error: "Solo estudiantes pueden acceder a este contenido" };
    }

    const useCase = new GetCourseWithModulesAndLessonsUseCase(studentRepository);
    const result = await useCase.execute(courseId, profile.id);

    if (!result.success || !result.data) {
      return { error: result.error || "Error al obtener curso" };
    }

    return {
      course: result.data.course,
      modules: result.data.modules,
      progress: result.data.progress,
    };
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : "Error al obtener curso",
    };
  }
}

/**
 * Server Action: Mark a lesson as completed
 */
export async function markLessonComplete(lessonId: string) {
  try {
    const profileResult = await getCurrentProfile();
    if ("error" in profileResult) {
      return { error: "No autenticado" };
    }

    const { profile } = profileResult;

    if (!profile.isStudent) {
      return {
        error: "Solo estudiantes pueden marcar lecciones como completadas",
      };
    }

    const useCase = new MarkLessonCompleteUseCase(studentRepository);
    const result = await useCase.execute(lessonId, profile.id);

    if (!result.success) {
      return { error: result.error || "Error al marcar lección" };
    }

    revalidatePath("/dashboard/student");
    return { success: true };
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : "Error al marcar lección",
    };
  }
}

/**
 * Server Action: Mark a lesson as incomplete
 */
export async function markLessonIncomplete(lessonId: string) {
  try {
    const profileResult = await getCurrentProfile();
    if ("error" in profileResult) {
      return { error: "No autenticado" };
    }

    const { profile } = profileResult;

    if (!profile.isStudent) {
      return { error: "Solo estudiantes pueden actualizar su progreso" };
    }

    const useCase = new MarkLessonIncompleteUseCase(studentRepository);
    const result = await useCase.execute(lessonId, profile.id);

    if (!result.success) {
      return { error: result.error || "Error al actualizar lección" };
    }

    revalidatePath("/dashboard/student");
    return { success: true };
  } catch (error) {
    return {
      error:
        error instanceof Error ? error.message : "Error al actualizar lección",
    };
  }
}

/**
 * Server Action: Get student progress (legacy - kept for compatibility)
 * @deprecated Use getCourseWithModulesAndLessons instead
 */
export async function getStudentProgress(studentId: string) {
  try {
    const progress = await studentRepository.getStudentProgress(studentId);
    return { progress };
  } catch (error) {
    return {
      error:
        error instanceof Error ? error.message : "Error al obtener progreso",
    };
  }
}
