"use client";

import React, { useCallback, useState } from "react";
import { Upload, X, File, CheckCircle2, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  formatFileSize,
  getFileIcon,
  validateFile,
  MAX_FILE_SIZES,
  RESOURCE_TYPE_MIME_MAP,
} from "@/lib/storage.utils";
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
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const handleDrag = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      if (!disabled) {
        if (e.type === "dragenter" || e.type === "dragover") {
          setDragActive(true);
        } else if (e.type === "dragleave") {
          setDragActive(false);
        }
      }
    },
    [disabled]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setDragActive(false);

      if (disabled) return;

      const files = e.dataTransfer.files;
      if (files && files.length > 0) {
        handleFile(files[0]);
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [disabled]
  );

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      e.preventDefault();
      if (disabled) return;

      const files = e.target.files;
      if (files && files.length > 0) {
        handleFile(files[0]);
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [disabled]
  );

  const handleFile = useCallback(
    (file: File) => {
      setValidationError(null);

      // Validar archivo
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

      onFileSelect(file);
    },
    [maxSize, resourceType, onFileSelect]
  );

  const handleButtonClick = () => {
    fileInputRef.current?.click();
  };

  const handleRemove = () => {
    setValidationError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
    onFileRemove?.();
  };

  const errorMessage = validationError || uploadError;

  return (
    <div className={cn("w-full", className)}>
      {!selectedFile ? (
        <div
          className={cn(
            "relative flex flex-col items-center justify-center rounded-lg border-2 border-dashed p-8 transition-colors",
            dragActive
              ? "border-purple-500 bg-purple-50"
              : "border-slate-300 bg-slate-50 hover:border-purple-400 hover:bg-purple-50/50",
            disabled && "cursor-not-allowed opacity-50",
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
            disabled={disabled}
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
            disabled={disabled}
            className="mb-3"
          >
            Seleccionar archivo
          </Button>

          <p className="text-center text-xs text-slate-500">
            {resourceType && (
              <span className="block">
                Tipo: <span className="font-medium">{resourceType}</span>
              </span>
            )}
            <span className="block">
              Tamaño máximo: {formatFileSize(maxSize)}
            </span>
          </p>

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
                </div>

                {!disabled && !uploadSuccess && (
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
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
