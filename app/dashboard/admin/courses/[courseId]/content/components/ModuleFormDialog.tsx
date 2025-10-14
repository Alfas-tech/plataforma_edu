"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
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
import { Loader2 } from "lucide-react";
import { moduleSchema, type ModuleInput } from "@/lib/validations";
import {
  createModule,
  updateModule,
} from "@/src/presentation/actions/content.actions";
import { useRouter } from "next/navigation";
import { useState } from "react";

interface ModuleData {
  id: string;
  title: string;
  description: string | null;
  orderIndex: number;
  content: string | null;
  isPublished: boolean;
}

interface ModuleFormDialogProps {
  isOpen: boolean;
  onClose: () => void;
  mode: "create" | "edit";
  courseId: string;
  module?: ModuleData | null;
  maxOrderIndex: number;
}

export function ModuleFormDialog({
  isOpen,
  onClose,
  mode,
  courseId,
  module,
  maxOrderIndex,
}: ModuleFormDialogProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
    watch,
  } = useForm<ModuleInput>({
    resolver: zodResolver(moduleSchema),
    defaultValues: {
      title: "",
      description: "",
      orderIndex: maxOrderIndex + 1,
      content: "",
      isPublished: false,
    },
  });

  const isPublished = watch("isPublished");

  useEffect(() => {
    if (isOpen) {
      if (mode === "edit" && module) {
        reset({
          title: module.title,
          description: module.description || "",
          orderIndex: module.orderIndex,
          content: module.content || "",
          isPublished: module.isPublished,
        });
      } else {
        reset({
          title: "",
          description: "",
          orderIndex: maxOrderIndex + 1,
          content: "",
          isPublished: false,
        });
      }
      setError(null);
    }
  }, [isOpen, mode, module, maxOrderIndex, reset]);

  const onSubmit = async (data: ModuleInput) => {
    setIsSubmitting(true);
    setError(null);

    try {
      let result;
      if (mode === "create") {
        result = await createModule({
          course_id: courseId,
          title: data.title,
          description: data.description || null,
          order_index: data.orderIndex,
          content: data.content || null,
          is_published: data.isPublished || false,
        });
      } else if (module) {
        result = await updateModule(module.id, {
          title: data.title,
          description: data.description || null,
          order_index: data.orderIndex,
          content: data.content || null,
          is_published: data.isPublished || false,
        });
      }

      if (result && "error" in result) {
        setError(result.error || "Error al guardar el módulo");
      } else {
        onClose();
        router.refresh();
      }
    } catch (err) {
      setError("Error inesperado al guardar el módulo");
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
            {mode === "create" ? "Crear Nuevo Módulo" : "Editar Módulo"}
          </DialogTitle>
          <DialogDescription>
            {mode === "create"
              ? "Completa la información del nuevo módulo del curso."
              : "Modifica la información del módulo."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 py-4">
          {/* Title */}
          <div className="space-y-2">
            <Label htmlFor="title">
              Título del Módulo <span className="text-red-500">*</span>
            </Label>
            <Input
              id="title"
              placeholder="Ej: Fundamentos de Python"
              {...register("title")}
              error={errors.title?.message}
              disabled={isSubmitting}
            />
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Descripción</Label>
            <Textarea
              id="description"
              placeholder="Describe brevemente el contenido del módulo..."
              {...register("description")}
              error={errors.description?.message}
              disabled={isSubmitting}
              rows={3}
            />
          </div>

          {/* Order Index */}
          <div className="space-y-2">
            <Label htmlFor="orderIndex">
              Orden <span className="text-red-500">*</span>
            </Label>
            <Input
              id="orderIndex"
              type="number"
              placeholder="1"
              {...register("orderIndex", { valueAsNumber: true })}
              error={errors.orderIndex?.message}
              disabled={isSubmitting}
            />
            <p className="text-xs text-slate-500">
              Los módulos se reorganizarán automáticamente si hay conflictos de
              orden.
            </p>
          </div>

          {/* Content */}
          <div className="space-y-2">
            <Label htmlFor="content">Contenido</Label>
            <Textarea
              id="content"
              placeholder="Contenido del módulo en formato Markdown..."
              {...register("content")}
              error={errors.content?.message}
              disabled={isSubmitting}
              rows={8}
              className="font-mono text-sm"
            />
          </div>

          {/* Published */}
          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="isPublished"
              {...register("isPublished")}
              disabled={isSubmitting}
              className="h-4 w-4 rounded border-slate-300 text-purple-600 focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            />
            <Label htmlFor="isPublished" className="cursor-pointer font-normal">
              Publicar módulo (visible para estudiantes)
            </Label>
          </div>

          {/* Error Message */}
          {error && (
            <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800">
              {error}
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
              disabled={isSubmitting}
              className="bg-purple-600 hover:bg-purple-700"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Guardando...
                </>
              ) : mode === "create" ? (
                "Crear Módulo"
              ) : (
                "Guardar Cambios"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
