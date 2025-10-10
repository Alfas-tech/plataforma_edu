
import { StudentProgressEntity } from '../../entities/StudentProgress.entity';

export interface IProgressRepository {
  getStudentProgress(studentId: string, lessonId: string): Promise<StudentProgressEntity | null>;
  getAllStudentProgress(studentId: string): Promise<StudentProgressEntity[]>;
  markLessonComplete(studentId: string, lessonId: string, timeSpent: number): Promise<StudentProgressEntity>;
  updateProgress(studentId: string, lessonId: string, timeSpent: number): Promise<StudentProgressEntity>;
}