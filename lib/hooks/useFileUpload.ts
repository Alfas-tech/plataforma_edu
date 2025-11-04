"use client";

import { useState, useCallback } from "react";
import { uploadResourceFile } from "@/src/presentation/actions/storage.actions";

export interface UploadProgress {
  loaded: number;
  total: number;
  percentage: number;
}

export interface UploadState {
  isUploading: boolean;
  progress: UploadProgress | null;
  error: string | null;
  uploadedFile: {
    path: string;
    url: string;
    fileName: string;
    fileSize: number;
    mimeType: string;
  } | null;
}

export function useFileUpload() {
  const [uploadState, setUploadState] = useState<UploadState>({
    isUploading: false,
    progress: null,
    error: null,
    uploadedFile: null,
  });

  const uploadFile = useCallback(
    async (
      file: File,
      courseId: string,
      topicId: string,
      resourceType: string
    ) => {
      console.log("📤 [useFileUpload] Iniciando subida:", {
        fileName: file.name,
        fileSize: file.size,
        fileType: file.type,
        courseId,
        topicId,
        resourceType,
      });

      setUploadState({
        isUploading: true,
        progress: { loaded: 0, total: file.size, percentage: 0 },
        error: null,
        uploadedFile: null,
      });

      try {
        const formData = new FormData();
        formData.append("file", file);
        formData.append("courseId", courseId);
        formData.append("topicId", topicId);
        formData.append("resourceType", resourceType);

        console.log("📤 [useFileUpload] FormData creado, llamando a uploadResourceFile...");

        // Simular progreso (Supabase JS no soporta nativamente progress tracking)
        // Para un progress tracking real, necesitarías usar XMLHttpRequest o fetch con ReadableStream
        const progressInterval = setInterval(() => {
          setUploadState((prev) => {
            if (!prev.progress) return prev;
            const newPercentage = Math.min(prev.progress.percentage + 10, 90);
            return {
              ...prev,
              progress: {
                ...prev.progress,
                percentage: newPercentage,
              },
            };
          });
        }, 200);

        const result = await uploadResourceFile(formData);

        clearInterval(progressInterval);

        console.log("📤 [useFileUpload] Resultado de uploadResourceFile:", result);

        if (!result.success) {
          const error = "error" in result ? result.error : "Error al subir el archivo";
          console.error("❌ [useFileUpload] Error en la subida:", error);
          setUploadState({
            isUploading: false,
            progress: null,
            error: error || "Error al subir el archivo",
            uploadedFile: null,
          });
          return { success: false, error };
        }

        const uploadData = "data" in result ? result.data : null;
        console.log("✅ [useFileUpload] Archivo subido exitosamente:", uploadData);

        setUploadState({
          isUploading: false,
          progress: { loaded: file.size, total: file.size, percentage: 100 },
          error: null,
          uploadedFile: uploadData
            ? {
                path: uploadData.path || "",
                url: uploadData.url || "",
                fileName: uploadData.fileName,
                fileSize: uploadData.fileSize,
                mimeType: uploadData.mimeType,
              }
            : null,
        });

        return { success: true, data: uploadData };
      } catch (error) {
        console.error("❌ [useFileUpload] Error inesperado:", error);
        setUploadState({
          isUploading: false,
          progress: null,
          error: "Error inesperado al subir el archivo",
          uploadedFile: null,
        });
        return {
          success: false,
          error: "Error inesperado al subir el archivo",
        };
      }
    },
    []
  );

  const reset = useCallback(() => {
    setUploadState({
      isUploading: false,
      progress: null,
      error: null,
      uploadedFile: null,
    });
  }, []);

  return {
    ...uploadState,
    uploadFile,
    reset,
  };
}
