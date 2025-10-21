import { CourseEntity } from "../../entities/Course.entity";
import {
  CreateCourseBranchInput,
  CreateCourseMergeRequestInput,
  DeleteCourseBranchInput,
  MergeCourseBranchInput,
  ReviewCourseMergeRequestInput,
} from "../../types/course.types";

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
