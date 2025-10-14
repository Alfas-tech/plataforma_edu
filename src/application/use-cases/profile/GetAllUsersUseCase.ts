import { IProfileRepository } from '@/src/core/interfaces/repositories/IProfileRepository';
import { ProfileEntity } from '@/src/core/entities/Profile.entity';

export interface GetAllUsersResult {
  success: boolean;
  students?: ProfileEntity[];
  teachers?: ProfileEntity[];
  error?: string;
}

export class GetAllUsersUseCase {
  constructor(private readonly profileRepository: IProfileRepository) {}

  async execute(): Promise<GetAllUsersResult> {
    try {
      const [students, teachers] = await Promise.all([
        this.profileRepository.getAllStudents(),
        this.profileRepository.getAllTeachers(),
      ]);

      return {
        success: true,
        students,
        teachers,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Error al obtener usuarios',
      };
    }
  }
}

