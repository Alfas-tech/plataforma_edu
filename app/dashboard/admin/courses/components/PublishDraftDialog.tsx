"use client";

import { useState } from "react";
import { Rocket, Loader2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface PublishDraftDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void>;
  draftTitle: string;
  isPending: boolean;
}

export function PublishDraftDialog({
  isOpen,
  onClose,
  onConfirm,
  draftTitle,
  isPending,
}: PublishDraftDialogProps) {
  const handleConfirm = async () => {
    await onConfirm();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-100">
              <Rocket className="h-5 w-5 text-emerald-600" />
            </div>
            <DialogTitle className="text-xl">Publicar borrador</DialogTitle>
          </div>
          <DialogDescription className="pt-4 text-base">
            Estás a punto de publicar{" "}
            <span className="font-semibold text-slate-900">
              "{draftTitle}"
            </span>
            .
          </DialogDescription>
        </DialogHeader>

        <div className="rounded-lg border border-amber-200 bg-amber-50 p-4">
          <div className="flex gap-3">
            <AlertCircle className="h-5 w-5 flex-shrink-0 text-amber-600" />
            <div className="space-y-2 text-sm text-amber-800">
              <p className="font-medium">Ten en cuenta que:</p>
              <ul className="list-inside list-disc space-y-1 pl-1">
                <li>El curso actualmente publicado pasará al historial</li>
                <li>Este borrador se convertirá en la versión activa</li>
                <li>Los estudiantes verán inmediatamente esta nueva versión</li>
              </ul>
            </div>
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={isPending}
          >
            Cancelar
          </Button>
          <Button
            type="button"
            onClick={handleConfirm}
            disabled={isPending}
            className="bg-emerald-600 hover:bg-emerald-700"
          >
            {isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Publicando...
              </>
            ) : (
              <>
                <Rocket className="mr-2 h-4 w-4" />
                Confirmar publicación
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
