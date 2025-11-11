"use server";

import { revalidatePath } from "next/cache";
import {
  STORAGE_BUCKETS,
  generateUniqueFileName,
  generateStoragePath,
  validateFile,
  MAX_FILE_SIZES,
  prettifyFileName,
} from "@/lib/storage.utils";
import { createClient } from "@/src/infrastructure/supabase/server";

/**
 * Sube un archivo de recurso al storage
 */
export async function uploadResourceFile(formData: FormData) {
  console.log("🔧 [uploadResourceFile] Iniciando en servidor...");
  
  try {
    const file = formData.get("file") as File;
    const courseId = formData.get("courseId") as string;
    const topicId = formData.get("topicId") as string;
    const resourceType = formData.get("resourceType") as string;

    console.log("🔧 [uploadResourceFile] Datos recibidos:", {
      hasFile: !!file,
      fileName: file?.name,
      fileSize: file?.size,
      fileType: file?.type,
      courseId,
      topicId,
      resourceType,
    });

    if (!file) {
      console.error("❌ [uploadResourceFile] No se proporcionó archivo");
      return { success: false, error: "No se proporcionó ningún archivo" };
    }

    if (!courseId || !topicId) {
      console.error("❌ [uploadResourceFile] Faltan courseId o topicId");
      return {
        success: false,
        error: "Se requieren courseId y topicId",
      };
    }

    // Validar archivo
    console.log("🔧 [uploadResourceFile] Validando archivo...");
    const validation = validateFile(file, {
      maxSize: MAX_FILE_SIZES.RESOURCE,
      resourceType,
    });

    if (!validation.valid) {
      console.error("❌ [uploadResourceFile] Validación fallida:", validation.error);
      return { success: false, error: validation.error };
    }

    console.log("✅ [uploadResourceFile] Validación exitosa");

    // Generar nombre único y ruta
    const uniqueFileName = generateUniqueFileName(file.name);
    const storagePath = generateStoragePath(courseId, topicId, uniqueFileName);

    console.log("🔧 [uploadResourceFile] Ruta de storage:", {
      uniqueFileName,
      storagePath,
      bucket: STORAGE_BUCKETS.COURSE_RESOURCES,
    });

    // Obtener el cliente de Supabase
    const supabase = createClient();

    // Verificar autenticación
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    console.log("🔧 [uploadResourceFile] Usuario autenticado:", {
      userId: user?.id,
      email: user?.email,
      hasAuthError: !!authError,
    });

    if (authError || !user) {
      console.error("❌ [uploadResourceFile] Error de autenticación:", authError);
      return { success: false, error: "Usuario no autenticado" };
    }

    // Convertir File a ArrayBuffer
    console.log("🔧 [uploadResourceFile] Convirtiendo archivo a ArrayBuffer...");
    const arrayBuffer = await file.arrayBuffer();
    const fileBuffer = new Uint8Array(arrayBuffer);
    console.log("✅ [uploadResourceFile] ArrayBuffer creado, tamaño:", fileBuffer.length);

    // Subir archivo a Supabase Storage
    console.log("🔧 [uploadResourceFile] Subiendo a Supabase Storage...");
    const { data, error } = await supabase.storage
      .from(STORAGE_BUCKETS.COURSE_RESOURCES)
      .upload(storagePath, fileBuffer, {
        contentType: file.type,
        cacheControl: "3600",
        upsert: false,
      });

    if (error) {
      console.error("❌ [uploadResourceFile] Error de Supabase Storage:", {
        message: error.message,
        name: error.name,
        cause: error.cause,
      });
      return { success: false, error: error.message };
    }

    console.log("✅ [uploadResourceFile] Archivo subido exitosamente:", data);

    // Obtener URL pública
    const { data: urlData } = supabase.storage
      .from(STORAGE_BUCKETS.COURSE_RESOURCES)
      .getPublicUrl(data.path);

    console.log("✅ [uploadResourceFile] URL pública generada:", urlData.publicUrl);

    // Revalidar la página de recursos
    revalidatePath(
      `/dashboard/admin/courses/${courseId}/topics/${topicId}/resources`
    );

    const result = {
      success: true,
      data: {
        path: data.path,
        url: urlData.publicUrl,
  fileName: prettifyFileName(file.name) ?? file.name,
        fileSize: file.size,
        mimeType: file.type,
      },
    };

    console.log("✅ [uploadResourceFile] Resultado final:", result);

    return result;
  } catch (error) {
    console.error("❌ [uploadResourceFile] Error inesperado:", error);
    return {
      success: false,
      error: "Error inesperado al subir el archivo",
    };
  }
}

/**
 * Elimina un archivo de recurso del storage
 */
export async function deleteResourceFile(filePath: string, courseId: string) {
  try {
    if (!filePath) {
      return { success: false, error: "No se proporcionó la ruta del archivo" };
    }

    const supabase = createClient();

    const { error } = await supabase.storage
      .from(STORAGE_BUCKETS.COURSE_RESOURCES)
      .remove([filePath]);

    if (error) {
      console.error("Error al eliminar archivo de Supabase:", error);
      return { success: false, error: error.message };
    }

    // Revalidar las páginas relacionadas
    revalidatePath(`/dashboard/admin/courses/${courseId}`);

    return { success: true };
  } catch (error) {
    console.error("Error en deleteResourceFile:", error);
    return {
      success: false,
      error: "Error inesperado al eliminar el archivo",
    };
  }
}

/**
 * Obtiene una URL firmada temporal para acceder a un recurso privado
 */
