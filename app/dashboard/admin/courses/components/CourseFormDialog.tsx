"use client";

import { useEffect, useState } from "react";
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
import { courseSchema, type CourseInput } from "@/lib/validations";
import type { CourseOverview } from "@/src/presentation/types/course";
import {
  createCourse,
  updateCourse,
} from "@/src/presentation/actions/course.actions";
import { useRouter } from "next/navigation";

interface CourseFormDialogProps {
  isOpen: boolean;
  onClose: () => void;
  mode: "create" | "edit";
  course?: CourseOverview | null;
}

export function CourseFormDialog({
  isOpen,
  onClose,
  mode,
  course,
}: CourseFormDialogProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<CourseInput>({
    resolver: zodResolver(courseSchema),
    defaultValues: {
      title: "",
      summary: "",
      description: "",
      initialVersionLabel: "v1.0.0",
      initialVersionSummary: "",
      visibilityOverride: false,
    },
  });

  useEffect(() => {
    if (isOpen) {
      if (mode === "edit" && course) {
        reset({
          title: course.title,
          summary: course.summary || "",
          description: course.description || "",
          initialVersionLabel: "",
          initialVersionSummary: "",
          visibilityOverride: course.visibilityOverride,
        });
      } else {
        reset({
          title: "",
          summary: "",
          description: "",
          initialVersionLabel: "v1.0.0",
          initialVersionSummary: "",
          visibilityOverride: false,
        });
      }
      setError(null);
    }
  }, [isOpen, mode, course, reset]);

  const onSubmit = async (data: CourseInput) => {
    setIsSubmitting(true);
    setError(null);

    try {
      let result;
      if (mode === "create") {
        result = await createCourse({
          title: data.title,
          summary: data.summary || null,
          description: data.description || null,
          initialVersionLabel: data.initialVersionLabel || undefined,
          initialVersionSummary: data.initialVersionSummary || undefined,
        });
      } else if (course) {
        result = await updateCourse(course.id, {
          title: data.title,
          summary: data.summary || null,
          description: data.description || null,
          visibility_override: data.visibilityOverride,
        });
      }

      if (result && "error" in result) {
        setError(result.error || "Error al guardar el curso");
      } else {
        onClose();
        router.refresh();
      }
    } catch (err) {
      setError("Error inesperado al guardar el curso");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open: boolean) => {
        if (!open && !isSubmitting) {
          onClose();
        }
      }}
    >
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>
            {mode === "create" ? "Crear Nuevo Curso" : "Editar Curso"}
          </DialogTitle>
          <DialogDescription>
            {mode === "create"
              ? "Completa la información del nuevo curso."
              : "Modifica la información del curso."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 py-4">
          {/* Title */}
          <div className="space-y-2">
            <Label htmlFor="title">
              Título del Curso <span className="text-red-500">*</span>
            </Label>
            <Input
              id="title"
              placeholder="Ej: Introducción a Python"
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
              placeholder="Describe el contenido del curso..."
              {...register("description")}
              error={errors.description?.message}
              disabled={isSubmitting}
              rows={4}
            />
          </div>

          {/* Summary */}
          <div className="space-y-2">
            <Label htmlFor="summary">Resumen</Label>
            <Textarea
              id="summary"
              placeholder="Resumen breve para identificar el curso"
              {...register("summary")}
              error={errors.summary?.message}
              disabled={isSubmitting}
              rows={3}
            />
          </div>

          {/* Version defaults for create */}
          {mode === "create" && (
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="initialVersionLabel">
                  Etiqueta de versión inicial
                </Label>
                <Input
                  id="initialVersionLabel"
                  placeholder="Ej: v1.0.0"
                  {...register("initialVersionLabel")}
                  error={errors.initialVersionLabel?.message}
                  disabled={isSubmitting}
                />
              </div>
              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="initialVersionSummary">
                  Resumen de la versión
                </Label>
                <Textarea
                  id="initialVersionSummary"
                  placeholder="Describe brevemente el alcance de la versión inicial"
                  {...register("initialVersionSummary")}
                  error={errors.initialVersionSummary?.message}
                  disabled={isSubmitting}
                  rows={3}
                />
              </div>
            </div>
          )}

          {/* Visibility override (edit only) */}
          {mode === "edit" && (
            <div className="flex items-center space-x-2 rounded-lg border border-purple-200 bg-purple-50 p-3">
              <input
                type="checkbox"
                id="visibilityOverride"
                {...register("visibilityOverride")}
                disabled={isSubmitting}
                className="h-4 w-4 rounded border-purple-300 text-purple-600 focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              />
              <Label
                htmlFor="visibilityOverride"
                className="cursor-pointer text-sm font-medium text-purple-900"
              >
                Mostrar curso públicamente aunque la versión no esté publicada
              </Label>
            </div>
          )}

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
                "Crear Curso"
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
