import { ICourseRepository } from '@/src/core/interfaces/repositories/ICourseRepository';
import { CourseEntity } from '@/src/core/entities/Course.entity';

export interface GetTeacherCoursesResult {
  success: boolean;
  courses?: CourseEntity[];
  error?: string;
}

export class GetTeacherCoursesUseCase {
  constructor(private readonly courseRepository: ICourseRepository) {}

  async execute(teacherId: string): Promise<GetTeacherCoursesResult> {
    try {
      const courses = await this.courseRepository.getTeacherCourses(teacherId);

      return {
        success: true,
        courses,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Error al obtener cursos del docente',
      };
    }
  }
}

