import {
  CourseWithTopicsData,
  StudentTopicProgress,
  MarkTopicResult,
} from "@/src/core/types/student.types";

/**
 * Repository interface for student-related operations
 * Defines the contract that must be implemented by infrastructure layer
 */
export interface IStudentRepository {
  /**
   * Get a course with all its topics and resources for a student
   * @param courseId - The course ID
   * @param studentId - The student ID
   * @returns Course data with topics, resources, and student progress
   */
  getCourseWithTopicsAndResources(
    courseId: string,
    studentId: string
  ): Promise<CourseWithTopicsData>;

  /**
   * Get all progress records for a student
   * @param studentId - The student ID
   * @returns Array of progress records
   */
  getStudentTopicProgress(studentId: string): Promise<StudentTopicProgress[]>;

  /**
   * Mark a topic as completed for a student
   * @param topicId - The topic ID
   * @param studentId - The student ID
   * @returns Result indicating success or failure
   */
  markTopicComplete(
    topicId: string,
    studentId: string
  ): Promise<MarkTopicResult>;

  /**
   * Mark a topic as incomplete for a student
   * @param topicId - The topic ID
   * @param studentId - The student ID
   * @returns Result indicating success or failure
   */
  markTopicIncomplete(
    topicId: string,
    studentId: string
  ): Promise<MarkTopicResult>;
}
