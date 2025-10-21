export type CourseVersionStatus =
  | "draft"
  | "pending_review"
  | "published"
  | "archived";

export type CourseMergeRequestStatus =
  | "open"
  | "approved"
  | "merged"
  | "rejected";

export interface CourseData {
  id: string;
  title: string;
  summary: string | null;
  description: string | null;
  slug: string;
  visibility_override: boolean;
  active_version_id: string | null;
  default_branch_id: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface CourseVersionData {
  id: string;
  course_id: string;
  branch_id: string | null;
  version_label: string;
  summary: string | null;
  status: CourseVersionStatus;
  is_active: boolean;
  is_published: boolean;
  is_tip: boolean | null;
  parent_version_id: string | null;
  merged_into_version_id: string | null;
  merge_request_id: string | null;
  based_on_version_id: string | null;
  created_by: string | null;
  reviewed_by: string | null;
  approved_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface CourseBranchData {
  id: string;
  course_id: string;
  name: string;
  description: string | null;
  parent_branch_id: string | null;
  base_version_id: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
  is_default: boolean;
}

export interface CourseMergeRequestData {
  id: string;
  course_id: string;
  source_branch_id: string;
  target_branch_id: string;
  source_version_id: string;
  target_version_id: string | null;
  title: string;
  summary: string | null;
  status: CourseMergeRequestStatus;
  opened_by: string | null;
  reviewer_id: string | null;
  opened_at: string;
  closed_at: string | null;
  merged_at: string | null;
  payload: Record<string, unknown> | null;
}

export interface CourseModuleData {
  id: string;
  course_id: string;
  course_version_id: string;
  title: string;
  description: string | null;
  order_index: number;
  content: string | null;
  is_published: boolean;
  created_at: string;
  updated_at: string;
}

export interface LessonData {
  id: string;
  module_id: string;
  title: string;
  content: string | null;
  order_index: number;
  duration_minutes: number | null;
  is_published: boolean;
  created_at: string;
  updated_at: string;
}

export interface StudentProgressData {
  id: string;
  student_id: string;
  lesson_id: string;
  completed: boolean;
  completed_at: string | null;
  time_spent_minutes: number;
}

export interface CourseTeacherData {
  id: string;
  course_id: string;
  teacher_id: string;
  assigned_by: string | null;
  assigned_at: string;
}

export interface CourseVersionEditorData {
  id: string;
  course_version_id: string;
  user_id: string;
  role: string;
  added_by: string | null;
  created_at: string;
}

export interface CreateCourseInput {
  title: string;
  summary?: string | null;
  description?: string | null;
  initialVersionLabel?: string;
  initialVersionSummary?: string | null;
}

export interface UpdateCourseInput {
  title?: string;
  summary?: string | null;
  description?: string | null;
  visibility_override?: boolean;
}

export interface CreateCourseVersionInput {
  courseId: string;
  versionLabel: string;
  summary?: string | null;
  basedOnVersionId?: string | null;
}

export interface UpdateCourseVersionInput {
  versionId: string;
  summary?: string | null;
  status?: CourseVersionStatus;
  isActive?: boolean;
  isPublished?: boolean;
  reviewedBy?: string | null;
  approvedAt?: string | null;
}

export interface CreateCourseBranchInput {
  courseId: string;
  branchName: string;
  description?: string | null;
  baseVersionId: string;
  newVersionLabel: string;
}

export interface CreateCourseMergeRequestInput {
  courseId: string;
  sourceBranchId: string;
  targetBranchId: string;
  title: string;
  summary?: string | null;
}

export interface ReviewCourseMergeRequestInput {
  mergeRequestId: string;
  decision: "approve" | "reject";
}

export interface MergeCourseBranchInput {
  mergeRequestId: string;
}

export interface DeleteCourseBranchInput {
  courseId: string;
  branchId: string;
}
