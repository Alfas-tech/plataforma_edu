/**
 * Utilidades para manejo de archivos y Storage
 */

export const STORAGE_BUCKETS = {
  COURSE_RESOURCES: "gen", // Nombre del bucket configurado en Supabase
  COURSE_IMAGES: "course-images",
  USER_AVATARS: "user-avatars",
} as const;

export const MAX_FILE_SIZES = {
  RESOURCE: 50 * 1024 * 1024, // 50 MB
  IMAGE: 5 * 1024 * 1024, // 5 MB
  AVATAR: 2 * 1024 * 1024, // 2 MB
} as const;

// SIMPLIFICADO: Solo tipos específicos permitidos
export const ALLOWED_MIME_TYPES = {
  PDF: ["application/pdf"],
  DOCUMENTS: [
    "application/msword", // .doc
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document", // .docx
  ],
  VIDEOS: ["video/mp4"], // Solo MP4
  AUDIO: ["audio/mpeg", "audio/mp3"], // Solo MP3
  IMAGES: ["image/jpeg", "image/png"], // Solo JPG y PNG
} as const;

// SIMPLIFICADO: Solo tipos específicos permitidos
export const RESOURCE_TYPE_MIME_MAP: Record<string, readonly string[]> = {
  pdf: ALLOWED_MIME_TYPES.PDF,
  document: ALLOWED_MIME_TYPES.DOCUMENTS,
  video: ALLOWED_MIME_TYPES.VIDEOS,
  audio: ALLOWED_MIME_TYPES.AUDIO,
  image: ALLOWED_MIME_TYPES.IMAGES,
  link: [], // No requiere archivo
};

// Lista plana de TODOS los tipos MIME permitidos (para validación rápida)
export const ALL_ALLOWED_MIME_TYPES = [
  ...ALLOWED_MIME_TYPES.PDF,
  ...ALLOWED_MIME_TYPES.DOCUMENTS,
  ...ALLOWED_MIME_TYPES.VIDEOS,
  ...ALLOWED_MIME_TYPES.AUDIO,
  ...ALLOWED_MIME_TYPES.IMAGES,
] as const;

/**
 * Valida si un archivo es del tipo correcto
 */
export function validateFileType(file: File, allowedTypes: readonly string[]): boolean {
  return allowedTypes.includes(file.type);
}

/**
 * Valida si un archivo no excede el tamaño máximo
 */
export function validateFileSize(file: File, maxSize: number): boolean {
  return file.size <= maxSize;
}

/**
 * Formatea bytes a tamaño legible (KB, MB, GB)
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return "0 Bytes";

  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + " " + sizes[i];
}

/**
 * Obtiene la extensión de un archivo
 */
export function getFileExtension(filename: string): string {
  return filename.slice(((filename.lastIndexOf(".") - 1) >>> 0) + 2);
}

/**
 * Sanitiza el nombre de un archivo para usarlo en rutas
 */
export function sanitizeFileName(filename: string): string {
  // Remover caracteres especiales y espacios
  const name = filename.replace(/[^a-zA-Z0-9._-]/g, "_");
  // Limitar longitud
  return name.length > 100 ? name.substring(0, 100) : name;
}

/**
 * Genera un nombre de archivo único con timestamp
 */
export function generateUniqueFileName(originalName: string): string {
  const timestamp = Date.now();
  const randomStr = Math.random().toString(36).substring(2, 8);
  const extension = getFileExtension(originalName);
  const nameWithoutExt = originalName.replace(`.${extension}`, "");
  const sanitizedName = sanitizeFileName(nameWithoutExt);

  return `${sanitizedName}_${timestamp}_${randomStr}.${extension}`;
}

/**
 * Genera la ruta completa para un archivo en el storage
 */
export function generateStoragePath(
  courseId: string,
  topicId: string,
  fileName: string
): string {
  return `courses/${courseId}/topics/${topicId}/${fileName}`;
}

/**
 * Valida un archivo completo (tipo y tamaño)
 */
export interface FileValidationResult {
  valid: boolean;
  error?: string;
}

