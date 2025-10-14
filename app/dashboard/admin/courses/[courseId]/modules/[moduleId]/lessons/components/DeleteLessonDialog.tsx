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
import { deleteLesson } from "@/src/presentation/actions/content.actions";
import { useRouter } from "next/navigation";

interface LessonData {
  id: string;
  title: string;
}

interface DeleteLessonDialogProps {
  isOpen: boolean;
  onClose: () => void;
  lesson: LessonData | null;
}

export function DeleteLessonDialog({
  isOpen,
  onClose,
  lesson,
}: DeleteLessonDialogProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleConfirm = async () => {
    if (!lesson) return;

    setIsLoading(true);
    setError(null);

    try {
      const result = await deleteLesson(lesson.id);

      if ("error" in result) {
        setError(result.error || "Error al eliminar la lección");
      } else {
        onClose();
        router.refresh();
      }
    } catch (err) {
      setError("Error inesperado al eliminar la lección");
    } finally {
      setIsLoading(false);
    }
  };

  if (!lesson) return null;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-red-600">
            <AlertTriangle className="h-5 w-5" />
            Eliminar Lección
          </DialogTitle>
          <DialogDescription>
            Esta acción no se puede deshacer. Se eliminará la lección y el
            progreso de los estudiantes en esta lección.
          </DialogDescription>
        </DialogHeader>

        <div className="my-4 rounded-lg border border-red-200 bg-red-50 p-4">
          <p className="text-sm font-semibold text-red-900">{lesson.title}</p>
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
            className="bg-red-600 hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isLoading ? (
              <>
                <span className="mr-2 inline-block h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></span>
                Eliminando...
              </>
            ) : (
              "Eliminar Lección"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
