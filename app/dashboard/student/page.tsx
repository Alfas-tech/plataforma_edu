import { redirect } from "next/navigation";
import { getCurrentProfile } from "@/src/presentation/actions/profile.actions";
import { getAllCourses } from "@/src/presentation/actions/course.actions";
import { getCourseContent } from "@/src/presentation/actions/student.actions";
import { signout } from "@/src/presentation/actions/auth.actions";
import { formatDateSpanish as formatDate } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  LogOut,
  BookOpen,
  CheckCircle2,
  Calendar,
  Trophy,
} from "lucide-react";
import Link from "next/link";
import Image from "next/image";

export default async function StudentDashboardPage() {
  const profileResult = await getCurrentProfile();

  if ("error" in profileResult) {
    redirect("/login");
  }

  const { profile } = profileResult;

  if (!profile.isStudent) {
    redirect("/dashboard");
  }

  // Get all courses
  const coursesResult = await getAllCourses();
  const allCourses =
    "error" in coursesResult ? [] : coursesResult.courses || [];

  // Filter active courses
  const visibleCourses = allCourses.filter((c) => c.isVisibleForStudents);
  const upcomingCourses = allCourses.filter(
    (c) =>
      !c.isVisibleForStudents &&
      c.hasActiveVersion &&
      c.activeVersion?.status === "draft"
  );

  // Get progress data for all visible courses
  const coursesProgress = await Promise.all(
    visibleCourses.map(async (course) => {
      const result = await getCourseContent(course.id);
      if ("error" in result) {
        return {
          courseId: course.id,
          totalTopics: 0,
          completedTopics: 0,
          totalResources: 0,
          progress: 0,
        };
      }

      const topics = result.topics || [];
      const totalTopics = topics.length;
      const completedTopics = topics.filter((t) => t.completed).length;
      const totalResources = topics.reduce(
        (sum, topic) => sum + (topic.resources?.length || 0),
        0
      );
      const progress =
        totalTopics > 0 ? Math.round((completedTopics / totalTopics) * 100) : 0;

      return {
        courseId: course.id,
        totalTopics,
        completedTopics,
        totalResources,
        progress,
      };
    })
  );

  // Calculate global statistics
  const totalTopics = coursesProgress.reduce(
    (sum, cp) => sum + cp.totalTopics,
    0
  );
  const completedTopics = coursesProgress.reduce(
    (sum, cp) => sum + cp.completedTopics,
    0
  );
  const totalResources = coursesProgress.reduce(
    (sum, cp) => sum + cp.totalResources,
    0
  );
  const progressPercentage =
    totalTopics > 0 ? Math.round((completedTopics / totalTopics) * 100) : 0;
  const availableTopics = totalTopics;

  function formatVersionStatus(status?: string): string {
    switch (status) {
      case "active":
        return "Activa";
      case "draft":
        return "Borrador";
      case "archived":
        return "Archivada";
      default:
        return "Sin versión";
    }
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

        {/* Main Content Grid */}
        <div className="grid gap-4 sm:gap-6 lg:grid-cols-3">
          {/* Course Cards */}
          <div className="space-y-4 sm:space-y-6 lg:col-span-2">
            <div>
              <h2 className="mb-4 text-xl font-bold text-slate-800 sm:text-2xl">
                Mis Cursos
              </h2>
              {visibleCourses.length === 0 ? (
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
                <div className="grid gap-4 sm:gap-6 md:grid-cols-2">
                  {visibleCourses.map((course) => {
                    // Get course progress
                    const courseProgressData = coursesProgress.find(
                      (cp) => cp.courseId === course.id
                    );
                    const courseProgress = courseProgressData?.progress || 0;
                    const courseTotalTopics =
                      courseProgressData?.totalTopics || 0;
                    const courseCompletedTopics =
                      courseProgressData?.completedTopics || 0;

                    return (
                      <Link
                        key={course.id}
                        href={`/dashboard/student/courses/${course.id}`}
                      >
                        <Card className="h-full cursor-pointer border-2 transition-all hover:border-blue-300 hover:shadow-lg">
                          <CardHeader className="p-4 sm:p-6">
                            <div className="flex items-start justify-between gap-2">
                              <CardTitle className="line-clamp-2 text-base sm:text-lg">
                                {course.title}
                              </CardTitle>
                              <Badge className="ml-2 flex-shrink-0 bg-green-600">
                                Disponible
                              </Badge>
                            </div>
                            {(course.summary || course.description) && (
                              <CardDescription className="mt-2 line-clamp-2">
                                {course.summary ?? course.description}
                              </CardDescription>
                            )}
                          </CardHeader>
                          <CardContent className="p-4 pt-0 sm:p-6 sm:pt-0">
                            {/* Progress bar */}
                            <div className="mb-3">
                              <div className="mb-1 flex justify-between text-xs sm:text-sm">
                                <span className="text-slate-600">Progreso</span>
                                <span className="font-semibold">
                                  {courseProgress}%
                                </span>
                              </div>
                              <div className="h-2 w-full rounded-full bg-slate-200">
                                <div
                                  className="h-2 rounded-full bg-blue-600 transition-all"
                                  style={{ width: `${courseProgress}%` }}
                                ></div>
                              </div>
                            </div>

                            {/* Stats */}
                            <div className="flex items-center gap-4 text-xs text-slate-600">
                              <div className="flex items-center gap-1">
                                <BookOpen className="h-3 w-3" />
                                <span>
                                    {courseCompletedTopics}/{courseTotalTopics}{" "}
                                    tópicos
                                </span>
                              </div>
                              {course.activeVersion && (
                                <Badge variant="outline" className="text-xs">
                                  {formatVersionStatus(
                                    course.activeVersion.status
                                  )}
                                </Badge>
                              )}
                            </div>

                            <div className="mt-3 flex items-center gap-2 text-xs text-slate-500">
                              <Calendar className="h-3 w-3" />
                              <span>
                                Actualizado el{" "}
                                {course.lastUpdatedAt
                                  ? formatDate(course.lastUpdatedAt)
                                  : "Fecha no disponible"}
                              </span>
                            </div>
                          </CardContent>
                        </Card>
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>
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
                      <span className="font-semibold">
                        {progressPercentage}%
                      </span>
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
                          <strong>{completedTopics}</strong> de{" "}
                          <strong>{totalTopics}</strong> tópicos completados
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
                      <p className="mb-1 font-medium text-slate-800">
                        {course.title}
                      </p>
                      {(course.summary || course.description) && (
                        <p className="text-xs text-slate-600">
                          {course.summary ?? course.description}
                        </p>
                      )}
                      <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-slate-500">
                        <Calendar className="h-3 w-3" />
                        <span>
                          Última actualización{" "}
                          {course.lastUpdatedAt
                            ? formatDate(course.lastUpdatedAt)
                            : "Fecha no disponible"}
                        </span>
                      </div>
                      <div className="mt-2 flex flex-wrap gap-2">
                        <Badge variant="outline" className="text-xs">
                          {formatVersionStatus(course.activeVersion?.status)}
                        </Badge>
                        {course.visibilityOverride && (
                          <Badge className="bg-purple-600 text-xs">
                            Visibilidad forzada
                          </Badge>
                        )}
                      </div>
                      {course.activeVersion?.summary && (
                        <p className="mt-2 text-xs text-slate-500">
                          {course.activeVersion.summary}
                        </p>
                      )}
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
