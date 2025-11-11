/**
 * Utilities for file handling and Supabase storage integration.
 */

export const STORAGE_BUCKETS = {
  COURSE_RESOURCES: "gen", // Supabase bucket configured for course resources
  COURSE_IMAGES: "course-images",
  USER_AVATARS: "user-avatars",
} as const;

export const MAX_FILE_SIZES = {
  RESOURCE: 50 * 1024 * 1024, // 50 MB
  IMAGE: 5 * 1024 * 1024, // 5 MB
  AVATAR: 2 * 1024 * 1024, // 2 MB
} as const;
// Restricted list of supported mime-types
export const ALLOWED_MIME_TYPES = {
  PDF: ["application/pdf"],
  DOCUMENTS: [
    "application/msword", // .doc
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document", // .docx
  ],
  VIDEOS: ["video/mp4"], // Only MP4
  AUDIO: ["audio/mpeg", "audio/mp3"], // Only MP3
  IMAGES: ["image/jpeg", "image/png"], // Only JPG and PNG
} as const;

// Map allowed mime-types per resource type
export const RESOURCE_TYPE_MIME_MAP: Record<string, readonly string[]> = {
  pdf: ALLOWED_MIME_TYPES.PDF,
  document: ALLOWED_MIME_TYPES.DOCUMENTS,
  video: ALLOWED_MIME_TYPES.VIDEOS,
  audio: ALLOWED_MIME_TYPES.AUDIO,
  image: ALLOWED_MIME_TYPES.IMAGES,
  link: [], // No file required
};

// Flattened list of every supported mime-type (useful for validation)
export const ALL_ALLOWED_MIME_TYPES = [
  ...ALLOWED_MIME_TYPES.PDF,
  ...ALLOWED_MIME_TYPES.DOCUMENTS,
  ...ALLOWED_MIME_TYPES.VIDEOS,
  ...ALLOWED_MIME_TYPES.AUDIO,
  ...ALLOWED_MIME_TYPES.IMAGES,
] as const;

/**
 * Check if a file matches one of the allowed mime-types.
 */
export function validateFileType(file: File, allowedTypes: readonly string[]): boolean {
  return allowedTypes.includes(file.type);
}

/**
 * Check if a file is within the configured size limit.
 */
export function validateFileSize(file: File, maxSize: number): boolean {
  return file.size <= maxSize;
}

/**
 * Format raw bytes into a human readable string (KB, MB, GB).
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return "0 Bytes";

  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + " " + sizes[i];
}

/**
 * Extract the extension from a filename.
 */
export function getFileExtension(filename: string): string {
  return filename.slice(((filename.lastIndexOf(".") - 1) >>> 0) + 2);
}

/**
 * Produce a storage-safe filename using ASCII characters only.
 */
export function sanitizeFileName(filename: string): string {
  const normalized = filename.normalize("NFD");
  const noMarks = normalized.replace(/[\u0300-\u036f]/g, "");
  const collapsedWhitespace = noMarks.replace(/\s+/g, "_");
  const safeCharacters = collapsedWhitespace.replace(/[^a-zA-Z0-9._-]/g, "_");
  const compactUnderscores = safeCharacters.replace(/_+/g, "_");
  const trimmed = compactUnderscores.replace(/^_+|_+$/g, "");
  return trimmed.length > 100 ? trimmed.substring(0, 100) : trimmed;
}

export function prettifyFileName(name?: string | null): string | null {
  if (!name) {
    return null;
  }

  const trimmed = `${name}`.trim();
  if (!trimmed) {
    return null;
  }

  let decoded = trimmed;

  try {
    decoded = decodeURIComponent(trimmed);
  } catch (error) {
    // ignore decode errors and fallback to original value
  }

  if (typeof decoded.normalize === "function") {
    decoded = decoded.normalize("NFC");
  }

  return decoded;
}

/**
 * Generate a unique filename using a timestamp suffix.
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
 * Generate the full storage path for a course resource file.
 */
export function generateStoragePath(
  courseId: string,
  topicId: string,
  fileName: string
): string {
  return `courses/${courseId}/topics/${topicId}/${fileName}`;
}

/**
 * Validate a file according to size and resource-type constraints.
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

  // If no resourceType is provided, validate against every allowed mime-type
  if (!resourceType && !allowedTypes) {
    if (!validateFileType(file, ALL_ALLOWED_MIME_TYPES)) {
      return {
        valid: false,
        error: `Tipo de archivo "${file.type}" no permitido. Solo se permiten: PDF (.pdf), Word (.doc, .docx), Imágenes (.jpg, .png), Audio (.mp3), Video (.mp4)`,
      };
    }
  }

  // Prefer the specific rules that match the selected resource type
  if (resourceType && RESOURCE_TYPE_MIME_MAP[resourceType]) {
    const allowedForType = RESOURCE_TYPE_MIME_MAP[resourceType];
    if (!validateFileType(file, allowedForType)) {
      // Provide a more descriptive hint for the user
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

  // Apply generic allowedTypes fallback when provided
  if (allowedTypes && !validateFileType(file, allowedTypes)) {
    return {
      valid: false,
      error: `Tipo de archivo no permitido. Solo se permiten: ${allowedTypes.join(", ")}`,
    };
  }

  // Validate the maximum size constraint
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
  
  // Word documents
  if (
    normalized === "application/msword" ||
    normalized === "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
  ) {
    return "document";
  }
  
  // Videos (MP4 only)
  if (normalized === "video/mp4") return "video";
  
  // Audio (MP3 only)
  if (normalized === "audio/mpeg" || normalized === "audio/mp3") return "audio";
  
  // Images (JPG/PNG)
  if (normalized === "image/jpeg" || normalized === "image/png") return "image";
  
  // Default to PDF so the caller can display a validation error
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
