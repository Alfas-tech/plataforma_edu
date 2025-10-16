"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/src/infrastructure/supabase/server";
import { getCurrentProfile } from "./profile.actions";
import { SupabaseAuthRepository } from "@/src/infrastructure/repositories/SupabaseAuthRepository";
import { SupabaseProfileRepository } from "@/src/infrastructure/repositories/SupabaseProfileRepository";
import { DeleteUserUseCase } from "@/src/application/use-cases/profile/DeleteUserUseCase";

/**
 * Create a new user
 * @param formData - User creation data (email, password, fullName, role)
 * @returns Object with success flag or error message for UI display
 */
export async function createUser(formData: {
  email: string;
  password: string;
  fullName: string;
  role: "student" | "teacher" | "admin";
}) {
  try {
    // Verify current user is admin
    const profileResult = await getCurrentProfile();
    if ("error" in profileResult) {
      return { error: "No autenticado" };
    }

    if (!profileResult.profile.isAdmin) {
      return { error: "Solo administradores pueden crear usuarios" };
    }

    const supabase = createClient();

    // Create user using signUp
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: formData.email,
      password: formData.password,
      options: {
        data: {
          full_name: formData.fullName,
          role: formData.role,
        },
        emailRedirectTo: "/auth/confirm",
      },
    });

    if (authError) {
      return { error: authError.message };
    }

    if (!authData.user) {
      return { error: "Error al crear usuario" };
    }

    // Update role in profiles table
    const { error: updateError } = await supabase
      .from("profiles")
      .update({ role: formData.role })
      .eq("id", authData.user.id);

    if (updateError) {
      console.error("Error updating role:", updateError);
    }

    revalidatePath("/dashboard/admin/users");
    return { success: true };
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : "Error al crear usuario",
    };
  }
}

/**
 * Delete a user
 * Removes user from both authentication and database
 * @param userId - ID of the user to delete
 * @returns Object with success flag or error message for UI display
 */
export async function deleteUser(userId: string) {
  try {
    const authRepository = new SupabaseAuthRepository();
    const profileRepository = new SupabaseProfileRepository();
    const deleteUserUseCase = new DeleteUserUseCase(
      authRepository,
      profileRepository
    );

    const result = await deleteUserUseCase.execute(userId);

    if (!result.success) {
      return { error: result.error || "Error al eliminar usuario" };
    }

    revalidatePath("/dashboard/admin/users");
    return { success: true };
  } catch (error) {
    return {
      error:
        error instanceof Error ? error.message : "Error al eliminar usuario",
    };
  }
}

/**
 * Send password reset email to a user
 * @param userId - ID of the user to reset password
 * @returns Object with success flag or error message for UI display
 */
export async function sendPasswordResetEmail(userId: string) {
  try {
    // Verify current user is admin
    const profileResult = await getCurrentProfile();
    if ("error" in profileResult) {
      return { error: "No autenticado" };
    }

    if (!profileResult.profile.isAdmin) {
      return { error: "Solo administradores pueden enviar emails" };
    }

    const supabase = createClient();

    // Get user email
    const { data: profile } = await supabase
      .from("profiles")
      .select("email")
      .eq("id", userId)
      .single();

    if (!profile?.email) {
      return { error: "Usuario no encontrado" };
    }

    // Send password reset email
    const { error } = await supabase.auth.resetPasswordForEmail(profile.email, {
      redirectTo: "/auth/update-password",
    });

    if (error) {
      return { error: error.message };
    }

    return { success: true, message: "Email de restablecimiento enviado" };
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : "Error al enviar email",
    };
  }
}
