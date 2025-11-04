import { CourseEntity } from "@/src/core/entities/Course.entity";
import { ICourseBranchingRepository } from "@/src/core/interfaces/repositories/ICourseBranchingRepository";
// import { ReviewCourseMergeRequestInput } from "@/src/core/types/course.types"; // DEPRECATED - branching removed

// Temporary type definition for backwards compatibility
type ReviewCourseMergeRequestInput = any;

export interface ReviewCourseMergeRequestResult {
  success: boolean;
  course?: CourseEntity;
  error?: string;
}

export class ReviewCourseMergeRequestUseCase {
  constructor(
    private readonly branchingRepository: ICourseBranchingRepository
  ) {}

  async execute(
    input: ReviewCourseMergeRequestInput
  ): Promise<ReviewCourseMergeRequestResult> {
    try {
      const course =
        await this.branchingRepository.reviewCourseMergeRequest(input);

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
            : "Error inesperado al revisar la solicitud",
      };
    }
  }
}
