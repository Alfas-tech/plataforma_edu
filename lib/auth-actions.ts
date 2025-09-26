"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";

export async function login(formData: FormData) {
  const supabase = createClient();

  const data = {
    email: formData.get("email") as string,
    password: formData.get("password") as string,
  };

  const { error } = await supabase.auth.signInWithPassword(data);

  if (error) {
    console.error("Login error:", error);
    redirect("/error");
  }

  revalidatePath("/", "layout");
  redirect("/");
}

export async function signup(formData: FormData) {
  const supabase = createClient();

  const firstName = formData.get("first-name") as string;
  const lastName = formData.get("last-name") as string;
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;

  if (!email || !password || !firstName || !lastName) {
    redirect("/error");
  }

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name: `${firstName} ${lastName}`,
        email: email,
      },
      emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/confirm`,
    },
  });

  if (error) {
    console.error("Signup error:", error);
    redirect("/error");
  }

  if (data?.user && !data.user.confirmed_at) {
    redirect("/signup/check-email");
  }

  revalidatePath("/", "layout");
  redirect("/");
}

export async function signout() {
  const supabase = createClient();
  const { error } = await supabase.auth.signOut();

  if (error) {
    console.log(error);
    redirect("/error");
  }

  redirect("/logout");
}

export async function signInWithGoogle() {
  const supabase = createClient();
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      queryParams: {
        access_type: "offline",
        prompt: "consent",
      },
      redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/confirm`,
    },
  });

  if (error) {
    console.log(error);
    redirect("/error");
  }

  redirect(data.url);
}

export async function resetPassword(formData: FormData) {
  const supabase = createClient();
  const email = formData.get("email") as string;

  if (!email) {
    return { error: "Por favor ingresa un correo electrónico válido" };
  }

  // Verificar si el usuario existe y cómo se registró
  const { data: userData } = await supabase
    .from('profiles')
    .select('email')
    .eq('email', email)
    .single();

  if (!userData) {
    // No revelar si el email existe o no por seguridad
    return {
      success: true,
      message: "Si el correo está registrado, recibirás un enlace de recuperación"
    };
  }

  // Intentar enviar el email de recuperación
  // Supabase permite esto incluso para usuarios OAuth
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/confirm?next=/auth/update-password`,
  });

  if (error) {
    console.error("Reset password error:", error);

    // Si el error es porque el usuario no tiene contraseña (OAuth)
    // Supabase igualmente enviará el email permitiendo establecer una
    if (error.message.includes("User not found")) {
      return {
        success: true,
        message: "Si el correo está registrado, recibirás un enlace de recuperación"
      };
    }

    return {
      error: "Ocurrió un error al enviar el correo. Intenta nuevamente."
    };
  }

  return {
    success: true,
    message: "Revisa tu correo para el enlace de recuperación"
  };
}

export async function updatePassword(formData: FormData) {
  const supabase = createClient();
  const password = formData.get("password") as string;

  if (!password || password.length < 6) {
    return { error: "La contraseña debe tener al menos 6 caracteres" };
  }

  // Verificar que el usuario está autenticado
  const { data: { user }, error: userError } = await supabase.auth.getUser();

  if (userError || !user) {
    return { error: "Sesión inválida. Solicita un nuevo enlace de recuperación." };
  }

  // Actualizar la contraseña
  const { error } = await supabase.auth.updateUser({
    password: password,
  });

  if (error) {
    console.error("Update password error:", error);
    return { error: "No se pudo actualizar la contraseña" };
  }

  // Si el usuario se registró con OAuth y ahora tiene contraseña
  // Supabase automáticamente habilitará el login con email/password

  return { success: true };
}