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
import { Loader2 } from "lucide-react";
import { resourceSchema, type ResourceInput } from "@/lib/validations";
import {
  createResource,
  updateResource,
} from "@/src/presentation/actions/content.actions";

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
  resource?: ResourceData | null;
  defaultOrderIndex: number;
  canMutateContent: boolean;
}

const RESOURCE_TYPE_OPTIONS: Array<{
  value: ResourceInput["resourceType"];
  label: string;
  helper: string;
}> = [
  { value: "pdf", label: "PDF", helper: "Documentos descargables" },
  { value: "video", label: "Video", helper: "Contenido audiovisual" },
  { value: "audio", label: "Audio", helper: "Clases o podcasts" },
  { value: "document", label: "Documento", helper: "Material de referencia" },
  { value: "link", label: "Enlace", helper: "Recursos externos" },
  { value: "image", label: "Imagen", helper: "Diagramas o gráficos" },
  { value: "other", label: "Otro", helper: "Otro tipo de recurso" },
];

export function ResourceFormDialog({
  isOpen,
  onClose,
  mode,
  topicId,
  resource,
  defaultOrderIndex,
  canMutateContent,
}: ResourceFormDialogProps) {
  const router = useRouter();
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    control,
    handleSubmit,
    reset,
    watch,
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
    } else {
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
    }

    setFormError(null);
  }, [isOpen, mode, resource, reset, defaultOrderIndex]);

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
      if (mode === "create") {
        const result = await createResource({
          topicId,
          title: data.title,
          description: data.description || null,
          resourceType: data.resourceType,
          fileUrl: data.fileUrl || null,
          fileName: data.fileName || null,
          fileSize:
            typeof data.fileSize === "number" && !Number.isNaN(data.fileSize)
              ? data.fileSize
              : undefined,
          mimeType: data.mimeType || null,
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
          onClose();
          router.refresh();
        }
      } else if (resource) {
        const result = await updateResource(resource.id, {
          title: data.title,
          description: data.description || null,
          resourceType: data.resourceType,
          fileUrl: data.fileUrl || null,
          fileName: data.fileName || null,
          fileSize:
            typeof data.fileSize === "number" && !Number.isNaN(data.fileSize)
              ? data.fileSize
              : undefined,
          mimeType: data.mimeType || null,
          externalUrl: data.externalUrl || null,
        });

        if (result && "error" in result) {
          setFormError(result.error || "Error al actualizar el recurso");
        } else {
          onClose();
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
      onOpenChange={(open) => !open && !isSubmitting && onClose()}
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

          <div className="space-y-2">
            <Label>Tipo de recurso</Label>
            <Controller
              name="resourceType"
              control={control}
              render={({ field }) => (
                <Select
                  onValueChange={field.onChange}
                  value={field.value}
                  disabled={isSubmitting}
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
            <p className="text-xs text-slate-500">{resourceTypeHelper}</p>
            {errors.resourceType?.message && (
              <p className="text-xs text-red-600">
                {errors.resourceType.message}
              </p>
            )}
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="fileUrl">URL de archivo</Label>
              <Input
                id="fileUrl"
                placeholder="https://..."
                disabled={isSubmitting}
                error={errors.fileUrl?.message}
                {...register("fileUrl")}
              />
              <p className="text-xs text-slate-500">
                Proporciona la URL directa al archivo (si aplica).
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="externalUrl">URL externa</Label>
              <Input
                id="externalUrl"
                placeholder="https://..."
                disabled={isSubmitting}
                error={errors.externalUrl?.message}
                {...register("externalUrl")}
              />
              <p className="text-xs text-slate-500">
                Enlace a plataformas externas (YouTube, artículos, etc.).
              </p>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="orderIndex">Orden en el tópico</Label>
              <Input
                id="orderIndex"
                type="number"
                disabled={isSubmitting}
                error={errors.orderIndex?.message}
                {...register("orderIndex", {
                  setValueAs: (value) => {
                    if (
                      value === "" ||
                      value === null ||
                      typeof value === "undefined"
                    ) {
                      return undefined;
                    }
                    const parsed = Number(value);
                    return Number.isNaN(parsed) ? value : parsed;
                  },
                })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="fileName">Nombre de archivo</Label>
              <Input
                id="fileName"
                placeholder="ej: guia-algoritmos.pdf"
                disabled={isSubmitting}
                error={errors.fileName?.message}
                {...register("fileName")}
              />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="fileSize">Tamaño (bytes)</Label>
              <Input
                id="fileSize"
                type="number"
                disabled={isSubmitting}
                error={errors.fileSize?.message}
                {...register("fileSize", {
                  setValueAs: (value) => {
                    if (
                      value === "" ||
                      value === null ||
                      typeof value === "undefined"
                    ) {
                      return undefined;
                    }
                    const parsed = Number(value);
                    return Number.isNaN(parsed) ? value : parsed;
                  },
                })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="mimeType">Tipo MIME</Label>
              <Input
                id="mimeType"
                placeholder="application/pdf"
                disabled={isSubmitting}
                error={errors.mimeType?.message}
                {...register("mimeType")}
              />
            </div>
          </div>

          <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 text-xs text-slate-600">
            Puedes dejar vacíos los campos que no apliquen. Si necesitas
            adjuntar archivos, asegúrate de cargarlos previamente a tu proveedor
            de almacenamiento y pega aquí la URL resultante.
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
              onClick={onClose}
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
