import { CourseData } from "../types/course.types";
import { CourseVersionEntity } from "./CourseVersion.entity";
import type { CourseVersionData } from "../types/course.types";

interface CourseEntityExtras {
  versions?: CourseVersionData[];
}

export class CourseEntity {
  constructor(
    public readonly id: string,
    public readonly name: string,
    public readonly description: string | null,
    public readonly createdBy: string,
    public readonly createdAt: Date,
    public readonly updatedAt: Date,
    public readonly activeVersionId: string | null,
    public readonly versions: readonly CourseVersionEntity[] = []
  ) {}

  static fromDatabase(
    data: CourseData,
    extras?: CourseEntityExtras
  ): CourseEntity {
    const versionEntities = (extras?.versions ?? [])
      .map((version) => CourseVersionEntity.fromDatabase(version))
      .sort((a, b) => a.versionNumber - b.versionNumber);

    return new CourseEntity(
      data.id,
      data.name,
      data.description ?? null,
      data.created_by,
      new Date(data.created_at),
      new Date(data.updated_at),
      data.active_version_id,
      versionEntities
    );
  }

  get activeVersion(): CourseVersionEntity | null {
    return (
      this.versions.find((version) => version.isActive()) ??
      (this.activeVersionId
        ? (this.versions.find(
            (version) => version.id === this.activeVersionId
          ) ?? null)
        : null)
    );
  }

  get draftVersion(): CourseVersionEntity | null {
    return this.versions.find((version) => version.isDraft()) ?? null;
  }

  get title(): string {
    return this.name;
  }

  get summary(): string | null {
    return this.description;
  }

  get slug(): string | null {
    return null;
  }

  get visibilityOverride(): boolean {
    return false;
  }

  get archivedVersions(): CourseVersionEntity[] {
    return this.versions
      .filter((version) => version.isArchived())
      .sort((a, b) => b.versionNumber - a.versionNumber);
  }

  hasDraft(): boolean {
    return Boolean(this.draftVersion);
  }

  hasActiveVersion(): boolean {
    return Boolean(this.activeVersion);
  }

  getVersionById(versionId: string): CourseVersionEntity | null {
    return this.versions.find((version) => version.id === versionId) ?? null;
  }
}
