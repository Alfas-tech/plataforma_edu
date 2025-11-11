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
import { MAX_FILE_SIZES, formatFileSize, getResourceTypeFromMime, prettifyFileName } from "@/lib/storage.utils";

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
  courseId: string; // Required to build the storage path
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
  { value: "text", label: "Texto (.txt)", helper: "Notas o guías en texto plano" },
  { value: "image", label: "Imagen (.jpg, .png)", helper: "Diagramas o gráficos" },
  { value: "audio", label: "Audio (.mp3)", helper: "Clases o podcasts en MP3" },
  { value: "video", label: "Video (.mp4)", helper: "Videos MP4 de hasta 5 minutos (50 MB máx.)" },
  { value: "other", label: "Otro", helper: "Material complementario" },
];

export function ResourceFormDialog({
  isOpen,
  onClose,
  mode,
  topicId,
  courseId,
  resource,
  defaultOrderIndex,
  canMutateContent,
}: ResourceFormDialogProps) {
  const router = useRouter();
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  
  // File upload management hook
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
  const watchedFileName = watch("fileName");
  const watchedFileSize = watch("fileSize");
  const watchedMimeType = watch("mimeType");
  const watchedFileUrl = watch("fileUrl");
  const resourceFileName = resource?.fileName ?? "";
  const displayStoredFileName = useMemo(() => {
    const candidate = watchedFileName || resourceFileName;
    const prettyCandidate = candidate ? prettifyFileName(candidate) : null;
    return prettyCandidate ?? candidate ?? "Sin nombre";
  }, [watchedFileName, resourceFileName]);
  const formattedStoredSize =
    typeof watchedFileSize === "number" && !Number.isNaN(watchedFileSize)
      ? formatFileSize(watchedFileSize)
      : null;

  const resourceTypeHelper = useMemo(() => {
    return (
      RESOURCE_TYPE_OPTIONS.find((option) => option.value === selectedType)
        ?.helper ?? "Selecciona el tipo que mejor describe el recurso"
    );
  }, [selectedType]);

  // Keep metadata in sync when a new file is selected
  useEffect(() => {
    if (selectedFile) {
      const normalizedFileName = prettifyFileName(selectedFile.name) ?? selectedFile.name;
      setValue("fileName", normalizedFileName);
      setValue("fileSize", selectedFile.size);
      setValue("mimeType", selectedFile.type);
      setValue("fileUrl", "");
      
      // Autodetect the resource type based on the selected file
      const detectedType = getResourceTypeFromMime(selectedFile.type);
      setValue("resourceType", detectedType as ResourceInput["resourceType"]);
    }
  }, [selectedFile, setValue]);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    if (mode === "edit" && resource) {
      const sanitizedType: ResourceInput["resourceType"] =
        resource.resourceType === "link" ? "other" : resource.resourceType;

      reset({
        title: resource.title,
        description: resource.description ?? "",
        resourceType: sanitizedType,
        fileUrl: resource.fileUrl ?? "",
        externalUrl: resource.externalUrl ?? "",
        orderIndex: resource.orderIndex,
        fileName: resource.fileName ? (prettifyFileName(resource.fileName) ?? resource.fileName) : "",
        fileSize: resource.fileSize ?? undefined,
        mimeType: resource.mimeType ?? "",
      });
      setSelectedFile(null);
    } else {
      // Reset the entire form when creating a new resource
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
      resetUpload(); // Clear upload state before the next interaction
    }

    setFormError(null);
  }, [isOpen, mode, resource, reset, defaultOrderIndex, resetUpload]);

  const handleClose = () => {
    // Reset the form when closing the dialog
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

      // Upload the new file ahead of persisting metadata
      if (selectedFile) {
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

        // Replace metadata with details from the uploaded file
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
          <input type="hidden" {...register("fileName")} />
          <input type="hidden" {...register("fileSize", { valueAsNumber: true })} />
          <input type="hidden" {...register("mimeType")} />
          <input type="hidden" {...register("fileUrl")} />
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
            {!errors.title && (
              <p className="text-xs text-slate-500">
                Debe tener entre 3 y 200 caracteres.
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label>
              Archivo {mode === "create" && <span className="text-red-500">*</span>}
            </Label>
            {mode === "edit" && resource?.fileUrl && !selectedFile && (
              <div className="space-y-2 rounded-lg border border-slate-200 bg-slate-50 p-3 text-sm text-slate-700">
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                  <span className="font-semibold text-slate-800">Archivo actual:</span>
                  <span
                    className="max-w-full break-words font-medium text-purple-700"
                    title={displayStoredFileName}
                  >
                    {displayStoredFileName}
                  </span>
                </div>
                <div className="grid gap-1 text-xs text-slate-500 sm:grid-cols-2">
                  <span>Tipo MIME: {watchedMimeType || "No disponible"}</span>
                  <span>Tamaño: {formattedStoredSize ?? "No disponible"}</span>
                  <span>Orden: {resource.orderIndex}</span>
                  {watchedFileUrl && (
                    <a
                      href={watchedFileUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="truncate text-purple-600 underline-offset-2 hover:underline"
                    >
                      Abrir en nueva pestaña
                    </a>
                  )}
                </div>
                <p className="text-xs text-slate-500">
                  Carga un nuevo archivo para reemplazarlo o déjalo vacío para conservar el actual.
                </p>
              </div>
            )}
            <FileUpload
              onFileSelect={(file) => {
                // Detect the underlying resource type before setting metadata
                const detectedType = getResourceTypeFromMime(file.type);

                // Update the form with the inferred metadata
                setValue("resourceType", detectedType as ResourceInput["resourceType"]);
                const normalizedName = prettifyFileName(file.name) ?? file.name;
                setValue("fileName", normalizedName);
                setValue("fileSize", file.size);
                setValue("mimeType", file.type);

                // Track the file locally so we can upload it later
                setSelectedFile(file);
                resetUpload();
              }}
              onFileRemove={() => {
                setSelectedFile(null);
                resetUpload();
                if (mode === "edit" && resource) {
                  const restoredName = resource.fileName ? (prettifyFileName(resource.fileName) ?? resource.fileName) : "";
                  setValue("fileName", restoredName);
                  setValue("fileSize", resource.fileSize ?? undefined);
                  setValue("mimeType", resource.mimeType ?? "");
                  setValue("fileUrl", resource.fileUrl ?? "");
                  setValue(
                    "resourceType",
                    (resource.resourceType === "link" ? "other" : resource.resourceType) as ResourceInput["resourceType"]
                  );
                } else {
                  setValue("fileName", "");
                  setValue("fileSize", undefined);
                  setValue("mimeType", "");
                  setValue("fileUrl", "");
                }
              }}
              resourceType={undefined} // Let the uploader autodetect the resource type
              maxSize={MAX_FILE_SIZES.RESOURCE}
              selectedFile={selectedFile}
              uploadProgress={progress?.percentage}
              uploadError={uploadError}
              uploadSuccess={!!uploadedFile}
              disabled={isSubmitting || isUploading}
            />
            <p className="text-xs text-purple-600">
              💡 <strong>Sugerencia:</strong> El tipo de recurso se detectará automáticamente al seleccionar el archivo.
            </p>
          </div>

          <div className="space-y-2">
            <Label>Tipo de recurso</Label>
            <Controller
              name="resourceType"
              control={control}
              render={({ field }) => (
                <Select
                  onValueChange={field.onChange}
                  value={field.value}
                  disabled={isSubmitting || selectedFile !== null}
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
                disabled
                readOnly
                value={selectedFile ? (prettifyFileName(selectedFile.name) ?? selectedFile.name) : (prettifyFileName(watchedFileName) ?? "")}
                title={selectedFile ? (prettifyFileName(selectedFile.name) ?? selectedFile.name) : (prettifyFileName(watchedFileName) ?? "")}
                className="bg-slate-50 text-ellipsis"
              />
              <p className="text-xs text-slate-500 break-words">
                {selectedFile 
                  ? `✓ Capturado: ${selectedFile.name}`
                  : watchedFileName
                    ? `Nombre registrado: ${prettifyFileName(watchedFileName) ?? watchedFileName}`
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
                disabled
                readOnly
                className="bg-slate-50"
                value={selectedFile ? formatFileSize(selectedFile.size) : formattedStoredSize ?? ""}
                placeholder={selectedFile ? "Capturado automáticamente" : "Se capturará automáticamente"}
              />
              <p className="text-xs text-slate-500">
                {selectedFile 
                  ? `✓ ${formatFileSize(selectedFile.size)} (${selectedFile.size.toLocaleString()} bytes)`
                  : formattedStoredSize
                    ? `Tamaño registrado: ${formattedStoredSize}`
                    : "Se capturará automáticamente al seleccionar el archivo"}
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="mimeType">Tipo MIME</Label>
              <Input
                id="mimeType"
                placeholder={selectedFile ? "Capturado automáticamente" : "application/pdf"}
                disabled
                readOnly
                className="bg-slate-50"
                value={selectedFile ? selectedFile.type : watchedMimeType ?? ""}
              />
              <p className="text-xs text-slate-500">
                {selectedFile 
                  ? `✓ Capturado: ${selectedFile.type || 'application/octet-stream'}`
                  : watchedMimeType
                    ? `Tipo registrado: ${watchedMimeType}`
                    : "Se capturará automáticamente al seleccionar el archivo"}
              </p>
            </div>
          </div>

          <div className="rounded-lg border border-purple-200 bg-purple-50 p-3 text-xs text-purple-700">
            <strong>💡 Sugerencia:</strong> Los metadatos del archivo (nombre, tamaño, tipo) se capturan automáticamente al seleccionar un archivo. Asegúrate de seleccionar primero el tipo de recurso correcto antes de cargar el archivo.
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
