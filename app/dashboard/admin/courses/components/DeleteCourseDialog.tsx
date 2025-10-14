"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { AlertTriangle } from "lucide-react";
import { deleteCourse } from "@/src/presentation/actions/course.actions";
import { useRouter } from "next/navigation";

interface CourseData {
  id: string;
  title: string;
  description: string | null;
}

interface DeleteCourseDialogProps {
  isOpen: boolean;
  onClose: () => void;
  course: CourseData | null;
}

export function DeleteCourseDialog({ isOpen, onClose, course }: DeleteCourseDialogProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleConfirm = async () => {
    if (!course) return;

    setIsLoading(true);
    setError(null);

    try {
      const result = await deleteCourse(course.id);

      if ('error' in result) {
        setError(result.error || 'Error al eliminar el curso');
      } else {
        onClose();
        router.refresh();
      }
    } catch (err) {
      setError('Error inesperado al eliminar el curso');
    } finally {
      setIsLoading(false);
    }
  };

  if (!course) return null;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-red-600">
            <AlertTriangle className="h-5 w-5" />
            Eliminar Curso
          </DialogTitle>
          <DialogDescription>
            Esta acción no se puede deshacer. Se eliminará el curso y todo su contenido asociado
            (módulos, lecciones, progreso de estudiantes, etc.).
          </DialogDescription>
        </DialogHeader>

        <div className="my-4 rounded-lg border border-red-200 bg-red-50 p-4">
          <p className="mb-1 text-sm font-semibold text-red-900">
            {course.title}
          </p>
          {course.description && (
            <p className="text-sm text-red-700">{course.description}</p>
          )}
        </div>

        <div className="rounded-lg border border-orange-200 bg-orange-50 p-3">
          <p className="text-sm font-medium text-orange-900">
            ⚠️ Se eliminarán permanentemente:
          </p>
          <ul className="mt-2 list-inside list-disc space-y-1 text-sm text-orange-700">
            <li>Todos los módulos del curso</li>
            <li>Todas las lecciones</li>
            <li>Asignaciones de docentes</li>
            <li>Progreso de estudiantes</li>
          </ul>
        </div>

        {error && (
          <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800">
            {error}
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isLoading}>
            Cancelar
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={isLoading}
            className="bg-red-600 hover:bg-red-700"
          >
            {isLoading ? 'Eliminando...' : 'Eliminar Curso'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
