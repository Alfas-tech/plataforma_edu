import type { ICourseBranchingRepository } from "@/src/core/interfaces/repositories/ICourseBranchingRepository";

type CreateBranchInput = Parameters<
  ICourseBranchingRepository["createCourseBranch"]
>[0];
type CreateMergeRequestInput = Parameters<
  ICourseBranchingRepository["createCourseMergeRequest"]
>[0];
type ReviewMergeRequestInput = Parameters<
  ICourseBranchingRepository["reviewCourseMergeRequest"]
>[0];
type MergeBranchInput = Parameters<
  ICourseBranchingRepository["mergeCourseBranch"]
>[0];
type DeleteBranchInput = Parameters<
  ICourseBranchingRepository["deleteCourseBranch"]
>[0];

type BranchOperationResult = ReturnType<
  ICourseBranchingRepository["createCourseBranch"]
>;

const NOT_IMPLEMENTED_MESSAGE =
  "La funcionalidad de ramas de curso no está disponible en la versión actual.";

export class SupabaseCourseBranchingRepository
  implements ICourseBranchingRepository
{
  private fail(): Promise<never> {
    return Promise.reject(new Error(NOT_IMPLEMENTED_MESSAGE));
  }

  createCourseBranch(_input: CreateBranchInput): BranchOperationResult {
    return this.fail();
  }

  createCourseMergeRequest(
    _input: CreateMergeRequestInput
  ): BranchOperationResult {
    return this.fail();
  }

  reviewCourseMergeRequest(
    _input: ReviewMergeRequestInput
  ): BranchOperationResult {
    return this.fail();
  }

  mergeCourseBranch(_input: MergeBranchInput): BranchOperationResult {
    return this.fail();
  }

  deleteCourseBranch(_input: DeleteBranchInput): BranchOperationResult {
    return this.fail();
  }
}
