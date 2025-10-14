'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/src/infrastructure/supabase/server';
import { getCurrentProfile } from './profile.actions';

export async function getStudentProgress(studentId: string) {
  try {
    const supabase = createClient();

    // Get all progress for student
    const { data: progressData, error } = await supabase
      .from('student_progress')
      .select(`
        *,
        lesson:lessons (
          id,
          title,
          module_id
        )
      `)
      .eq('student_id', studentId);

    if (error) {
      return { error: error.message };
    }

    return { progress: progressData || [] };
  } catch (error) {
    return { error: error instanceof Error ? error.message : 'Error al obtener progreso' };
  }
}

export async function getCourseWithModulesAndLessons(courseId: string) {
  try {
    const profileResult = await getCurrentProfile();
    if ('error' in profileResult) {
      return { error: 'No autenticado' };
    }

    const { profile } = profileResult;
    const supabase = createClient();

    // Get course
    const { data: course, error: courseError } = await supabase
      .from('courses')
      .select('*')
      .eq('id', courseId)
      .single();

    if (courseError) {
      return { error: courseError.message };
    }

    // Get modules
    const modulesQuery = supabase
      .from('course_modules')
      .select('*')
      .eq('course_id', courseId)
      .order('order_index', { ascending: true });

    // Only show published modules to students
    if (profile.isStudent) {
      modulesQuery.eq('is_published', true);
    }

    const { data: modules, error: modulesError } = await modulesQuery;

    if (modulesError) {
      return { error: modulesError.message };
    }

    // Get lessons for each module
    const modulesWithLessons = await Promise.all(
      (modules || []).map(async (module) => {
        const lessonsQuery = supabase
          .from('lessons')
          .select('*')
          .eq('module_id', module.id)
          .order('order_index', { ascending: true });

        // Only show published lessons to students
        if (profile.isStudent) {
          lessonsQuery.eq('is_published', true);
        }

        const { data: lessons, error: lessonsError } = await lessonsQuery;

        if (lessonsError) {
          return { ...module, lessons: [] };
        }

        return { ...module, lessons: lessons || [] };
      })
    );

    // Get student progress if student
    let progress: any[] = [];
    if (profile.isStudent) {
      const { data: progressData, error: progressError } = await supabase
        .from('student_progress')
        .select('*')
        .eq('student_id', profile.id);
      
      if (!progressError) {
        progress = progressData || [];
      }
    }

    return {
      course,
      modules: modulesWithLessons,
      progress,
    };
  } catch (error) {
    return { error: error instanceof Error ? error.message : 'Error al obtener curso' };
  }
}

export async function markLessonComplete(lessonId: string) {
  try {
    const profileResult = await getCurrentProfile();
    if ('error' in profileResult) {
      return { error: 'No autenticado' };
    }

    const { profile } = profileResult;

    if (!profile.isStudent) {
      return { error: 'Solo estudiantes pueden marcar lecciones como completadas' };
    }

    const supabase = createClient();

    // Check if progress already exists
    const { data: existing } = await supabase
      .from('student_progress')
      .select('*')
      .eq('student_id', profile.id)
      .eq('lesson_id', lessonId)
      .single();

    if (existing) {
      // Update existing
      const { error } = await supabase
        .from('student_progress')
        .update({
          completed: true,
          completed_at: new Date().toISOString(),
        })
        .eq('student_id', profile.id)
        .eq('lesson_id', lessonId);

      if (error) {
        return { error: error.message };
      }
    } else {
      // Insert new
      const { error } = await supabase
        .from('student_progress')
        .insert({
          student_id: profile.id,
          lesson_id: lessonId,
          completed: true,
          completed_at: new Date().toISOString(),
        });

      if (error) {
        return { error: error.message };
      }
    }

    revalidatePath('/dashboard/student');
    return { success: true };
  } catch (error) {
    return { error: error instanceof Error ? error.message : 'Error al marcar lección' };
  }
}

export async function markLessonIncomplete(lessonId: string) {
  try {
    const profileResult = await getCurrentProfile();
    if ('error' in profileResult) {
      return { error: 'No autenticado' };
    }

    const { profile } = profileResult;

    if (!profile.isStudent) {
      return { error: 'Solo estudiantes pueden actualizar su progreso' };
    }

    const supabase = createClient();

    const { error } = await supabase
      .from('student_progress')
      .update({
        completed: false,
        completed_at: null,
      })
      .eq('student_id', profile.id)
      .eq('lesson_id', lessonId);

    if (error) {
      return { error: error.message };
    }

    revalidatePath('/dashboard/student');
    return { success: true };
  } catch (error) {
    return { error: error instanceof Error ? error.message : 'Error al actualizar lección' };
  }
}

