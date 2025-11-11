"use client";

import React, { useCallback, useRef, useState } from "react";
import { Upload, X, File, CheckCircle2, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  formatFileSize,
  validateFile,
  MAX_FILE_SIZES,
  RESOURCE_TYPE_MIME_MAP,
  VIDEO_CONSTRAINTS,
} from "@/lib/storage.utils";
import { getMediaDuration } from "@/lib/media.utils";
import { Button } from "./button";

export interface FileUploadProps {
  onFileSelect: (file: File) => void;
  onFileRemove?: () => void;
  accept?: string;
  maxSize?: number;
  resourceType?: string;
  disabled?: boolean;
  selectedFile?: File | null;
  uploadProgress?: number;
  uploadError?: string | null;
  uploadSuccess?: boolean;
  className?: string;
}

export function FileUpload({
  onFileSelect,
  onFileRemove,
  accept,
  maxSize = MAX_FILE_SIZES.RESOURCE,
  resourceType,
  disabled = false,
  selectedFile,
  uploadProgress,
  uploadError,
  uploadSuccess,
  className,
}: FileUploadProps) {
  const [dragActive, setDragActive] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [isCheckingMedia, setIsCheckingMedia] = useState(false);
  const [checkingMediaType, setCheckingMediaType] = useState<"video" | "audio" | null>(null);
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const validationRunRef = useRef(0);

  const formatDuration = useCallback((seconds: number) => {
    const rounded = Math.round(seconds);
    const minutes = Math.floor(rounded / 60);
    const remainingSeconds = Math.max(0, rounded - minutes * 60);
    return `${minutes}:${remainingSeconds.toString().padStart(2, "0")} min`;
  }, []);

  const handleDrag = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      if (!disabled && !isCheckingMedia) {
        if (e.type === "dragenter" || e.type === "dragover") {
          setDragActive(true);
        } else if (e.type === "dragleave") {
          setDragActive(false);
        }
      }
    },
    [disabled, isCheckingMedia]
  );

  const handleFile = useCallback(
    async (file: File) => {
      setValidationError(null);
  setIsCheckingMedia(false);
  setCheckingMediaType(null);
      const currentValidationId = validationRunRef.current + 1;
      validationRunRef.current = currentValidationId;

      const validation = validateFile(file, {
        maxSize,
        resourceType,
        allowedTypes: resourceType
          ? RESOURCE_TYPE_MIME_MAP[resourceType]
          : undefined,
      });

      if (!validation.valid) {
        setValidationError(validation.error || "Archivo no válido");
        return;
      }

      const shouldCheckDuration =
        file.type && (file.type.startsWith("video/") || file.type.startsWith("audio/"));

      if (shouldCheckDuration) {
        const mediaType = file.type.startsWith("video/") ? "video" : "audio";
        setIsCheckingMedia(true);
        setCheckingMediaType(mediaType);
        try {
          const duration = await getMediaDuration(file);
          if (currentValidationId !== validationRunRef.current) {
            return;
          }

          if (!Number.isFinite(duration)) {
            setValidationError(
              `No se pudo determinar la duración del ${mediaType}. Intenta con otro archivo.`
            );
            return;
          }

          if (duration > VIDEO_CONSTRAINTS.MAX_DURATION_SECONDS) {
            setValidationError(
              `El ${mediaType} dura ${formatDuration(
                duration
              )}. El máximo permitido es ${formatDuration(
                VIDEO_CONSTRAINTS.MAX_DURATION_SECONDS
              )}.`
            );
            return;
          }
        } catch (error) {
          if (currentValidationId === validationRunRef.current) {
            setValidationError(
              `No se pudo validar la duración del ${mediaType}. Intenta nuevamente.`
            );
          }
          return;
        } finally {
          if (currentValidationId === validationRunRef.current) {
            setIsCheckingMedia(false);
            setCheckingMediaType(null);
          }
        }
      }

      if (currentValidationId !== validationRunRef.current) {
        return;
      }

      onFileSelect(file);
    },
    [formatDuration, maxSize, onFileSelect, resourceType]
  );

  const handleDrop = useCallback(
    async (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setDragActive(false);

  if (disabled || isCheckingMedia) return;

      const files = e.dataTransfer.files;
      if (files && files.length > 0) {
        await handleFile(files[0]);
      }
    },
    [disabled, isCheckingMedia, handleFile]
  );

  const handleChange = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      e.preventDefault();
  if (disabled || isCheckingMedia) return;

      const files = e.target.files;
      if (files && files.length > 0) {
        await handleFile(files[0]);
      }
    },
    [disabled, isCheckingMedia, handleFile]
  );

  const handleButtonClick = () => {
    fileInputRef.current?.click();
  };

  const handleRemove = () => {
    setValidationError(null);
    setIsCheckingMedia(false);
    setCheckingMediaType(null);
    validationRunRef.current += 1;
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
    onFileRemove?.();
  };

  const errorMessage = validationError || uploadError;
  const isDisabled = disabled || isCheckingMedia;

  return (
    <div className={cn("w-full", className)}>
      {!selectedFile ? (
        <div
          className={cn(
            "relative flex flex-col items-center justify-center rounded-lg border-2 border-dashed p-8 transition-colors",
            dragActive
              ? "border-purple-500 bg-purple-50"
              : "border-slate-300 bg-slate-50 hover:border-purple-400 hover:bg-purple-50/50",
            isDisabled && "cursor-not-allowed opacity-50",
            errorMessage && "border-red-300 bg-red-50"
          )}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
        >
          <input
            ref={fileInputRef}
            type="file"
            className="hidden"
            onChange={handleChange}
            accept={accept}
            disabled={isDisabled}
          />

          <Upload
            className={cn(
              "mb-4 h-12 w-12",
              errorMessage ? "text-red-400" : "text-slate-400"
            )}
          />

          <p className="mb-2 text-center text-sm font-medium text-slate-700">
            {dragActive
              ? "Suelta el archivo aquí"
              : "Arrastra un archivo aquí o haz clic para seleccionar"}
          </p>

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleButtonClick}
            disabled={isDisabled}
            className="mb-3"
          >
            Seleccionar archivo
          </Button>

          <div className="text-center text-xs text-slate-500">
            <span className="block">Tamaño máximo: {formatFileSize(maxSize)}</span>
            {resourceType && (
              <span className="mt-1 block">
                Tipo seleccionado: {resourceType.toUpperCase()}
              </span>
            )}
            <span className="mt-1 block">
              Tipos permitidos: PDF, DOC, DOCX, TXT, JPG, PNG, MP3, MP4
            </span>
            <span className="mt-1 block font-semibold text-purple-600">
              Videos y audios: máximo 5 minutos y 50 MB
            </span>
            {isCheckingMedia && checkingMediaType && (
              <span className="mt-2 block text-purple-500">
                {checkingMediaType === "audio"
                  ? "Validando duración del audio…"
                  : "Validando duración del video…"}
              </span>
            )}
          </div>

          {errorMessage && (
            <div className="mt-3 flex items-center gap-2 rounded-md bg-red-100 px-3 py-2 text-sm text-red-700">
              <AlertCircle className="h-4 w-4 flex-shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}
        </div>
      ) : (
        <div
          className={cn(
            "rounded-lg border-2 p-4",
            uploadSuccess
              ? "border-green-300 bg-green-50"
              : uploadError
                ? "border-red-300 bg-red-50"
                : "border-slate-300 bg-white"
          )}
        >
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0 text-2xl">
              {uploadSuccess ? (
                <CheckCircle2 className="h-8 w-8 text-green-600" />
              ) : uploadError ? (
                <AlertCircle className="h-8 w-8 text-red-600" />
              ) : (
                <File className="h-8 w-8 text-purple-600" />
              )}
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <p
                    className="break-words text-sm font-medium text-slate-900"
                    title={selectedFile.name}
                  >
                    {selectedFile.name}
                  </p>
                  <p className="text-xs text-slate-500">
                    {formatFileSize(selectedFile.size)}
                  </p>
                    {isCheckingMedia && checkingMediaType && (
                    <p className="mt-1 text-xs text-purple-600">
                        {checkingMediaType === "audio"
                          ? "Validando duración del audio…"
                          : "Validando duración del video…"}
                    </p>
                  )}
                </div>

                {!isDisabled && !uploadSuccess && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={handleRemove}
                    className="flex-shrink-0 h-8 w-8 p-0"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>

              {typeof uploadProgress === "number" && uploadProgress < 100 && (
                <div className="mt-2">
                  <div className="h-2 w-full overflow-hidden rounded-full bg-slate-200">
                    <div
                      className="h-full bg-purple-600 transition-all duration-300"
                      style={{ width: `${uploadProgress}%` }}
                    />
                  </div>
                  <p className="mt-1 text-xs text-slate-500">
                    Subiendo... {uploadProgress}%
                  </p>
                </div>
              )}

              {uploadSuccess && (
                <p className="mt-2 text-xs font-medium text-green-600">
                  ✓ Archivo subido correctamente
                </p>
              )}

              {uploadError && (
                <p className="mt-2 text-xs text-red-600">{uploadError}</p>
              )}
              {errorMessage && !uploadError && (
                <p className="mt-2 text-xs text-red-600">{errorMessage}</p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
