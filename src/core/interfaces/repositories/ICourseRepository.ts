import { CourseEntity } from "../../entities/Course.entity";
import { CreateCourseInput, UpdateCourseInput } from "../../types/course.types";

export interface ICourseRepository {
  getActiveCourse(): Promise<CourseEntity | null>;
  getCourseById(id: string): Promise<CourseEntity | null>;
  getAllCourses(): Promise<CourseEntity[]>;
  createCourse(input: CreateCourseInput): Promise<CourseEntity>;
  updateCourse(id: string, input: UpdateCourseInput): Promise<CourseEntity>;
  deleteCourse(id: string): Promise<void>;
  assignTeacher(courseId: string, teacherId: string): Promise<void>;
  removeTeacher(courseId: string, teacherId: string): Promise<void>;
  getCourseTeachers(courseId: string): Promise<string[]>;
  getTeacherCourses(teacherId: string): Promise<CourseEntity[]>;
}
