import { redirect } from "next/navigation";
import { getCurrentProfile } from "@/src/presentation/actions/profile.actions";
import { getAllCourses } from "@/src/presentation/actions/course.actions";
import { getCourseWithModulesAndLessons } from "@/src/presentation/actions/student.actions";
import { signout } from "@/src/presentation/actions/auth.actions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { LogOut, BookOpen, Clock, CheckCircle2, Calendar, PlayCircle, FileText, Trophy, TrendingUp } from "lucide-react";
import Link from "next/link";
import Image from "next/image";

export default async function StudentDashboardPage() {
  const profileResult = await getCurrentProfile();

  if ('error' in profileResult) {
    redirect("/login");
  }

  const { profile } = profileResult;

  if (!profile.isStudent) {
    redirect("/dashboard");
  }

  // Obtener todos los cursos
  const coursesResult = await getAllCourses();
  const allCourses = 'error' in coursesResult ? [] : coursesResult.courses || [];

  // Filtrar cursos activos
  const activeCourses = allCourses.filter(c => c.status === 'active');
  const upcomingCourses = allCourses.filter(c => c.status === 'upcoming');

  // Obtener datos completos del primer curso activo
  let courseData: any = null;
  let totalLessons = 0;
  let completedLessons = 0;
  
  if (activeCourses.length > 0) {
    const result = await getCourseWithModulesAndLessons(activeCourses[0].id);
    if (!('error' in result)) {
      courseData = result;
      
      // Calcular totales de forma segura
      if (courseData.modules && Array.isArray(courseData.modules)) {
        courseData.modules.forEach((module: any) => {
          if (module.lessons && Array.isArray(module.lessons)) {
            totalLessons += module.lessons.length;
            module.lessons.forEach((lesson: any) => {
              if (courseData.progress && Array.isArray(courseData.progress)) {
                const isCompleted = courseData.progress.some(
                  (p: any) => p.lesson_id === lesson.id && p.completed
                );
                if (isCompleted) completedLessons++;
              }
            });
          }
        });
      }
    } else {
      console.error('Error loading course data:', result.error);
    }
  }

  const progressPercentage = totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0;
  const publishedModules = (courseData?.modules && Array.isArray(courseData.modules)) ? courseData.modules.length : 0;

  function formatDate(dateString: string): string {
    return new Date(dateString).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
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
              <span className="hidden text-xs font-medium text-blue-600 sm:inline sm:text-sm">
                👨‍🎓 Estudiante
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
                <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 text-xs font-semibold text-white sm:h-10 sm:w-10 sm:text-sm">
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
        {/* Welcome Section */}
        <div className="mb-6 sm:mb-8">
          <h1 className="mb-1 text-balance text-2xl font-bold text-slate-800 sm:mb-2 sm:text-3xl md:text-4xl lg:text-5xl">
            ¡Bienvenido, {profile.displayName}! 👋
          </h1>
          <p className="text-pretty text-sm text-slate-600 sm:text-base md:text-lg lg:text-xl">
            Continúa tu viaje de aprendizaje
          </p>
        </div>

        {/* Quick Stats */}
        <div className="mb-6 grid grid-cols-2 gap-3 sm:mb-8 sm:gap-4 lg:grid-cols-4">
          <Card className="border-2 transition-shadow hover:shadow-lg">
            <CardContent className="p-3 pt-4 sm:p-6 sm:pt-6">
              <div className="flex items-center justify-between gap-2">
                <div className="min-w-0">
                  <p className="mb-1 text-xs text-slate-600 sm:text-sm">
                    Cursos Activos
                  </p>
                  <p className="text-xl font-bold text-slate-800 sm:text-2xl md:text-3xl">
                    {activeCourses.length}
                  </p>
                </div>
                <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-blue-100 sm:h-12 sm:w-12">
                  <BookOpen className="h-5 w-5 text-blue-600 sm:h-6 sm:w-6" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-2 transition-shadow hover:shadow-lg">
            <CardContent className="p-3 pt-4 sm:p-6 sm:pt-6">
              <div className="flex items-center justify-between gap-2">
                <div className="min-w-0">
                  <p className="mb-1 text-xs text-slate-600 sm:text-sm">
                    Módulos
                  </p>
                  <p className="text-xl font-bold text-slate-800 sm:text-2xl md:text-3xl">
                    {publishedModules}
                  </p>
                </div>
                <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-green-100 sm:h-12 sm:w-12">
                  <FileText className="h-5 w-5 text-green-600 sm:h-6 sm:w-6" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-2 transition-shadow hover:shadow-lg">
            <CardContent className="p-3 pt-4 sm:p-6 sm:pt-6">
              <div className="flex items-center justify-between gap-2">
                <div className="min-w-0">
                  <p className="mb-1 text-xs text-slate-600 sm:text-sm">
                    Completadas
                  </p>
                  <p className="text-xl font-bold text-slate-800 sm:text-2xl md:text-3xl">
                    {completedLessons}/{totalLessons}
                  </p>
                </div>
                <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-yellow-100 sm:h-12 sm:w-12">
                  <Trophy className="h-5 w-5 text-yellow-600 sm:h-6 sm:w-6" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-2 transition-shadow hover:shadow-lg">
            <CardContent className="p-3 pt-4 sm:p-6 sm:pt-6">
              <div className="flex items-center justify-between gap-2">
                <div className="min-w-0">
                  <p className="mb-1 text-xs text-slate-600 sm:text-sm">
                    Progreso
                  </p>
                  <p className="truncate text-xl font-bold text-slate-800 sm:text-2xl md:text-3xl">
                    {progressPercentage}%
                  </p>
                </div>
                <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-purple-100 sm:h-12 sm:w-12">
                  <TrendingUp className="h-5 w-5 text-purple-600 sm:h-6 sm:w-6" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Grid */}
        <div className="grid gap-4 sm:gap-6 lg:grid-cols-3">
          {/* Course Content */}
          <div className="space-y-4 sm:space-y-6 lg:col-span-2">
            {activeCourses.length === 0 ? (
              <Card className="border-2">
                <CardContent className="py-12 text-center">
                  <BookOpen className="mx-auto mb-4 h-16 w-16 text-slate-300" />
                  <h3 className="mb-2 text-xl font-semibold text-slate-800">
                    No hay cursos activos
                  </h3>
                  <p className="text-slate-600">
                    Los cursos aparecerán aquí cuando estén disponibles
                  </p>
                </CardContent>
              </Card>
            ) : (
              <>
                {/* Current Course */}
                <Card className="border-2">
                  <CardHeader className="p-4 sm:p-6">
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="text-lg sm:text-xl md:text-2xl">
                          {activeCourses[0].title}
                        </CardTitle>
                        <CardDescription className="mt-2">
                          {activeCourses[0].description}
                        </CardDescription>
                      </div>
                      <Badge className="ml-2 bg-green-600">Activo</Badge>
                    </div>
                    <div className="mt-4 flex items-center gap-4 text-sm text-slate-600">
                      <div className="flex items-center gap-1">
                        <Calendar className="h-4 w-4" />
                        <span>
                          {formatDate(activeCourses[0].startDate)} - {formatDate(activeCourses[0].endDate)}
                        </span>
                      </div>
                    </div>
                  </CardHeader>
                </Card>

                {/* Modules & Lessons */}
                {courseData && courseData.modules && Array.isArray(courseData.modules) && courseData.modules.length > 0 ? (
                  <div className="space-y-4">
                    {courseData.modules.map((module: any, moduleIndex: number) => (
                      <Card key={module.id} className="border-2">
                        <CardHeader className="pb-3">
                          <div className="flex items-start justify-between">
                            <div>
                              <CardTitle className="text-base sm:text-lg">
                                Módulo {module.order_index}: {module.title}
                              </CardTitle>
                              {module.description && (
                                <CardDescription className="mt-1">
                                  {module.description}
                                </CardDescription>
                              )}
                            </div>
                            {module.is_published && (
                              <Badge variant="outline" className="ml-2">
                                {(module.lessons && Array.isArray(module.lessons)) ? module.lessons.length : 0} lecciones
                              </Badge>
                            )}
                          </div>
                        </CardHeader>
                        <CardContent>
                          {module.lessons && Array.isArray(module.lessons) && module.lessons.length > 0 ? (
                            <div className="space-y-2">
                              {module.lessons.map((lesson: any) => {
                                const isCompleted = courseData.progress && Array.isArray(courseData.progress) && courseData.progress.some(
                                  (p: any) => p.lesson_id === lesson.id && p.completed
                                );

                                return (
                                  <Link
                                    key={lesson.id}
                                    href={`/courses/${activeCourses[0].id}/modules/${module.id}/lessons/${lesson.id}`}
                                    className="block"
                                  >
                                    <div className="flex items-center justify-between rounded-lg border bg-white p-3 transition-all hover:border-blue-300 hover:shadow-md">
                                      <div className="flex items-center gap-3">
                                        <div
                                          className={`flex h-8 w-8 items-center justify-center rounded-full ${
                                            isCompleted
                                              ? 'bg-green-100 text-green-600'
                                              : 'bg-slate-100 text-slate-400'
                                          }`}
                                        >
                                          {isCompleted ? (
                                            <CheckCircle2 className="h-5 w-5" />
                                          ) : (
                                            <PlayCircle className="h-5 w-5" />
                                          )}
                                        </div>
                                        <div>
                                          <p className="font-medium text-slate-800">
                                            {lesson.title}
                                          </p>
                                          {lesson.duration_minutes && (
                                            <div className="mt-1 flex items-center gap-1 text-xs text-slate-500">
                                              <Clock className="h-3 w-3" />
                                              <span>{lesson.duration_minutes} min</span>
                                            </div>
                                          )}
                                        </div>
                                      </div>
                                      {isCompleted && (
                                        <Badge className="bg-green-600">Completado</Badge>
                                      )}
                                    </div>
                                  </Link>
                                );
                              })}
                            </div>
                          ) : (
                            <p className="py-4 text-center text-sm text-slate-500">
                              No hay lecciones publicadas aún
                            </p>
                          )}
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <Card className="border-2">
                    <CardContent className="py-8 text-center">
                      <FileText className="mx-auto mb-3 h-12 w-12 text-slate-300" />
                      <p className="text-sm text-slate-600">
                        El contenido del curso estará disponible pronto
                      </p>
                    </CardContent>
                  </Card>
                )}
              </>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-4 sm:space-y-6">
            {/* Progress Card */}
            <Card className="border-2">
              <CardHeader className="p-4 sm:p-6">
                <CardTitle className="text-base sm:text-lg">
                  Tu Progreso
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 sm:p-6">
                <div className="space-y-4">
                  <div>
                    <div className="mb-2 flex justify-between text-xs sm:text-sm">
                      <span className="text-slate-600">Curso completo</span>
                      <span className="font-semibold">{progressPercentage}%</span>
                    </div>
                    <div className="h-2 w-full rounded-full bg-slate-200">
                      <div
                        className="h-2 rounded-full bg-blue-600 transition-all"
                        style={{ width: `${progressPercentage}%` }}
                      ></div>
                    </div>
                  </div>

                  <div className="rounded-lg border border-blue-200 bg-blue-50 p-3">
                    <div className="flex items-center gap-2 text-sm text-blue-800">
                      <Trophy className="h-4 w-4" />
                      <span>
                        <strong>{completedLessons}</strong> de <strong>{totalLessons}</strong> lecciones completadas
                      </span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Upcoming Courses */}
            {upcomingCourses.length > 0 && (
              <Card className="border-2">
                <CardHeader className="p-4 sm:p-6">
                  <CardTitle className="text-base sm:text-lg">
                    Próximos Cursos
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 p-4 sm:p-6">
                  {upcomingCourses.map((course) => (
                    <div
                      key={course.id}
                      className="rounded-lg border bg-white p-3"
                    >
                      <p className="mb-1 font-medium text-slate-800">{course.title}</p>
                      <div className="flex items-center gap-1 text-xs text-slate-500">
                        <Calendar className="h-3 w-3" />
                        <span>Inicia el {formatDate(course.startDate)}</span>
                      </div>
                      {(() => {
                        const daysUntilStart = Math.ceil((new Date(course.startDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
                        return daysUntilStart > 0 && (
                          <Badge className="mt-2 bg-orange-600 text-xs">
                            En {daysUntilStart} días
                          </Badge>
                        );
                      })()}
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
