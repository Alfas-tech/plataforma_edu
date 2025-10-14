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
import { deleteModule } from "@/src/presentation/actions/content.actions";
import { useRouter } from "next/navigation";

interface ModuleData {
  id: string;
  title: string;
  description: string | null;
}

interface DeleteModuleDialogProps {
  isOpen: boolean;
  onClose: () => void;
  module: ModuleData | null;
}

export function DeleteModuleDialog({ isOpen, onClose, module }: DeleteModuleDialogProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleConfirm = async () => {
    if (!module) return;

    setIsLoading(true);
    setError(null);

    try {
      const result = await deleteModule(module.id);

      if ('error' in result) {
        setError(result.error || 'Error al eliminar el módulo');
      } else {
        onClose();
        router.refresh();
      }
    } catch (err) {
      setError('Error inesperado al eliminar el módulo');
    } finally {
      setIsLoading(false);
    }
  };

  if (!module) return null;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-red-600">
            <AlertTriangle className="h-5 w-5" />
            Eliminar Módulo
          </DialogTitle>
          <DialogDescription>
            Esta acción no se puede deshacer. Se eliminará el módulo y todas las lecciones asociadas.
          </DialogDescription>
        </DialogHeader>

        <div className="my-4 rounded-lg border border-red-200 bg-red-50 p-4">
          <p className="mb-1 text-sm font-semibold text-red-900">
            {module.title}
          </p>
          {module.description && (
            <p className="text-sm text-red-700">{module.description}</p>
          )}
        </div>

        <div className="rounded-lg border border-orange-200 bg-orange-50 p-3">
          <p className="text-sm font-medium text-orange-900">
            ⚠️ Se eliminarán permanentemente:
          </p>
          <ul className="mt-2 list-inside list-disc space-y-1 text-sm text-orange-700">
            <li>El módulo completo</li>
            <li>Todas las lecciones del módulo</li>
            <li>El progreso de los estudiantes en estas lecciones</li>
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
            className="bg-red-600 hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <>
                <span className="mr-2 inline-block h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></span>
                Eliminando...
              </>
            ) : (
              'Eliminar Módulo'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
