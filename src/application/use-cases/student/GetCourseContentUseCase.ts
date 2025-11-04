import { IStudentRepository } from "@/src/core/interfaces/repositories/IStudentRepository";
import {
  GetCourseContentResult,
  StudentTopicProgress,
} from "@/src/core/types/student.types";

/**
 * Use Case: Get course content (topics and resources) for a student
 * Merges topic progress information with the navigational structure
 */
export class GetCourseContentUseCase {
  constructor(private readonly studentRepository: IStudentRepository) {}

  async execute(
    courseId: string,
    studentId: string
  ): Promise<GetCourseContentResult> {
    try {
      const data = await this.studentRepository.getCourseWithTopicsAndResources(
        courseId,
        studentId
      );

      const progressByTopic = new Map<string, StudentTopicProgress>();
      data.progress.forEach((record) => {
        progressByTopic.set(record.topicId, record);
      });

      const topicsWithProgress = data.topics.map((topic) => ({
        ...topic,
        completed: progressByTopic.get(topic.id)?.completed ?? false,
      }));

      return {
        success: true,
        data: {
          ...data,
          topics: topicsWithProgress,
        },
      };
    } catch (error) {
      return {
        success: false,
        error:
          error instanceof Error ? error.message : "Error al obtener el curso",
      };
    }
  }
}
