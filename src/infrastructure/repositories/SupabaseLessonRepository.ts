import { ILessonRepository } from '@/src/core/interfaces/repositories/ILessonRepository';
import { LessonEntity } from '@/src/core/entities/Lesson.entity';
import { LessonData } from '@/src/core/types/course.types';
import { createClient } from '@/src/infrastructure/supabase/server';

export class SupabaseLessonRepository implements ILessonRepository {
  async getLessonsByModuleId(moduleId: string): Promise<LessonEntity[]> {
    const supabase = createClient();

    const { data, error } = await supabase
      .from('lessons')
      .select('*')
      .eq('module_id', moduleId)
      .order('order_index', { ascending: true });

    if (error || !data) {
      return [];
    }

    return data.map(lesson => LessonEntity.fromDatabase(lesson));
  }

  async getLessonById(id: string): Promise<LessonEntity | null> {
    const supabase = createClient();

    const { data, error } = await supabase
      .from('lessons')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !data) {
      return null;
    }

    return LessonEntity.fromDatabase(data);
  }

  async createLesson(data: Omit<LessonData, 'id' | 'created_at' | 'updated_at'>): Promise<LessonEntity> {
    const supabase = createClient();

    const { data: created, error } = await supabase
      .from('lessons')
      .insert(data)
      .select()
      .single();

    if (error || !created) {
      throw new Error('Error al crear lección');
    }

    return LessonEntity.fromDatabase(created);
  }

  async updateLesson(id: string, data: Partial<LessonData>): Promise<LessonEntity> {
    const supabase = createClient();

    const { data: updated, error } = await supabase
      .from('lessons')
      .update({
        ...data,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw new Error(error.message || 'Error al actualizar lección');
    }

    if (!updated) {
      throw new Error('No se pudo actualizar la lección');
    }

    return LessonEntity.fromDatabase(updated);
  }

  async deleteLesson(id: string): Promise<void> {
    const supabase = createClient();

    const { error } = await supabase
      .from('lessons')
      .delete()
      .eq('id', id);

    if (error) {
      throw new Error('Error al eliminar lección');
    }
  }
}
