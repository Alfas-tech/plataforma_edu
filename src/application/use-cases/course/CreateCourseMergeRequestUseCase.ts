import { CourseEntity } from "@/src/core/entities/Course.entity";
import { ICourseBranchingRepository } from "@/src/core/interfaces/repositories/ICourseBranchingRepository";
// import { CreateCourseMergeRequestInput } from "@/src/core/types/course.types"; // DEPRECATED - branching removed

// Temporary type definition for backwards compatibility
type CreateCourseMergeRequestInput = any;

export interface CreateCourseMergeRequestResult {
  success: boolean;
  course?: CourseEntity;
  error?: string;
}

export class CreateCourseMergeRequestUseCase {
  constructor(
    private readonly branchingRepository: ICourseBranchingRepository
  ) {}

  async execute(
    input: CreateCourseMergeRequestInput
  ): Promise<CreateCourseMergeRequestResult> {
    try {
      const course =
        await this.branchingRepository.createCourseMergeRequest(input);

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
            : "Error inesperado al crear la solicitud de fusión",
      };
    }
  }
}
