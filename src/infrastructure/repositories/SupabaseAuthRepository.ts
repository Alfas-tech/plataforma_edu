import { IAuthRepository } from "@/src/core/interfaces/repositories/IAuthRepository";
import {
  LoginCredentials,
  SignUpData,
  OAuthCallbackData,
} from "@/src/core/types/auth.types";
import { UserEntity } from "@/src/core/entities/User.entity";
import { createClient } from "../supabase/server";

export class SupabaseAuthRepository implements IAuthRepository {
  async login(credentials: LoginCredentials): Promise<UserEntity> {
    const supabase = createClient();

    const { data, error } = await supabase.auth.signInWithPassword({
      email: credentials.email,
      password: credentials.password,
    });

    if (error || !data.user) {
      throw new Error("Email o contraseña incorrectos");
    }

    return UserEntity.fromSupabase(data.user);
  }

  async signUp(
    data: SignUpData
  ): Promise<{ user: UserEntity; needsConfirmation: boolean }> {
    const supabase = createClient();

    const { data: authData, error } = await supabase.auth.signUp({
      email: data.email,
      password: data.password,
      options: {
        data: {
          full_name: `${data.firstName} ${data.lastName}`,
          email: data.email,
        },
        emailRedirectTo: "/auth/confirm?next=/dashboard",
      },
    });

    if (error || !authData.user) {
      throw new Error("Error al crear la cuenta");
    }

    const user = UserEntity.fromSupabase(authData.user);
    const needsConfirmation = !authData.user.confirmed_at;

    return { user, needsConfirmation };
  }

  async signOut(): Promise<void> {
    const supabase = createClient();
    const { error } = await supabase.auth.signOut();

    if (error) {
      throw new Error("Error al cerrar sesión");
    }
  }

  async getCurrentUser(): Promise<UserEntity | null> {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    return user ? UserEntity.fromSupabase(user) : null;
  }

  async signInWithGoogle(): Promise<string> {
    const supabase = createClient();

    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        queryParams: {
          access_type: "offline",
          prompt: "consent",
        },
        redirectTo: "/auth/confirm?next=/dashboard",
      },
    });

    if (error || !data.url) {
      throw new Error("Error al iniciar sesión con Google");
    }

    return data.url;
  }

  async handleOAuthCallback(data: OAuthCallbackData): Promise<UserEntity> {
    const supabase = createClient();

    const { data: authData, error } =
      await supabase.auth.exchangeCodeForSession(data.code);

    if (error || !authData.user) {
      throw new Error("Error al procesar el callback de autenticación");
    }

    return UserEntity.fromSupabase(authData.user);
  }

  async resetPassword(email: string): Promise<void> {
    const supabase = createClient();

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: "/auth/confirm?next=/auth/update-password",
    });

    if (error) {
      throw new Error("Error al enviar el correo de recuperación");
    }
  }

  async updatePassword(password: string): Promise<void> {
    const supabase = createClient();

    const { error } = await supabase.auth.updateUser({
      password: password,
    });

    if (error) {
      throw new Error("No se pudo actualizar la contraseña");
    }
  }
}
