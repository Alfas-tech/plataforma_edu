"use client";

import { useEffect, useMemo, useState, useTransition, type ChangeEvent } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
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
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { CourseOverview } from "@/src/presentation/types/course";
import { createCourseMergeRequest } from "@/src/presentation/actions/course.actions";

interface CreateMergeRequestDialogProps {
  course: CourseOverview;
  sourceBranchId: string;
  isOpen: boolean;
  onClose: () => void;
}

export function CreateMergeRequestDialog({
  course,
  sourceBranchId,
  isOpen,
  onClose,
}: CreateMergeRequestDialogProps) {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [summary, setSummary] = useState("");
  const [targetBranchId, setTargetBranchId] = useState<string>("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const sourceBranch = useMemo(
    () => course.branches.find((branch) => branch.id === sourceBranchId) ?? null,
    [course.branches, sourceBranchId],
  );

  const availableTargets = useMemo(() => {
    return course.branches.filter((branch) => branch.id !== sourceBranchId);
  }, [course.branches, sourceBranchId]);

  useEffect(() => {
    if (isOpen) {
      setTitle("");
      setSummary("");
      setError(null);
      const suggestedTarget = course.defaultBranch?.id;
      if (suggestedTarget && suggestedTarget !== sourceBranchId) {
        setTargetBranchId(suggestedTarget);
      } else {
        setTargetBranchId(availableTargets[0]?.id ?? "");
      }
    }
  }, [availableTargets, course.defaultBranch?.id, isOpen, sourceBranchId]);

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (isPending) {
      return;
    }

    if (!title.trim()) {
      setError("El título es obligatorio");
      return;
    }

    if (!targetBranchId) {
      setError("Selecciona la edición destino");
      return;
    }

    startTransition(async () => {
      setError(null);
      const result = await createCourseMergeRequest({
        courseId: course.id,
        sourceBranchId,
        targetBranchId,
        title: title.trim(),
        summary: summary.trim() || null,
      });

      if (result && "error" in result && result.error) {
        setError(result.error);
        return;
      }

      onClose();
      router.refresh();
    });
  };

  const disableSubmit = isPending || availableTargets.length === 0;

  return (
    <Dialog open={isOpen} onOpenChange={(open: boolean) => !isPending && !open && onClose()}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Nueva solicitud de fusión</DialogTitle>
          <DialogDescription>
            Compara tu trabajo en <span className="font-semibold">{sourceBranch?.name}</span> con otra edición y solicita la revisión del equipo.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Título</Label>
            <Input
              id="title"
              placeholder="ej. Preparar contenido final para lanzamiento"
              value={title}
              onChange={(event: ChangeEvent<HTMLInputElement>) =>
                setTitle(event.target.value)
              }
              disabled={isPending}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="summary">Resumen (opcional)</Label>
            <Textarea
              id="summary"
              placeholder="Describe los cambios y el contexto para la revisión"
              value={summary}
              onChange={(event: ChangeEvent<HTMLTextAreaElement>) =>
                setSummary(event.target.value)
              }
              rows={4}
              disabled={isPending}
            />
          </div>

          <div className="space-y-2">
            <Label>Edición destino</Label>
            <Select
              value={targetBranchId}
              onValueChange={setTargetBranchId}
              disabled={isPending || availableTargets.length === 0}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecciona una edición" />
              </SelectTrigger>
              <SelectContent>
                {availableTargets.map((branch: CourseOverview["branches"][number]) => (
                  <SelectItem key={branch.id} value={branch.id}>
                    {branch.name} · {branch.tipVersionLabel ?? "Sin etiqueta"}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {error && (
            <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">
              {error}
            </div>
          )}

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isPending}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={disableSubmit}>
              {isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Enviando...
                </>
              ) : (
                "Crear solicitud"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
