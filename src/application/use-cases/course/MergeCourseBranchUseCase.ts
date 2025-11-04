import { CourseEntity } from "@/src/core/entities/Course.entity";
import { ICourseBranchingRepository } from "@/src/core/interfaces/repositories/ICourseBranchingRepository";
// import { MergeCourseBranchInput } from "@/src/core/types/course.types"; // DEPRECATED - branching removed

// Temporary type definition for backwards compatibility
type MergeCourseBranchInput = any;

export interface MergeCourseBranchResult {
  success: boolean;
  course?: CourseEntity;
  error?: string;
}

export class MergeCourseBranchUseCase {
  constructor(
    private readonly branchingRepository: ICourseBranchingRepository
  ) {}

  async execute(
    input: MergeCourseBranchInput
  ): Promise<MergeCourseBranchResult> {
    try {
      const course = await this.branchingRepository.mergeCourseBranch(input);

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
            : "Error inesperado al fusionar la rama",
      };
    }
  }
}
