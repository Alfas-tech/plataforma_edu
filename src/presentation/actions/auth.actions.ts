"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { SupabaseAuthRepository } from "@/src/infrastructure/repositories/SupabaseAuthRepository";
import { LoginUseCase } from "@/src/application/use-cases/auth/LoginUseCase";
import { SignUpUseCase } from "@/src/application/use-cases/auth/SignUpUseCase";
import { SignOutUseCase } from "@/src/application/use-cases/auth/SignOutUseCase";
import { SignInWithGoogleUseCase } from "@/src/application/use-cases/auth/SignInWithGoogleUseCase";
import { ResetPasswordUseCase } from "@/src/application/use-cases/auth/ResetPasswordUseCase";
import { UpdatePasswordUseCase } from "@/src/application/use-cases/auth/UpdatePasswordUseCase";

// Instancia del repositorio (singleton)
const authRepository = new SupabaseAuthRepository();

export async function login(formData: FormData) {
  const loginUseCase = new LoginUseCase(authRepository);

  const email = formData.get("email") as string;
  const password = formData.get("password") as string;

  const result = await loginUseCase.execute({ email, password });

  if (!result.success) {
    return { error: result.error };
  }

  revalidatePath("/", "layout");
  revalidatePath("/dashboard");

  return { success: true };
}

export async function signup(formData: FormData) {
  const signUpUseCase = new SignUpUseCase(authRepository);

  const firstName = formData.get("first-name") as string;
  const lastName = formData.get("last-name") as string;
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;

  if (!email || !password || !firstName || !lastName) {
    return { error: "Todos los campos son requeridos" };
  }

  const result = await signUpUseCase.execute({
    email,
    password,
    firstName,
    lastName,
  });

  if (!result.success) {
    return { error: result.error || "Error al crear la cuenta" };
  }

  if (result.needsConfirmation) {
    return { success: true, needsConfirmation: true };
  }

  revalidatePath("/", "layout");
  revalidatePath("/dashboard");

  return { success: true };
}

export async function signout() {
  const signOutUseCase = new SignOutUseCase(authRepository);

  const result = await signOutUseCase.execute();

  if (!result.success) {
    redirect("/error");
  }

  revalidatePath("/", "layout");
  redirect("/");
}

export async function signInWithGoogle() {
  const signInWithGoogleUseCase = new SignInWithGoogleUseCase(authRepository);

  const result = await signInWithGoogleUseCase.execute();

  if (!result.success || !result.url) {
    redirect("/error");
  }

  redirect(result.url);
}

export async function resetPassword(formData: FormData) {
  const resetPasswordUseCase = new ResetPasswordUseCase(authRepository);

  const email = formData.get("email") as string;

  if (!email) {
    return { error: "Por favor ingresa un correo electrónico válido" };
  }

  const result = await resetPasswordUseCase.execute(email);

  if (!result.success) {
    return { error: result.error };
  }

  return {
    success: true,
    message: "Revisa tu correo para el enlace de recuperación",
  };
}

export async function updatePassword(formData: FormData) {
  const updatePasswordUseCase = new UpdatePasswordUseCase(authRepository);

  const password = formData.get("password") as string;

  const result = await updatePasswordUseCase.execute(password);

  if (!result.success) {
    return { error: result.error };
  }

  return { success: true };
}
