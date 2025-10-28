import {
  CourseWithModulesData,
  StudentProgress,
  MarkLessonResult,
} from "@/src/core/types/student.types";

/**
 * Repository interface for student-related operations
 * Defines the contract that must be implemented by infrastructure layer
 */
export interface IStudentRepository {
  /**
   * Get a course with all its modules and lessons for a student
   * @param courseId - The course ID
   * @param studentId - The student ID
   * @returns Course data with modules, lessons, and student progress
   */
  getCourseWithModulesAndLessons(
    courseId: string,
    studentId: string
  ): Promise<CourseWithModulesData>;

  /**
   * Get all progress records for a student
   * @param studentId - The student ID
   * @returns Array of progress records
   */
  getStudentProgress(studentId: string): Promise<StudentProgress[]>;

  /**
   * Mark a lesson as completed for a student
   * @param lessonId - The lesson ID
   * @param studentId - The student ID
   * @returns Result indicating success or failure
   */
  markLessonComplete(lessonId: string, studentId: string): Promise<MarkLessonResult>;

  /**
   * Mark a lesson as incomplete for a student
   * @param lessonId - The lesson ID
   * @param studentId - The student ID
   * @returns Result indicating success or failure
   */
  markLessonIncomplete(lessonId: string, studentId: string): Promise<MarkLessonResult>;
}
