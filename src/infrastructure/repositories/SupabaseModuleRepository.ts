import { IModuleRepository } from '@/src/core/interfaces/repositories/IModuleRepository';
import { CourseModuleEntity } from '@/src/core/entities/CourseModule.entity';
import { CourseModuleData } from '@/src/core/types/course.types';
import { createClient } from '@/src/infrastructure/supabase/server';

export class SupabaseModuleRepository implements IModuleRepository {
  async getModulesByCourseId(courseId: string): Promise<CourseModuleEntity[]> {
    const supabase = createClient();

    const { data, error } = await supabase
      .from('course_modules')
      .select('*')
      .eq('course_id', courseId)
      .order('order_index', { ascending: true });

    if (error || !data) {
      return [];
    }

    return data.map(module => CourseModuleEntity.fromDatabase(module));
  }

  async getModuleById(id: string): Promise<CourseModuleEntity | null> {
    const supabase = createClient();

    const { data, error } = await supabase
      .from('course_modules')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !data) {
      return null;
    }

    return CourseModuleEntity.fromDatabase(data);
  }

  async createModule(data: Omit<CourseModuleData, 'id' | 'created_at' | 'updated_at'>): Promise<CourseModuleEntity> {
    const supabase = createClient();

    const { data: created, error } = await supabase
      .from('course_modules')
      .insert(data)
      .select()
      .single();

    if (error || !created) {
      throw new Error('Error al crear módulo');
    }

    return CourseModuleEntity.fromDatabase(created);
  }

  async updateModule(id: string, data: Partial<CourseModuleData>): Promise<CourseModuleEntity> {
    const supabase = createClient();

    const { data: updated, error } = await supabase
      .from('course_modules')
      .update({
        ...data,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw new Error(error.message || 'Error al actualizar módulo');
    }

    if (!updated) {
      throw new Error('No se pudo actualizar el módulo');
    }

    return CourseModuleEntity.fromDatabase(updated);
  }

  async deleteModule(id: string): Promise<void> {
    const supabase = createClient();

    const { error } = await supabase
      .from('course_modules')
      .delete()
      .eq('id', id);

    if (error) {
      throw new Error('Error al eliminar módulo');
    }
  }
}
