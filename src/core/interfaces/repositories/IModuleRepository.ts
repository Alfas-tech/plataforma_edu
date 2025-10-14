import { CourseModuleEntity } from "../../entities/CourseModule.entity";
import { CourseModuleData } from "../../types/course.types";

export interface IModuleRepository {
  getModulesByCourseId(courseId: string): Promise<CourseModuleEntity[]>;
  getModuleById(id: string): Promise<CourseModuleEntity | null>;
  createModule(
    data: Omit<CourseModuleData, "id" | "created_at" | "updated_at">
  ): Promise<CourseModuleEntity>;
  updateModule(
    id: string,
    data: Partial<CourseModuleData>
  ): Promise<CourseModuleEntity>;
  deleteModule(id: string): Promise<void>;
}
