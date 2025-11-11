export type CourseStatus = "draft" | "active" | "archived";

export type CourseVersionStatus = CourseStatus;

// SIMPLIFICADO: Solo tipos específicos permitidos
export type ResourceType =
  | "pdf"
  | "document"
  | "text"
  | "image"
  | "audio"
  | "video"
  | "link"
  | "other";

export interface CourseData {
  id: string;
  name: string;
  description: string | null;
  created_by: string;
  active_version_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface CourseVersionData {
  id: string;
  course_id: string;
  version_number: number;
  title: string;
  description: string | null;
  content: string | null;
  status: CourseVersionStatus;
  start_date: string | null;
  end_date: string | null;
  published_at: string | null;
  published_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface GroupData {
  id: string;
  course_version_id: string;
  name: string;
  teacher_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface GroupStudentData {
  id: string;
  group_id: string;
  student_id: string;
  enrolled_at: string;
}

export interface TopicData {
  id: string;
  course_version_id: string;
  title: string;
  description: string | null;
  order_index: number;
  created_at: string;
  updated_at: string;
}

export interface ResourceData {
  id: string;
  topic_id: string;
  title: string;
  description: string | null;
  resource_type: ResourceType;
  file_url: string | null;
  file_name: string | null;
  file_size: number | null;
  mime_type: string | null;
  external_url: string | null;
  order_index: number;
  created_at: string;
  updated_at: string;
}

export interface StudentProgressData {
  id: string;
  student_id: string;
  topic_id: string;
  completed: boolean;
  completed_at: string | null;
  last_accessed_at: string;
}

export interface CreateCourseInput {
  name: string;
  description?: string | null;
  draft?: {
    title?: string | null;
    description?: string | null;
    content?: string | null;
  };
}

export interface UpdateCourseInput {
  name?: string;
  description?: string | null;
  activeVersionId?: string | null;
}

export interface CreateCourseDraftInput {
  courseId: string;
  title: string;
  description?: string | null;
  content?: string | null;
  startDate?: string | null;
  endDate?: string | null;
  createdBy: string;
}

export interface UpdateCourseDraftInput {
  title?: string;
  description?: string | null;
  content?: string | null;
  startDate?: string | null;
  endDate?: string | null;
}

export interface PublishCourseVersionInput {
  versionId: string;
  publishedBy: string;
  startDate?: string | null;
  endDate?: string | null;
}

export interface ArchiveCourseVersionInput {
  versionId: string;
  archivedBy: string;
}

export interface CreateTopicInput {
  courseVersionId: string;
  title: string;
  description?: string | null;
  orderIndex?: number;
  createdBy: string;
}

export interface UpdateTopicInput {
  title?: string;
  description?: string | null;
}

export interface ReorderTopicInput {
  topicId: string;
  orderIndex: number;
}

export interface DeleteTopicInput {
  topicId: string;
}

export interface AddResourceInput {
  topicId: string;
  title: string;
  description?: string | null;
  resourceType: ResourceType;
  fileUrl?: string | null;
  fileName?: string | null;
  fileSize?: number | null;
  mimeType?: string | null;
  externalUrl?: string | null;
  orderIndex?: number;
  createdBy: string;
}

export interface UpdateResourceInput {
  title?: string;
  description?: string | null;
  resourceType?: ResourceType;
  fileUrl?: string | null;
  fileName?: string | null;
  fileSize?: number | null;
  mimeType?: string | null;
  externalUrl?: string | null;
}

export interface CreateGroupInput {
  courseVersionId: string;
  name: string;
  teacherId?: string | null;
  createdBy: string;
}

export interface AssignGroupTeacherInput {
  groupId: string;
  teacherId: string | null;
  assignedBy: string;
}

export interface AddStudentToGroupInput {
  groupId: string;
  studentId: string;
}

export interface RemoveStudentFromGroupInput {
  groupId: string;
  studentId: string;
}
