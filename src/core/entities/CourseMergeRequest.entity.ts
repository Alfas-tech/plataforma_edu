import {
  CourseMergeRequestData,
  CourseMergeRequestStatus,
} from "../types/course.types";

export class CourseMergeRequestEntity {
  constructor(
    public readonly id: string,
    public readonly courseId: string,
    public readonly sourceBranchId: string,
    public readonly targetBranchId: string,
    public readonly sourceVersionId: string,
    public readonly targetVersionId: string | null,
    public readonly title: string,
    public readonly summary: string | null,
    public readonly status: CourseMergeRequestStatus,
    public readonly openedBy: string | null,
    public readonly reviewerId: string | null,
    public readonly openedAt: Date,
    public readonly closedAt: Date | null,
    public readonly mergedAt: Date | null,
    public readonly payload: Record<string, unknown> | null
  ) {}

  static fromDatabase(data: CourseMergeRequestData): CourseMergeRequestEntity {
    return new CourseMergeRequestEntity(
      data.id,
      data.course_id,
      data.source_branch_id,
      data.target_branch_id,
      data.source_version_id,
      data.target_version_id,
      data.title,
      data.summary,
      data.status,
      data.opened_by,
      data.reviewer_id,
      new Date(data.opened_at),
      data.closed_at ? new Date(data.closed_at) : null,
      data.merged_at ? new Date(data.merged_at) : null,
      data.payload
    );
  }

  isOpen(): boolean {
    return this.status === "open";
  }

  isMerged(): boolean {
    return this.status === "merged";
  }

  isApproved(): boolean {
    return this.status === "approved";
  }
}
