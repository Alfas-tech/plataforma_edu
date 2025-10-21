import {
  CourseVersionData,
  CourseVersionStatus,
} from "@/src/core/types/course.types";

export class CourseVersionEntity {
  constructor(
    public readonly id: string,
    public readonly courseId: string,
    public readonly branchId: string | null,
    public readonly versionLabel: string,
    public readonly summary: string | null,
    public readonly status: CourseVersionStatus,
    public readonly isActive: boolean,
    public readonly isPublished: boolean,
    public readonly isTip: boolean,
    public readonly parentVersionId: string | null,
    public readonly mergedIntoVersionId: string | null,
    public readonly mergeRequestId: string | null,
    public readonly basedOnVersionId: string | null,
    public readonly createdBy: string | null,
    public readonly reviewedBy: string | null,
    public readonly approvedAt: Date | null,
    public readonly createdAt: Date,
    public readonly updatedAt: Date
  ) {}

  static fromDatabase(data: CourseVersionData): CourseVersionEntity {
    return new CourseVersionEntity(
      data.id,
      data.course_id,
      data.branch_id,
      data.version_label,
      data.summary,
      data.status,
      data.is_active,
      data.is_published,
      data.is_tip ?? false,
      data.parent_version_id,
      data.merged_into_version_id,
      data.merge_request_id,
      data.based_on_version_id,
      data.created_by,
      data.reviewed_by,
      data.approved_at ? new Date(data.approved_at) : null,
      new Date(data.created_at),
      new Date(data.updated_at)
    );
  }

  isDraft(): boolean {
    return this.status === "draft";
  }

  isPendingReview(): boolean {
    return this.status === "pending_review";
  }

  isPublishedAndVisible(): boolean {
    return this.status === "published" && this.isActive && this.isPublished;
  }

  belongsToBranch(branchId: string): boolean {
    return this.branchId === branchId;
  }

  hasParent(): boolean {
    return this.parentVersionId !== null;
  }
}
