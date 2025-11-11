import { redirect } from "next/navigation";
import { getCurrentProfile } from "@/src/presentation/actions/profile.actions";
import { getAllCourses } from "@/src/presentation/actions/course.actions";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  BookOpen,
  FileEdit,
  Clock,
  Archive,
  LogOut,
  Pencil,
} from "lucide-react";
import { signout } from "@/src/presentation/actions/auth.actions";
import Image from "next/image";

export default async function EditorDashboardPage() {
  const profileResult = await getCurrentProfile();

  if ("error" in profileResult) {
    redirect("/login");
  }

  const { profile } = profileResult;

  if (!profile.isEditor) {
    redirect("/dashboard");
  }

  // Get all courses
  const coursesResult = await getAllCourses();
  const allCourses =
    "error" in coursesResult ? [] : coursesResult.courses || [];

  // Filter courses by status
  const draftCourses = allCourses.filter((c) => c.hasDraft);
  const activeCourses = allCourses.filter((c) => c.hasActiveVersion);
  const archivedCourses = allCourses.filter(
    (c) => c.archivedVersions && c.archivedVersions.length > 0
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-purple-50 to-indigo-50">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-slate-200 bg-white shadow-sm">
        <div className="container mx-auto px-4 py-4 lg:px-6">
          <div className="flex items-center justify-between">
            <Link
              href="/dashboard"
              className="flex items-center gap-3 transition-opacity hover:opacity-80"
            >
              <div className="relative h-10 w-10">
                <Image
                  src="/logo.png"
                  alt="Aprende Code Logo"
                  fill
                  className="object-contain"
                  priority
                />
              </div>
              <h1 className="text-xl font-bold text-slate-800 md:text-2xl">
                Aprende Code
              </h1>
            </Link>

            <div className="flex items-center gap-3">
              <span className="text-sm font-medium text-purple-600">
                ✏️ Editor
              </span>
              {profile.avatarUrl ? (
                <div className="relative h-10 w-10 overflow-hidden rounded-full">
                  <Image
                    src={profile.avatarUrl}
                    alt={profile.displayName}
                    fill
                    className="object-cover"
                    unoptimized
                  />
                </div>
              ) : (
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-purple-500 to-indigo-600 text-sm font-semibold text-white">
                  {profile.displayName.charAt(0).toUpperCase()}
                </div>
              )}
              <span className="hidden text-sm font-medium text-slate-700 md:inline">
                {profile.displayName}
              </span>
              <form action={signout}>
                <Button variant="outline" size="sm" type="submit">
                  <LogOut className="mr-2 h-4 w-4" />
                  Salir
                </Button>
              </form>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8 lg:px-6">
        {/* Welcome Section */}
        <div className="mb-8">
          <h1 className="mb-2 text-3xl font-bold text-slate-800">
            ¡Hola, {profile.displayName}! 👋
          </h1>
          <p className="text-slate-600">
            Panel de edición de contenido de cursos
          </p>
        </div>

        {/* Courses Grid */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {/* Draft Courses */}
          {draftCourses.map((course) => (
            <Card
              key={course.id}
              className="flex flex-col border-2 border-yellow-200 bg-yellow-50 transition-all hover:shadow-lg"
            >
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-2">
                  <CardTitle className="line-clamp-2 text-lg">
                    {course.title}
                  </CardTitle>
                  <Badge className="shrink-0 bg-yellow-600">Borrador</Badge>
                </div>
              </CardHeader>
              <CardContent className="flex flex-1 flex-col space-y-3">
                <div className="flex-1 space-y-1 text-sm text-slate-600">
                  {course.draftVersion && (
                    <>
                      <p>Versión {course.draftVersion.versionNumber}</p>
                      <p className="line-clamp-2 text-xs text-slate-500">
                        {course.draftVersion.title}
                      </p>
                    </>
                  )}
                </div>
                <Link
                  href={
                    course.draftVersion
                      ? `/dashboard/admin/courses/${course.id}/draft/${course.draftVersion.id}/edit`
                      : `/dashboard/admin/courses/${course.id}/draft/new`
                  }
                  className="mt-auto"
                >
                  <Button className="w-full bg-yellow-600 hover:bg-yellow-700">
                    <Pencil className="mr-2 h-4 w-4" />
                    Editar Contenido
                  </Button>
                </Link>
              </CardContent>
            </Card>
          ))}

          {/* Active Courses */}
          {activeCourses.map((course) => (
            <Card
              key={course.id}
              className="flex flex-col border-2 border-green-200 bg-green-50 transition-all hover:shadow-lg"
            >
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-2">
                  <CardTitle className="line-clamp-2 text-lg">
                    {course.title}
                  </CardTitle>
                  <Badge className="shrink-0 bg-green-600">Activo</Badge>
                </div>
              </CardHeader>
              <CardContent className="flex flex-1 flex-col space-y-3">
                <div className="flex-1 space-y-1 text-sm text-slate-600">
                  {course.activeVersion && (
                    <>
                      <p>Versión {course.activeVersion.versionNumber}</p>
                      {course.activeVersion.publishedAt && (
                        <div className="flex items-center gap-1 text-xs text-slate-500">
                          <Clock className="h-3 w-3" />
                          <span>
                            {new Date(
                              course.activeVersion.publishedAt
                            ).toLocaleDateString("es-ES")}
                          </span>
                        </div>
                      )}
                    </>
                  )}
                </div>
                <Link
                  href={`/dashboard/editor/courses/${course.id}/content?from=editor`}
                  className="mt-auto"
                >
                  <Button className="w-full" variant="outline">
                    <BookOpen className="mr-2 h-4 w-4" />
                    Ver Contenido
                  </Button>
                </Link>
              </CardContent>
            </Card>
          ))}

          {/* Archived Courses - Single Card Link */}
          {archivedCourses.length > 0 && (
            <Link href="/dashboard/editor/archived">
              <Card className="flex flex-col border-2 border-slate-200 bg-slate-50 transition-all hover:shadow-lg cursor-pointer">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between gap-2">
                    <CardTitle className="line-clamp-2 text-lg">
                      Cursos Archivados
                    </CardTitle>
                    <Badge className="shrink-0 bg-slate-600">
                      {archivedCourses.length}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="flex flex-1 flex-col space-y-3">
                  <div className="flex-1 space-y-1 text-sm text-slate-600">
                    <p>
                      {archivedCourses.length} curso{archivedCourses.length !== 1 ? "s" : ""} con versiones archivadas
                    </p>
                    <p className="text-xs text-slate-500">
                      {archivedCourses.reduce((sum, c) => sum + (c.archivedVersions?.length || 0), 0)} versión
                      {archivedCourses.reduce((sum, c) => sum + (c.archivedVersions?.length || 0), 0) !== 1 ? "es" : ""} en total
                    </p>
                  </div>
                  <div className="mt-auto">
                    <Button className="w-full" variant="outline">
                      <Archive className="mr-2 h-4 w-4" />
                      Ver Archivados
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </Link>
          )}
        </div>

        {/* Empty State */}
        {draftCourses.length === 0 &&
          activeCourses.length === 0 &&
          archivedCourses.length === 0 && (
            <Card className="border-2 border-dashed">
              <CardContent className="py-16 text-center">
                <BookOpen className="mx-auto mb-4 h-16 w-16 text-slate-300" />
                <h3 className="mb-2 text-lg font-semibold text-slate-700">
                  No hay cursos disponibles
                </h3>
                <p className="text-sm text-slate-500">
                  Los cursos aparecerán aquí cuando estén disponibles para edición
                </p>
              </CardContent>
            </Card>
          )}
      </main>
    </div>
  );
}
