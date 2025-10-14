"use server";

import { revalidatePath } from "next/cache";
import { GetCurrentProfileUseCase } from "@/src/application/use-cases/profile/GetCurrentProfileUseCase";
import { GetAllUsersUseCase } from "@/src/application/use-cases/profile/GetAllUsersUseCase";
import { PromoteToTeacherUseCase } from "@/src/application/use-cases/profile/PromoteToTeacherUseCase";
import { DemoteToStudentUseCase } from "@/src/application/use-cases/profile/DemoteToStudentUseCase";
import { SupabaseProfileRepository } from "@/src/infrastructure/repositories/SupabaseProfileRepository";
import { SupabaseAuthRepository } from "@/src/infrastructure/repositories/SupabaseAuthRepository";

const profileRepository = new SupabaseProfileRepository();
const authRepository = new SupabaseAuthRepository();

export async function getCurrentProfile() {
  const getCurrentProfileUseCase = new GetCurrentProfileUseCase(
    profileRepository,
    authRepository
  );

  const result = await getCurrentProfileUseCase.execute();

  if (!result.success || !result.profile) {
    return { error: result.error || "Error al obtener perfil" };
  }

  return {
    profile: {
      id: result.profile.id,
      email: result.profile.email,
      fullName: result.profile.fullName,
      avatarUrl: result.profile.avatarUrl,
      role: result.profile.role,
      displayName: result.profile.getDisplayName(),
      isStudent: result.profile.isStudent(),
      isTeacher: result.profile.isTeacher(),
      isAdmin: result.profile.isAdmin(),
    },
  };
}

export async function getAllUsers() {
  const getAllUsersUseCase = new GetAllUsersUseCase(profileRepository);

  const result = await getAllUsersUseCase.execute();

  if (!result.success) {
    return { error: result.error || "Error al obtener usuarios" };
  }

  const students =
    result.students?.map((student) => ({
      id: student.id,
      email: student.email,
      fullName: student.fullName,
      avatarUrl: student.avatarUrl,
      role: student.role,
      displayName: student.getDisplayName(),
      createdAt: student.createdAt.toISOString(),
    })) || [];

  const teachers =
    result.teachers?.map((teacher) => ({
      id: teacher.id,
      email: teacher.email,
      fullName: teacher.fullName,
      avatarUrl: teacher.avatarUrl,
      role: teacher.role,
      displayName: teacher.getDisplayName(),
      createdAt: teacher.createdAt.toISOString(),
    })) || [];

  return {
    students,
    teachers,
  };
}

export async function promoteToTeacher(userId: string) {
  const promoteToTeacherUseCase = new PromoteToTeacherUseCase(
    profileRepository,
    authRepository
  );

  const result = await promoteToTeacherUseCase.execute(userId);

  if (!result.success) {
    return { error: result.error || "Error al promover usuario" };
  }

  revalidatePath("/dashboard/admin");
  revalidatePath("/dashboard/admin/users");

  return { success: true };
}

export async function demoteToStudent(userId: string) {
  const demoteToStudentUseCase = new DemoteToStudentUseCase(
    profileRepository,
    authRepository
  );

  const result = await demoteToStudentUseCase.execute(userId);

  if (!result.success) {
    return { error: result.error || "Error al degradar usuario" };
  }

  revalidatePath("/dashboard/admin");
  revalidatePath("/dashboard/admin/users");

  return { success: true };
}
