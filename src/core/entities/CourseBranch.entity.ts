import { CourseBranchData, CourseVersionData } from "../types/course.types";
import { CourseVersionEntity } from "./CourseVersion.entity";

interface CourseBranchExtras {
  baseVersion?: CourseVersionData | null;
  tipVersion?: CourseVersionData | null;
  tipVersionTeacherIds?: string[];
  assignedTeacherIds?: string[];
}

export class CourseBranchEntity {
  constructor(
    public readonly id: string,
    public readonly courseId: string,
    public readonly name: string,
    public readonly description: string | null,
    public readonly parentBranchId: string | null,
    public readonly baseVersionId: string | null,
    public readonly createdBy: string | null,
    public readonly createdAt: Date,
    public readonly updatedAt: Date,
    public readonly isDefault: boolean,
    public readonly baseVersion: CourseVersionEntity | null = null,
    public readonly tipVersion: CourseVersionEntity | null = null,
    public readonly tipVersionTeacherIds: string[] = [],
    public readonly assignedTeacherIds: string[] = []
  ) {}

  static fromDatabase(
    data: CourseBranchData,
    extras?: CourseBranchExtras
  ): CourseBranchEntity {
    const baseVersionEntity = extras?.baseVersion
      ? CourseVersionEntity.fromDatabase(extras.baseVersion)
      : null;

    const tipVersionEntity = extras?.tipVersion
      ? CourseVersionEntity.fromDatabase(extras.tipVersion)
      : null;

    return new CourseBranchEntity(
      data.id,
      data.course_id,
      data.name,
      data.description,
      data.parent_branch_id,
      data.base_version_id,
      data.created_by,
      new Date(data.created_at),
      new Date(data.updated_at),
      data.is_default,
      baseVersionEntity,
      tipVersionEntity,
      extras?.tipVersionTeacherIds ?? [],
      extras?.assignedTeacherIds ?? []
    );
  }

  isMain(): boolean {
    return this.isDefault || this.name === "main";
  }

  hasParent(): boolean {
    return this.parentBranchId !== null;
  }
}
