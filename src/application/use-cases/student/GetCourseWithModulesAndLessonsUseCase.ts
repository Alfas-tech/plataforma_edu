import { GetCourseContentUseCase } from "./GetCourseContentUseCase";
import { GetCourseContentResult } from "@/src/core/types/student.types";

/**
 * @deprecated Mantener por compatibilidad; usar GetCourseContentUseCase
 */
export class GetCourseWithModulesAndLessonsUseCase {
  constructor(private readonly delegate: GetCourseContentUseCase) {}

  async execute(
    courseId: string,
    studentId: string
  ): Promise<GetCourseContentResult> {
    return this.delegate.execute(courseId, studentId);
  }
}
