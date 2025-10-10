'use server';

import { revalidatePath } from 'next/cache';
import { GetModulesByCourseUseCase } from '@/src/application/use-cases/module/GetModulesByCourseUseCase';
import { CreateModuleUseCase, CreateModuleInput } from '@/src/application/use-cases/module/CreateModuleUseCase';
import { UpdateModuleUseCase } from '@/src/application/use-cases/module/UpdateModuleUseCase';
import { DeleteModuleUseCase } from '@/src/application/use-cases/module/DeleteModuleUseCase';
import { GetLessonsByModuleUseCase } from '@/src/application/use-cases/lesson/GetLessonsByModuleUseCase';
import { CreateLessonUseCase, CreateLessonInput } from '@/src/application/use-cases/lesson/CreateLessonUseCase';
import { UpdateLessonUseCase } from '@/src/application/use-cases/lesson/UpdateLessonUseCase';
import { DeleteLessonUseCase } from '@/src/application/use-cases/lesson/DeleteLessonUseCase';
import { SupabaseModuleRepository } from '@/src/infrastructure/repositories/SupabaseModuleRepository';
import { SupabaseLessonRepository } from '@/src/infrastructure/repositories/SupabaseLessonRepository';
import { SupabaseCourseRepository } from '@/src/infrastructure/repositories/SupabaseCourseRepository';
import { SupabaseAuthRepository } from '@/src/infrastructure/repositories/SupabaseAuthRepository';
import { SupabaseProfileRepository } from '@/src/infrastructure/repositories/SupabaseProfileRepository';

const moduleRepository = new SupabaseModuleRepository();
const lessonRepository = new SupabaseLessonRepository();
const courseRepository = new SupabaseCourseRepository();
const authRepository = new SupabaseAuthRepository();
const profileRepository = new SupabaseProfileRepository();

// ============================================
// MODULE ACTIONS
// ============================================

export async function getModulesByCourse(courseId: string) {
  const getModulesUseCase = new GetModulesByCourseUseCase(
    moduleRepository,
    courseRepository,
    authRepository,
    profileRepository
  );

  const result = await getModulesUseCase.execute(courseId);

  if (!result.success || !result.modules) {
    return { error: result.error || 'Error al obtener módulos' };
  }

  const modules = result.modules.map(module => ({
    id: module.id,
    courseId: module.courseId,
    title: module.title,
    description: module.description,
    orderIndex: module.orderIndex,
    content: module.content,
    isPublished: module.isPublished,
    createdAt: module.createdAt.toISOString(),
    updatedAt: module.updatedAt.toISOString(),
  }));

  return { modules };
}

export async function createModule(input: CreateModuleInput) {
  const createModuleUseCase = new CreateModuleUseCase(
    moduleRepository,
    courseRepository,
    authRepository,
    profileRepository
  );

  const result = await createModuleUseCase.execute(input);

  if (!result.success) {
    return { error: result.error || 'Error al crear módulo' };
  }

  revalidatePath('/dashboard/admin');
  revalidatePath('/dashboard/teacher');
  revalidatePath('/dashboard/student');

  return { success: true };
}

export async function updateModule(moduleId: string, data: any) {
  const updateModuleUseCase = new UpdateModuleUseCase(
    moduleRepository,
    courseRepository,
    authRepository,
    profileRepository
  );

  const result = await updateModuleUseCase.execute(moduleId, data);

  if (!result.success) {
    return { error: result.error || 'Error al actualizar módulo' };
  }

  revalidatePath('/dashboard/admin');
  revalidatePath('/dashboard/teacher');
  revalidatePath('/dashboard/student');

  return { success: true };
}

export async function deleteModule(moduleId: string) {
  const deleteModuleUseCase = new DeleteModuleUseCase(
    moduleRepository,
    courseRepository,
    authRepository,
    profileRepository
  );

  const result = await deleteModuleUseCase.execute(moduleId);

  if (!result.success) {
    return { error: result.error || 'Error al eliminar módulo' };
  }

  revalidatePath('/dashboard/admin');
  revalidatePath('/dashboard/teacher');
  revalidatePath('/dashboard/student');

  return { success: true };
}

// ============================================
// LESSON ACTIONS
// ============================================

export async function getLessonsByModule(moduleId: string) {
  const getLessonsUseCase = new GetLessonsByModuleUseCase(
    lessonRepository,
    moduleRepository,
    authRepository,
    profileRepository
  );

  const result = await getLessonsUseCase.execute(moduleId);

  if (!result.success || !result.lessons) {
    return { error: result.error || 'Error al obtener lecciones' };
  }

  const lessons = result.lessons.map(lesson => ({
    id: lesson.id,
    moduleId: lesson.moduleId,
    title: lesson.title,
    content: lesson.content,
    orderIndex: lesson.orderIndex,
    durationMinutes: lesson.durationMinutes,
    isPublished: lesson.isPublished,
    createdAt: lesson.createdAt.toISOString(),
    updatedAt: lesson.updatedAt.toISOString(),
    durationFormatted: lesson.getDurationFormatted(),
  }));

  return { lessons };
}

export async function createLesson(input: CreateLessonInput) {
  const createLessonUseCase = new CreateLessonUseCase(
    lessonRepository,
    moduleRepository,
    courseRepository,
    authRepository,
    profileRepository
  );

  const result = await createLessonUseCase.execute(input);

  if (!result.success) {
    return { error: result.error || 'Error al crear lección' };
  }

  revalidatePath('/dashboard/admin');
  revalidatePath('/dashboard/teacher');
  revalidatePath('/dashboard/student');

  return { success: true };
}

export async function updateLesson(lessonId: string, data: any) {
  const updateLessonUseCase = new UpdateLessonUseCase(
    lessonRepository,
    moduleRepository,
    courseRepository,
    authRepository,
    profileRepository
  );

  const result = await updateLessonUseCase.execute(lessonId, data);

  if (!result.success) {
    return { error: result.error || 'Error al actualizar lección' };
  }

  revalidatePath('/dashboard/admin');
  revalidatePath('/dashboard/teacher');
  revalidatePath('/dashboard/student');

  return { success: true };
}

export async function deleteLesson(lessonId: string) {
  const deleteLessonUseCase = new DeleteLessonUseCase(
    lessonRepository,
    moduleRepository,
    courseRepository,
    authRepository,
    profileRepository
  );

  const result = await deleteLessonUseCase.execute(lessonId);

  if (!result.success) {
    return { error: result.error || 'Error al eliminar lección' };
  }

  revalidatePath('/dashboard/admin');
  revalidatePath('/dashboard/teacher');
  revalidatePath('/dashboard/student');

  return { success: true };
}