export async function getResourceSignedUrl(
  filePath: string,
  expiresIn: number = 3600
) {
  try {
    if (!filePath) {
      return { success: false, error: "No se proporcionó la ruta del archivo" };
    }

    const supabase = createClient();

    const { data, error } = await supabase.storage
      .from(STORAGE_BUCKETS.COURSE_RESOURCES)
      .createSignedUrl(filePath, expiresIn);

    if (error) {
      console.error("Error al generar URL firmada:", error);
      return { success: false, error: error.message };
    }

    return {
      success: true,
      signedUrl: data.signedUrl,
    };
  } catch (error) {
    console.error("Error en getResourceSignedUrl:", error);
    return {
      success: false,
      error: "Error inesperado al generar URL firmada",
    };
  }
}

/**
 * Sube una imagen de portada de curso
 */
export async function uploadCourseImage(formData: FormData) {
  try {
    const file = formData.get("file") as File;
    const courseId = formData.get("courseId") as string;

    if (!file) {
      return { success: false, error: "No se proporcionó ningún archivo" };
    }

    if (!courseId) {
      return { success: false, error: "Se requiere courseId" };
    }

    // Validar que sea una imagen
    const validation = validateFile(file, {
      maxSize: MAX_FILE_SIZES.IMAGE,
      resourceType: "image",
    });

    if (!validation.valid) {
      return { success: false, error: validation.error };
    }

    // Generar nombre único y ruta
    const uniqueFileName = generateUniqueFileName(file.name);
    const storagePath = `courses/${courseId}/${uniqueFileName}`;

    // Obtener el cliente de Supabase
    const supabase = createClient();

    // Convertir File a ArrayBuffer
    const arrayBuffer = await file.arrayBuffer();
    const fileBuffer = new Uint8Array(arrayBuffer);

    // Subir archivo
    const { data, error } = await supabase.storage
      .from(STORAGE_BUCKETS.COURSE_IMAGES)
      .upload(storagePath, fileBuffer, {
        contentType: file.type,
        cacheControl: "3600",
        upsert: false,
      });

    if (error) {
      console.error("Error al subir imagen a Supabase:", error);
      return { success: false, error: error.message };
    }

    // Obtener URL pública
    const { data: urlData } = supabase.storage
      .from(STORAGE_BUCKETS.COURSE_IMAGES)
      .getPublicUrl(data.path);

    // Revalidar la página del curso
    revalidatePath(`/dashboard/admin/courses/${courseId}`);

    return {
      success: true,
      data: {
        path: data.path,
        url: urlData.publicUrl,
      },
    };
  } catch (error) {
    console.error("Error en uploadCourseImage:", error);
    return {
      success: false,
      error: "Error inesperado al subir la imagen",
    };
  }
}

/**
 * Sube un avatar de usuario
 */
export async function uploadUserAvatar(formData: FormData) {
  try {
    const file = formData.get("file") as File;
    const supabase = createClient();

    // Obtener usuario actual
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return { success: false, error: "Usuario no autenticado" };
    }

    if (!file) {
      return { success: false, error: "No se proporcionó ningún archivo" };
    }

    // Validar que sea una imagen
    const validation = validateFile(file, {
      maxSize: MAX_FILE_SIZES.AVATAR,
      resourceType: "image",
    });

    if (!validation.valid) {
      return { success: false, error: validation.error };
    }

    // Generar nombre único y ruta (dentro de la carpeta del usuario)
    const uniqueFileName = generateUniqueFileName(file.name);
    const storagePath = `${user.id}/${uniqueFileName}`;

    // Convertir File a ArrayBuffer
    const arrayBuffer = await file.arrayBuffer();
    const fileBuffer = new Uint8Array(arrayBuffer);

    // Subir archivo
    const { data, error } = await supabase.storage
      .from(STORAGE_BUCKETS.USER_AVATARS)
      .upload(storagePath, fileBuffer, {
        contentType: file.type,
        cacheControl: "3600",
        upsert: false,
      });

    if (error) {
      console.error("Error al subir avatar a Supabase:", error);
      return { success: false, error: error.message };
    }

    // Obtener URL pública
    const { data: urlData } = supabase.storage
      .from(STORAGE_BUCKETS.USER_AVATARS)
      .getPublicUrl(data.path);

    // Actualizar el perfil del usuario con la nueva URL del avatar
    const { error: updateError } = await supabase
      .from("profiles")
      .update({ avatar_url: urlData.publicUrl })
      .eq("id", user.id);

    if (updateError) {
      console.error("Error al actualizar perfil:", updateError);
      // No fallar completamente, el archivo ya se subió
    }

    // Revalidar las páginas del usuario
    revalidatePath("/dashboard");

    return {
      success: true,
      data: {
        path: data.path,
        url: urlData.publicUrl,
      },
    };
  } catch (error) {
    console.error("Error en uploadUserAvatar:", error);
    return {
      success: false,
      error: "Error inesperado al subir el avatar",
    };
  }
}

/**
 * Obtiene metadatos de un archivo del storage
 */
export async function getFileMetadata(bucket: string, path: string) {
  try {
    const supabase = createClient();

    const { data, error } = await supabase.storage
      .from(bucket)
      .list(path.split("/").slice(0, -1).join("/"), {
        limit: 1,
        search: path.split("/").pop(),
      });

    if (error) {
      return { success: false, error: error.message };
    }

    if (!data || data.length === 0) {
      return { success: false, error: "Archivo no encontrado" };
    }

    return {
      success: true,
      metadata: data[0],
    };
  } catch (error) {
    console.error("Error en getFileMetadata:", error);
    return {
      success: false,
      error: "Error inesperado al obtener metadatos",
    };
  }
}
