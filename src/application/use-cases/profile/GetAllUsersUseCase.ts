import { IProfileRepository } from "@/src/core/interfaces/repositories/IProfileRepository";
import { ProfileEntity } from "@/src/core/entities/Profile.entity";

export interface GetAllUsersResult {
  success: boolean;
  students?: ProfileEntity[];
  teachers?: ProfileEntity[];
  editors?: ProfileEntity[];
  admins?: ProfileEntity[];
  error?: string;
}

export class GetAllUsersUseCase {
  constructor(private readonly profileRepository: IProfileRepository) {}

  async execute(): Promise<GetAllUsersResult> {
    try {
      const [students, teachers, editors, admins] = await Promise.all([
        this.profileRepository.getAllStudents(),
        this.profileRepository.getAllTeachers(),
        this.profileRepository.getAllEditors(),
        this.profileRepository.getAllAdmins(),
      ]);

      return {
        success: true,
        students,
        teachers,
        editors,
        admins,
      };
    } catch (error) {
      return {
        success: false,
        error:
          error instanceof Error ? error.message : "Error al obtener usuarios",
      };
    }
  }
}
