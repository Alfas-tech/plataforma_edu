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
import { deleteTopic } from "@/src/presentation/actions/content.actions";

interface TopicData {
  id: string;
  title: string;
  description: string | null;
}

interface DeleteTopicDialogProps {
  isOpen: boolean;
  onClose: () => void;
  topic: TopicData | null;
}

export function DeleteTopicDialog({
  isOpen,
  onClose,
  topic,
}: DeleteTopicDialogProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleConfirm = async () => {
    if (!topic) {
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const result = await deleteTopic(topic.id);

      if ("error" in result) {
        setError(result.error || "Error al eliminar el tópico");
      } else {
        onClose();
        router.refresh();
      }
    } catch (err) {
      setError("Error inesperado al eliminar el tópico");
    } finally {
      setIsLoading(false);
    }
  };

  if (!topic) {
    return null;
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open: boolean) => !open && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-red-600">
            <AlertTriangle className="h-5 w-5" />
            Eliminar tópico
          </DialogTitle>
          <DialogDescription>
            Esta acción no se puede deshacer. Se eliminará el tópico y todos los
            recursos asociados.
          </DialogDescription>
        </DialogHeader>

        <div className="my-4 rounded-lg border border-red-200 bg-red-50 p-4">
          <p className="mb-1 text-sm font-semibold text-red-900">
            {topic.title}
          </p>
          {topic.description && (
            <p className="text-sm text-red-700">{topic.description}</p>
          )}
        </div>

        <div className="rounded-lg border border-orange-200 bg-orange-50 p-3">
          <p className="text-sm font-medium text-orange-900">
            ⚠️ Se eliminarán permanentemente:
          </p>
          <ul className="mt-2 list-inside list-disc space-y-1 text-sm text-orange-700">
            <li>El tópico completo</li>
            <li>Todos los recursos vinculados</li>
            <li>El progreso registrado en estos recursos</li>
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
            className="bg-red-600 hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isLoading ? (
              <>
                <span className="mr-2 inline-block h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></span>
                Eliminando...
              </>
            ) : (
              "Eliminar tópico"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
