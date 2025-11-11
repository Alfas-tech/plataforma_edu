// Student domain types aligned with topics/resources structure

export interface StudentTopicProgress {
  studentId: string;
  topicId: string;
  completed: boolean;
  completedAt: string | null;
}

export interface ResourceSummary {
  id: string;
  topicId: string;
  title: string;
  description: string | null;
  resourceType: string;
  fileUrl: string | null;
  fileName: string | null;
  mimeType: string | null;
  externalUrl: string | null;
  orderIndex: number;
}

export interface TopicWithResources {
  id: string;
  courseVersionId: string;
  title: string;
  description: string | null;
  orderIndex: number;
  resources: ResourceSummary[];
  completed?: boolean;
}

export interface CourseWithTopicsData {
  course: {
    id: string;
    name: string;
    description: string | null;
    activeVersionId: string | null;
  };
  version: {
    id: string;
    title: string;
    summary: string | null;
    status: string;
  } | null;
  topics: TopicWithResources[];
  progress: StudentTopicProgress[];
}

export interface MarkTopicResult {
  success: boolean;
  error?: string;
}

export interface GetCourseContentResult {
  success: boolean;
  data?: CourseWithTopicsData;
  error?: string;
}
