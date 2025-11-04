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
import type {
  CreateCourseInput as CreateCoursePayload,
  UpdateCourseInput as UpdateCoursePayload,
} from "@/src/core/types/course.types";
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
        });
      } else {
        reset({
          title: "",
          summary: "",
          description: "",
          initialVersionLabel: "v1.0.0",
          initialVersionSummary: "",
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
        const name = data.title.trim();
        const description = data.description?.trim() ?? "";
        const summary = data.summary?.trim() ?? "";
        const initialVersionLabel = data.initialVersionLabel?.trim() ?? "";
        const initialVersionSummary = data.initialVersionSummary?.trim() ?? "";

        const payload: CreateCoursePayload = {
          name,
          description: description.length > 0 ? description : null,
        };

        if (initialVersionLabel.length > 0) {
          payload.draft = {
            title: initialVersionLabel,
            description:
              initialVersionSummary.length > 0
                ? initialVersionSummary
                : summary.length > 0
                  ? summary
                  : null,
            content: null,
          };
        }

        result = await createCourse(payload);
      } else if (course) {
        const name = data.title.trim();
        const description = data.description?.trim() ?? "";

        const payload: UpdateCoursePayload = {
          name,
          description: description.length > 0 ? description : null,
        };

        result = await updateCourse(course.id, payload);
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
