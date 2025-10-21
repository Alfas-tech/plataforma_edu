import { CourseEntity } from "@/src/core/entities/Course.entity";
import { ICourseBranchingRepository } from "@/src/core/interfaces/repositories/ICourseBranchingRepository";
import { DeleteCourseBranchInput } from "@/src/core/types/course.types";

export interface DeleteCourseBranchResult {
  success: boolean;
  course?: CourseEntity;
  error?: string;
}

export class DeleteCourseBranchUseCase {
  constructor(
    private readonly branchingRepository: ICourseBranchingRepository
  ) {}

  async execute(
    input: DeleteCourseBranchInput
  ): Promise<DeleteCourseBranchResult> {
    try {
      const course = await this.branchingRepository.deleteCourseBranch(input);

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
            : "Error inesperado al eliminar la rama",
      };
    }
  }
}
