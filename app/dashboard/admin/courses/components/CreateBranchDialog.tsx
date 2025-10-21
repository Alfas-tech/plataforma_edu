"use client";

import { useEffect, useMemo, useState, useTransition, type ChangeEvent } from "react";
import { useRouter } from "next/navigation";
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
import { Loader2 } from "lucide-react";
import type { CourseOverview } from "@/src/presentation/types/course";
import { createCourseBranch } from "@/src/presentation/actions/course.actions";

interface CreateBranchDialogProps {
  course: CourseOverview;
  selectedBranchId: string | null;
  isOpen: boolean;
  onClose: () => void;
}

export function CreateBranchDialog({
  course,
  selectedBranchId,
  isOpen,
  onClose,
}: CreateBranchDialogProps) {
  const router = useRouter();
  const [branchName, setBranchName] = useState("");
  const [description, setDescription] = useState("");
  const [baseVersionId, setBaseVersionId] = useState<string>("");
  const [newVersionLabel, setNewVersionLabel] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const branchLookup = useMemo(() => {
    const map = new Map<string, CourseOverview["branches"][number]>();
    course.branches.forEach((branch) => {
      map.set(branch.id, branch);
    });
    if (course.defaultBranch) {
      map.set(course.defaultBranch.id, course.defaultBranch);
    }
    return map;
  }, [course]);

  const defaultBranch = useMemo(() => {
    if (selectedBranchId && branchLookup.has(selectedBranchId)) {
      return branchLookup.get(selectedBranchId) ?? null;
    }
    if (course.defaultBranch) {
      return course.defaultBranch;
    }
    return course.branches[0] ?? null;
  }, [branchLookup, course, selectedBranchId]);

  const defaultBaseVersionId = useMemo(() => {
    if (!defaultBranch) {
      return "";
    }
    return (
      defaultBranch.tipVersionId ??
      defaultBranch.baseVersionId ??
      ""
    );
  }, [defaultBranch]);

  useEffect(() => {
    if (isOpen) {
      setBranchName("");
      setDescription("");
      setNewVersionLabel("");
      setError(null);
      setBaseVersionId(defaultBaseVersionId);
    }
  }, [isOpen, defaultBaseVersionId]);

  const versionOptions = useMemo(() => {
    const options: Array<{ value: string; label: string }> = [];
    const seen = new Set<string>();

    course.branches.forEach((branch) => {
      if (branch.tipVersionId && !seen.has(branch.tipVersionId)) {
        options.push({
          value: branch.tipVersionId,
          label: `${branch.name} · ${branch.tipVersionLabel ?? "Sin etiqueta"}`,
        });
        seen.add(branch.tipVersionId);
      }
      if (branch.baseVersionId && !seen.has(branch.baseVersionId)) {
        options.push({
          value: branch.baseVersionId,
          label: `${branch.name} · Base ${branch.baseVersionLabel ?? "Sin etiqueta"}`,
        });
        seen.add(branch.baseVersionId);
      }
    });

    if (course.defaultBranch) {
      const branch = course.defaultBranch;
      if (branch.tipVersionId && !seen.has(branch.tipVersionId)) {
        options.push({
          value: branch.tipVersionId,
          label: `${branch.name} · ${branch.tipVersionLabel ?? "Sin etiqueta"}`,
        });
        seen.add(branch.tipVersionId);
      }
      if (branch.baseVersionId && !seen.has(branch.baseVersionId)) {
        options.push({
          value: branch.baseVersionId,
          label: `${branch.name} · Base ${branch.baseVersionLabel ?? "Sin etiqueta"}`,
        });
        seen.add(branch.baseVersionId);
      }
    }

    return options;
  }, [course]);

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (isPending) {
      return;
    }

    if (!branchName.trim()) {
      setError("El nombre de la rama es obligatorio");
      return;
    }

    if (!baseVersionId) {
      setError("Selecciona la versión base para la rama");
      return;
    }

    if (!newVersionLabel.trim()) {
      setError("Define la etiqueta de la nueva versión");
      return;
    }

    startTransition(async () => {
      setError(null);
      const result = await createCourseBranch({
        courseId: course.id,
        branchName: branchName.trim(),
        description: description.trim() || null,
        baseVersionId,
        newVersionLabel: newVersionLabel.trim(),
      });

      if (result && "error" in result && result.error) {
        setError(result.error);
        return;
      }

      onClose();
      router.refresh();
    });
  };

  const disableSubmit =
    isPending || versionOptions.length === 0 || !baseVersionId;

  return (
  <Dialog open={isOpen} onOpenChange={(open: boolean) => !isPending && !open && onClose()}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>Crear nueva rama</DialogTitle>
          <DialogDescription>
            Duplica la versión seleccionada para trabajar cambios sin afectar a los estudiantes.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="branchName">Nombre de la rama</Label>
            <Input
              id="branchName"
              placeholder="ej. rediseño-front"
              value={branchName}
              onChange={(event: ChangeEvent<HTMLInputElement>) =>
                setBranchName(event.target.value)
              }
              disabled={isPending}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="newVersionLabel">Etiqueta de la nueva versión</Label>
            <Input
              id="newVersionLabel"
              placeholder="ej. v2.0.0-redesign"
              value={newVersionLabel}
              onChange={(event: ChangeEvent<HTMLInputElement>) =>
                setNewVersionLabel(event.target.value)
              }
              disabled={isPending}
            />
          </div>

          <div className="space-y-2">
            <Label>Versión base</Label>
            <Select
              value={baseVersionId}
              onValueChange={setBaseVersionId}
              disabled={isPending || versionOptions.length === 0}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecciona una versión" />
              </SelectTrigger>
              <SelectContent>
                {versionOptions.map((option: { value: string; label: string }) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Descripción (opcional)</Label>
            <Textarea
              id="description"
              placeholder="Describe el objetivo de esta rama"
              value={description}
              onChange={(event: ChangeEvent<HTMLTextAreaElement>) =>
                setDescription(event.target.value)
              }
              rows={3}
              disabled={isPending}
            />
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
                  Creando...
                </>
              ) : (
                "Crear rama"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
