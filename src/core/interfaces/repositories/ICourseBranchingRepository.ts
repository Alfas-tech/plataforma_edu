import { CourseEntity } from "../../entities/Course.entity";
// import {
//   CreateCourseBranchInput,
//   CreateCourseMergeRequestInput,
//   DeleteCourseBranchInput,
//   MergeCourseBranchInput,
//   ReviewCourseMergeRequestInput,
// } from "../../types/course.types"; // DEPRECATED - branching removed

// Temporary type definitions for backwards compatibility
type CreateCourseBranchInput = {
  courseId: string;
  branchName: string;
  description?: string | null;
  baseVersionId: string;
  newVersionLabel: string;
};
type CreateCourseMergeRequestInput = any;
type DeleteCourseBranchInput = any;
type MergeCourseBranchInput = any;
type ReviewCourseMergeRequestInput = any;

export interface ICourseBranchingRepository {
  createCourseBranch(input: CreateCourseBranchInput): Promise<CourseEntity>;
  createCourseMergeRequest(
    input: CreateCourseMergeRequestInput
  ): Promise<CourseEntity>;
  reviewCourseMergeRequest(
    input: ReviewCourseMergeRequestInput
  ): Promise<CourseEntity>;
  mergeCourseBranch(input: MergeCourseBranchInput): Promise<CourseEntity>;
  deleteCourseBranch(input: DeleteCourseBranchInput): Promise<CourseEntity>;
}
