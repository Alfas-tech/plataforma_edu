import { ProfileEntity } from '../../entities/Profile.entity';
import { UserRole } from '../../types/roles.types';

export interface IProfileRepository {
  getProfileByUserId(userId: string): Promise<ProfileEntity | null>;
  getProfileByEmail(email: string): Promise<ProfileEntity | null>;
  getAllProfiles(): Promise<ProfileEntity[]>;
  updateProfile(userId: string, data: Partial<ProfileEntity>): Promise<ProfileEntity>;
  promoteToTeacher(userId: string): Promise<void>;
  demoteToStudent(userId: string): Promise<void>;
  updateRole(userId: string, role: UserRole): Promise<ProfileEntity>;
  getAllTeachers(): Promise<ProfileEntity[]>;
  getAllStudents(): Promise<ProfileEntity[]>;
}
