"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { FileUpload } from "@/components/ui/file-upload";
import { Loader2 } from "lucide-react";
import {
  resourceSchema,
  type ResourceInput,
} from "@/lib/validations";
import {
  createResource,
  updateResource,
} from "@/src/presentation/actions/content.actions";
import { useFileUpload } from "@/lib/hooks/useFileUpload";
import { MAX_FILE_SIZES, formatFileSize, getResourceTypeFromMime } from "@/lib/storage.utils";

interface ResourceData {
  id: string;
  title: string;
  description: string | null;
  resourceType: ResourceInput["resourceType"];
  fileUrl: string | null;
  fileName: string | null;
  fileSize: number | null;
  mimeType: string | null;
  externalUrl: string | null;
  orderIndex: number;
}

interface ResourceFormDialogProps {
  isOpen: boolean;
  onClose: () => void;
  mode: "create" | "edit";
  topicId: string;
  courseId: string; // NUEVO: necesario para upload
  resource?: ResourceData | null;
  defaultOrderIndex: number;
  canMutateContent: boolean;
}

const RESOURCE_TYPE_OPTIONS: Array<{
  value: ResourceInput["resourceType"];
  label: string;
  helper: string;
}> = [
  { value: "pdf", label: "PDF (.pdf)", helper: "Documentos PDF descargables" },
  { value: "document", label: "Documento (.doc, .docx)", helper: "Archivos Word" },
  { value: "image", label: "Imagen (.jpg, .png)", helper: "Diagramas o gráficos" },
  { value: "audio", label: "Audio (.mp3)", helper: "Clases o podcasts en MP3" },
  { value: "video", label: "Video (.mp4)", helper: "Videos en formato MP4" },
  { value: "link", label: "Enlace externo", helper: "YouTube, artículos web, etc." },
];

