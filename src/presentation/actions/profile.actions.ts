"use server";

import { revalidatePath, revalidateTag } from "next/cache";
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
      isEditor: result.profile.isEditor(),
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

  const editors =
    result.editors?.map((editor) => ({
      id: editor.id,
      email: editor.email,
      fullName: editor.fullName,
      avatarUrl: editor.avatarUrl,
      role: editor.role,
      displayName: editor.getDisplayName(),
      createdAt: editor.createdAt.toISOString(),
    })) || [];

  const admins =
    result.admins?.map((admin) => ({
      id: admin.id,
      email: admin.email,
      fullName: admin.fullName,
      avatarUrl: admin.avatarUrl,
      role: admin.role,
      displayName: admin.getDisplayName(),
      createdAt: admin.createdAt.toISOString(),
    })) || [];

  return {
    students,
    teachers,
    editors,
    admins,
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

  revalidateTag("admin-users");
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

  revalidateTag("admin-users");
  revalidatePath("/dashboard/admin");
  revalidatePath("/dashboard/admin/users");

  return { success: true };
}

export async function changeUserRole(
  userId: string,
  newRole: "admin" | "teacher" | "editor" | "student"
) {
  try {
    // Get current user
    const currentUser = await authRepository.getCurrentUser();

    if (!currentUser) {
      return { error: "No autenticado" };
    }

    // Validate user is not changing their own role
    if (currentUser.id === userId) {
      return { error: "No puedes cambiar tu propio rol" };
    }

    // Verify current user is admin
    const currentProfile = await profileRepository.getProfileByUserId(
      currentUser.id
    );

    if (!currentProfile || currentProfile.role !== "admin") {
      return { error: "Solo los administradores pueden cambiar roles" };
    }

    // Update user role
    await profileRepository.updateRole(userId, newRole);

    revalidateTag("admin-users");
    revalidatePath("/dashboard/admin");
    revalidatePath("/dashboard/admin/users");

    return { success: true };
  } catch (error) {
    return {
      error:
        error instanceof Error
          ? error.message
          : "Error al cambiar el rol del usuario",
    };
  }
}
