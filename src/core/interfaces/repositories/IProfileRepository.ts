import { ProfileEntity } from '../../entities/Profile.entity';

export interface IProfileRepository {
  getProfileByUserId(userId: string): Promise<any>;
  updateProfile(userId: string, data: Partial<any>): Promise<any>;
}