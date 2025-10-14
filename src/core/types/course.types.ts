export interface CourseData {
  id: string;
  title: string;
  description: string | null;
  start_date: string;
  end_date: string;
  is_active: boolean;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface CourseModuleData {
  id: string;
  course_id: string;
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

export interface CreateCourseInput {
  title: string;
  description: string | null;
  start_date: string;
  end_date: string;
}

export interface UpdateCourseInput {
  title?: string;
  description?: string | null;
  start_date?: string;
  end_date?: string;
  is_active?: boolean;
}