export function validateFile(
  file: File,
  options: {
    allowedTypes?: readonly string[];
    maxSize?: number;
    resourceType?: string;
  }
): FileValidationResult {
  const { allowedTypes, maxSize, resourceType } = options;

  // Si NO hay resourceType específico, validar contra TODOS los tipos permitidos
  if (!resourceType && !allowedTypes) {
    if (!validateFileType(file, ALL_ALLOWED_MIME_TYPES)) {
      return {
        valid: false,
        error: `Tipo de archivo "${file.type}" no permitido. Solo se permiten: PDF (.pdf), Word (.doc, .docx), Imágenes (.jpg, .png), Audio (.mp3), Video (.mp4)`,
      };
    }
  }

  // Validar tipo de archivo según resourceType primero
  if (resourceType && RESOURCE_TYPE_MIME_MAP[resourceType]) {
    const allowedForType = RESOURCE_TYPE_MIME_MAP[resourceType];
    if (!validateFileType(file, allowedForType)) {
      // Crear mensaje más descriptivo
      let typeDescription = "";
      switch (resourceType) {
        case "pdf":
          typeDescription = "archivos PDF (.pdf)";
          break;
        case "video":
          typeDescription = "videos MP4 (.mp4)";
          break;
        case "image":
          typeDescription = "imágenes JPG o PNG (.jpg, .jpeg, .png)";
          break;
        case "audio":
          typeDescription = "audio MP3 (.mp3)";
          break;
        case "document":
          typeDescription = "documentos Word (.doc, .docx)";
          break;
        default:
          typeDescription = allowedForType.join(", ");
      }

      return {
        valid: false,
        error: `El tipo de archivo "${file.type || 'desconocido'}" no está permitido para recursos de tipo "${resourceType}". Solo se permiten: ${typeDescription}`,
      };
    }
  }

  // Validar tipo de archivo genérico
  if (allowedTypes && !validateFileType(file, allowedTypes)) {
    return {
      valid: false,
      error: `Tipo de archivo no permitido. Solo se permiten: ${allowedTypes.join(", ")}`,
    };
  }

  // Validar tamaño
  if (maxSize && !validateFileSize(file, maxSize)) {
    return {
      valid: false,
      error: `El archivo "${file.name}" (${formatFileSize(file.size)}) excede el tamaño máximo permitido de ${formatFileSize(maxSize)}`,
    };
  }

  return { valid: true };
}

/**
 * Determina el tipo de recurso basado en el MIME type
 * SIMPLIFICADO: Solo detecta tipos permitidos
 */
export function getResourceTypeFromMime(mimeType: string): string {
  const normalized = mimeType.toLowerCase().trim();
  
  // PDF
  if (normalized === "application/pdf") return "pdf";
  
  // Documentos Word
  if (
    normalized === "application/msword" ||
    normalized === "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
  ) {
    return "document";
  }
  
  // Videos (solo MP4)
  if (normalized === "video/mp4") return "video";
  
  // Audio (solo MP3)
  if (normalized === "audio/mpeg" || normalized === "audio/mp3") return "audio";
  
  // Imágenes (solo JPG/PNG)
  if (normalized === "image/jpeg" || normalized === "image/png") return "image";
  
  // Por defecto PDF (mostrará error si no es válido)
  return "pdf";
}

/**
 * Obtiene el icono apropiado para un tipo de archivo
 */
export function getFileIcon(resourceType: string): string {
  const icons: Record<string, string> = {
    pdf: "📄",
    video: "🎥",
    audio: "🎵",
    image: "🖼️",
    document: "📝",
    link: "🔗",
    other: "📎",
  };
  return icons[resourceType] || icons.other;
}

/**
 * Verifica si un archivo es una imagen
 */
export function isImageFile(mimeType: string): boolean {
  return (ALLOWED_MIME_TYPES.IMAGES as readonly string[]).includes(mimeType);
}

/**
 * Verifica si un archivo es un video
 */
export function isVideoFile(mimeType: string): boolean {
  return (ALLOWED_MIME_TYPES.VIDEOS as readonly string[]).includes(mimeType);
}

/**
 * Verifica si un archivo es un PDF
 */
export function isPDFFile(mimeType: string): boolean {
  return mimeType === "application/pdf";
}

/**
 * Genera un preview URL temporal para archivos (si el navegador lo soporta)
 */
export function createFilePreviewUrl(file: File): string | null {
  if (isImageFile(file.type) || isPDFFile(file.type)) {
    return URL.createObjectURL(file);
  }
  return null;
}

/**
 * Formatea bytes a tamaño legible (alias de formatFileSize para compatibilidad)
 */
export { formatFileSize as formatBytes };
