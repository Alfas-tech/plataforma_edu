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
import { createCourse, updateCourse } from "@/src/presentation/actions/course.actions";
import { useRouter } from "next/navigation";

interface CourseData {
  id: string;
  title: string;
  description: string | null;
  startDate: string;
  endDate: string;
  isActive: boolean;
}

interface CourseFormDialogProps {
  isOpen: boolean;
  onClose: () => void;
  mode: 'create' | 'edit';
  course?: CourseData | null;
}

export function CourseFormDialog({ isOpen, onClose, mode, course }: CourseFormDialogProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    watch,
  } = useForm<CourseInput>({
    resolver: zodResolver(courseSchema),
    defaultValues: {
      title: '',
      description: '',
      startDate: '',
      endDate: '',
      isActive: true,
    },
  });

  const isActive = watch('isActive');

  useEffect(() => {
    if (isOpen) {
      if (mode === 'edit' && course) {
        // Convert ISO dates to YYYY-MM-DD format for input
        const startDate = new Date(course.startDate).toISOString().split('T')[0];
        const endDate = new Date(course.endDate).toISOString().split('T')[0];
        
        reset({
          title: course.title,
          description: course.description || '',
          startDate: startDate,
          endDate: endDate,
          isActive: course.isActive,
        });
      } else {
        reset({
          title: '',
          description: '',
          startDate: '',
          endDate: '',
          isActive: true,
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
      if (mode === 'create') {
        result = await createCourse({
          title: data.title,
          description: data.description || null,
          start_date: data.startDate,
          end_date: data.endDate,
        });
      } else if (course) {
        result = await updateCourse(course.id, {
          title: data.title,
          description: data.description || null,
          start_date: data.startDate,
          end_date: data.endDate,
          is_active: data.isActive,
        });
      }

      if (result && 'error' in result) {
        setError(result.error || 'Error al guardar el curso');
      } else {
        onClose();
        router.refresh();
      }
    } catch (err) {
      setError('Error inesperado al guardar el curso');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && !isSubmitting && onClose()}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>
            {mode === 'create' ? 'Crear Nuevo Curso' : 'Editar Curso'}
          </DialogTitle>
          <DialogDescription>
            {mode === 'create'
              ? 'Completa la información del nuevo curso.'
              : 'Modifica la información del curso.'}
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
              {...register('title')}
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
              {...register('description')}
              error={errors.description?.message}
              disabled={isSubmitting}
              rows={4}
            />
          </div>

          {/* Dates */}
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="startDate">
                Fecha de Inicio <span className="text-red-500">*</span>
              </Label>
              <Input
                id="startDate"
                type="date"
                {...register('startDate')}
                error={errors.startDate?.message}
                disabled={isSubmitting}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="endDate">
                Fecha de Fin <span className="text-red-500">*</span>
              </Label>
              <Input
                id="endDate"
                type="date"
                {...register('endDate')}
                error={errors.endDate?.message}
                disabled={isSubmitting}
              />
            </div>
          </div>

          {/* Active checkbox (only in edit mode) */}
          {mode === 'edit' && (
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="isActive"
                {...register('isActive')}
                disabled={isSubmitting}
                className="h-4 w-4 rounded border-slate-300 text-purple-600 focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              />
              <Label htmlFor="isActive" className="cursor-pointer font-normal">
                Curso activo
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
              ) : (
                mode === 'create' ? 'Crear Curso' : 'Guardar Cambios'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
