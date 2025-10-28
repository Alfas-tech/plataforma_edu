import { IStudentRepository } from "@/src/core/interfaces/repositories/IStudentRepository";
import { GetCourseResult } from "@/src/core/types/student.types";

/**
 * Use Case: Get course with modules and lessons for a student
 * Business logic for retrieving course content including student progress
 */
export class GetCourseWithModulesAndLessonsUseCase {
  constructor(private readonly studentRepository: IStudentRepository) {}

  async execute(courseId: string, studentId: string): Promise<GetCourseResult> {
    try {
      const data = await this.studentRepository.getCourseWithModulesAndLessons(
        courseId,
        studentId
      );

      // Merge progress with lessons
      const modulesWithProgress = data.modules.map((module) => ({
        ...module,
        lessons: module.lessons.map((lesson) => {
          const progress = data.progress.find((p) => p.lessonId === lesson.id);
          return {
            ...lesson,
            completed: progress?.completed || false,
          };
        }),
      }));

      return {
        success: true,
        data: {
          ...data,
          modules: modulesWithProgress,
        },
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Error al obtener curso",
      };
    }
  }
}
