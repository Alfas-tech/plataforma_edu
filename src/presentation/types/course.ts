import type { CourseVersionStatus } from "@/src/core/types/course.types";
import type { CourseMergeRequestStatus } from "@/src/core/types/course.types";

export type CourseVisibilitySource = "override" | "version" | "hidden";

export interface CourseVersionOverview {
  id: string;
  label: string;
  summary: string | null;
  status: CourseVersionStatus;
  isActive: boolean;
  isPublished: boolean;
  approvedAt: string | null;
  createdAt: string;
  updatedAt: string;
  branchId: string | null;
  branchName: string | null;
}

export interface CourseOverview {
  id: string;
  title: string;
  summary: string | null;
  description: string | null;
  slug: string;
  visibilityOverride: boolean;
  isVisibleForStudents: boolean;
  visibilitySource: CourseVisibilitySource;
  hasActiveVersion: boolean;
  createdAt: string;
  lastUpdatedAt: string;
  activeVersion: CourseVersionOverview | null;
  defaultBranch: CourseBranchOverview | null;
  branches: CourseBranchOverview[];
  pendingMergeRequests: CourseMergeRequestOverview[];
  canEditCourse?: boolean;
}

export interface CourseBranchOverview {
  id: string;
  name: string;
  description: string | null;
  isDefault: boolean;
  parentBranchId: string | null;
  baseVersionId: string | null;
  baseVersionLabel: string | null;
  tipVersionId: string | null;
  tipVersionLabel: string | null;
  tipVersionStatus: CourseVersionStatus | null;
  tipVersionUpdatedAt: string | null;
  updatedAt: string;
  canManage?: boolean;
}

export interface CourseMergeRequestOverview {
  id: string;
  title: string;
  summary: string | null;
  status: CourseMergeRequestStatus;
  sourceBranchId: string;
  sourceBranchName: string;
  sourceVersionId: string;
  sourceVersionLabel: string;
  targetBranchId: string;
  targetBranchName: string;
  targetVersionId: string | null;
  targetVersionLabel: string | null;
  openedAt: string;
  openedById: string | null;
  openedByName: string | null;
  openedByEmail: string | null;
  openedByAvatarUrl: string | null;
  reviewerId: string | null;
  reviewerName: string | null;
  reviewerEmail: string | null;
  reviewerAvatarUrl: string | null;
  closedAt: string | null;
  mergedAt: string | null;
}
