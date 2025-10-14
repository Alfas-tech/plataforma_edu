import { redirect } from "next/navigation";
import { getCurrentProfile } from "@/src/presentation/actions/profile.actions";
import { getCourseWithTeachers } from "@/src/presentation/actions/course.actions";
import { getModulesByCourse } from "@/src/presentation/actions/content.actions";
import { signout } from "@/src/presentation/actions/auth.actions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LogOut, ArrowLeft, BookMarked, Plus } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { ModuleManagementClient } from "./components/ModuleManagementClient";

interface PageProps {
  params: {
    courseId: string;
  };
}

export default async function CourseContentPage({ params }: PageProps) {
  const { courseId } = params;

  const profileResult = await getCurrentProfile();

  if ('error' in profileResult) {
    redirect("/login");
  }

  const { profile } = profileResult;

  // Admin o Teacher pueden gestionar contenido
  if (!profile.isAdmin && !profile.isTeacher) {
    redirect("/dashboard");
  }

  // Obtener curso
  const courseResult = await getCourseWithTeachers(courseId);

  if ('error' in courseResult) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-purple-50 to-pink-50">
        <div className="container mx-auto px-4 py-8">
          <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-red-800">
            <p>Error: {courseResult.error}</p>
          </div>
        </div>
      </div>
    );
  }

  const { course } = courseResult;

  // Obtener módulos
  const modulesResult = await getModulesByCourse(courseId);
  const modules = 'error' in modulesResult ? [] : modulesResult.modules || [];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-purple-50 to-pink-50">
      {/* Header */}
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
              <span className="hidden text-xs font-medium text-purple-600 sm:inline sm:text-sm">
                {profile.isAdmin ? '🛡️ Administrador' : '👨‍🏫 Docente'}
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
                <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-purple-500 to-pink-600 text-xs font-semibold text-white sm:h-10 sm:w-10 sm:text-sm">
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

      {/* Main Content */}
      <main className="container mx-auto px-3 py-4 sm:px-4 sm:py-6 lg:px-6 lg:py-8">
        {/* Header Section */}
        <div className="mb-6 flex items-center gap-4 sm:mb-8">
          <Link href={profile.isAdmin ? "/dashboard/admin/courses" : "/dashboard/teacher"}>
            <Button variant="outline" size="sm">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Volver
            </Button>
          </Link>
          <div>
            <h1 className="mb-1 text-balance text-2xl font-bold text-slate-800 sm:mb-2 sm:text-3xl md:text-4xl">
              Gestión de Contenido
            </h1>
            <p className="text-pretty text-sm text-slate-600 sm:text-base md:text-lg">
              {course.title}
            </p>
          </div>
        </div>

        {/* Stats */}
        <div className="mb-6 grid grid-cols-1 gap-4 sm:mb-8 sm:grid-cols-2">
          <Card className="border-2">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                <BookMarked className="h-5 w-5 text-purple-600" />
                Total Módulos
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-purple-600">
                {modules.length}
              </p>
            </CardContent>
          </Card>

          <Card className="border-2">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                <Plus className="h-5 w-5 text-green-600" />
                Módulos Publicados
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-green-600">
                {modules.filter(m => m.isPublished).length}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Module Management */}
        <ModuleManagementClient 
          courseId={courseId} 
          modules={modules}
          isAdmin={profile.isAdmin}
        />
      </main>
    </div>
  );
}

