"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { CourseOverview } from "@/src/presentation/types/course";
import { deleteCourseBranch } from "@/src/presentation/actions/course.actions";

interface DeleteBranchDialogProps {
  isOpen: boolean;
  onClose: () => void;
  course: CourseOverview | null;
  branch: CourseOverview["branches"][number] | CourseOverview["defaultBranch"] | null;
}

export function DeleteBranchDialog({
  isOpen,
  onClose,
  course,
  branch,
}: DeleteBranchDialogProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!course || !branch) {
    return null;
  }

  const handleConfirm = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const result = await deleteCourseBranch({
        courseId: course.id,
        branchId: branch.id,
      });

      if ("error" in result) {
        setError(result.error || "Error al eliminar la rama");
        return;
      }

      onClose();
      router.refresh();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Error inesperado al eliminar la rama"
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
  <Dialog open={isOpen} onOpenChange={(open: boolean) => !open && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-red-600">
            <AlertTriangle className="h-5 w-5" />
            Eliminar rama
          </DialogTitle>
          <DialogDescription>
            Esta acción elimina de forma permanente la rama seleccionada, incluyendo
            sus versiones, módulos y lecciones asociados.
          </DialogDescription>
        </DialogHeader>

        <div className="my-4 space-y-2 rounded-lg border border-red-200 bg-red-50 p-4 text-sm">
          <p className="font-semibold text-red-900">{branch.name}</p>
          <p className="text-red-800">
            Curso: <span className="font-medium">{course.title}</span>
          </p>
          {branch.tipVersionLabel && (
            <p className="text-red-700">
              Última versión: <span className="font-medium">{branch.tipVersionLabel}</span>
            </p>
          )}
        </div>

        <div className="rounded-lg border border-orange-200 bg-orange-50 p-3 text-sm text-orange-800">
          <p className="font-semibold text-orange-900">Se eliminará:</p>
          <ul className="mt-2 list-inside list-disc space-y-1">
            <li>El historial de versiones de la rama</li>
            <li>Módulos y lecciones asociados</li>
            <li>Solicitudes de fusión en curso</li>
          </ul>
        </div>

        {error && (
          <div className="mt-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800">
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
            {isLoading ? "Eliminando..." : "Eliminar rama"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
