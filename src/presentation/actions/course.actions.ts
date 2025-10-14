"use server";

import { revalidatePath } from "next/cache";
import { GetAllCoursesUseCase } from "@/src/application/use-cases/course/GetAllCoursesUseCase";
import { CreateCourseUseCase } from "@/src/application/use-cases/course/CreateCourseUseCase";
import { UpdateCourseUseCase } from "@/src/application/use-cases/course/UpdateCourseUseCase";
import { DeleteCourseUseCase } from "@/src/application/use-cases/course/DeleteCourseUseCase";
import { AssignTeacherToCourseUseCase } from "@/src/application/use-cases/course/AssignTeacherToCourseUseCase";
import { RemoveTeacherFromCourseUseCase } from "@/src/application/use-cases/course/RemoveTeacherFromCourseUseCase";
import { GetCourseWithTeachersUseCase } from "@/src/application/use-cases/course/GetCourseWithTeachersUseCase";
import { GetTeacherCoursesUseCase } from "@/src/application/use-cases/course/GetTeacherCoursesUseCase";
import { SupabaseCourseRepository } from "@/src/infrastructure/repositories/SupabaseCourseRepository";
import { SupabaseAuthRepository } from "@/src/infrastructure/repositories/SupabaseAuthRepository";
import { SupabaseProfileRepository } from "@/src/infrastructure/repositories/SupabaseProfileRepository";
import {
  CreateCourseInput,
  UpdateCourseInput,
} from "@/src/core/types/course.types";

const courseRepository = new SupabaseCourseRepository();
const authRepository = new SupabaseAuthRepository();
const profileRepository = new SupabaseProfileRepository();

export async function getAllCourses() {
  const getAllCoursesUseCase = new GetAllCoursesUseCase(courseRepository);

  const result = await getAllCoursesUseCase.execute();

  if (!result.success || !result.courses) {
    return { error: result.error || "Error al obtener cursos" };
  }

  const courses = result.courses.map((course) => ({
    id: course.id,
    title: course.title,
    description: course.description,
    startDate: course.startDate.toISOString(),
    endDate: course.endDate.toISOString(),
    isActive: course.isActive,
    createdAt: course.createdAt.toISOString(),
    status: course.getStatus(),
    daysRemaining: course.getDaysRemaining(),
    isCurrentlyActive: course.isCurrentlyActive(),
  }));

  return { courses };
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

  revalidatePath("/dashboard/admin");
  revalidatePath("/dashboard/admin/courses");

  return { success: true };
}

export async function assignTeacherToCourse(
  courseId: string,
  teacherId: string
) {
  const assignTeacherUseCase = new AssignTeacherToCourseUseCase(
    courseRepository,
    authRepository,
    profileRepository
  );

  const result = await assignTeacherUseCase.execute(courseId, teacherId);

  if (!result.success) {
    return { error: result.error || "Error al asignar docente" };
  }

  revalidatePath("/dashboard/admin");
  revalidatePath("/dashboard/admin/courses");
  revalidatePath(`/dashboard/admin/courses/${courseId}`);

  return { success: true };
}

export async function removeTeacherFromCourse(
  courseId: string,
  teacherId: string
) {
  const removeTeacherUseCase = new RemoveTeacherFromCourseUseCase(
    courseRepository,
    authRepository,
    profileRepository
  );

  const result = await removeTeacherUseCase.execute(courseId, teacherId);

  if (!result.success) {
    return { error: result.error || "Error al remover docente" };
  }

  revalidatePath("/dashboard/admin");
  revalidatePath("/dashboard/admin/courses");
  revalidatePath(`/dashboard/admin/courses/${courseId}`);

  return { success: true };
}

export async function getCourseWithTeachers(courseId: string) {
  const getCourseWithTeachersUseCase = new GetCourseWithTeachersUseCase(
    courseRepository,
    profileRepository
  );

  const result = await getCourseWithTeachersUseCase.execute(courseId);

  if (!result.success || !result.data) {
    return { error: result.error || "Error al obtener curso" };
  }

  const { course, teachers } = result.data;

  return {
    course: {
      id: course.id,
      title: course.title,
      description: course.description,
      startDate: course.startDate.toISOString(),
      endDate: course.endDate.toISOString(),
      isActive: course.isActive,
      status: course.getStatus(),
      daysRemaining: course.getDaysRemaining(),
      isCurrentlyActive: course.isCurrentlyActive(),
    },
    teachers: teachers.map((teacher) => ({
      id: teacher.id,
      email: teacher.email,
      fullName: teacher.fullName,
      avatarUrl: teacher.avatarUrl,
      displayName: teacher.getDisplayName(),
    })),
  };
}

export async function getTeacherCourses(teacherId: string) {
  const useCase = new GetTeacherCoursesUseCase(courseRepository);

  const result = await useCase.execute(teacherId);

  if (result.success && result.courses) {
    return {
      courses: result.courses.map((course) => ({
        id: course.id,
        title: course.title,
        description: course.description,
        startDate: course.startDate,
        endDate: course.endDate,
        isActive: course.isActive,
        createdAt: course.createdAt,
        updatedAt: course.updatedAt,
        status: course.getStatus(),
        daysRemaining: course.getDaysRemaining(),
        daysUntilStart: course.getDaysUntilStart(),
      })),
    };
  }

  return { error: result.error || "Error al obtener cursos" };
}
