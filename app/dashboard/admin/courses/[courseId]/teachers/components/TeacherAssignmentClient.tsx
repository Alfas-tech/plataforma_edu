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
import { GraduationCap, UserPlus, UserMinus, Mail } from "lucide-react";
import Image from "next/image";
import {
  assignTeacherToCourse,
  removeTeacherFromCourse,
} from "@/src/presentation/actions/course.actions";
import { useRouter } from "next/navigation";

interface TeacherData {
  id: string;
  email: string;
  fullName: string | null;
  avatarUrl: string | null;
  displayName: string;
}

interface TeacherAssignmentClientProps {
  courseId: string;
  assignedTeachers: TeacherData[];
  allTeachers: TeacherData[];
}

export function TeacherAssignmentClient({
  courseId,
  assignedTeachers,
  allTeachers,
}: TeacherAssignmentClientProps) {
  const router = useRouter();
  const [selectedTeacher, setSelectedTeacher] = useState<TeacherData | null>(
    null
  );
  const [action, setAction] = useState<"assign" | "remove" | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Filter available teachers (those not assigned yet)
  const availableTeachers = allTeachers.filter(
    (teacher) =>
      !assignedTeachers.some((assigned) => assigned.id === teacher.id)
  );

  const handleAssignClick = (teacher: TeacherData) => {
    setSelectedTeacher(teacher);
    setAction("assign");
    setError(null);
  };

  const handleRemoveClick = (teacher: TeacherData) => {
    setSelectedTeacher(teacher);
    setAction("remove");
    setError(null);
  };

  const handleConfirm = async () => {
    if (!selectedTeacher || !action) return;

    setIsLoading(true);
    setError(null);

    try {
      let result;
      if (action === "assign") {
        result = await assignTeacherToCourse(courseId, selectedTeacher.id);
      } else {
        result = await removeTeacherFromCourse(courseId, selectedTeacher.id);
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

  return (
    <>
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Assigned Teachers Card */}
        <Card className="border-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <GraduationCap className="h-5 w-5 text-emerald-600" />
              Docentes Asignados ({assignedTeachers.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {assignedTeachers.length === 0 ? (
              <div className="rounded-lg border border-dashed border-slate-300 bg-slate-50 p-8 text-center">
                <GraduationCap className="mx-auto mb-3 h-12 w-12 text-slate-400" />
                <p className="text-sm text-slate-600">
                  No hay docentes asignados a este curso
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

        {/* Available Teachers Card */}
        <Card className="border-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <UserPlus className="h-5 w-5 text-blue-600" />
              Docentes Disponibles ({availableTeachers.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {availableTeachers.length === 0 ? (
              <div className="rounded-lg border border-dashed border-slate-300 bg-slate-50 p-8 text-center">
                <UserPlus className="mx-auto mb-3 h-12 w-12 text-slate-400" />
                <p className="text-sm text-slate-600">
                  {allTeachers.length === 0
                    ? "No hay docentes registrados en la plataforma"
                    : "Todos los docentes están asignados a este curso"}
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

      {/* Confirmation Dialog */}
      <Dialog open={!!selectedTeacher && !!action} onOpenChange={handleCancel}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {action === "assign"
                ? "Asignar Docente al Curso"
                : "Remover Docente del Curso"}
            </DialogTitle>
            <DialogDescription>
              {action === "assign"
                ? "¿Estás seguro de que deseas asignar este docente al curso? Podrá editar el contenido del curso."
                : "¿Estás seguro de que deseas remover este docente del curso? Perderá acceso para editar el contenido."}
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
              disabled={isLoading}
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
