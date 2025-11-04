import { createClient } from "./server";

/**
 * Cliente de Supabase Storage para operaciones de archivos
 */

export interface UploadFileOptions {
  bucket: string;
  path: string;
  file: File;
  onProgress?: (progress: number) => void;
}

export interface UploadFileResult {
  success: boolean;
  path?: string;
  publicUrl?: string;
  error?: string;
}

export interface DeleteFileOptions {
  bucket: string;
  path: string;
}

export interface GetSignedUrlOptions {
  bucket: string;
  path: string;
  expiresIn?: number; // Segundos, por defecto 3600 (1 hora)
}

/**
 * Sube un archivo al bucket de Supabase Storage
 */
export async function uploadFile(
  options: UploadFileOptions
): Promise<UploadFileResult> {
  try {
    const supabase = createClient();
    const { bucket, path, file } = options;

    // Validar que el archivo existe
    if (!file) {
      return { success: false, error: "No se proporcionó ningún archivo" };
    }

    // Subir el archivo
    const { data, error } = await supabase.storage
      .from(bucket)
      .upload(path, file, {
        cacheControl: "3600",
        upsert: false, // No sobrescribir archivos existentes
      });

    if (error) {
      console.error("Error al subir archivo:", error);
      return { success: false, error: error.message };
    }

    // Obtener URL pública (para buckets públicos) o firmada (para privados)
    const { data: urlData } = supabase.storage
      .from(bucket)
      .getPublicUrl(data.path);

    return {
      success: true,
      path: data.path,
      publicUrl: urlData.publicUrl,
    };
  } catch (error) {
    console.error("Error inesperado al subir archivo:", error);
    return {
      success: false,
      error: "Error inesperado al subir el archivo",
    };
  }
}

/**
 * Elimina un archivo del bucket de Supabase Storage
 */
export async function deleteFile(
  options: DeleteFileOptions
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = createClient();
    const { bucket, path } = options;

    const { error } = await supabase.storage.from(bucket).remove([path]);

    if (error) {
      console.error("Error al eliminar archivo:", error);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (error) {
    console.error("Error inesperado al eliminar archivo:", error);
    return { success: false, error: "Error inesperado al eliminar el archivo" };
  }
}

/**
 * Obtiene una URL firmada temporal para acceder a un archivo privado
 */
export async function getSignedUrl(
  options: GetSignedUrlOptions
): Promise<{ success: boolean; signedUrl?: string; error?: string }> {
  try {
    const supabase = createClient();
    const { bucket, path, expiresIn = 3600 } = options;

    const { data, error } = await supabase.storage
      .from(bucket)
      .createSignedUrl(path, expiresIn);

    if (error) {
      console.error("Error al crear URL firmada:", error);
      return { success: false, error: error.message };
    }

    return {
      success: true,
      signedUrl: data.signedUrl,
    };
  } catch (error) {
    console.error("Error inesperado al crear URL firmada:", error);
    return {
      success: false,
      error: "Error inesperado al crear la URL firmada",
    };
  }
}

/**
 * Obtiene la URL pública de un archivo (solo para buckets públicos)
 */
export function getPublicUrl(bucket: string, path: string): string {
  const supabase = createClient();
  const { data } = supabase.storage.from(bucket).getPublicUrl(path);
  return data.publicUrl;
}

/**
 * Lista archivos en un directorio del bucket
 */
export async function listFiles(
  bucket: string,
  path: string = ""
): Promise<{
  success: boolean;
  files?: Array<{
    name: string;
    id: string;
    updated_at: string;
    created_at: string;
    last_accessed_at: string;
    metadata: Record<string, any>;
  }>;
  error?: string;
}> {
  try {
    const supabase = createClient();

    const { data, error } = await supabase.storage.from(bucket).list(path, {
      limit: 100,
      offset: 0,
      sortBy: { column: "created_at", order: "desc" },
    });

    if (error) {
      console.error("Error al listar archivos:", error);
      return { success: false, error: error.message };
    }

    return { success: true, files: data };
  } catch (error) {
    console.error("Error inesperado al listar archivos:", error);
    return { success: false, error: "Error inesperado al listar archivos" };
  }
}

/**
 * Mueve o renombra un archivo dentro del mismo bucket
 */
export async function moveFile(
  bucket: string,
  fromPath: string,
  toPath: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = createClient();

    const { error } = await supabase.storage
      .from(bucket)
      .move(fromPath, toPath);

    if (error) {
      console.error("Error al mover archivo:", error);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (error) {
    console.error("Error inesperado al mover archivo:", error);
    return { success: false, error: "Error inesperado al mover el archivo" };
  }
}

/**
 * Copia un archivo dentro del mismo bucket
 */
export async function copyFile(
  bucket: string,
  fromPath: string,
  toPath: string
): Promise<{ success: boolean; path?: string; error?: string }> {
  try {
    const supabase = createClient();

    const { data, error } = await supabase.storage
      .from(bucket)
      .copy(fromPath, toPath);

    if (error) {
      console.error("Error al copiar archivo:", error);
      return { success: false, error: error.message };
    }

    return { success: true, path: data.path };
  } catch (error) {
    console.error("Error inesperado al copiar archivo:", error);
    return { success: false, error: "Error inesperado al copiar el archivo" };
  }
}
