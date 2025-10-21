import {
  CourseBranchData,
  CourseData,
  CourseMergeRequestData,
  CourseVersionData,
} from "../types/course.types";
import { CourseVersionEntity } from "./CourseVersion.entity";
import { CourseBranchEntity } from "./CourseBranch.entity";
import { CourseMergeRequestEntity } from "./CourseMergeRequest.entity";

interface CourseEntityExtras {
  defaultBranch?: CourseBranchData | null;
  branches?: CourseBranchData[];
  branchBaseVersions?: Record<string, CourseVersionData | null>;
  branchTipVersions?: Record<string, CourseVersionData | null>;
  mergeRequests?: CourseMergeRequestData[];
}

export class CourseEntity {
  constructor(
    public readonly id: string,
    public readonly title: string,
    public readonly summary: string | null,
    public readonly description: string | null,
    public readonly slug: string,
    public readonly visibilityOverride: boolean,
    public readonly activeVersion: CourseVersionEntity | null,
    public readonly createdBy: string | null,
    public readonly createdAt: Date,
    public readonly updatedAt: Date,
    public readonly defaultBranchId: string | null,
    public readonly defaultBranch: CourseBranchEntity | null = null,
    public readonly branches: CourseBranchEntity[] = [],
    public readonly pendingMergeRequests: CourseMergeRequestEntity[] = []
  ) {}

  static fromDatabase(
    data: CourseData,
    activeVersion?: CourseVersionData | null,
    extras?: CourseEntityExtras
  ): CourseEntity {
    const defaultBranchEntity = extras?.defaultBranch
      ? CourseBranchEntity.fromDatabase(extras.defaultBranch, {
          baseVersion:
            extras.branchBaseVersions?.[extras.defaultBranch.id] ?? null,
          tipVersion:
            extras.branchTipVersions?.[extras.defaultBranch.id] ?? null,
        })
      : null;

    const branchEntities = extras?.branches
      ? extras.branches.map((branch) =>
          CourseBranchEntity.fromDatabase(branch, {
            baseVersion: extras?.branchBaseVersions?.[branch.id] ?? null,
            tipVersion: extras?.branchTipVersions?.[branch.id] ?? null,
          })
        )
      : [];

    const mergeRequestEntities = extras?.mergeRequests
      ? extras.mergeRequests.map((mr) =>
          CourseMergeRequestEntity.fromDatabase(mr)
        )
      : [];

    return new CourseEntity(
      data.id,
      data.title,
      data.summary,
      data.description,
      data.slug,
      data.visibility_override,
      activeVersion ? CourseVersionEntity.fromDatabase(activeVersion) : null,
      data.created_by,
      new Date(data.created_at),
      new Date(data.updated_at),
      data.default_branch_id,
      defaultBranchEntity,
      branchEntities,
      mergeRequestEntities
    );
  }

  getActiveVersionLabel(): string | null {
    return this.activeVersion?.versionLabel ?? null;
  }

  getActiveVersionSummary(): string | null {
    return this.activeVersion?.summary ?? null;
  }

  getActiveVersionStatus() {
    return this.activeVersion?.status ?? null;
  }

  isVisibleForStudents(): boolean {
    if (this.visibilityOverride) {
      return true;
    }

    return this.activeVersion?.isPublishedAndVisible() ?? false;
  }

  hasActiveVersion(): boolean {
    return Boolean(this.activeVersion);
  }
}
