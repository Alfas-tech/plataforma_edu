import { redirect } from "next/navigation";
import { getCurrentProfile } from "@/src/presentation/actions/profile.actions";
import { getTeacherCourses } from "@/src/presentation/actions/course.actions";
import { signout } from "@/src/presentation/actions/auth.actions";
import { formatDateSpanish as formatDate } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { CourseOverview } from "@/src/presentation/types/course";
import {
  LogOut,
  BookOpen,
  FileEdit,
  Eye,
  EyeOff,
  RefreshCcw,
  ShieldCheck,
  Calendar,
  AlertTriangle,
} from "lucide-react";
import Link from "next/link";
import Image from "next/image";

function formatVersionStatus(status?: string): string {
  switch (status) {
    case "published":
      return "Publicada";
    case "pending_review":
      return "Pendiente de revisión";
    case "draft":
      return "En borrador";
    case "archived":
      return "Archivada";
    default:
      return "Sin versión activa";
  }
}

function getVisibilityBadge(course: CourseOverview) {
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
}

function getVersionBadge(course: CourseOverview) {
  if (!course.activeVersion) {
    return (
      <Badge variant="outline" className="border-slate-300 text-slate-600">
        Sin versión activa
      </Badge>
    );
  }

  return (
    <span className="inline-flex items-center rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-emerald-700">
      Versión {course.activeVersion.label}
    </span>
  );
}

function getVisibilityExplanation(course: CourseOverview): string {
  if (course.visibilitySource === "override") {
    return "Visibilidad forzada por un administrador.";
  }

  if (course.visibilitySource === "version") {
    return "Visible porque la versión activa está publicada y marcada como activa.";
  }

  return "Oculto hasta que la versión activa se publique o se habilite la visibilidad forzada.";
}

