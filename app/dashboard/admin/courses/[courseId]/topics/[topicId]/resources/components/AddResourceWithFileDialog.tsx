"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select } from "@/components/ui/select";
import { FileUpload } from "@/components/ui/file-upload";
import { useFileUpload } from "@/lib/hooks/useFileUpload";
import { MAX_FILE_SIZES } from "@/lib/storage.utils";
import type { ResourceType } from "@/src/core/types/course.types";

interface AddResourceWithFileDialogProps {
  isOpen: boolean;
  onClose: () => void;
  courseId: string;
  topicId: string;
  onSuccess: () => void;
}

export function AddResourceWithFileDialog({
  isOpen,
  onClose,
  courseId,
  topicId,
  onSuccess,
}: AddResourceWithFileDialogProps) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [resourceType, setResourceType] = useState<ResourceType>("pdf");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const { isUploading, progress, error, uploadedFile, uploadFile, reset } =
    useFileUpload();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!title.trim()) {
      alert("El título es requerido");
      return;
    }

    if (!selectedFile) {
      alert("Selecciona un archivo");
      return;
    }

    // 1. Subir archivo al storage
    const uploadResult = await uploadFile(
      selectedFile,
      courseId,
      topicId,
      resourceType
    );

    if (!uploadResult.success) {
      return; // Error ya está en el estado del hook
    }

    // 2. Guardar recurso en la BD con la información del archivo
    // await addResource({
    //   topicId,
    //   title,
    //   description,
    //   resourceType,
    //   fileUrl: uploadResult.data!.path,
    //   fileName: uploadResult.data!.fileName,
    //   fileSize: uploadResult.data!.fileSize,
    //   mimeType: uploadResult.data!.mimeType,
    // });

    console.log("Crear recurso con archivo:", {
      title,
      description,
      resourceType,
      file: uploadResult.data,
    });

    handleClose();
    onSuccess();
  };

  const handleClose = () => {
    setTitle("");
    setDescription("");
    setResourceType("pdf");
    setSelectedFile(null);
    reset();
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Agregar nuevo recurso</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Título */}
          <div>
            <Label htmlFor="title" className="text-sm font-medium">
              Título <span className="text-red-500">*</span>
            </Label>
            <Input
              id="title"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ej: Introducción a React"
              required
              className="mt-1"
            />
          </div>

          {/* Descripción */}
          <div>
            <Label htmlFor="description" className="text-sm font-medium">
              Descripción
            </Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe el contenido de este recurso..."
              rows={3}
              className="mt-1"
            />
          </div>

          {/* Tipo de recurso */}
          <div>
            <Label htmlFor="resourceType" className="text-sm font-medium">
              Tipo de recurso <span className="text-red-500">*</span>
            </Label>
            <select
              id="resourceType"
              value={resourceType}
              onChange={(e) => {
                const newType = e.target.value as ResourceType;
                setResourceType(newType);
                setSelectedFile(null);
                reset();
              }}
              className="mt-1 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-500"
              required
            >
              <option value="pdf">📄 PDF</option>
              <option value="video">🎥 Video</option>
              <option value="audio">🎵 Audio</option>
              <option value="image">🖼️ Imagen</option>
              <option value="document">📝 Documento</option>
              <option value="text">📃 Texto</option>
              <option value="other">📎 Otro</option>
            </select>
          </div>

          {/* Upload de archivo */}
          <div>
            <Label className="text-sm font-medium">
              Archivo <span className="text-red-500">*</span>
            </Label>
            <div className="mt-1">
              <FileUpload
                onFileSelect={setSelectedFile}
                onFileRemove={() => {
                  setSelectedFile(null);
                  reset();
                }}
                resourceType={resourceType}
                maxSize={MAX_FILE_SIZES.RESOURCE}
                selectedFile={selectedFile}
                uploadProgress={progress?.percentage}
                uploadError={error}
                uploadSuccess={!!uploadedFile}
                disabled={isUploading}
              />
            </div>
          </div>

          {/* Botones de acción */}
          <div className="flex justify-end gap-3 border-t pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={isUploading}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={isUploading || !selectedFile}>
              {isUploading ? (
                <>
                  <span className="mr-2">⏳</span>
                  Subiendo... {progress?.percentage || 0}%
                </>
              ) : (
                "Crear recurso"
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
