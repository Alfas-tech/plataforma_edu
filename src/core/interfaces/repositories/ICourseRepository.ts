import { CourseEntity } from "../../entities/Course.entity";
import { CourseVersionEntity } from "../../entities/CourseVersion.entity";
import {
  CreateCourseInput,
  UpdateCourseInput,
} from "../../types/course.types";

export interface ICourseRepository {
  getActiveCourse(): Promise<CourseEntity | null>;
  getCourseById(id: string): Promise<CourseEntity | null>;
  getCourseVersionById(versionId: string): Promise<CourseVersionEntity | null>;
  getAllCourses(): Promise<CourseEntity[]>;
  createCourse(input: CreateCourseInput): Promise<CourseEntity>;
  updateCourse(id: string, input: UpdateCourseInput): Promise<CourseEntity>;
  deleteCourse(id: string): Promise<void>;
  assignTeacherToVersion(
    courseId: string,
    courseVersionId: string,
    teacherId: string
  ): Promise<void>;
  removeTeacherFromVersion(
    courseId: string,
    courseVersionId: string,
    teacherId: string
  ): Promise<void>;
  getCourseTeachers(courseId: string): Promise<string[]>;
  getVersionTeachers(courseVersionId: string): Promise<string[]>;
  getCourseVersionAssignments(
    courseId: string
  ): Promise<Array<{ version: CourseVersionEntity; teacherIds: string[] }>>;
  isTeacherAssignedToVersion(
    courseVersionId: string,
    teacherId: string
  ): Promise<boolean>;
  getTeacherCourses(teacherId: string): Promise<CourseEntity[]>;
}
