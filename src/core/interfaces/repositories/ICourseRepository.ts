import { CourseEntity } from "../../entities/Course.entity";
import { CourseGroupEntity } from "../../entities/CourseGroup.entity";
import { CourseGroupStudentEntity } from "../../entities/CourseGroupStudent.entity";
import { CourseResourceEntity } from "../../entities/CourseResource.entity";
import { CourseTopicEntity } from "../../entities/CourseTopic.entity";
import { CourseVersionEntity } from "../../entities/CourseVersion.entity";
import {
  AddResourceInput,
  AddStudentToGroupInput,
  AssignGroupTeacherInput,
  CreateCourseDraftInput,
  CreateCourseInput,
  ArchiveCourseVersionInput,
  CreateGroupInput,
  CreateTopicInput,
  PublishCourseVersionInput,
  ReorderTopicInput,
  UpdateCourseDraftInput,
  UpdateCourseInput,
  UpdateResourceInput,
  UpdateTopicInput,
} from "../../types/course.types";

export interface CourseWithVersions {
  course: CourseEntity;
  versions: CourseVersionEntity[];
}

export interface ICourseRepository {
  getAllCourses(): Promise<CourseEntity[]>;
  getCourseById(courseId: string): Promise<CourseEntity | null>;
  getCourseWithVersions(courseId: string): Promise<CourseWithVersions | null>;
  getCourseVersionById(versionId: string): Promise<CourseVersionEntity | null>;
  createCourse(input: CreateCourseInput): Promise<CourseEntity>;
  updateCourse(
    courseId: string,
    input: UpdateCourseInput
  ): Promise<CourseEntity>;
  deleteCourse(courseId: string): Promise<void>;

  createDraftVersion(
    input: CreateCourseDraftInput
  ): Promise<CourseVersionEntity>;
  updateDraftVersion(
    versionId: string,
    input: UpdateCourseDraftInput
  ): Promise<CourseVersionEntity>;
  publishCourseVersion(input: PublishCourseVersionInput): Promise<CourseEntity>;
  archiveCourseVersion(input: ArchiveCourseVersionInput): Promise<CourseEntity>;

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

  listTopics(courseVersionId: string): Promise<CourseTopicEntity[]>;
  getTopicById(topicId: string): Promise<CourseTopicEntity | null>;
  createTopic(input: CreateTopicInput): Promise<CourseTopicEntity>;
  updateTopic(
    topicId: string,
    input: UpdateTopicInput
  ): Promise<CourseTopicEntity>;
  reorderTopics(
    courseVersionId: string,
    order: ReorderTopicInput[]
  ): Promise<void>;
  deleteTopic(topicId: string): Promise<void>;

  listResources(topicId: string): Promise<CourseResourceEntity[]>;
  getResourceById(resourceId: string): Promise<CourseResourceEntity | null>;
  addResource(input: AddResourceInput): Promise<CourseResourceEntity>;
  updateResource(
    resourceId: string,
    input: UpdateResourceInput
  ): Promise<CourseResourceEntity>;
  deleteResource(resourceId: string): Promise<void>;

  listGroups(courseVersionId: string): Promise<CourseGroupEntity[]>;
  createGroup(input: CreateGroupInput): Promise<CourseGroupEntity>;
  assignGroupTeacher(
    input: AssignGroupTeacherInput
  ): Promise<CourseGroupEntity>;
  addStudentToGroup(
    input: AddStudentToGroupInput
  ): Promise<CourseGroupStudentEntity>;
  removeStudentFromGroup(groupId: string, studentId: string): Promise<void>;
}
