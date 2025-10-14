import { ProfileData } from '../types/auth.types';
import { UserRole, RolePermissions } from '../types/roles.types';

export class ProfileEntity {
  constructor(
    public readonly id: string,
    public readonly email: string,
    public readonly fullName: string | null,
    public readonly avatarUrl: string | null,
    public readonly role: UserRole, // NUEVO
    public readonly createdAt: Date, // NUEVO
    public readonly updatedAt: Date  // NUEVO
  ) {}

  static fromDatabase(data: ProfileData): ProfileEntity {
    return new ProfileEntity(
      data.id,
      data.email,
      data.full_name,
      data.avatar_url,
      data.role,
      new Date(data.created_at),
      new Date(data.updated_at)
    );
  }

  getDisplayName(): string {
    return this.fullName || this.email.split('@')[0] || 'Usuario';
  }

  hasAvatar(): boolean {
    return this.avatarUrl !== null && this.avatarUrl !== '';
  }

  // NUEVOS MÉTODOS
  isStudent(): boolean {
    return this.role === 'student';
  }

  isTeacher(): boolean {
    return this.role === 'teacher';
  }

  isAdmin(): boolean {
    return this.role === 'admin';
  }

  getPermissions(): RolePermissions {
    switch (this.role) {
      case 'admin':
        return {
          canCreateCourse: true,
          canEditCourse: true,
          canDeleteCourse: true,
          canAssignTeachers: true,
          canPromoteUsers: true,
          canViewAllProgress: true,
        };
      case 'teacher':
        return {
          canCreateCourse: false,
          canEditCourse: true,
          canDeleteCourse: false,
          canAssignTeachers: false,
          canPromoteUsers: false,
          canViewAllProgress: true,
        };
      case 'student':
      default:
        return {
          canCreateCourse: false,
          canEditCourse: false,
          canDeleteCourse: false,
          canAssignTeachers: false,
          canPromoteUsers: false,
          canViewAllProgress: false,
        };
    }
  }

  canAccessAdminPanel(): boolean {
    return this.role === 'admin' || this.role === 'teacher';
  }
}