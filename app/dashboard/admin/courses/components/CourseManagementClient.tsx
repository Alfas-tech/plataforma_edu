"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  Archive,
  Edit,
  Eye,
  Loader2,
  PenSquare,
  PlusCircle,
  Rocket,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { CourseOverview } from "@/src/presentation/types/course";
import {
  archiveCourseVersion,
  publishCourseVersion,
} from "@/src/presentation/actions/course.actions";
import { useToast } from "@/components/ui/toast-provider";
import { CourseFormDialog } from "./CourseFormDialog";
import { PublishDraftDialog } from "./PublishDraftDialog";

interface CourseManagementClientProps {
  courses: CourseOverview[];
  mode?: "admin" | "teacher";
}

export function CourseManagementClient({
  courses,
  mode = "admin",
}: CourseManagementClientProps) {
  const router = useRouter();
  const { showToast } = useToast();
  const isAdminMode = mode === "admin";
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editingCourse, setEditingCourse] = useState<CourseOverview | null>(
    null
  );
  const [publishingCourse, setPublishingCourse] = useState<CourseOverview | null>(
    null
  );
  const [globalError, setGlobalError] = useState<string | null>(null);
  const [actionTarget, setActionTarget] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const sortedCourses = useMemo(() => {
    return courses
      .slice()
      .sort(
        (a, b) =>
          new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
      );
  }, [courses]);

  const formatDateTime = (value: string) =>
    new Date(value).toLocaleString("es-ES", {
      year: "numeric",
      month: "short",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });

  const getArchivedVersions = (course: CourseOverview) =>
    course.archivedVersions
      .slice()
      .sort(
        (a, b) =>
          new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
      );

  const handlePublishDraft = (course: CourseOverview) => {
    if (isPending) return;
    setPublishingCourse(course);
  };

  const confirmPublishDraft = async () => {
    if (!publishingCourse?.draftVersion || isPending) return;
    
    const draft = publishingCourse.draftVersion;
    
    startTransition(async () => {
      setGlobalError(null);
      setActionTarget(publishingCourse.id);
      try {
        const result = await publishCourseVersion({ versionId: draft.id });
        if (result && "error" in result && result.error) {
          showToast(result.error, "error");
          setGlobalError(result.error);
          return;
        }
        showToast(
          `✨ "${draft.title}" se ha publicado exitosamente`,
          "success"
        );
        setPublishingCourse(null);
        router.refresh();
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : "Error al publicar.";
        showToast(errorMessage, "error");
        setGlobalError(errorMessage);
      } finally {
        setActionTarget(null);
      }
    });
  };

  const handleArchiveActive = (course: CourseOverview) => {
    const activeVersion = course.activeVersion;
    if (!activeVersion || isPending) return;
    if (
      !window.confirm(
        `¿Archivar "${activeVersion.title}"? Los estudiantes ya no podrán acceder.`
      )
    )
      return;
    startTransition(async () => {
      setGlobalError(null);
      setActionTarget(course.id);
      try {
        const result = await archiveCourseVersion({
          versionId: activeVersion.id,
        });
        if (result && "error" in result && result.error) {
          showToast(result.error, "error");
          setGlobalError(result.error);
          return;
        }
        showToast(
          `📦 "${activeVersion.title}" se ha archivado correctamente`,
          "success"
        );
        router.refresh();
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : "Error al archivar.";
        showToast(errorMessage, "error");
        setGlobalError(errorMessage);
      } finally {
        setActionTarget(null);
      }
    });
  };

  const handleEditDraft = (courseId: string, draftId: string) => {
    router.push(`/dashboard/admin/courses/${courseId}/draft/${draftId}/edit`);
  };

  const handleViewActive = (courseId: string, versionId: string) => {
    router.push(`/dashboard/admin/courses/${courseId}/content?versionId=${versionId}`);
  };

  const handleCreateDraft = (courseId: string) => {
    router.push(`/dashboard/admin/courses/${courseId}/draft/new`);
  };

  return (
    <>
      <div className="mb-6 flex items-center justify-between">
        <h2 className="text-xl font-bold text-slate-900">Cursos</h2>
        {isAdminMode && courses.length === 0 && (
          <Button
            className="bg-purple-600 hover:bg-purple-700"
            onClick={() => setIsCreateDialogOpen(true)}
          >
            <PlusCircle className="mr-2 h-4 w-4" />
            Nuevo
          </Button>
        )}
      </div>
      {globalError && (
        <div className="mb-4 rounded-md border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">
          {globalError}
        </div>
      )}
      {sortedCourses.length === 0 ? (
        <Card className="border-2 border-dashed">
          <CardContent className="flex items-center justify-center p-10 text-slate-500">
            Sin cursos
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {sortedCourses.map((course) => {
            const archivedVersions = getArchivedVersions(course);
            return (
              <Card key={course.id}>
                <CardHeader>
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <CardTitle className="text-lg">{course.name}</CardTitle>
                      {course.description && (
                        <p className="mt-1 text-sm text-slate-600">
                          {course.description}
                        </p>
                      )}
                    </div>
                    {isAdminMode && (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => setEditingCourse(course)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-4">
                    <div className="mb-3 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Rocket className="h-4 w-4 text-emerald-600" />
                        <h3 className="font-semibold text-slate-900">
                          Publicado
                        </h3>
                      </div>
                      {isAdminMode && course.activeVersion && (
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() =>
                              handleViewActive(
                                course.id,
                                course.activeVersion!.id
                              )
                            }
                          >
                            <Eye className="mr-1 h-3 w-3" />
                            Ver
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            disabled={isPending && actionTarget === course.id}
                            onClick={() => handleArchiveActive(course)}
                          >
                            {isPending && actionTarget === course.id ? (
                              <Loader2 className="mr-1 h-3 w-3 animate-spin" />
                            ) : (
                              <Archive className="mr-1 h-3 w-3" />
                            )}
                            Archivar
                          </Button>
                        </div>
                      )}
                    </div>
                    {course.activeVersion ? (
                      <div>
                        <p className="font-bold text-emerald-900">
                          {course.activeVersion.title}
                        </p>
                        <p className="text-xs text-emerald-700">
                          v{course.activeVersion.versionNumber} ·{" "}
                          {formatDateTime(course.activeVersion.updatedAt)}
                        </p>
                        {course.activeVersion.description && (
                          <p className="mt-2 text-sm text-slate-700">
                            {course.activeVersion.description}
                          </p>
                        )}
                      </div>
                    ) : (
                      <p className="text-sm text-slate-600">
                        Sin curso publicado
                      </p>
                    )}
                  </div>
                  <div className="rounded-lg border border-indigo-200 bg-indigo-50 p-4">
                    <div className="mb-3 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <PenSquare className="h-4 w-4 text-indigo-600" />
                        <h3 className="font-semibold text-slate-900">
                          Borrador
                        </h3>
                      </div>
                      {isAdminMode && (
                        <div className="flex gap-2">
                          {course.draftVersion ? (
                            <>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() =>
                                  handleEditDraft(
                                    course.id,
                                    course.draftVersion!.id
                                  )
                                }
                              >
                                <Edit className="mr-1 h-3 w-3" />
                                Editar
                              </Button>
                              <Button
                                size="sm"
                                className="bg-emerald-600 hover:bg-emerald-700"
                                disabled={
                                  isPending && actionTarget === course.id
                                }
                                onClick={() => handlePublishDraft(course)}
                              >
                                {isPending && actionTarget === course.id ? (
                                  <Loader2 className="mr-1 h-3 w-3 animate-spin" />
                                ) : (
                                  <Rocket className="mr-1 h-3 w-3" />
                                )}
                                Publicar
                              </Button>
                            </>
                          ) : (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleCreateDraft(course.id)}
                            >
                              <PlusCircle className="mr-1 h-3 w-3" />
                              Crear
                            </Button>
                          )}
                        </div>
                      )}
                    </div>
                    {course.draftVersion ? (
                      <div>
                        <p className="font-bold text-indigo-900">
                          {course.draftVersion.title}
                        </p>
                        <p className="text-xs text-indigo-700">
                          v{course.draftVersion.versionNumber} ·{" "}
                          {formatDateTime(course.draftVersion.updatedAt)}
                        </p>
                        {course.draftVersion.description && (
                          <p className="mt-2 text-sm text-slate-700">
                            {course.draftVersion.description}
                          </p>
                        )}
                      </div>
                    ) : (
                      <p className="text-sm text-slate-600">Sin borrador</p>
                    )}
                  </div>
                  {archivedVersions.length > 0 && (
                    <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
                      <h3 className="mb-3 font-semibold text-slate-900">
                        📦 Historial de versiones archivadas
                      </h3>
                      <ul className="space-y-2">
                        {archivedVersions.map((version) => (
                          <li
                            key={version.id}
                            className="flex items-center justify-between rounded-md border border-slate-200 bg-white p-3"
                          >
                            <div className="flex-1">
                              <span className="font-medium text-slate-900">
                                {version.title}
                              </span>
                              <span className="ml-2 text-xs text-slate-500">
                                v{version.versionNumber}
                              </span>
                            </div>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                router.push(
                                  `/dashboard/admin/courses/${course.id}/content?versionId=${version.id}`
                                );
                              }}
                            >
                              <Eye className="mr-2 h-4 w-4" />
                              Ver contenido
                            </Button>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
      <CourseFormDialog
        isOpen={isCreateDialogOpen}
        onClose={() => setIsCreateDialogOpen(false)}
        mode="create"
      />
      {editingCourse && (
        <CourseFormDialog
          isOpen
          onClose={() => setEditingCourse(null)}
          mode="edit"
          course={editingCourse}
        />
      )}
      {publishingCourse && publishingCourse.draftVersion && (
        <PublishDraftDialog
          isOpen={true}
          onClose={() => setPublishingCourse(null)}
          onConfirm={confirmPublishDraft}
          draftTitle={publishingCourse.draftVersion.title}
          isPending={isPending && actionTarget === publishingCourse.id}
        />
      )}
    </>
  );
}
