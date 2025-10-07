import { UserData } from "../types/auth.types";

export class UserEntity {
  constructor(
    public readonly id: string,
    public readonly email: string,
    public readonly fullName?: string,
    public readonly avatarUrl?: string,
    public readonly metadata?: Record<any, any>,
    public readonly createdAt?: Date
  ) {}

  static fromSupabase(data: any): UserEntity {
    return new UserEntity(
      data.id,
      data.email,
      data.user_metadata?.full_name,
      data.user_metadata?.avatar_url,
      data.user_metadata,
      data.created_at ? new Date(data.created_at) : undefined
    );
  }

  getDisplayName(): string {
    if (this.fullName) return this.fullName;
    if (this.metadata?.full_name) return this.metadata.full_name;
    return this.email.split("@")[0] || "Usuario";
  }
}
