import { IProfileRepository } from "@/src/core/interfaces/repositories/IProfileRepository";
import { ProfileEntity } from "@/src/core/entities/Profile.entity";
import { UserRole } from "@/src/core/types/roles.types";
import { ProfileData } from "@/src/core/types/auth.types";
import { createClient } from "@/src/infrastructure/supabase/server";
import { createAdminClient } from "@/src/infrastructure/supabase/admin";

type ProfileRow = ProfileData;

const PROFILE_SELECT =
  "id, email, full_name, avatar_url, role, created_at, updated_at";

async function mapToEntity(data: ProfileRow | null): Promise<ProfileEntity | null> {
  if (!data) {
    return null;
  }

  const normalized: ProfileData = {
    id: data.id,
    email: data.email ?? "",
    full_name: data.full_name ?? null,
    avatar_url: data.avatar_url ?? null,
    role: data.role,
    created_at: data.created_at,
    updated_at: data.updated_at,
  };

  if (!normalized.email) {
    const adminClient = createAdminClient();
    const { data: userData } = await adminClient.auth.admin.getUserById(
      normalized.id
    );
    if (userData?.user?.email) {
      normalized.email = userData.user.email;
    }
  }

  return ProfileEntity.fromDatabase(normalized);
}

async function mapListToEntities(data: ProfileRow[] | null | undefined) {
  if (!data || data.length === 0) {
    return [] as ProfileEntity[];
  }

  const entities = await Promise.all(data.map((row) => mapToEntity(row)));
  return entities.filter(
    (profile): profile is ProfileEntity => profile !== null
  );
}

export class SupabaseProfileRepository implements IProfileRepository {
  async getProfileByUserId(userId: string): Promise<ProfileEntity | null> {
    const supabase = createClient();

    const { data, error } = await supabase
      .from("profiles")
      .select(PROFILE_SELECT)
      .eq("id", userId)
      .single();

    if (error) {
      return null;
    }

    return mapToEntity(data as ProfileRow);
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
      .select(PROFILE_SELECT)
      .single();

    if (error || !data) {
      throw new Error("Error al actualizar el perfil");
    }

    return (await mapToEntity(data as ProfileRow))!;
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
      .select(PROFILE_SELECT)
      .single();

    if (error || !data) {
      throw new Error("Error al actualizar el rol");
    }

    return (await mapToEntity(data as ProfileRow))!;
  }

  async getAllTeachers(): Promise<ProfileEntity[]> {
    const supabase = createClient();

    const { data, error } = await supabase
      .from("profiles")
      .select(PROFILE_SELECT)
      .eq("role", "teacher");

    if (error || !data) {
      return [];
    }

    return mapListToEntities(data as ProfileRow[]);
  }

  async getAllStudents(): Promise<ProfileEntity[]> {
    const supabase = createClient();

    const { data, error } = await supabase
      .from("profiles")
      .select(PROFILE_SELECT)
      .eq("role", "student");

    if (error || !data) {
      return [];
    }

    return mapListToEntities(data as ProfileRow[]);
  }

  async getProfileByEmail(email: string): Promise<ProfileEntity | null> {
    const supabase = createClient();

    const { data, error } = await supabase
      .from("profiles")
      .select(PROFILE_SELECT)
      .eq("email", email)
      .single();

    if (error) {
      return null;
    }

    return mapToEntity(data as ProfileRow);
  }

  async getAllProfiles(): Promise<ProfileEntity[]> {
    const supabase = createClient();

    const { data, error } = await supabase
      .from("profiles")
      .select(PROFILE_SELECT);

    if (error || !data) {
      return [];
    }

    return mapListToEntities(data as ProfileRow[]);
  }
}