export default async function TeacherDashboardPage() {
  const profileResult = await getCurrentProfile();

  if ("error" in profileResult) {
    redirect("/login");
  }

  const { profile } = profileResult;

  if (!profile.isTeacher) {
    redirect("/dashboard");
  }

  const coursesResult = await getTeacherCourses(profile.id);
  const courses: CourseOverview[] =
    "error" in coursesResult ? [] : coursesResult.courses || [];

  const visibleCourses = courses.filter((course) => course.isVisibleForStudents);
  const pendingCourses = courses.filter(
    (course) => course.activeVersion?.status === "pending_review"
  );
  const draftCourses = courses.filter(
    (course) => course.activeVersion?.status === "draft"
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-emerald-50 to-teal-50">
      <header className="sticky top-0 z-50 border-b border-slate-200 bg-white shadow-sm">
        <div className="container mx-auto px-3 py-3 sm:px-4 sm:py-4 lg:px-6">
          <div className="flex items-center justify-between gap-2 sm:gap-4">
            <Link
              href="/dashboard"
              className="flex items-center gap-2 transition-opacity hover:opacity-80 sm:gap-3"
            >
              <div className="relative h-8 w-8 flex-shrink-0 sm:h-10 sm:w-10">
                <Image
                  src="/logo.png"
                  alt="Aprende Code Logo"
                  fill
                  className="object-contain"
                  priority
                />
              </div>
              <h1 className="truncate text-lg font-bold text-slate-800 sm:text-xl md:text-2xl">
                Aprende Code
              </h1>
            </Link>

            <div className="flex items-center gap-2 sm:gap-3">
              <span className="hidden text-xs font-medium text-emerald-600 sm:inline sm:text-sm">
                👨‍🏫 Docente
              </span>
              {profile.avatarUrl ? (
                <div className="relative h-8 w-8 flex-shrink-0 overflow-hidden rounded-full sm:h-10 sm:w-10">
                  <Image
                    src={profile.avatarUrl}
                    alt={profile.displayName}
                    fill
                    className="object-cover"
                    unoptimized
                  />
                </div>
              ) : (
                <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 text-xs font-semibold text-white sm:h-10 sm:w-10 sm:text-sm">
                  {profile.displayName.charAt(0).toUpperCase()}
                </div>
              )}
              <span className="hidden max-w-[120px] truncate text-xs font-medium text-slate-700 sm:text-sm md:inline lg:max-w-none">
                {profile.displayName}
              </span>
              <form action={signout}>
                <Button
                  variant="outline"
                  size="sm"
                  type="submit"
                  className="bg-transparent text-xs sm:text-sm"
                >
                  <LogOut className="h-3 w-3 sm:mr-2 sm:h-4 sm:w-4" />
                  <span className="hidden sm:inline">Salir</span>
                </Button>
              </form>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-3 py-4 sm:px-4 sm:py-6 lg:px-6 lg:py-8">
        <div className="mb-6 sm:mb-8">
          <h1 className="mb-2 text-balance text-2xl font-bold text-slate-800 sm:mb-3 sm:text-3xl md:text-4xl">
            Panel de Docente
          </h1>
          <p className="text-pretty text-sm text-slate-600 sm:text-base">
            Bienvenido, {profile.displayName}. Gestiona el contenido de tus cursos asignados.
          </p>
        </div>

        <div className="mb-6 grid grid-cols-2 gap-3 sm:mb-8 sm:gap-4 lg:grid-cols-4">
          <Card className="border-2">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-sm sm:text-base">
                <BookOpen className="h-4 w-4 text-emerald-600 sm:h-5 sm:w-5" />
                Total Cursos
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-emerald-600 sm:text-3xl">
                {courses.length}
              </p>
            </CardContent>
          </Card>

          <Card className="border-2">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-sm sm:text-base">
                <Eye className="h-4 w-4 text-green-600 sm:h-5 sm:w-5" />
                Visibles
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-green-600 sm:text-3xl">
                {visibleCourses.length}
              </p>
            </CardContent>
          </Card>

          <Card className="border-2">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-sm sm:text-base">
                <RefreshCcw className="h-4 w-4 text-blue-600 sm:h-5 sm:w-5" />
                Pendientes revisión
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-blue-600 sm:text-3xl">
                {pendingCourses.length}
              </p>
            </CardContent>
          </Card>

          <Card className="border-2">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-sm sm:text-base">
                <AlertTriangle className="h-4 w-4 text-amber-600 sm:h-5 sm:w-5" />
                Borradores
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-amber-600 sm:text-3xl">
                {draftCourses.length}
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="mb-6 sm:mb-8">
          <h2 className="mb-4 text-xl font-bold text-slate-800 sm:text-2xl">
            Mis Cursos Asignados
          </h2>

          {courses.length === 0 ? (
            <Card className="border-2">
              <CardContent className="p-8 text-center">
                <div className="rounded-lg border border-dashed border-slate-300 bg-slate-50 p-8">
                  <BookOpen className="mx-auto mb-3 h-12 w-12 text-slate-400" />
                  <h3 className="mb-2 text-lg font-semibold text-slate-800">
                    No tienes cursos asignados
                  </h3>
                  <p className="text-sm text-slate-600">
                    El administrador te asignará cursos para que puedas gestionar su contenido.
                  </p>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {courses.map((course) => {
                const versionVisibilityLabel = course.activeVersion
                  ? course.activeVersion.isPublished && course.activeVersion.isActive
                    ? "Publicada y activa"
                    : course.activeVersion.isPublished
                      ? "Publicada (sin activar)"
                      : course.activeVersion.isActive
                        ? "Activa sin publicar"
                        : "No publicada"
                  : "Sin versión activa";

                const versionUpdatedAt =
                  course.activeVersion?.updatedAt ?? course.lastUpdatedAt;

                return (
                  <Card
                    key={course.id}
                    className="border-2 transition-shadow hover:shadow-lg"
                  >
                    <CardHeader>
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <div className="mb-2 flex flex-wrap items-center gap-2">
                            <CardTitle className="text-xl">{course.title}</CardTitle>
                            {getVisibilityBadge(course)}
                            {getVersionBadge(course)}
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
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="grid gap-3 sm:grid-cols-2">
                        <div className="flex items-start gap-3 rounded-lg border bg-slate-50 p-3">
                          <Calendar className="mt-0.5 h-5 w-5 flex-shrink-0 text-emerald-600" />
                          <div>
                            <p className="text-xs font-medium text-slate-600">
                              Creado
                            </p>
                            <p className="text-sm font-semibold text-slate-800">
                              {formatDate(course.createdAt)}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-start gap-3 rounded-lg border bg-slate-50 p-3">
                          <RefreshCcw className="mt-0.5 h-5 w-5 flex-shrink-0 text-indigo-600" />
                          <div>
                            <p className="text-xs font-medium text-slate-600">
                              Última actualización
                            </p>
                            <p className="text-sm font-semibold text-slate-800">
                              {formatDate(versionUpdatedAt)}
                            </p>
                          </div>
                        </div>
                      </div>

                      <div className="mt-3 space-y-1 rounded-lg border border-emerald-100 bg-emerald-50 p-3 text-xs text-emerald-800">
                        <p>
                          <strong>Estado de versión:</strong>{" "}
                          {formatVersionStatus(course.activeVersion?.status)}
                        </p>
                        <p>
                          <strong>Visibilidad:</strong> {versionVisibilityLabel}
                        </p>
                        <p>
                          <strong>Motivo:</strong> {getVisibilityExplanation(course)}
                        </p>
                        {course.activeVersion?.summary && (
                          <p className="text-slate-700">
                            {course.activeVersion.summary}
                          </p>
                        )}
                      </div>

                      {!course.isVisibleForStudents && (
                        <div className="mt-3 flex items-start gap-2 rounded-lg border border-slate-200 bg-white p-3 text-xs text-slate-700">
                          <AlertTriangle className="mt-0.5 h-4 w-4 text-slate-500" />
                          <span>
                            Este curso sigue oculto para estudiantes. Publica la versión activa o habilita la visibilidad forzada para hacerlo visible.
                          </span>
                        </div>
                      )}

                      {course.visibilityOverride && (
                        <div className="mt-3 rounded-lg border border-purple-200 bg-purple-50 p-3 text-xs text-purple-900">
                          🔓 Visibilidad forzada: los estudiantes pueden ver el curso aunque la versión activa no esté publicada.
                        </div>
                      )}

                      <div className="mt-4">
                        <Link href={`/dashboard/admin/courses/${course.id}/content`}>
                          <Button className="w-full bg-emerald-600 hover:bg-emerald-700">
                            <FileEdit className="mr-2 h-4 w-4" />
                            Gestionar Contenido
                          </Button>
                        </Link>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </div>

        {courses.length > 0 && (
          <Card className="border-2 border-emerald-200 bg-emerald-50">
            <CardContent className="p-4 sm:p-6">
              <div className="flex items-start gap-3">
                <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-emerald-100">
                  <FileEdit className="h-5 w-5 text-emerald-600" />
                </div>
                <div>
                  <h4 className="mb-1 text-sm font-semibold text-emerald-900">
                    Permisos de Docente
                  </h4>
                  <ul className="space-y-1 text-xs text-emerald-700">
                    <li>✓ Crear y editar módulos</li>
                    <li>✓ Crear y editar lecciones</li>
                    <li>✓ Publicar/ocultar contenido</li>
                    <li>✗ No puedes eliminar módulos ni lecciones (solo admins)</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
}
