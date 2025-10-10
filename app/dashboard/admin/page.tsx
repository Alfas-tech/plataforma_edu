import { redirect } from "next/navigation";
import { getCurrentProfile } from "@/src/presentation/actions/profile.actions";
import { getAllCourses } from "@/src/presentation/actions/course.actions";
import { getAllUsers } from "@/src/presentation/actions/profile.actions";
import { signout } from "@/src/presentation/actions/auth.actions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LogOut, Users, BookOpen, Settings } from "lucide-react";
import Link from "next/link";
import Image from "next/image";

export default async function AdminDashboardPage() {
  const profileResult = await getCurrentProfile();

  if ('error' in profileResult) {
    redirect("/login");
  }

  const { profile } = profileResult;

  if (!profile.isAdmin) {
    redirect("/dashboard");
  }

  // Obtener cursos
  const coursesResult = await getAllCourses();
  const courses = 'error' in coursesResult ? [] : coursesResult.courses || [];

  // Obtener usuarios
  const usersResult = await getAllUsers();
  const students = 'error' in usersResult ? [] : usersResult.students || [];
  const teachers = 'error' in usersResult ? [] : usersResult.teachers || [];

  // Calcular estadísticas
  const activeCourses = courses.filter(c => c.status === 'active').length;
  const upcomingCourses = courses.filter(c => c.status === 'upcoming').length;
  const completedCourses = courses.filter(c => c.status === 'ended').length;

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
                🛡️ Administrador
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
        <div className="mb-6 sm:mb-8">
          <h1 className="mb-2 text-balance text-2xl font-bold text-slate-800 sm:mb-3 sm:text-3xl md:text-4xl">
            Panel de Administración
          </h1>
          <p className="text-pretty text-sm text-slate-600 sm:text-base">
            Gestiona usuarios, cursos y contenido de la plataforma
          </p>
        </div>

        {/* Management Links */}
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <Card className="border-2 transition-shadow hover:shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-xl">
                <Users className="h-6 w-6 text-blue-600" />
                Gestión de Usuarios
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="mb-4 text-sm text-slate-600">
                Administra roles y permisos de estudiantes y docentes
              </p>
              <div className="flex flex-wrap gap-2">
                <Link href="/dashboard/admin/users" className="flex-1">
                  <Button className="w-full bg-blue-600 hover:bg-blue-700">
                    <Settings className="mr-2 h-4 w-4" />
                    Gestionar Usuarios
                  </Button>
                </Link>
              </div>
              <div className="mt-4 grid grid-cols-2 gap-4">
                <div className="rounded-lg border bg-slate-50 p-3">
                  <p className="mb-1 text-xs text-slate-600">Estudiantes</p>
                  <p className="text-xl font-bold text-blue-600">{students.length}</p>
                </div>
                <div className="rounded-lg border bg-slate-50 p-3">
                  <p className="mb-1 text-xs text-slate-600">Docentes</p>
                  <p className="text-xl font-bold text-purple-600">{teachers.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-2 transition-shadow hover:shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-xl">
                <BookOpen className="h-6 w-6 text-green-600" />
                Gestión de Cursos
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="mb-4 text-sm text-slate-600">
                Crea, edita cursos y asigna docentes
              </p>
              <div className="flex flex-wrap gap-2">
                <Link href="/dashboard/admin/courses" className="flex-1">
                  <Button className="w-full bg-green-600 hover:bg-green-700">
                    <BookOpen className="mr-2 h-4 w-4" />
                    Gestionar Cursos
                  </Button>
                </Link>
              </div>
              <div className="mt-4 grid grid-cols-3 gap-2">
                <div className="rounded-lg border bg-slate-50 p-3">
                  <p className="mb-1 text-xs text-slate-600">Total</p>
                  <p className="text-xl font-bold text-green-600">{courses.length}</p>
                </div>
                <div className="rounded-lg border bg-slate-50 p-3">
                  <p className="mb-1 text-xs text-slate-600">Activos</p>
                  <p className="text-xl font-bold text-orange-600">{activeCourses}</p>
                </div>
                <div className="rounded-lg border bg-slate-50 p-3">
                  <p className="mb-1 text-xs text-slate-600">Próximos</p>
                  <p className="text-xl font-bold text-blue-600">{upcomingCourses}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
