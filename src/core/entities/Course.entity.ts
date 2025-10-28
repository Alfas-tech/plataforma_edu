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
  branchTipTeacherIds?: Record<string, string[]>;
  branchTeacherIds?: Record<string, string[]>;
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

  getPrimaryVersion(): CourseVersionEntity | null {
    if (this.activeVersion) {
      return this.activeVersion;
    }

    if (this.defaultBranch?.tipVersion) {
      return this.defaultBranch.tipVersion;
    }

    return null;
  }

  static fromDatabase(
    data: CourseData,
    activeVersion?: CourseVersionData | null,
    extras?: CourseEntityExtras
  ): CourseEntity {
    const activeVersionEntity = activeVersion
      ? CourseVersionEntity.fromDatabase(activeVersion)
      : null;

    const defaultBranchEntity = extras?.defaultBranch
      ? CourseBranchEntity.fromDatabase(extras.defaultBranch, {
          baseVersion:
            extras.branchBaseVersions?.[extras.defaultBranch.id] ?? null,
          tipVersion:
            extras.branchTipVersions?.[extras.defaultBranch.id] ?? null,
          tipVersionTeacherIds:
            extras.branchTipTeacherIds?.[extras.defaultBranch.id] ?? [],
          assignedTeacherIds:
            extras.branchTeacherIds?.[extras.defaultBranch.id] ?? [],
        })
      : null;

    const branchEntities = extras?.branches
      ? extras.branches.map((branch) =>
          CourseBranchEntity.fromDatabase(branch, {
            baseVersion: extras?.branchBaseVersions?.[branch.id] ?? null,
            tipVersion: extras?.branchTipVersions?.[branch.id] ?? null,
            tipVersionTeacherIds:
              extras?.branchTipTeacherIds?.[branch.id] ?? [],
            assignedTeacherIds: extras?.branchTeacherIds?.[branch.id] ?? [],
          })
        )
      : [];

    const mergeRequestEntities = extras?.mergeRequests
      ? extras.mergeRequests.map((mr) =>
          CourseMergeRequestEntity.fromDatabase(mr)
        )
      : [];

    const primaryVersionCandidate =
      activeVersionEntity ?? defaultBranchEntity?.tipVersion ?? null;

    const visibilityOverrideActive = Boolean(data.visibility_override);
    const shouldShowOverride =
      visibilityOverrideActive &&
      !(primaryVersionCandidate?.isPublishedAndVisible() ?? false);

    return new CourseEntity(
      data.id,
      data.title,
      data.summary,
      data.description,
      data.slug,
      shouldShowOverride,
      activeVersionEntity,
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
    return this.getPrimaryVersion()?.versionLabel ?? null;
  }

  getActiveVersionSummary(): string | null {
    return this.getPrimaryVersion()?.summary ?? null;
  }

  getActiveVersionStatus() {
    return this.getPrimaryVersion()?.status ?? null;
  }

  isVisibleForStudents(): boolean {
    const version = this.getPrimaryVersion();

    if (version?.isPublishedAndVisible()) {
      return true;
    }

    return this.visibilityOverride;
  }

  hasActiveVersion(): boolean {
    return this.getPrimaryVersion() !== null;
  }
}
