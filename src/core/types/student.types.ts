// Student domain types

export interface StudentProgress {
  studentId: string;
  lessonId: string;
  completed: boolean;
  completedAt: string | null;
}

export interface LessonWithProgress {
  id: string;
  moduleId: string;
  title: string;
  content: string | null;
  orderIndex: number;
  durationMinutes: number | null;
  isPublished: boolean;
  completed?: boolean;
}

export interface ModuleWithLessons {
  id: string;
  courseId: string;
  courseVersionId: string;
  title: string;
  description: string | null;
  orderIndex: number;
  isPublished: boolean;
  lessons: LessonWithProgress[];
}

export interface CourseWithModulesData {
  course: {
    id: string;
    title: string;
    description: string | null;
    activeVersionId: string | null;
  };
  modules: ModuleWithLessons[];
  progress: StudentProgress[];
}

export interface MarkLessonResult {
  success: boolean;
  error?: string;
}

export interface GetCourseResult {
  success: boolean;
  data?: CourseWithModulesData;
  error?: string;
}
