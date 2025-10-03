import { ProfileData } from '../types/auth.types';

export class ProfileEntity {
  constructor(
    public readonly id: string,
    public readonly email: string,
    public readonly fullName: string | null,
    public readonly avatarUrl: string | null
  ) {}

  static fromDatabase(data: ProfileData): ProfileEntity {
    return new ProfileEntity(
      data.id,
      data.email,
      data.full_name,
      data.avatar_url
    );
  }

  getDisplayName(): string {
    return this.fullName || this.email.split('@')[0] || 'Usuario';
  }

  hasAvatar(): boolean {
    return this.avatarUrl !== null && this.avatarUrl !== '';
  }
}