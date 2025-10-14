"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  PlusCircle,
  Calendar,
  Edit,
  Trash2,
  Users,
  CheckCircle2,
  Clock,
  XCircle,
  BookOpen,
} from "lucide-react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { CourseFormDialog } from "./CourseFormDialog";
import { DeleteCourseDialog } from "./DeleteCourseDialog";

interface CourseData {
  id: string;
  title: string;
  description: string | null;
  startDate: string;
  endDate: string;
  isActive: boolean;
  status: "upcoming" | "active" | "ended";
  daysRemaining: number;
  isCurrentlyActive: boolean;
}

interface CourseManagementClientProps {
  courses: CourseData[];
}

export function CourseManagementClient({
  courses,
}: CourseManagementClientProps) {
  const router = useRouter();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editingCourse, setEditingCourse] = useState<CourseData | null>(null);
  const [deletingCourse, setDeletingCourse] = useState<CourseData | null>(null);

  const handleCreateClick = () => {
    setIsCreateDialogOpen(true);
  };

  const handleEditClick = (course: CourseData) => {
    setEditingCourse(course);
  };

  const handleDeleteClick = (course: CourseData) => {
    setDeletingCourse(course);
  };

  const handleAssignTeachersClick = (courseId: string) => {
    router.push(`/dashboard/admin/courses/${courseId}/teachers`);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("es-ES", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const getStatusBadge = (course: CourseData) => {
    if (course.status === "active") {
      return (
        <Badge className="bg-green-100 text-green-700 hover:bg-green-100">
          <CheckCircle2 className="mr-1 h-3 w-3" />
          Activo
        </Badge>
      );
    } else if (course.status === "upcoming") {
      return (
        <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-100">
          <Clock className="mr-1 h-3 w-3" />
          Próximo
        </Badge>
      );
    } else {
      return (
        <Badge className="bg-slate-100 text-slate-700 hover:bg-slate-100">
          <XCircle className="mr-1 h-3 w-3" />
          Finalizado
        </Badge>
      );
    }
  };

  return (
    <>
      {/* Create Button */}
      <div className="mb-6">
        <Button
          onClick={handleCreateClick}
          className="bg-purple-600 hover:bg-purple-700"
        >
          <PlusCircle className="mr-2 h-4 w-4" />
          Crear Nuevo Curso
        </Button>
      </div>

      {/* Courses List */}
      {courses.length === 0 ? (
        <Card className="border-2">
          <CardContent className="p-8 text-center">
            <div className="rounded-lg border border-dashed border-slate-300 bg-slate-50 p-8">
              <Calendar className="mx-auto mb-3 h-12 w-12 text-slate-400" />
              <h3 className="mb-2 text-lg font-semibold text-slate-800">
                No hay cursos creados
              </h3>
              <p className="mb-4 text-sm text-slate-600">
                Comienza creando el primer curso de la plataforma
              </p>
              <Button onClick={handleCreateClick} variant="outline">
                <PlusCircle className="mr-2 h-4 w-4" />
                Crear primer curso
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {courses.map((course) => (
            <Card
              key={course.id}
              className="border-2 transition-shadow hover:shadow-lg"
            >
              <CardHeader>
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="mb-2 flex flex-wrap items-center gap-2">
                      <CardTitle className="text-xl">{course.title}</CardTitle>
                      {getStatusBadge(course)}
                      {!course.isActive && (
                        <Badge
                          variant="outline"
                          className="border-orange-300 text-orange-600"
                        >
                          Inactivo
                        </Badge>
                      )}
                    </div>
                    {course.description && (
                      <p className="text-sm text-slate-600">
                        {course.description}
                      </p>
                    )}
                  </div>
                  <div className="flex flex-shrink-0 gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleEditClick(course)}
                    >
                      <Edit className="h-4 w-4 sm:mr-2" />
                      <span className="hidden sm:inline">Editar</span>
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleDeleteClick(course)}
                      className="border-red-300 text-red-600 hover:bg-red-50"
                    >
                      <Trash2 className="h-4 w-4 sm:mr-2" />
                      <span className="hidden sm:inline">Eliminar</span>
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  <div className="flex items-start gap-3 rounded-lg border bg-slate-50 p-3">
                    <Calendar className="mt-0.5 h-5 w-5 flex-shrink-0 text-blue-600" />
                    <div>
                      <p className="text-xs font-medium text-slate-600">
                        Fecha de Inicio
                      </p>
                      <p className="text-sm font-semibold text-slate-800">
                        {formatDate(course.startDate)}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 rounded-lg border bg-slate-50 p-3">
                    <Calendar className="mt-0.5 h-5 w-5 flex-shrink-0 text-red-600" />
                    <div>
                      <p className="text-xs font-medium text-slate-600">
                        Fecha de Fin
                      </p>
                      <p className="text-sm font-semibold text-slate-800">
                        {formatDate(course.endDate)}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 rounded-lg border bg-slate-50 p-3">
                    <Users className="mt-0.5 h-5 w-5 flex-shrink-0 text-emerald-600" />
                    <div>
                      <p className="text-xs font-medium text-slate-600">
                        Docentes
                      </p>
                      <Button
                        variant="link"
                        size="sm"
                        className="h-auto p-0 text-sm font-semibold text-emerald-600"
                        onClick={() => handleAssignTeachersClick(course.id)}
                      >
                        Gestionar →
                      </Button>
                    </div>
                  </div>
                </div>

                <div className="mt-4">
                  <Link href={`/dashboard/admin/courses/${course.id}/content`}>
                    <Button variant="outline" size="sm" className="w-full">
                      <BookOpen className="mr-2 h-4 w-4" />
                      Gestionar Contenido (Módulos y Lecciones)
                    </Button>
                  </Link>
                </div>

                {course.status === "active" && course.daysRemaining > 0 && (
                  <div className="mt-4 rounded-lg border border-green-200 bg-green-50 p-3 text-sm text-green-800">
                    <strong>⏳ {course.daysRemaining} días restantes</strong>{" "}
                    hasta finalizar el curso
                  </div>
                )}

                {course.status === "upcoming" && (
                  <div className="mt-4 rounded-lg border border-blue-200 bg-blue-50 p-3 text-sm text-blue-800">
                    <strong>📅 Próximamente</strong> - El curso comenzará el{" "}
                    {formatDate(course.startDate)}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Dialogs */}
      <CourseFormDialog
        isOpen={isCreateDialogOpen}
        onClose={() => setIsCreateDialogOpen(false)}
        mode="create"
      />

      <CourseFormDialog
        isOpen={!!editingCourse}
        onClose={() => setEditingCourse(null)}
        mode="edit"
        course={editingCourse}
      />

      <DeleteCourseDialog
        isOpen={!!deletingCourse}
        onClose={() => setDeletingCourse(null)}
        course={deletingCourse}
      />
    </>
  );
}
