import { redirect } from "next/navigation";
import { getCurrentProfile } from "@/src/presentation/actions/profile.actions";
import { getTeacherCourses } from "@/src/presentation/actions/course.actions";
import { signout } from "@/src/presentation/actions/auth.actions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { LogOut, BookOpen, FileEdit, Clock, CheckCircle2, XCircle } from "lucide-react";
import Link from "next/link";
import Image from "next/image";

export default async function TeacherDashboardPage() {
  const profileResult = await getCurrentProfile();

  if ('error' in profileResult) {
    redirect("/login");
  }

  const { profile } = profileResult;

  if (!profile.isTeacher) {
    redirect("/dashboard");
  }

  // Obtener cursos asignados al docente
  const coursesResult = await getTeacherCourses(profile.id);
  const courses = 'error' in coursesResult ? [] : coursesResult.courses || [];

  // Calcular estadísticas
  const activeCourses = courses.filter(c => c.status === 'active');
  const upcomingCourses = courses.filter(c => c.status === 'upcoming');
  const completedCourses = courses.filter(c => c.status === 'ended');

  function formatDate(dateInput: string | Date): string {
    const date = typeof dateInput === 'string' ? new Date(dateInput) : dateInput;
    return date.toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-emerald-50 to-teal-50">
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

      {/* Main Content */}
      <main className="container mx-auto px-3 py-4 sm:px-4 sm:py-6 lg:px-6 lg:py-8">
        {/* Header Section */}
        <div className="mb-6 sm:mb-8">
          <h1 className="mb-2 text-balance text-2xl font-bold text-slate-800 sm:mb-3 sm:text-3xl md:text-4xl">
            Panel de Docente
          </h1>
          <p className="text-pretty text-sm text-slate-600 sm:text-base">
            Bienvenido, {profile.displayName}. Gestiona el contenido de tus cursos asignados
          </p>
        </div>

        {/* Quick Stats */}
        <div className="mb-6 grid grid-cols-2 gap-3 sm:mb-8 sm:gap-4 lg:grid-cols-3">
          <Card className="border-2">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-sm sm:text-base">
                <BookOpen className="h-4 w-4 text-emerald-600 sm:h-5 sm:w-5" />
                Total Cursos
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-emerald-600 sm:text-3xl">{courses.length}</p>
            </CardContent>
          </Card>

          <Card className="border-2">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-sm sm:text-base">
                <CheckCircle2 className="h-4 w-4 text-green-600 sm:h-5 sm:w-5" />
                Activos
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-green-600 sm:text-3xl">{activeCourses.length}</p>
            </CardContent>
          </Card>

          <Card className="border-2">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-sm sm:text-base">
                <Clock className="h-4 w-4 text-blue-600 sm:h-5 sm:w-5" />
                Próximos
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-blue-600 sm:text-3xl">{upcomingCourses.length}</p>
            </CardContent>
          </Card>
        </div>

        {/* Courses List */}
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
                    El administrador te asignará cursos para que puedas gestionar su contenido
                  </p>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {courses.map((course) => (
                <Card key={course.id} className="border-2 transition-shadow hover:shadow-lg">
                  <CardHeader>
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <CardTitle className="mb-2 text-xl">{course.title}</CardTitle>
                        {course.status === 'active' ? (
                          <Badge className="bg-green-100 text-green-700">
                            <CheckCircle2 className="mr-1 h-3 w-3" />
                            Activo
                          </Badge>
                        ) : course.status === 'upcoming' ? (
                          <Badge className="bg-blue-100 text-blue-700">
                            <Clock className="mr-1 h-3 w-3" />
                            Próximo
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="border-slate-300 text-slate-600">
                            <XCircle className="mr-1 h-3 w-3" />
                            Finalizado
                          </Badge>
                        )}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="mb-4 text-sm text-slate-600">{course.description}</p>
                    
                    <div className="grid gap-3 sm:grid-cols-2">
                      <div className="rounded-lg border bg-slate-50 p-3">
                        <p className="mb-1 text-xs text-slate-600">Fecha de Inicio</p>
                        <p className="text-sm font-semibold text-slate-800">
                          {formatDate(course.startDate)}
                        </p>
                      </div>
                      <div className="rounded-lg border bg-slate-50 p-3">
                        <p className="mb-1 text-xs text-slate-600">Fecha de Fin</p>
                        <p className="text-sm font-semibold text-slate-800">
                          {formatDate(course.endDate)}
                        </p>
                      </div>
                    </div>

                    {course.status === 'active' && course.daysRemaining > 0 && (
                      <div className="mt-3 rounded-lg border border-green-200 bg-green-50 p-3 text-sm text-green-800">
                        <strong>⏳ {course.daysRemaining} días restantes</strong> hasta finalizar
                      </div>
                    )}

                    {course.status === 'upcoming' && (() => {
                      const startDate = new Date(course.startDate);
                      const today = new Date();
                      const daysUntilStart = Math.ceil((startDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
                      return daysUntilStart > 0;
                    })() && (
                      <div className="mt-3 rounded-lg border border-blue-200 bg-blue-50 p-3 text-sm text-blue-800">
                        <strong>⏰ Inicia en {(() => {
                          const startDate = new Date(course.startDate);
                          const today = new Date();
                          return Math.ceil((startDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
                        })()} días</strong>
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
              ))}
            </div>
          )}
        </div>

        {/* Info Card */}
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
