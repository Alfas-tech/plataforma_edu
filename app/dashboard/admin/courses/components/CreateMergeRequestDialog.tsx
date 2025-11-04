"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { CourseOverview } from "@/src/presentation/types/course";

interface CreateMergeRequestDialogProps {
  course: CourseOverview;
  sourceBranchId: string | null;
  isOpen: boolean;
  onClose: () => void;
}

/**
 * This component is deprecated as the branch/merge request system has been removed.
 * Keeping the interface for backwards compatibility but returns a notice dialog.
 */
export function CreateMergeRequestDialog({
  isOpen,
  onClose,
}: CreateMergeRequestDialogProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Función no disponible</DialogTitle>
          <DialogDescription>
            El sistema de merge requests ha sido removido. Esta funcionalidad ya no está disponible.
          </DialogDescription>
        </DialogHeader>
      </DialogContent>
    </Dialog>
  );
}
