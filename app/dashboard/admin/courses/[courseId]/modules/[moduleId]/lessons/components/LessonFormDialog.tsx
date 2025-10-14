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
import { lessonSchema, type LessonInput } from "@/lib/validations";
import {
  createLesson,
  updateLesson,
} from "@/src/presentation/actions/content.actions";
import { useRouter } from "next/navigation";
import { useState } from "react";

interface LessonData {
  id: string;
  title: string;
  content: string | null;
  orderIndex: number;
  durationMinutes: number | null;
  isPublished: boolean;
}

interface LessonFormDialogProps {
  isOpen: boolean;
  onClose: () => void;
  mode: "create" | "edit";
  moduleId: string;
  lesson?: LessonData | null;
  maxOrderIndex: number;
}

export function LessonFormDialog({
  isOpen,
  onClose,
  mode,
  moduleId,
  lesson,
  maxOrderIndex,
}: LessonFormDialogProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    watch,
  } = useForm<LessonInput>({
    resolver: zodResolver(lessonSchema),
    defaultValues: {
      title: "",
      content: "",
      orderIndex: maxOrderIndex + 1,
      durationMinutes: 0,
      isPublished: false,
    },
  });

  const isPublished = watch("isPublished");

  useEffect(() => {
    if (isOpen) {
      if (mode === "edit" && lesson) {
        reset({
          title: lesson.title,
          content: lesson.content || "",
          orderIndex: lesson.orderIndex,
          durationMinutes: lesson.durationMinutes || 0,
          isPublished: lesson.isPublished,
        });
      } else {
        reset({
          title: "",
          content: "",
          orderIndex: maxOrderIndex + 1,
          durationMinutes: 0,
          isPublished: false,
        });
      }
      setError(null);
    }
  }, [isOpen, mode, lesson, maxOrderIndex, reset]);

  const onSubmit = async (data: LessonInput) => {
    setIsSubmitting(true);
    setError(null);

    try {
      let result;
      if (mode === "create") {
        result = await createLesson({
          module_id: moduleId,
          title: data.title,
          content: data.content || null,
          order_index: data.orderIndex,
          duration_minutes: data.durationMinutes || null,
          is_published: data.isPublished || false,
        });
      } else if (lesson) {
        result = await updateLesson(lesson.id, {
          title: data.title,
          content: data.content || null,
          order_index: data.orderIndex,
          duration_minutes: data.durationMinutes || null,
          is_published: data.isPublished || false,
        });
      }

      if (result && "error" in result) {
        setError(result.error || "Error al guardar la lección");
      } else {
        onClose();
        router.refresh();
      }
    } catch (err) {
      setError("Error inesperado al guardar la lección");
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
            {mode === "create" ? "Crear Nueva Lección" : "Editar Lección"}
          </DialogTitle>
          <DialogDescription>
            {mode === "create"
              ? "Completa la información de la nueva lección del módulo."
              : "Modifica la información de la lección."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 py-4">
          {/* Title */}
          <div className="space-y-2">
            <Label htmlFor="title">
              Título de la Lección <span className="text-red-500">*</span>
            </Label>
            <Input
              id="title"
              placeholder="Ej: Introducción a variables"
              {...register("title")}
              error={errors.title?.message}
              disabled={isSubmitting}
            />
          </div>

          {/* Content */}
          <div className="space-y-2">
            <Label htmlFor="content">Contenido</Label>
            <Textarea
              id="content"
              placeholder="Contenido de la lección en formato Markdown..."
              {...register("content")}
              error={errors.content?.message}
              disabled={isSubmitting}
              rows={12}
              className="font-mono text-sm"
            />
            <p className="text-xs text-slate-500">
              Puedes usar Markdown para dar formato al contenido
            </p>
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
              Las lecciones se reorganizarán automáticamente si hay conflictos
              de orden.
            </p>
          </div>

          {/* Duration */}
          <div className="space-y-2">
            <Label htmlFor="durationMinutes">Duración (minutos)</Label>
            <Input
              id="durationMinutes"
              type="number"
              placeholder="30"
              {...register("durationMinutes", { valueAsNumber: true })}
              error={errors.durationMinutes?.message}
              disabled={isSubmitting}
            />
            <p className="text-xs text-slate-500">
              Duración estimada de la lección (opcional, máximo 480 minutos)
            </p>
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
              Publicar lección (visible para estudiantes)
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
                "Crear Lección"
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
