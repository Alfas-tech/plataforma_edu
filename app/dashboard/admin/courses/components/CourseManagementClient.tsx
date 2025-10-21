"use client";

import { useEffect, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { CourseVersionStatus } from "@/src/core/types/course.types";
import type { CourseOverview } from "@/src/presentation/types/course";
import type { LucideIcon } from "lucide-react";
import {
  PlusCircle,
  Calendar,
  Edit,
  Trash2,
  Users,
  Eye,
  EyeOff,
  ShieldCheck,
  AlertTriangle,
  BookOpen,
  RefreshCcw,
  GitBranch,
  GitPullRequest,
  GitCommit,
  Layers,
  Clock,
  GitMerge,
  Loader2,
  Check,
  X,
  Sparkles,
  Info,
  ListChecks,
} from "lucide-react";
import {
  mergeCourseBranch,
  reviewCourseMergeRequest,
} from "@/src/presentation/actions/course.actions";
import { CourseFormDialog } from "./CourseFormDialog";
import { CreateBranchDialog } from "./CreateBranchDialog";
import { CreateMergeRequestDialog } from "./CreateMergeRequestDialog";
import { DeleteBranchDialog } from "./DeleteBranchDialog";

interface CourseManagementClientProps {
  courses: CourseOverview[];
}

type BranchOverview = CourseOverview["branches"][number];

type MergeRequestStatus = CourseOverview["pendingMergeRequests"][number]["status"];

interface MergeRequestCallout {
  title: string;
  message: string;
  classes: string;
  Icon: LucideIcon;
}

const reviewSteps = [
  {
    Icon: Eye,
    title: "Paso 1 · Revisar",
    description: "Abre la vista previa para validar módulos, lecciones y metadatos.",
  },
  {
    Icon: Check,
    title: "Paso 2 · Decidir",
    description: "Aprueba si los cambios están listos o rechaza pidiendo ajustes.",
  },
  {
    Icon: GitMerge,
    title: "Paso 3 · Publicar",
    description: "Fusiona con la edición principal cuando confirmes que todo luce bien.",
  },
];

function getMergeRequestCallout(status: MergeRequestStatus): MergeRequestCallout | null {
  if (status === "open") {
    return {
      title: "Tu revisión está pendiente",
      message: "Revisa los cambios propuestos y aprueba o rechaza para desbloquear la fusión.",
      classes: "border-amber-200 bg-amber-50 text-amber-700",
      Icon: AlertTriangle,
    };
  }

  if (status === "approved") {
    return {
      title: "Listo para fusionar",
      message:
        "Esta solicitud ya fue aprobada. Fusiona cuando quieras publicar los cambios en la edición principal.",
      classes: "border-emerald-200 bg-emerald-50 text-emerald-700",
      Icon: GitMerge,
    };
  }

  if (status === "merged") {
    return {
      title: "Cambios integrados",
      message:
        "Los contenidos ya están en la edición principal. Usa el historial de versiones si necesitas revisar detalles.",
      classes: "border-indigo-200 bg-indigo-50 text-indigo-700",
      Icon: Sparkles,
    };
  }

  if (status === "rejected") {
    return {
      title: "Solicita ajustes",
      message: "La solicitud se rechazó. Comunica los cambios necesarios para que el autor vuelva a intentarlo.",
      classes: "border-rose-200 bg-rose-50 text-rose-700",
      Icon: X,
    };
  }

  return null;
}

function buildInitialSelectedBranches(courseList: CourseOverview[]) {
  const initial: Record<string, string> = {};
  courseList.forEach((course) => {
    const defaultId = course.defaultBranch?.id;
    const firstBranch = course.branches[0]?.id ?? null;
    const selected = defaultId ?? firstBranch;
    if (selected) {
      initial[course.id] = selected;
    }
  });
  return initial;
}

export function CourseManagementClient({
  courses,
}: CourseManagementClientProps) {
  const router = useRouter();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editingCourse, setEditingCourse] = useState<CourseOverview | null>(
    null
  );
  const [selectedBranches, setSelectedBranches] = useState<Record<string, string>>(
    () => buildInitialSelectedBranches(courses)
  );
  const [branchDialogCourse, setBranchDialogCourse] = useState<CourseOverview | null>(null);
  const [mergeDialogState, setMergeDialogState] = useState<
    { course: CourseOverview; branchId: string } | null
  >(null);
  const [branchDeletionTarget, setBranchDeletionTarget] = useState<
    { course: CourseOverview; branch: BranchOverview } | null
  >(null);
  const [processingMergeRequestId, setProcessingMergeRequestId] = useState<string | null>(
    null
  );
  const [actionError, setActionError] = useState<string | null>(null);
  const [isActionPending, startActionTransition] = useTransition();

  useEffect(() => {
    setSelectedBranches((previous: Record<string, string>) => {
      const updated: Record<string, string> = { ...previous };
      let changed = false;

      courses.forEach((course) => {
        const branchIds = [
          ...(course.defaultBranch ? [course.defaultBranch.id] : []),
          ...course.branches.map((branch) => branch.id),
        ];

        if (branchIds.length === 0) {
          return;
        }

        const fallback = branchIds[0];
        const current = updated[course.id];

        if (!current || !branchIds.includes(current)) {
          updated[course.id] = fallback;
          changed = true;
        }
      });

      return changed ? updated : previous;
    });
  }, [courses]);

  const handleCreateClick = () => {
    setIsCreateDialogOpen(true);
  };

  const handleEditClick = (course: CourseOverview) => {
    setEditingCourse(course);
  };

  const handleAssignTeachersClick = (courseId: string) => {
    router.push(`/dashboard/admin/courses/${courseId}/teachers`);
  };

  const handleDeleteBranchClick = (
    course: CourseOverview,
    branch: BranchOverview
  ) => {
    setBranchDeletionTarget({ course, branch });
  };

  const handleBranchChange = (courseId: string, branchId: string) => {
    setSelectedBranches((previous: Record<string, string>) => ({
      ...previous,
      [courseId]: branchId,
    }));
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("es-ES", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString("es-ES", {
      year: "numeric",
      month: "short",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getVisibilityBadge = (course: CourseOverview) => {
    if (course.visibilitySource === "override") {
      return (
        <Badge className="bg-purple-100 text-purple-700">
          <ShieldCheck className="mr-1 h-3 w-3" />
          Visible (forzado)
        </Badge>
      );
    }

    if (course.visibilitySource === "version") {
      return (
        <Badge className="bg-green-100 text-green-700">
          <Eye className="mr-1 h-3 w-3" />
          Visible
        </Badge>
      );
    }

    return (
      <Badge variant="outline" className="border-slate-300 text-slate-600">
        <EyeOff className="mr-1 h-3 w-3" />
        Oculto
      </Badge>
    );
  };

  const getVersionStatusLabel = (status?: CourseVersionStatus | null) => {
    switch (status) {
      case "draft":
        return "Borrador";
      case "pending_review":
        return "Pendiente de revisión";
      case "approved":
        return "Aprobada";
      case "published":
        return "Publicada";
      case "archived":
        return "Archivada";
      default:
        return "Sin estado";
    }
  };

  const getVersionBadge = (course: CourseOverview) => {
    if (!course.activeVersion) {
      return (
        <Badge variant="outline" className="border-slate-300 text-slate-600">
          Sin versión activa
        </Badge>
      );
    }

    const { status, label, branchName } = course.activeVersion;

    const baseClasses = "inline-flex items-center gap-1 px-2.5 py-0.5 text-xs";
    const branchLabel = branchName ? `${branchName} · ` : "";

    if (status === "published") {
      return (
        <span className={`${baseClasses} rounded-full border border-emerald-200 bg-emerald-50 font-semibold text-emerald-700`}>
          {branchLabel}Versión {label} · Publicada
        </span>
      );
    }

    if (status === "approved") {
      return (
        <span className={`${baseClasses} rounded-full border border-blue-200 bg-blue-50 font-semibold text-blue-700`}>
          {branchLabel}Versión {label} · Aprobada
        </span>
      );
    }

    if (status === "pending_review") {
      return (
        <span className={`${baseClasses} rounded-full border border-amber-200 bg-amber-50 font-semibold text-amber-700`}>
          {branchLabel}Versión {label} · Pendiente
        </span>
      );
    }

    if (status === "draft") {
      return (
        <span className={`${baseClasses} rounded-full border border-slate-200 bg-slate-50 font-semibold text-slate-700`}>
          {branchLabel}Versión {label} · Borrador
        </span>
      );
    }

    return (
      <span className={`${baseClasses} rounded-full border border-slate-300 bg-slate-100 font-semibold text-slate-700`}>
        {branchLabel}Versión {label} · Archivada
      </span>
    );
  };

  const getMergeRequestBadge = (
    status: CourseOverview["pendingMergeRequests"][number]["status"]
  ) => {
    const base = "inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold";

    if (status === "open") {
      return (
        <span className={`${base} border border-amber-200 bg-amber-50 text-amber-700`}>
          Abierta
        </span>
      );
    }

    if (status === "approved") {
      return (
        <span className={`${base} border border-blue-200 bg-blue-50 text-blue-700`}>
          Aprobada
        </span>
      );
    }

    if (status === "merged") {
      return (
        <span className={`${base} border border-emerald-200 bg-emerald-50 text-emerald-700`}>
          Fusionada
        </span>
      );
    }

    return (
      <span className={`${base} border border-rose-200 bg-rose-50 text-rose-700`}>
        Rechazada
      </span>
    );
  };

  const getParticipantLabel = (name?: string | null, email?: string | null) =>
    name ?? email ?? "Usuario sin perfil";

  const handleReviewMergeRequest = (
    mergeRequestId: string,
    decision: "approve" | "reject"
  ) => {
    setProcessingMergeRequestId(mergeRequestId);
    startActionTransition(async () => {
      try {
        const result = await reviewCourseMergeRequest({
          mergeRequestId,
          decision,
        });

        if (result && "error" in result && result.error) {
          setActionError(result.error);
          return;
        }

        setActionError(null);
        router.refresh();
      } catch (error) {
        setActionError(
          error instanceof Error
            ? error.message
            : "Error al actualizar la solicitud"
        );
      } finally {
        setProcessingMergeRequestId(null);
      }
    });
  };

  const handleMergeCourseBranch = (mergeRequestId: string) => {
    setProcessingMergeRequestId(mergeRequestId);
    startActionTransition(async () => {
      try {
        const result = await mergeCourseBranch({ mergeRequestId });

        if (result && "error" in result && result.error) {
          setActionError(result.error);
          return;
        }

        setActionError(null);
        router.refresh();
      } catch (error) {
        setActionError(
          error instanceof Error
            ? error.message
            : "Error al fusionar la edición"
        );
      } finally {
        setProcessingMergeRequestId(null);
      }
    });
  };

  return (
    <>
      {courses.length === 0 && (
        <div className="mb-6">
          <Button
            onClick={handleCreateClick}
            className="bg-purple-600 hover:bg-purple-700"
          >
            <PlusCircle className="mr-2 h-4 w-4" />
            Crear Nuevo Curso
          </Button>
        </div>
      )}

      {courses.length > 0 && (
        <div className="mb-6 rounded-lg border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
          <p className="font-semibold text-slate-800">Curso principal</p>
          <p>
            Esta cuenta administra un único curso base. Usa ediciones de trabajo para preparar
            nuevas versiones sin afectar la experiencia publicada en la edición principal.
          </p>
        </div>
      )}

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
          {courses.map((course) => {
            const branchLookup = new Map<string, BranchOverview>();

            if (course.defaultBranch) {
              branchLookup.set(course.defaultBranch.id, course.defaultBranch);
            }

            course.branches.forEach((branch) => {
              branchLookup.set(branch.id, branch);
            });

            const allBranches = course.defaultBranch
              ? [
                  course.defaultBranch,
                  ...course.branches.filter(
                    (branch) => branch.id !== course.defaultBranch?.id
                  ),
                ]
              : course.branches;

            const selectedBranchId =
              selectedBranches[course.id] ?? allBranches[0]?.id ?? null;
            const selectedBranch = selectedBranchId
              ? branchLookup.get(selectedBranchId) ?? null
              : null;
            const isDefaultBranchSelected =
              !!course.defaultBranch &&
              selectedBranchId === course.defaultBranch.id;

            const mainBranchId = course.defaultBranch?.id ?? null;

            const selectedBranchVersionId = (() => {
              if (selectedBranchId === course.defaultBranch?.id) {
                return (
                  course.defaultBranch?.tipVersionId ??
                  course.activeVersion?.id ??
                  null
                );
              }

              if (selectedBranch) {
                return selectedBranch.tipVersionId ?? null;
              }

              return course.activeVersion?.id ?? null;
            })();

            const contentQuery = new URLSearchParams();
            if (selectedBranchId) {
              contentQuery.set("branchId", selectedBranchId);
            }
            if (selectedBranchVersionId) {
              contentQuery.set("versionId", selectedBranchVersionId);
            }

            const contentHref = `/dashboard/admin/courses/${course.id}/content${
              contentQuery.toString() ? `?${contentQuery.toString()}` : ""
            }`;

            const incomingRequests = mainBranchId
              ? course.pendingMergeRequests.filter(
                  (mr) =>
                    mr.targetBranchId === mainBranchId &&
                    (mr.status === "open" || mr.status === "approved")
                )
              : [];

            const outgoingRequests =
              selectedBranchId && selectedBranchId !== mainBranchId
                ? course.pendingMergeRequests.filter(
                    (mr) =>
                      mr.sourceBranchId === selectedBranchId &&
                      (mr.status === "open" || mr.status === "approved")
                  )
                : [];

            const lastBranchUpdate = selectedBranch
              ? selectedBranch.tipVersionUpdatedAt ?? selectedBranch.updatedAt
              : null;

            const branchNameMap = new Map<string, string>();
            course.branches.forEach((branch) =>
              branchNameMap.set(branch.id, branch.name)
            );
            if (course.defaultBranch) {
              branchNameMap.set(course.defaultBranch.id, course.defaultBranch.name);
            }

            const activeVersionBranchName =
              course.activeVersion?.branchId
                ? branchNameMap.get(course.activeVersion.branchId) ?? "Sin edición"
                : course.defaultBranch?.name ?? "Sin edición";

            const activeVersionAssociatedWithSelection = course.activeVersion
              ? course.activeVersion.branchId
                ? course.activeVersion.branchId === selectedBranchId
                : isDefaultBranchSelected
              : false;

            const processingSameMergeRequest = (mergeRequestId: string) =>
              isActionPending && processingMergeRequestId === mergeRequestId;

            return (
              <Card
                key={course.id}
                className="border-2 transition-shadow hover:shadow-lg"
              >
                <CardHeader className="space-y-4">
                  <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                    <div className="flex-1">
                      <div className="mb-2 flex flex-wrap items-center gap-2">
                        <CardTitle className="text-xl">{course.title}</CardTitle>
                        {getVisibilityBadge(course)}
                        {getVersionBadge(course)}
                        {course.defaultBranch && (
                          <Badge className="bg-indigo-100 text-indigo-700">
                            <GitBranch className="mr-1 h-3 w-3" />
                            Edición principal: {course.defaultBranch.name}
                          </Badge>
                        )}
                      </div>
                      {course.description && (
                        <p className="text-sm text-slate-600">
                          {course.description}
                        </p>
                      )}
                      {course.summary && (
                        <p className="mt-1 text-xs text-slate-500">
                          {course.summary}
                        </p>
                      )}
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleEditClick(course)}
                      >
                        <Edit className="h-4 w-4 sm:mr-2" />
                        <span className="hidden sm:inline">Editar</span>
                      </Button>
                    </div>
                  </div>

                  <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                    <div className="flex items-start gap-3 rounded-lg border bg-slate-50 p-3">
                      <Calendar className="mt-0.5 h-5 w-5 flex-shrink-0 text-blue-600" />
                      <div>
                        <p className="text-xs font-medium text-slate-600">Creado</p>
                        <p className="text-sm font-semibold text-slate-800">
                          {formatDate(course.createdAt)}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3 rounded-lg border bg-slate-50 p-3">
                      <RefreshCcw className="mt-0.5 h-5 w-5 flex-shrink-0 text-indigo-600" />
                      <div>
                        <p className="text-xs font-medium text-slate-600">Última actualización</p>
                        <p className="text-sm font-semibold text-slate-800">
                          {formatDate(course.lastUpdatedAt)}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3 rounded-lg border bg-slate-50 p-3">
                      <GitCommit className="mt-0.5 h-5 w-5 flex-shrink-0 text-emerald-600" />
                      <div>
                        <p className="text-xs font-medium text-slate-600">Versión activa</p>
                        <p className="text-sm font-semibold text-slate-800">
                          {course.activeVersion
                            ? `${course.activeVersion.label} · ${getVersionStatusLabel(course.activeVersion.status)}`
                            : "Sin versión"}
                        </p>
                        <p className="text-xs text-slate-500">
                          Edición: {activeVersionBranchName}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3 rounded-lg border bg-slate-50 p-3">
                      <Layers className="mt-0.5 h-5 w-5 flex-shrink-0 text-purple-600" />
                      <div>
                        <p className="text-xs font-medium text-slate-600">Ediciones & fusiones</p>
                        <p className="text-sm font-semibold text-slate-800">
                          {allBranches.length} ediciones · {course.pendingMergeRequests.length} fusiones
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col gap-3 rounded-lg border border-slate-200 bg-white p-4 md:flex-row md:items-center md:justify-between">
                    <div className="flex flex-col gap-2">
                      <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                        Edición seleccionada
                      </span>
                      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-3">
                        <div className="flex items-center gap-2 text-sm font-semibold text-slate-800">
                          <GitBranch className="h-4 w-4 text-indigo-600" />
                          {selectedBranch?.name ?? "Sin edición"}
                        </div>
                        <Select
                          value={selectedBranchId ?? undefined}
                          onValueChange={(value: string) =>
                            handleBranchChange(course.id, value)
                          }
                        >
                          <SelectTrigger className="w-full sm:w-[230px]">
                            <SelectValue placeholder="Selecciona una edición" />
                          </SelectTrigger>
                          <SelectContent>
                            {allBranches.map((branch) => (
                              <SelectItem key={branch.id} value={branch.id}>
                                {branch.name} · {branch.tipVersionLabel ?? "Sin etiqueta"}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setBranchDialogCourse(course)}
                      >
                        <PlusCircle className="h-4 w-4 sm:mr-2" />
                        <span className="hidden sm:inline">Nueva edición</span>
                        <span className="sm:hidden">Edición</span>
                      </Button>
                      {selectedBranchId && !isDefaultBranchSelected && (
                        <Button
                          size="sm"
                          className="bg-indigo-600 text-white hover:bg-indigo-700"
                          onClick={() =>
                            setMergeDialogState({
                              course,
                              branchId: selectedBranchId,
                            })
                          }
                        >
                          <GitPullRequest className="h-4 w-4 sm:mr-2" />
                          <span className="hidden sm:inline">
                            Solicitar fusión
                          </span>
                          <span className="sm:hidden">Fusión</span>
                        </Button>
                      )}
                    </div>
                  </div>
                </CardHeader>

                <CardContent>
                  <div className="space-y-6">
                    {incomingRequests.length > 0 && (
                      <section className="space-y-3 rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
                        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                          <h3 className="flex items-center gap-2 text-sm font-semibold text-slate-900">
                            <GitPullRequest className="h-4 w-4 text-emerald-600" />
                            Revisiones pendientes en {course.defaultBranch?.name ?? "principal"}
                          </h3>
                          <span className="text-xs text-slate-500">
                            {incomingRequests.length} solicitud(es) por atender
                          </span>
                        </div>

                        <div className="rounded-md border border-slate-200 bg-slate-100 p-3 text-xs text-slate-600">
                          <p className="flex items-center gap-2 font-semibold text-slate-800">
                            <Info className="h-4 w-4 text-indigo-600" />
                            ¿Cómo revisar?
                          </p>
                          <p className="mt-1 leading-5">
                            Previsualiza los contenidos, registra tu decisión y finalmente fusiona cuando estés seguro. Todo sucede sin afectar a la edición principal hasta el paso final.
                          </p>
                        </div>

                        {actionError && (
                          <div className="rounded-md border border-rose-200 bg-rose-50 p-3 text-xs text-rose-700">
                            {actionError}
                          </div>
                        )}

                        <div className="space-y-3">
                          {incomingRequests.map((mr: CourseOverview["pendingMergeRequests"][number]) => {
                            const isProcessing = processingSameMergeRequest(mr.id);
                            const reviewQuery = new URLSearchParams();
                            reviewQuery.set("branchId", mr.sourceBranchId);
                            reviewQuery.set("versionId", mr.sourceVersionId);
                            const reviewHref = `/dashboard/admin/courses/${course.id}/content?${reviewQuery.toString()}`;
                            const callout = getMergeRequestCallout(mr.status);
                            const isPendingDecision = mr.status === "open";
                            const hasReviewer = Boolean(
                              mr.reviewerId || mr.reviewerName || mr.reviewerEmail
                            );

                            return (
                              <div
                                key={mr.id}
                                className="space-y-3 rounded-lg border border-slate-200 bg-slate-50 p-4"
                              >
                                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                                  <p className="text-sm font-semibold text-slate-800">
                                    {mr.title}
                                  </p>
                                  {getMergeRequestBadge(mr.status)}
                                </div>
                                {callout && (
                                  <div className={`flex items-start gap-3 rounded-md border px-3 py-2 text-xs ${callout.classes}`}>
                                    <callout.Icon className="mt-0.5 h-4 w-4 flex-shrink-0" />
                                    <div className="space-y-1">
                                      <p className="font-semibold">{callout.title}</p>
                                      <p className="leading-4 opacity-90">{callout.message}</p>
                                    </div>
                                  </div>
                                )}
                                <div className="flex flex-wrap items-center gap-2 text-xs text-slate-600">
                                  <GitBranch className="h-3 w-3 text-slate-500" />
                                  Edición origen: {mr.sourceBranchName} ({mr.sourceVersionLabel}) → Edición destino: {mr.targetBranchName}
                                  {mr.targetVersionLabel && (
                                    <span>({mr.targetVersionLabel})</span>
                                  )}
                                </div>
                                <div className="flex flex-wrap items-center gap-3 text-xs text-slate-600">
                                  <div className="flex items-center gap-1">
                                    <Users className="h-3 w-3 text-slate-500" />
                                    <span>
                                      Solicitado por
                                      <span className="ml-1 font-semibold text-slate-800">
                                        {getParticipantLabel(
                                          mr.openedByName,
                                          mr.openedByEmail
                                        )}
                                      </span>
                                    </span>
                                  </div>
                                  <div className="flex items-center gap-1">
                                    <ShieldCheck className="h-3 w-3 text-emerald-600" />
                                    <span>
                                      {hasReviewer
                                        ? `Revisor: ${getParticipantLabel(
                                            mr.reviewerName,
                                            mr.reviewerEmail
                                          )}`
                                        : "Revisor sin asignar"}
                                    </span>
                                  </div>
                                </div>
                                <p className="text-xs text-slate-500">
                                  Abierta el {formatDateTime(mr.openedAt)}
                                </p>
                                {mr.summary && (
                                  <p className="text-xs text-slate-600">
                                    {mr.summary}
                                  </p>
                                )}
                                {isPendingDecision && (
                                  <div className="rounded-md border border-slate-200 bg-white p-3">
                                    <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-600">
                                      <ListChecks className="h-3.5 w-3.5 text-indigo-600" />
                                      Flujo sugerido
                                    </p>
                                    <div className="mt-3 grid gap-3 sm:grid-cols-3">
                                      {reviewSteps.map(({ Icon, title, description }) => (
                                        <div key={title} className="flex items-start gap-2 text-xs text-slate-600">
                                          <Icon className="mt-0.5 h-4 w-4 flex-shrink-0 text-indigo-600" />
                                          <div className="space-y-1">
                                            <p className="font-semibold text-slate-800">{title}</p>
                                            <p className="text-[11px] leading-4 text-slate-600">{description}</p>
                                          </div>
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                )}
                                <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
                                  <Button
                                    asChild
                                    size="sm"
                                    variant="outline"
                                    className="w-full border-slate-300 text-slate-700 hover:bg-slate-100 sm:w-auto"
                                  >
                                    <Link href={reviewHref} target="_blank" rel="noreferrer">
                                      <Eye className="mr-2 h-4 w-4" />
                                      Previsualizar cambios
                                    </Link>
                                  </Button>
                                  {mr.status === "open" && (
                                    <>
                                      <Button
                                        size="sm"
                                        className="w-full bg-emerald-600 text-white hover:bg-emerald-700 sm:w-auto"
                                        disabled={isProcessing}
                                        onClick={() => handleReviewMergeRequest(mr.id, "approve")}
                                      >
                                        {isProcessing ? (
                                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        ) : (
                                          <Check className="mr-2 h-4 w-4" />
                                        )}
                                        Aprobar
                                      </Button>
                                      <Button
                                        size="sm"
                                        variant="outline"
                                        className="w-full border-rose-300 text-rose-600 hover:bg-rose-50 sm:w-auto"
                                        disabled={isProcessing}
                                        onClick={() => handleReviewMergeRequest(mr.id, "reject")}
                                      >
                                        {isProcessing ? (
                                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        ) : (
                                          <X className="mr-2 h-4 w-4" />
                                        )}
                                        Rechazar
                                      </Button>
                                    </>
                                  )}
                                  {mr.status === "approved" && (
                                    <Button
                                      size="sm"
                                      className="w-full bg-indigo-600 text-white hover:bg-indigo-700 sm:w-auto"
                                      disabled={isProcessing}
                                      onClick={() => handleMergeCourseBranch(mr.id)}
                                    >
                                      {isProcessing ? (
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                      ) : (
                                        <GitMerge className="mr-2 h-4 w-4" />
                                      )}
                                      Fusionar con la edición principal
                                    </Button>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </section>
                    )}

                    <section className="rounded-lg border border-slate-200 bg-white p-4">
                      <div className="flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
                        <div>
                          <p className="text-sm font-semibold text-slate-900">
                            {selectedBranch?.name ?? "No hay edición seleccionada"}
                          </p>
                          <div className="mt-1 flex flex-wrap gap-2 text-xs text-slate-600">
                            {selectedBranch?.isDefault && (
                              <Badge className="bg-indigo-100 text-indigo-700">
                                Principal
                              </Badge>
                            )}
                            {selectedBranch?.tipVersionStatus && (
                              <Badge className="bg-slate-100 text-slate-700">
                                {getVersionStatusLabel(
                                  selectedBranch.tipVersionStatus
                                )}
                              </Badge>
                            )}
                            {selectedBranch?.tipVersionLabel && (
                              <Badge variant="outline" className="border-slate-300 text-slate-600">
                                Última versión · {selectedBranch.tipVersionLabel}
                              </Badge>
                            )}
                          </div>
                          {selectedBranch?.description && (
                            <p className="mt-2 text-xs text-slate-600">
                              {selectedBranch.description}
                            </p>
                          )}
                        </div>
                        {lastBranchUpdate && (
                          <span className="flex items-center gap-2 text-xs text-slate-500">
                            <Clock className="h-4 w-4" />
                            Actualizada {formatDateTime(lastBranchUpdate)}
                          </span>
                        )}
                      </div>
                      <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:flex-wrap">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleAssignTeachersClick(course.id)}
                          className="w-full sm:w-auto"
                        >
                          <Users className="h-4 w-4 sm:mr-2" />
                          <span className="hidden sm:inline">Docentes</span>
                          <span className="sm:hidden">Doc.</span>
                        </Button>
                        <Link href={contentHref} className="w-full sm:w-auto">
                          <Button size="sm" variant="outline" className="w-full sm:w-auto">
                            <BookOpen className="h-4 w-4 sm:mr-2" />
                            <span className="hidden sm:inline">Contenido</span>
                            <span className="sm:hidden">Cont.</span>
                          </Button>
                        </Link>
                        {selectedBranch && !isDefaultBranchSelected && (
                          <Button
                            size="sm"
                            variant="outline"
                            className="w-full border-red-300 text-red-600 hover:bg-red-50 sm:w-auto"
                            onClick={() =>
                              handleDeleteBranchClick(course, selectedBranch)
                            }
                          >
                            <Trash2 className="h-4 w-4 sm:mr-2" />
                            <span className="hidden sm:inline">Eliminar edición</span>
                            <span className="sm:hidden">Eliminar</span>
                          </Button>
                        )}
                      </div>
                      <div className="mt-4 grid gap-3 sm:grid-cols-3">
                        <div className="rounded-md border border-slate-200 bg-slate-50 p-3 text-xs text-slate-600">
                          <p className="font-semibold text-slate-800">Base</p>
                          <p>{selectedBranch?.baseVersionLabel ?? "Sin versión"}</p>
                        </div>
                        <div className="rounded-md border border-slate-200 bg-slate-50 p-3 text-xs text-slate-600">
                          <p className="font-semibold text-slate-800">Última etiqueta</p>
                          <p>{selectedBranch?.tipVersionLabel ?? "Sin versiones"}</p>
                        </div>
                        <div className="rounded-md border border-slate-200 bg-slate-50 p-3 text-xs text-slate-600">
                          <p className="font-semibold text-slate-800">Edición de origen</p>
                          <p>
                            {selectedBranch?.parentBranchId
                              ? branchNameMap.get(selectedBranch.parentBranchId) ?? "Desconocida"
                              : "Sin edición de origen"}
                          </p>
                        </div>
                      </div>
                      {!isDefaultBranchSelected && selectedBranch && (
                        <div className="mt-4 rounded-md border border-indigo-200 bg-indigo-50 p-3 text-xs text-indigo-900">
                          Esta edición es una copia aislada de <span className="font-semibold">{course.defaultBranch?.name ?? "la edición principal"}</span>.
                          Puedes crear, editar o borrar módulos y lecciones sin afectar al contenido publicado hasta que envíes y fusiones una solicitud.
                        </div>
                      )}
                    </section>

                    <section className="rounded-lg border border-slate-200 bg-slate-50 p-4 text-xs text-slate-700">
                      {course.activeVersion ? (
                        activeVersionAssociatedWithSelection ? (
                          <div className="space-y-2 text-sm">
                            <p className="flex items-center gap-2 font-semibold text-slate-900">
                              <ShieldCheck className="h-4 w-4 text-emerald-600" />
                              Versión activa {course.activeVersion.label}
                            </p>
                            <p>
                              <strong>Estado:</strong> {getVersionStatusLabel(course.activeVersion.status)}
                            </p>
                            <p>
                              <strong>Visibilidad:</strong> {course.activeVersion.isPublished && course.activeVersion.isActive
                                ? "Publicada y activa"
                                : course.activeVersion.isActive
                                ? "Activa pero no publicada"
                                : "Inactiva"}
                            </p>
                            <p>
                              <strong>Última revisión:</strong> {formatDateTime(course.activeVersion.updatedAt)}
                            </p>
                            {course.activeVersion.summary && (
                              <p className="text-slate-600">
                                {course.activeVersion.summary}
                              </p>
                            )}
                          </div>
                        ) : (
                          <div className="flex items-center gap-2 text-sm text-slate-700">
                            <AlertTriangle className="h-4 w-4 text-amber-600" />
                            <span>
                              La versión activa vive en {activeVersionBranchName}. Cambia de edición para revisarla.
                            </span>
                          </div>
                        )
                      ) : (
                        <div className="flex items-center gap-2 text-sm text-slate-700">
                          <AlertTriangle className="h-4 w-4 text-amber-600" />
                          <span>Este curso aún no tiene una versión activa configurada.</span>
                        </div>
                      )}
                    </section>

                    <section className="space-y-3">
                      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                        <h3 className="flex items-center gap-2 text-sm font-semibold text-slate-900">
                          <GitPullRequest className="h-4 w-4 text-emerald-600" />
                          {isDefaultBranchSelected
                            ? "Solicitudes en esta edición"
                            : "Solicitudes enviadas"}
                        </h3>
                        <span className="text-xs text-slate-500">
                          {isDefaultBranchSelected
                            ? incomingRequests.length
                              ? `${incomingRequests.length} atendidas arriba`
                              : "Sin solicitudes entrantes"
                            : outgoingRequests.length
                            ? `${outgoingRequests.length} pendiente(s)`
                            : "Sin solicitudes desde esta edición"}
                        </span>
                      </div>

                      {isDefaultBranchSelected ? (
                        <div className="rounded-lg border border-dashed border-slate-300 bg-white p-4 text-xs text-slate-600">
                          Usa el panel de revisión superior para aprobar o fusionar los cambios que llegan a la edición principal.
                        </div>
                      ) : outgoingRequests.length === 0 ? (
                        <div className="rounded-lg border border-dashed border-slate-300 bg-white p-4 text-xs text-slate-600">
                          Aún no has creado solicitudes de fusión desde esta edición. Prepara tus cambios y envía una revisión cuando estén listos.
                        </div>
                      ) : (
                        <div className="space-y-3">
                          {outgoingRequests.map((mr: CourseOverview["pendingMergeRequests"][number]) => {
                            const callout = getMergeRequestCallout(mr.status);
                            const hasReviewer = Boolean(
                              mr.reviewerId || mr.reviewerName || mr.reviewerEmail
                            );

                            return (
                              <div
                                key={mr.id}
                                className="space-y-2 rounded-lg border border-slate-200 bg-white p-4"
                              >
                                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                                  <p className="text-sm font-semibold text-slate-800">
                                    {mr.title}
                                  </p>
                                  {getMergeRequestBadge(mr.status)}
                                </div>
                                {callout && (
                                  <div className={`flex items-start gap-3 rounded-md border px-3 py-2 text-xs ${callout.classes}`}>
                                    <callout.Icon className="mt-0.5 h-4 w-4 flex-shrink-0" />
                                    <div className="space-y-1">
                                      <p className="font-semibold">{callout.title}</p>
                                      <p className="leading-4 opacity-90">{callout.message}</p>
                                    </div>
                                  </div>
                                )}
                                <div className="flex flex-wrap items-center gap-2 text-xs text-slate-600">
                                  <GitBranch className="h-3 w-3 text-slate-500" />
                                  Edición origen: {mr.sourceBranchName} ({mr.sourceVersionLabel}) → Edición destino: {mr.targetBranchName}
                                  {mr.targetVersionLabel && (
                                    <span>({mr.targetVersionLabel})</span>
                                  )}
                                </div>
                                <div className="flex flex-wrap items-center gap-3 text-xs text-slate-600">
                                  <div className="flex items-center gap-1">
                                    <Users className="h-3 w-3 text-slate-500" />
                                    <span>
                                      Solicitado por
                                      <span className="ml-1 font-semibold text-slate-800">
                                        {getParticipantLabel(
                                          mr.openedByName,
                                          mr.openedByEmail
                                        )}
                                      </span>
                                    </span>
                                  </div>
                                  <div className="flex items-center gap-1">
                                    <ShieldCheck className="h-3 w-3 text-emerald-600" />
                                    <span>
                                      {hasReviewer
                                        ? `Revisor: ${getParticipantLabel(
                                            mr.reviewerName,
                                            mr.reviewerEmail
                                          )}`
                                        : "Revisor sin asignar"}
                                    </span>
                                  </div>
                                </div>
                                <p className="text-xs text-slate-500">
                                  Abierta el {formatDateTime(mr.openedAt)}
                                </p>
                                {mr.summary && (
                                  <p className="text-xs text-slate-600">
                                    {mr.summary}
                                  </p>
                                )}
                                <div className="rounded-md border border-slate-200 bg-slate-50 p-3 text-xs text-slate-600">
                                  Espera la revisión del administrador. Puedes seguir editando esta edición sin afectar a la edición principal.
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </section>

                    {course.visibilityOverride && (
                      <div className="rounded-lg border border-purple-200 bg-purple-50 p-3 text-xs text-purple-900">
                        🔓 Visibilidad forzada: los estudiantes verán este curso incluso si la versión activa no está publicada.
                      </div>
                    )}

                    {!course.isVisibleForStudents && (
                      <div className="rounded-lg border border-slate-200 bg-white p-3 text-xs text-slate-700">
                        <strong>Estado actual:</strong> Este curso aún no es visible para estudiantes. Publica la versión activa o usa la visibilidad forzada para habilitarlo.
                      </div>
                    )}
                  </div>
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

      <CourseFormDialog
        isOpen={!!editingCourse}
        onClose={() => setEditingCourse(null)}
        mode="edit"
        course={editingCourse}
      />

      {branchDialogCourse && (
        <CreateBranchDialog
          course={branchDialogCourse}
          selectedBranchId={
            selectedBranches[branchDialogCourse.id] ??
            branchDialogCourse.defaultBranch?.id ??
            branchDialogCourse.branches[0]?.id ??
            null
          }
          isOpen={!!branchDialogCourse}
          onClose={() => setBranchDialogCourse(null)}
        />
      )}

      <DeleteBranchDialog
        isOpen={!!branchDeletionTarget}
        onClose={() => setBranchDeletionTarget(null)}
        course={branchDeletionTarget?.course ?? null}
        branch={branchDeletionTarget?.branch ?? null}
      />

      {mergeDialogState && (
        <CreateMergeRequestDialog
          course={mergeDialogState.course}
          sourceBranchId={mergeDialogState.branchId}
          isOpen={!!mergeDialogState}
          onClose={() => setMergeDialogState(null)}
        />
      )}
    </>
  );
}
