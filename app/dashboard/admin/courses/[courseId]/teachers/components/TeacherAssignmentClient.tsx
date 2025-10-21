"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { GraduationCap, UserPlus, UserMinus, Mail } from "lucide-react";
import Image from "next/image";
import {
  assignTeacherToCourseVersion,
  removeTeacherFromCourseVersion,
} from "@/src/presentation/actions/course.actions";
import { useRouter } from "next/navigation";

interface TeacherData {
  id: string;
  email: string;
  fullName: string | null;
  avatarUrl: string | null;
  displayName: string;
}

interface VersionAssignment {
  id: string;
  label: string;
  summary: string | null;
  status: string;
  isActive: boolean;
  isPublished: boolean;
  isTip: boolean;
  createdAt: string;
  updatedAt: string;
  branchId: string | null;
  branchName: string | null;
  teachers: TeacherData[];
}

interface TeacherAssignmentClientProps {
  courseId: string;
  versions: VersionAssignment[];
  allTeachers: TeacherData[];
}

export function TeacherAssignmentClient({
  courseId,
  versions,
  allTeachers,
}: TeacherAssignmentClientProps) {
  const router = useRouter();
  const [selectedVersionId, setSelectedVersionId] = useState<string>(
    versions[0]?.id ?? ""
  );
  const [selectedTeacher, setSelectedTeacher] = useState<TeacherData | null>(
    null
  );
  const [action, setAction] = useState<"assign" | "remove" | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const selectedVersion =
    versions.find((version) => version.id === selectedVersionId) ?? null;

  const assignedTeachers = selectedVersion?.teachers ?? [];

  const availableTeachers = selectedVersion
    ? allTeachers.filter(
        (teacher) =>
          !assignedTeachers.some((assigned) => assigned.id === teacher.id)
      )
    : [];

  const handleVersionChange = (value: string) => {
    setSelectedVersionId(value);
    setSelectedTeacher(null);
    setAction(null);
    setError(null);
  };

  const handleAssignClick = (teacher: TeacherData) => {
    if (!selectedVersion) {
      return;
    }
    setSelectedTeacher(teacher);
    setAction("assign");
    setError(null);
  };

  const handleRemoveClick = (teacher: TeacherData) => {
    if (!selectedVersion) {
      return;
    }
    setSelectedTeacher(teacher);
    setAction("remove");
    setError(null);
  };

  const handleConfirm = async () => {
    if (!selectedTeacher || !action || !selectedVersion) {
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      let result;
      if (action === "assign") {
        result = await assignTeacherToCourseVersion(
          courseId,
          selectedVersion.id,
          selectedTeacher.id
        );
      } else {
        result = await removeTeacherFromCourseVersion(
          courseId,
          selectedVersion.id,
          selectedTeacher.id
        );
      }

      if ("error" in result) {
        setError(result.error || "Error en la operación");
      } else {
        setSelectedTeacher(null);
        setAction(null);
        router.refresh();
      }
    } catch (err) {
      setError("Error inesperado al realizar la acción");
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    setSelectedTeacher(null);
    setAction(null);
    setError(null);
  };

  if (versions.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-slate-300 bg-slate-50 p-8 text-center">
        <GraduationCap className="mx-auto mb-3 h-12 w-12 text-slate-400" />
        <p className="text-sm text-slate-600">
          No hay versiones disponibles para asignar docentes.
        </p>
      </div>
    );
  }

  const versionStatusLabel = selectedVersion
    ? (() => {
        switch (selectedVersion.status) {
          case "published":
            return "Publicada";
          case "pending_review":
            return "Pendiente de revisión";
          case "draft":
            return "En borrador";
          case "archived":
            return "Archivada";
          default:
            return selectedVersion.status;
        }
      })()
    : "";

  return (
    <>
      <Card className="mb-6 border-2">
        <CardHeader>
          <CardTitle className="text-base sm:text-lg">
            Selecciona la versión a gestionar
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-sm text-slate-600">
                Gestiona los docentes asignados por versión del curso.
              </p>
              {selectedVersion && (
                <div className="mt-2 flex flex-wrap items-center gap-2 text-xs">
                  <Badge variant="outline" className="border-slate-300">
                    Edición del curso: {selectedVersion.branchName ?? "General"}
                  </Badge>
                  <Badge
                    variant="outline"
                    className="border-emerald-300 text-emerald-700"
                  >
                    Estado: {versionStatusLabel}
                  </Badge>
                  <Badge
                    variant="outline"
                    className={
                      selectedVersion.isPublished
                        ? "border-green-300 text-green-700"
                        : "border-amber-300 text-amber-700"
                    }
                  >
                    {selectedVersion.isPublished
                      ? "Publicada"
                      : "Sin publicar"}
                  </Badge>
                  {selectedVersion.isActive && (
                    <Badge className="bg-emerald-600 text-white">
                      Versión activa
                    </Badge>
                  )}
                </div>
              )}
            </div>
            <Select
              value={selectedVersionId}
              onValueChange={handleVersionChange}
              disabled={versions.length === 0}
            >
              <SelectTrigger className="w-full md:w-64">
                <SelectValue placeholder="Selecciona una versión" />
              </SelectTrigger>
              <SelectContent>
                {versions.map((version) => (
                  <SelectItem key={version.id} value={version.id}>
                    {(version.branchName ?? "Edición principal") +
                      " • " +
                      version.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {selectedVersion?.summary && (
            <p className="mt-4 text-sm text-slate-600">
              {selectedVersion.summary}
            </p>
          )}
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="border-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <GraduationCap className="h-5 w-5 text-emerald-600" />
              Docentes asignados ({assignedTeachers.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {assignedTeachers.length === 0 ? (
              <div className="rounded-lg border border-dashed border-slate-300 bg-slate-50 p-8 text-center">
                <GraduationCap className="mx-auto mb-3 h-12 w-12 text-slate-400" />
                <p className="text-sm text-slate-600">
                  No hay docentes asignados a esta versión.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {assignedTeachers.map((teacher) => (
                  <div
                    key={teacher.id}
                    className="flex items-center justify-between gap-3 rounded-lg border bg-white p-4 transition-shadow hover:shadow-md"
                  >
                    <div className="flex min-w-0 flex-1 items-center gap-3">
                      {teacher.avatarUrl ? (
                        <div className="relative h-10 w-10 flex-shrink-0 overflow-hidden rounded-full">
                          <Image
                            src={teacher.avatarUrl}
                            alt={teacher.displayName}
                            fill
                            className="object-cover"
                            unoptimized
                          />
                        </div>
                      ) : (
                        <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 text-sm font-semibold text-white">
                          {teacher.displayName.charAt(0).toUpperCase()}
                        </div>
                      )}
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <p className="truncate font-semibold text-slate-800">
                            {teacher.displayName}
                          </p>
                          <Badge
                            variant="secondary"
                            className="bg-emerald-100 text-emerald-700"
                          >
                            Asignado
                          </Badge>
                        </div>
                        <div className="flex items-center gap-1 text-xs text-slate-600">
                          <Mail className="h-3 w-3" />
                          <span className="truncate">{teacher.email}</span>
                        </div>
                      </div>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleRemoveClick(teacher)}
                      className="flex-shrink-0 border-red-300 text-red-600 hover:bg-red-50"
                      disabled={!selectedVersion}
                    >
                      <UserMinus className="mr-2 h-4 w-4" />
                      Remover
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="border-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <UserPlus className="h-5 w-5 text-blue-600" />
              Docentes disponibles ({availableTeachers.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {availableTeachers.length === 0 ? (
              <div className="rounded-lg border border-dashed border-slate-300 bg-slate-50 p-8 text-center">
                <UserPlus className="mx-auto mb-3 h-12 w-12 text-slate-400" />
                <p className="text-sm text-slate-600">
                  {allTeachers.length === 0
                    ? "No hay docentes registrados en la plataforma."
                    : "Todos los docentes están asignados a esta versión."}
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {availableTeachers.map((teacher) => (
                  <div
                    key={teacher.id}
                    className="flex items-center justify-between gap-3 rounded-lg border bg-white p-4 transition-shadow hover:shadow-md"
                  >
                    <div className="flex min-w-0 flex-1 items-center gap-3">
                      {teacher.avatarUrl ? (
                        <div className="relative h-10 w-10 flex-shrink-0 overflow-hidden rounded-full">
                          <Image
                            src={teacher.avatarUrl}
                            alt={teacher.displayName}
                            fill
                            className="object-cover"
                            unoptimized
                          />
                        </div>
                      ) : (
                        <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-purple-600 text-sm font-semibold text-white">
                          {teacher.displayName.charAt(0).toUpperCase()}
                        </div>
                      )}
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-semibold text-slate-800">
                          {teacher.displayName}
                        </p>
                        <div className="flex items-center gap-1 text-xs text-slate-600">
                          <Mail className="h-3 w-3" />
                          <span className="truncate">{teacher.email}</span>
                        </div>
                      </div>
                    </div>
                    <Button
                      size="sm"
                      onClick={() => handleAssignClick(teacher)}
                      className="flex-shrink-0 bg-emerald-600 hover:bg-emerald-700"
                      disabled={!selectedVersion}
                    >
                      <UserPlus className="mr-2 h-4 w-4" />
                      Asignar
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Dialog open={!!selectedTeacher && !!action} onOpenChange={handleCancel}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {action === "assign"
                ? "Asignar docente a la versión"
                : "Remover docente de la versión"}
            </DialogTitle>
            <DialogDescription>
              {action === "assign"
                ? `¿Estás seguro de que deseas asignar este docente a la versión ${selectedVersion?.label}? Podrá editar el contenido asociado.`
                : `¿Estás seguro de que deseas remover este docente de la versión ${selectedVersion?.label}? Perderá acceso para editar su contenido.`}
            </DialogDescription>
          </DialogHeader>

          {selectedTeacher && (
            <div className="my-4 rounded-lg border bg-slate-50 p-4">
              <div className="flex items-center gap-3">
                {selectedTeacher.avatarUrl ? (
                  <div className="relative h-12 w-12 flex-shrink-0 overflow-hidden rounded-full">
                    <Image
                      src={selectedTeacher.avatarUrl}
                      alt={selectedTeacher.displayName}
                      fill
                      className="object-cover"
                      unoptimized
                    />
                  </div>
                ) : (
                  <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 text-sm font-semibold text-white">
                    {selectedTeacher.displayName.charAt(0).toUpperCase()}
                  </div>
                )}
                <div>
                  <p className="font-semibold text-slate-800">
                    {selectedTeacher.displayName}
                  </p>
                  <p className="text-sm text-slate-600">
                    {selectedTeacher.email}
                  </p>
                </div>
              </div>
            </div>
          )}

          {error && (
            <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800">
              {error}
            </div>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={handleCancel}
              disabled={isLoading}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleConfirm}
              disabled={isLoading || !selectedVersion}
              className={
                action === "assign"
                  ? "bg-emerald-600 hover:bg-emerald-700"
                  : "bg-red-600 hover:bg-red-700"
              }
            >
              {isLoading ? "Procesando..." : "Confirmar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
