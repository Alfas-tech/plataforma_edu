import { ICourseRepository } from "@/src/core/interfaces/repositories/ICourseRepository";
import { CourseEntity } from "@/src/core/entities/Course.entity";

export interface GetAllCoursesResult {
  success: boolean;
  courses?: CourseEntity[];
  error?: string;
}

export class GetAllCoursesUseCase {
  constructor(private readonly courseRepository: ICourseRepository) {}

  async execute(): Promise<GetAllCoursesResult> {
    try {
      const courses = await this.courseRepository.getAllCourses();

      return {
        success: true,
        courses,
      };
    } catch (error) {
      return {
        success: false,
        error:
          error instanceof Error ? error.message : "Error al obtener cursos",
      };
    }
  }
}