export function ResourceFormDialog({
  isOpen,
  onClose,
  mode,
  topicId,
  courseId, // NUEVO
  resource,
  defaultOrderIndex,
  canMutateContent,
}: ResourceFormDialogProps) {
  const router = useRouter();
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  
  // Hook para subir archivos
  const { isUploading, progress, error: uploadError, uploadedFile, uploadFile, reset: resetUpload } = useFileUpload();

  const {
    register,
    control,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors },
  } = useForm<ResourceInput>({
    resolver: zodResolver(resourceSchema),
    defaultValues: {
      title: "",
      description: "",
      resourceType: "pdf",
      fileUrl: "",
      externalUrl: "",
      orderIndex: defaultOrderIndex,
      fileName: "",
      fileSize: undefined,
      mimeType: "",
    },
  });

  const selectedType = watch("resourceType");

  const resourceTypeHelper = useMemo(() => {
    return (
      RESOURCE_TYPE_OPTIONS.find((option) => option.value === selectedType)
        ?.helper ?? "Selecciona el tipo que mejor describe el recurso"
    );
  }, [selectedType]);

  // Efecto para actualizar metadatos cuando se selecciona un archivo
  useEffect(() => {
    if (selectedFile) {
      setValue("fileName", selectedFile.name);
      setValue("fileSize", selectedFile.size);
      setValue("mimeType", selectedFile.type);
      
      // Auto-detectar y cambiar el tipo de recurso basado en el archivo
      const detectedType = getResourceTypeFromMime(selectedFile.type);
      setValue("resourceType", detectedType as ResourceInput["resourceType"]);
    }
  }, [selectedFile, setValue]);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    if (mode === "edit" && resource) {
      reset({
        title: resource.title,
        description: resource.description ?? "",
        resourceType: resource.resourceType,
        fileUrl: resource.fileUrl ?? "",
        externalUrl: resource.externalUrl ?? "",
        orderIndex: resource.orderIndex,
        fileName: resource.fileName ?? "",
        fileSize: resource.fileSize ?? undefined,
        mimeType: resource.mimeType ?? "",
      });
      setSelectedFile(null);
    } else {
      // Modo crear: limpiar completamente el formulario
      reset({
        title: "",
        description: "",
        resourceType: "pdf",
        fileUrl: "",
        externalUrl: "",
        orderIndex: defaultOrderIndex,
        fileName: "",
        fileSize: undefined,
        mimeType: "",
      });
      setSelectedFile(null);
      resetUpload(); // Limpiar estado de upload
    }

    setFormError(null);
  }, [isOpen, mode, resource, reset, defaultOrderIndex, resetUpload]);

  const handleClose = () => {
    // Limpiar completamente el formulario al cerrar
    reset({
      title: "",
      description: "",
      resourceType: "pdf",
      fileUrl: "",
      externalUrl: "",
      orderIndex: defaultOrderIndex,
      fileName: "",
      fileSize: undefined,
      mimeType: "",
    });
    setSelectedFile(null);
    resetUpload();
    setFormError(null);
    onClose();
  };

  const onSubmit = async (data: ResourceInput) => {
    setIsSubmitting(true);
    setFormError(null);

    if (mode === "create" && !canMutateContent) {
      setFormError(
        "La edición seleccionada no tiene una versión activa para guardar recursos."
      );
      setIsSubmitting(false);
      return;
    }

    try {
      let fileData = {
        fileUrl: data.fileUrl || null,
        fileName: data.fileName || null,
        fileSize:
          typeof data.fileSize === "number" && !Number.isNaN(data.fileSize)
            ? data.fileSize
            : undefined,
        mimeType: data.mimeType || null,
      };

      // Si hay un archivo seleccionado y no es tipo "link", subirlo primero
      if (selectedFile && data.resourceType !== "link") {
        const uploadResult = await uploadFile(
          selectedFile,
          courseId,
          topicId,
          data.resourceType
        );

        if (!uploadResult.success) {
          setFormError(uploadResult.error || "Error al subir el archivo");
          setIsSubmitting(false);
          return;
        }

        // Usar los datos del archivo subido
        fileData = {
          fileUrl: uploadResult.data!.url || null,
          fileName: uploadResult.data!.fileName,
          fileSize: uploadResult.data!.fileSize,
          mimeType: uploadResult.data!.mimeType,
        };
      }

      if (mode === "create") {
        const result = await createResource({
          topicId,
          title: data.title,
          description: data.description || null,
          resourceType: data.resourceType,
          ...fileData,
          externalUrl: data.externalUrl || null,
          orderIndex:
            typeof data.orderIndex === "number" &&
            !Number.isNaN(data.orderIndex)
              ? data.orderIndex
              : undefined,
        });

        if (result && "error" in result) {
          setFormError(result.error || "Error al crear el recurso");
        } else {
          handleClose();
          router.refresh();
        }
      } else if (resource) {
        const result = await updateResource(resource.id, {
          title: data.title,
          description: data.description || null,
          resourceType: data.resourceType,
          ...fileData,
          externalUrl: data.externalUrl || null,
        });

        if (result && "error" in result) {
          setFormError(result.error || "Error al actualizar el recurso");
        } else {
          handleClose();
          router.refresh();
        }
      }
    } catch (error) {
      setFormError("Ocurrió un error inesperado al guardar el recurso");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => !open && !isSubmitting && handleClose()}
    >
      <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {mode === "create" ? "Agregar recurso" : "Editar recurso"}
          </DialogTitle>
          <DialogDescription>
            {mode === "create"
              ? "Completa la información para publicar un nuevo recurso."
              : "Actualiza la información del recurso seleccionado."}
          </DialogDescription>
          {!canMutateContent && mode === "create" && (
            <p className="mt-2 text-xs text-red-600">
              Activa una versión para esta edición del curso antes de crear
              recursos.
            </p>
          )}
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="title">
              Título <span className="text-red-500">*</span>
            </Label>
            <Input
              id="title"
              placeholder="Ej: Guía práctica de algoritmos"
              disabled={isSubmitting}
              error={errors.title?.message}
              {...register("title")}
            />
          </div>

          {/* Upload de archivo o URL externa - MOVIDO ARRIBA */}
          {selectedType === "link" ? (
            <div className="space-y-2">
              <Label htmlFor="externalUrl">
                URL externa <span className="text-red-500">*</span>
              </Label>
              <Input
                id="externalUrl"
                placeholder="https://youtube.com/watch?v=..."
                disabled={isSubmitting}
                error={errors.externalUrl?.message}
                {...register("externalUrl")}
              />
              <p className="text-xs text-slate-500">
                Enlace a plataformas externas (YouTube, artículos, etc.).
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              <Label>
                Archivo {mode === "create" && <span className="text-red-500">*</span>}
              </Label>
              <FileUpload
                onFileSelect={(file) => {
                  // 🔥 DETECTAR TIPO PRIMERO, ANTES DE TODO
                  const detectedType = getResourceTypeFromMime(file.type);
                  
                  // Actualizar el formulario con el tipo detectado
                  setValue("resourceType", detectedType as ResourceInput["resourceType"]);
                  setValue("fileName", file.name);
                  setValue("fileSize", file.size);
                  setValue("mimeType", file.type);
                  
                  // Establecer el archivo seleccionado
                  setSelectedFile(file);
                  resetUpload();
                }}
                onFileRemove={() => {
                  setSelectedFile(null);
                  resetUpload();
                }}
                resourceType={undefined} // 🔥 NO VALIDAR POR TIPO - dejamos que auto-detecte
                maxSize={MAX_FILE_SIZES.RESOURCE}
                selectedFile={selectedFile}
                uploadProgress={progress?.percentage}
                uploadError={uploadError}
                uploadSuccess={!!uploadedFile}
                disabled={isSubmitting || isUploading}
              />
              {mode === "edit" && resource?.fileUrl && !selectedFile && (
                <p className="text-xs text-slate-500">
                  Archivo actual: {resource.fileName || resource.fileUrl}
                </p>
              )}
              <p className="text-xs text-purple-600">
                💡 <strong>Sugerencia:</strong> El tipo de recurso se detectará automáticamente al seleccionar el archivo.
              </p>
            </div>
          )}

          <div className="space-y-2">
            <Label>Tipo de recurso</Label>
            <Controller
              name="resourceType"
              control={control}
              render={({ field }) => (
                <Select
                  onValueChange={field.onChange}
                  value={field.value}
                  disabled={isSubmitting || (selectedFile !== null && selectedType !== "link")}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona un tipo" />
                  </SelectTrigger>
                  <SelectContent>
                    {RESOURCE_TYPE_OPTIONS.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
            {selectedFile ? (
              <p className="text-xs text-green-600">
                ✓ Tipo detectado automáticamente: <strong>{RESOURCE_TYPE_OPTIONS.find(opt => opt.value === selectedType)?.label}</strong>
              </p>
            ) : (
              <p className="text-xs text-slate-500">{resourceTypeHelper}</p>
            )}
            {errors.resourceType?.message && (
              <p className="text-xs text-red-600">
                {errors.resourceType.message}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Descripción</Label>
            <Textarea
              id="description"
              placeholder="Describe el contenido del recurso..."
              rows={3}
              disabled={isSubmitting}
              error={errors.description?.message}
              {...register("description")}
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="fileName">Nombre de archivo</Label>
              <Input
                id="fileName"
                placeholder={selectedFile ? "Capturado automáticamente" : "ej: guia-algoritmos.pdf"}
                disabled={true}
                className="bg-slate-50"
                error={errors.fileName?.message}
                {...register("fileName")}
              />
              <p className="text-xs text-slate-500">
                {selectedFile 
                  ? `✓ Capturado: ${selectedFile.name}`
                  : "Se capturará automáticamente al seleccionar el archivo"}
              </p>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="fileSize">Tamaño</Label>
              <Input
                id="fileSize"
                type="text"
                disabled={true}
                className="bg-slate-50"
                value={selectedFile ? formatFileSize(selectedFile.size) : ""}
                placeholder={selectedFile ? "Capturado automáticamente" : "Se capturará automáticamente"}
              />
              <p className="text-xs text-slate-500">
                {selectedFile 
                  ? `✓ ${formatFileSize(selectedFile.size)} (${selectedFile.size.toLocaleString()} bytes)`
                  : "Se capturará automáticamente al seleccionar el archivo"}
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="mimeType">Tipo MIME</Label>
              <Input
                id="mimeType"
                placeholder={selectedFile ? "Capturado automáticamente" : "application/pdf"}
                disabled={true}
                className="bg-slate-50"
                error={errors.mimeType?.message}
                {...register("mimeType")}
              />
              <p className="text-xs text-slate-500">
                {selectedFile 
                  ? `✓ Capturado: ${selectedFile.type || 'application/octet-stream'}`
                  : "Se capturará automáticamente al seleccionar el archivo"}
              </p>
            </div>
          </div>

          <div className="rounded-lg border border-purple-200 bg-purple-50 p-3 text-xs text-purple-700">
            <strong>💡 Sugerencia:</strong> Los metadatos del archivo (nombre, tamaño, tipo) se capturan automáticamente al seleccionar un archivo. 
            {selectedType !== "link" && " Asegúrate de seleccionar primero el tipo de recurso correcto antes de cargar el archivo."}
          </div>

          {formError && (
            <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
              {formError}
            </div>
          )}

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={isSubmitting}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={
                isSubmitting || (mode === "create" && !canMutateContent)
              }
              className="bg-purple-600 hover:bg-purple-700"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Guardando...
                </>
              ) : mode === "create" ? (
                "Crear recurso"
              ) : (
                "Guardar cambios"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
