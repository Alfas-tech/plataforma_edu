import { IProfileRepository } from "@/src/core/interfaces/repositories/IProfileRepository";
import { ProfileEntity } from "@/src/core/entities/Profile.entity";
import { createClient } from "../supabase/server";

export class SupabaseProfileRepository implements IProfileRepository {
  async getProfileByUserId(userId: string): Promise<any> {
    const supabase = createClient();

    const { data, error } = await supabase
      .from("profiles")
      .select("id, email, full_name, avatar_url")
      .eq("id", userId)
      .single();

    if (error || !data) {
      return null;
    }

    return ProfileEntity.fromDatabase(data);
  }

  async updateProfile(userId: string, profileData: Partial<any>): Promise<any> {
    const supabase = createClient();

    const updateData: any = {};
    if (profileData.fullName !== undefined)
      updateData.full_name = profileData.fullName;
    if (profileData.avatarUrl !== undefined)
      updateData.avatar_url = profileData.avatarUrl;

    const { data, error } = await supabase
      .from("profiles")
      .update(updateData)
      .eq("id", userId)
      .select("id, email, full_name, avatar_url")
      .single();

    if (error || !data) {
      throw new Error("Error al actualizar el perfil");
    }

    return ProfileEntity.fromDatabase(data);
  }
}
