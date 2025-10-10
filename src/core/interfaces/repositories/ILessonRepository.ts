import { LessonEntity } from '../../entities/Lesson.entity';
import { LessonData } from '../../types/course.types';

export interface ILessonRepository {
  getLessonsByModuleId(moduleId: string): Promise<LessonEntity[]>;
  getLessonById(id: string): Promise<LessonEntity | null>;
  createLesson(data: Omit<LessonData, 'id' | 'created_at' | 'updated_at'>): Promise<LessonEntity>;
  updateLesson(id: string, data: Partial<LessonData>): Promise<LessonEntity>;
  deleteLesson(id: string): Promise<void>;
}