import { redirect } from "next/navigation";
import { getCurrentProfile } from "@/src/presentation/actions/profile.actions";
import { getAllCourses } from "@/src/presentation/actions/course.actions";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Archive, LogOut, ArrowLeft, BookOpen } from "lucide-react";
import { signout } from "@/src/presentation/actions/auth.actions";
import Image from "next/image";

export default async function ArchivedCoursesPage() {
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

  // Flatten all archived versions into an individual list
  const archivedVersions = allCourses.flatMap((course) =>
    (course.archivedVersions || []).map((version) => ({
      courseId: course.id,
      courseTitle: course.title,
      version: version,
    }))
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
        {/* Back Button */}
        <div className="mb-6">
          <Link href="/dashboard/editor">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Volver al Dashboard
            </Button>
          </Link>
        </div>

        {/* Page Header */}
        <div className="mb-8">
          <h1 className="mb-2 text-3xl font-bold text-slate-800">
            📦 Versiones Archivadas
          </h1>
          <p className="text-slate-600">
            {archivedVersions.length} versión{archivedVersions.length !== 1 ? "es" : ""}{" "}
            archivada{archivedVersions.length !== 1 ? "s" : ""}
          </p>
        </div>

        {/* Archived Versions Grid - Each version gets its own card */}
        {archivedVersions.length === 0 ? (
          <Card className="border-2">
            <CardContent className="py-16 text-center">
              <Archive className="mx-auto mb-4 h-16 w-16 text-slate-300" />
              <h3 className="mb-2 text-lg font-semibold text-slate-700">
                No hay versiones archivadas
              </h3>
              <p className="text-sm text-slate-500">
                Las versiones archivadas aparecerán aquí
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {archivedVersions.map((item) => (
              <Card
                key={item.version.id}
                className="flex flex-col border-2 border-slate-200 bg-slate-50 transition-all hover:shadow-lg"
              >
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between gap-2">
                    <CardTitle className="line-clamp-2 text-lg">
                      {item.version.title}
                    </CardTitle>
                    <Badge className="shrink-0 bg-slate-600">
                      v{item.version.versionNumber}
                    </Badge>
                  </div>
                  {item.version.description && (
                    <p className="mt-2 text-sm text-slate-600 line-clamp-2">
                      {item.version.description}
                    </p>
                  )}
                </CardHeader>
                <CardContent className="flex flex-1 flex-col space-y-3">
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center gap-2 text-sm text-slate-600">
                      <BookOpen className="h-4 w-4" />
                      <span className="font-medium">Curso:</span>
                    </div>
                    <p className="pl-6 text-sm text-slate-700 line-clamp-2">
                      {item.courseTitle}
                    </p>
                  </div>

                  <Link
                    href={`/dashboard/admin/courses/${item.courseId}/content?versionId=${item.version.id}&from=archived`}
                    className="mt-auto"
                  >
                    <Button className="w-full" variant="outline">
                      <Archive className="mr-2 h-4 w-4" />
                      Ver Contenido
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
