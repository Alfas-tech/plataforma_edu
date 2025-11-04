import { GroupData, GroupStudentData } from "../types/course.types";

interface CourseGroupExtras {
  students?: GroupStudentData[];
}

export class CourseGroupEntity {
  constructor(
    public readonly id: string,
    public readonly courseVersionId: string,
    public readonly name: string,
    public readonly teacherId: string | null,
    public readonly studentIds: readonly string[],
    public readonly createdAt: Date,
    public readonly updatedAt: Date
  ) {}

  static fromDatabase(
    data: GroupData,
    extras?: CourseGroupExtras
  ): CourseGroupEntity {
    const studentIds = extras?.students
      ? extras.students.map((student) => student.student_id)
      : [];

    return new CourseGroupEntity(
      data.id,
      data.course_version_id,
      data.name,
      data.teacher_id,
      studentIds,
      new Date(data.created_at),
      new Date(data.updated_at)
    );
  }

  hasTeacher(): boolean {
    return this.teacherId !== null;
  }

  includesStudent(studentId: string): boolean {
    return this.studentIds.includes(studentId);
  }
}
