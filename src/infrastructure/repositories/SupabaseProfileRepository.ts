import { IProfileRepository } from "@/src/core/interfaces/repositories/IProfileRepository";
import { ProfileEntity } from "@/src/core/entities/Profile.entity";
import { UserRole } from "@/src/core/types/roles.types";
import { createClient } from "@/src/infrastructure/supabase/server";

export class SupabaseProfileRepository implements IProfileRepository {
  async getProfileByUserId(userId: string): Promise<ProfileEntity | null> {
    const supabase = createClient();

    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .single();

    if (error || !data) {
      return null;
    }

    return ProfileEntity.fromDatabase(data);
  }

  async updateProfile(
    userId: string,
    profileData: Partial<ProfileEntity>
  ): Promise<ProfileEntity> {
    const supabase = createClient();

    const updateData: any = {};
    if (profileData.fullName !== undefined)
      updateData.full_name = profileData.fullName;
    if (profileData.avatarUrl !== undefined)
      updateData.avatar_url = profileData.avatarUrl;

    const { data, error } = await supabase
      .from("profiles")
      .update({
        ...updateData,
        updated_at: new Date().toISOString(),
      })
      .eq("id", userId)
      .select()
      .single();

    if (error || !data) {
      throw new Error("Error al actualizar el perfil");
    }

    return ProfileEntity.fromDatabase(data);
  }

  async promoteToTeacher(userId: string): Promise<void> {
    const supabase = createClient();

    const { error } = await supabase.rpc("promote_to_teacher", {
      user_id: userId,
    });

    if (error) {
      throw new Error("Error al promover a docente");
    }
  }

  async demoteToStudent(userId: string): Promise<void> {
    const supabase = createClient();

    const { error } = await supabase.rpc("demote_to_student", {
      user_id: userId,
    });

    if (error) {
      throw new Error("Error al degradar a estudiante");
    }
  }

  async updateRole(userId: string, role: UserRole): Promise<ProfileEntity> {
    const supabase = createClient();

    const { data, error } = await supabase
      .from("profiles")
      .update({
        role: role,
        updated_at: new Date().toISOString(),
      })
      .eq("id", userId)
      .select()
      .single();

    if (error || !data) {
      throw new Error("Error al actualizar el rol");
    }

    return ProfileEntity.fromDatabase(data);
  }

  async getAllTeachers(): Promise<ProfileEntity[]> {
    const supabase = createClient();

    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("role", "teacher");

    if (error || !data) {
      return [];
    }

    return data.map((profile) => ProfileEntity.fromDatabase(profile));
  }

  async getAllStudents(): Promise<ProfileEntity[]> {
    const supabase = createClient();

    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("role", "student");

    if (error || !data) {
      return [];
    }

    return data.map((profile) => ProfileEntity.fromDatabase(profile));
  }

  async getProfileByEmail(email: string): Promise<ProfileEntity | null> {
    const supabase = createClient();

    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("email", email)
      .single();

    if (error || !data) {
      return null;
    }

    return ProfileEntity.fromDatabase(data);
  }

  async getAllProfiles(): Promise<ProfileEntity[]> {
    const supabase = createClient();

    const { data, error } = await supabase.from("profiles").select("*");

    if (error || !data) {
      return [];
    }

    return data.map((profile) => ProfileEntity.fromDatabase(profile));
  }
}
