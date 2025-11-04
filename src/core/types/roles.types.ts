export type UserRole = "student" | "teacher" | "editor" | "admin";

export interface RolePermissions {
  canCreateCourse: boolean;
  canEditCourse: boolean;
  canDeleteCourse: boolean;
  canAssignTeachers: boolean;
  canPromoteUsers: boolean;
  canViewAllProgress: boolean;
}
