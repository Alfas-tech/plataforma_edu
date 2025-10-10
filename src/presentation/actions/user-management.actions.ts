'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/src/infrastructure/supabase/server';
import { getCurrentProfile } from './profile.actions';

export async function createUser(formData: {
  email: string;
  password: string;
  fullName: string;
  role: 'student' | 'teacher' | 'admin';
}) {
  try {
    // Verify current user is admin
    const profileResult = await getCurrentProfile();
    if ('error' in profileResult) {
      return { error: 'No autenticado' };
    }

    if (!profileResult.profile.isAdmin) {
      return { error: 'Solo administradores pueden crear usuarios' };
    }

    const supabase = createClient();

    // Create user using signUp
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: formData.email,
      password: formData.password,
      options: {
        data: {
          full_name: formData.fullName,
          role: formData.role,
        },
        emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/confirm`,
      },
    });

    if (authError) {
      return { error: authError.message };
    }

    if (!authData.user) {
      return { error: 'Error al crear usuario' };
    }

    // Update role in profiles table
    const { error: updateError } = await supabase
      .from('profiles')
      .update({ role: formData.role })
      .eq('id', authData.user.id);

    if (updateError) {
      console.error('Error updating role:', updateError);
    }

    revalidatePath('/dashboard/admin/users');
    return { success: true };
  } catch (error) {
    return { error: error instanceof Error ? error.message : 'Error al crear usuario' };
  }
}

export async function deleteUser(userId: string) {
  try {
    // Verify current user is admin
    const profileResult = await getCurrentProfile();
    if ('error' in profileResult) {
      return { error: 'No autenticado' };
    }

    if (!profileResult.profile.isAdmin) {
      return { error: 'Solo administradores pueden eliminar usuarios' };
    }

    // Prevent self-deletion
    if (profileResult.profile.id === userId) {
      return { error: 'No puedes eliminar tu propia cuenta' };
    }

    const supabase = createClient();

    // Get user profile
    const { data: targetProfile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', userId)
      .single();

    if (targetProfile?.role === 'admin') {
      // Check if it's the last admin
      const { count } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .eq('role', 'admin');

      if (count && count <= 1) {
        return { error: 'No se puede eliminar al último administrador' };
      }
    }

    // Delete user profile (auth.users will cascade delete via trigger)
    const { error } = await supabase
      .from('profiles')
      .delete()
      .eq('id', userId);

    if (error) {
      return { error: error.message };
    }

    revalidatePath('/dashboard/admin/users');
    return { success: true };
  } catch (error) {
    return { error: error instanceof Error ? error.message : 'Error al eliminar usuario' };
  }
}

export async function sendPasswordResetEmail(userId: string) {
  try {
    // Verify current user is admin
    const profileResult = await getCurrentProfile();
    if ('error' in profileResult) {
      return { error: 'No autenticado' };
    }

    if (!profileResult.profile.isAdmin) {
      return { error: 'Solo administradores pueden enviar emails' };
    }

    const supabase = createClient();

    // Get user email
    const { data: profile } = await supabase
      .from('profiles')
      .select('email')
      .eq('id', userId)
      .single();

    if (!profile?.email) {
      return { error: 'Usuario no encontrado' };
    }

    // Send password reset email
    const { error } = await supabase.auth.resetPasswordForEmail(profile.email, {
      redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/update-password`,
    });

    if (error) {
      return { error: error.message };
    }

    return { success: true, message: 'Email de restablecimiento enviado' };
  } catch (error) {
    return { error: error instanceof Error ? error.message : 'Error al enviar email' };
  }
}
