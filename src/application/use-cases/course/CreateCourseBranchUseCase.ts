import { CourseEntity } from "@/src/core/entities/Course.entity";
import { ICourseBranchingRepository } from "@/src/core/interfaces/repositories/ICourseBranchingRepository";
import { CreateCourseBranchInput } from "@/src/core/types/course.types";

export interface CreateCourseBranchResult {
  success: boolean;
  course?: CourseEntity;
  error?: string;
}

export class CreateCourseBranchUseCase {
  constructor(
    private readonly branchingRepository: ICourseBranchingRepository
  ) {}

  async execute(
    input: CreateCourseBranchInput
  ): Promise<CreateCourseBranchResult> {
    try {
      const course = await this.branchingRepository.createCourseBranch(input);

      return {
        success: true,
        course,
      };
    } catch (error) {
      return {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Error inesperado al crear la rama",
      };
    }
  }
}
