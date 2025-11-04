import { GroupStudentData } from "../types/course.types";

export class CourseGroupStudentEntity {
  constructor(
    public readonly id: string,
    public readonly groupId: string,
    public readonly studentId: string,
    public readonly enrolledAt: Date
  ) {}

  static fromDatabase(data: GroupStudentData): CourseGroupStudentEntity {
    return new CourseGroupStudentEntity(
      data.id,
      data.group_id,
      data.student_id,
      new Date(data.enrolled_at)
    );
  }
}
