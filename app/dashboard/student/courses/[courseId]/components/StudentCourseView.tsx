"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  BookOpen,
  CheckCircle2,
  Circle,
  Clock,
  ArrowLeft,
  ChevronDown,
  ChevronRight,
  Trophy,
  FileText,
  LogOut,
} from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { markLessonComplete, markLessonIncomplete } from "@/src/presentation/actions/student.actions";
import { useRouter } from "next/navigation";
import { signout } from "@/src/presentation/actions/auth.actions";

interface Lesson {
  id: string;
  moduleId: string;
  title: string;
  content: string | null;
  orderIndex: number;
  durationMinutes: number | null;
  isPublished: boolean;
  completed?: boolean;
}

interface Module {
  id: string;
  courseId: string;
  courseVersionId: string;
  title: string;
  description: string | null;
  orderIndex: number;
  isPublished: boolean;
  lessons: Lesson[];
}

interface Course {
  id: string;
  title: string;
  description: string | null;
  activeVersionId: string | null;
}

interface Profile {
  displayName: string;
  avatarUrl: string | null;
}

interface StudentCourseViewProps {
  course: Course;
  modules: Module[];
  studentId: string;
  profile: Profile;
}

export function StudentCourseView({
  course,
  modules,
  studentId,
  profile,
}: StudentCourseViewProps) {
  const router = useRouter();
  const [expandedModules, setExpandedModules] = useState<Set<string>>(
    new Set(modules.map((m) => m.id))
  );
  const [processingLessons, setProcessingLessons] = useState<Set<string>>(
    new Set()
  );

  const toggleModule = (moduleId: string) => {
    const newExpanded = new Set(expandedModules);
    if (newExpanded.has(moduleId)) {
      newExpanded.delete(moduleId);
    } else {
      newExpanded.add(moduleId);
    }
    setExpandedModules(newExpanded);
  };

  const handleToggleComplete = async (lesson: Lesson) => {
    if (processingLessons.has(lesson.id)) return;

    setProcessingLessons(new Set(processingLessons).add(lesson.id));

    try {
      if (lesson.completed) {
        await markLessonIncomplete(lesson.id);
      } else {
        await markLessonComplete(lesson.id);
      }
      router.refresh();
    } catch (error) {
      console.error("Error al actualizar progreso:", error);
    } finally {
      const newProcessing = new Set(processingLessons);
      newProcessing.delete(lesson.id);
      setProcessingLessons(newProcessing);
    }
  };

  const totalLessons = modules.reduce((acc, m) => acc + m.lessons.length, 0);
  const completedLessons = modules.reduce(
    (acc, m) => acc + m.lessons.filter((l) => l.completed).length,
    0
  );
  const progress =
    totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      {/* Header - Mismo que el dashboard */}
      <header className="sticky top-0 z-50 border-b border-slate-200 bg-white shadow-sm">
        <div className="container mx-auto px-3 py-3 sm:px-4 sm:py-4 lg:px-6">
          <div className="flex items-center justify-between gap-2 sm:gap-4">
            <Link
              href="/dashboard/student"
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
        {/* Breadcrumb */}
        <div className="mb-4 sm:mb-6">
          <Link
            href="/dashboard/student"
            className="inline-flex items-center gap-2 text-sm text-slate-600 transition-colors hover:text-slate-900 sm:text-base"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Volver a Mis Cursos</span>
          </Link>
        </div>

        {/* Course Header Card */}
        <Card className="mb-6 border-2 sm:mb-8">
          <CardHeader className="p-4 sm:p-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div className="flex-1">
                <CardTitle className="mb-2 text-xl sm:text-2xl md:text-3xl">
                  {course.title}
                </CardTitle>
                {course.description && (
                  <CardDescription className="text-sm sm:text-base">
                    {course.description}
                  </CardDescription>
                )}
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-4 sm:p-6">
            <div className="grid grid-cols-2 gap-4 sm:flex sm:items-center sm:gap-6">
              <div>
                <p className="text-xs text-slate-600 sm:text-sm">
                  Progreso General
                </p>
                <p className="text-2xl font-bold text-indigo-600 sm:text-3xl">
                  {progress}%
                </p>
              </div>
              <div>
                <p className="text-xs text-slate-600 sm:text-sm">
                  Lecciones Completadas
                </p>
                <p className="text-xl font-semibold text-slate-900 sm:text-2xl">
                  {completedLessons} / {totalLessons}
                </p>
              </div>
              <div>
                <p className="text-xs text-slate-600 sm:text-sm">Módulos</p>
                <p className="text-xl font-semibold text-slate-900 sm:text-2xl">
                  {modules.length}
                </p>
              </div>
              <div>
                <div className="mb-1 text-xs text-slate-600 sm:text-sm">
                  Progreso
                </div>
                <div className="h-2 w-full rounded-full bg-slate-200 sm:w-32">
                  <div
                    className="h-2 rounded-full bg-blue-600 transition-all"
                    style={{ width: `${progress}%` }}
                  ></div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Modules Section */}
        <div className="grid gap-4 sm:gap-6 lg:grid-cols-3">
          {/* Modules List */}
          <div className="space-y-4 sm:space-y-6 lg:col-span-2">
            <h2 className="text-xl font-bold text-slate-800 sm:text-2xl">
              Contenido del Curso
            </h2>
            {modules.length === 0 ? (
              <Card className="border-2">
                <CardContent className="p-8 text-center">
                  <BookOpen className="mx-auto mb-4 h-12 w-12 text-slate-400" />
                  <p className="text-lg font-semibold text-slate-700">
                    No hay módulos disponibles
                  </p>
                  <p className="text-sm text-slate-500">
                    El contenido de este curso estará disponible próximamente.
                  </p>
                </CardContent>
              </Card>
            ) : (
              modules.map((module) => {
                const moduleLessons = module.lessons || [];
                const moduleCompleted = moduleLessons.filter(
                  (l) => l.completed
                ).length;
                const moduleProgress =
                  moduleLessons.length > 0
                    ? Math.round((moduleCompleted / moduleLessons.length) * 100)
                    : 0;
                const isExpanded = expandedModules.has(module.id);

                return (
                  <Card key={module.id} className="border-2">
                    <CardHeader
                      className="cursor-pointer p-4 transition-colors hover:bg-slate-50 sm:p-6"
                      onClick={() => toggleModule(module.id)}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            {isExpanded ? (
                              <ChevronDown className="h-5 w-5 flex-shrink-0 text-slate-400" />
                            ) : (
                              <ChevronRight className="h-5 w-5 flex-shrink-0 text-slate-400" />
                            )}
                            <CardTitle className="text-base sm:text-lg">
                              Módulo {module.orderIndex}: {module.title}
                            </CardTitle>
                          </div>
                          {module.description && (
                            <p className="ml-7 mt-1 text-sm text-slate-600">
                              {module.description}
                            </p>
                          )}
                        </div>
                        <div className="flex flex-shrink-0 items-center gap-2">
                          <Badge
                            variant="outline"
                            className="border-indigo-200 bg-indigo-50 text-indigo-700"
                          >
                            {moduleProgress}%
                          </Badge>
                        </div>
                      </div>
                    </CardHeader>

                    {isExpanded && (
                      <CardContent className="p-4 sm:p-6">
                        {moduleLessons.length === 0 ? (
                          <p className="py-4 text-center text-sm text-slate-500">
                            No hay lecciones disponibles en este módulo
                          </p>
                        ) : (
                          <div className="space-y-2">
                            {moduleLessons.map((lesson) => (
                              <div
                                key={lesson.id}
                                className="group flex items-center justify-between rounded-lg border border-slate-200 p-3 transition-all hover:border-blue-300 hover:bg-blue-50/50 hover:shadow-md sm:p-4"
                              >
                                <div className="flex flex-1 items-center gap-3">
                                  <button
                                    onClick={() => handleToggleComplete(lesson)}
                                    disabled={processingLessons.has(lesson.id)}
                                    className="flex-shrink-0 transition-all hover:scale-110 disabled:opacity-50 disabled:hover:scale-100"
                                    title={
                                      lesson.completed
                                        ? "Marcar como no completada"
                                        : "Marcar como completada"
                                    }
                                  >
                                    {lesson.completed ? (
                                      <CheckCircle2 className="h-6 w-6 text-emerald-600 sm:h-7 sm:w-7" />
                                    ) : (
                                      <Circle className="h-6 w-6 text-slate-300 group-hover:text-blue-400 sm:h-7 sm:w-7" />
                                    )}
                                  </button>
                                  <div className="flex-1 min-w-0">
                                    <p
                                      className={`font-medium transition-colors text-sm sm:text-base ${
                                        lesson.completed
                                          ? "text-slate-500 line-through"
                                          : "text-slate-900 group-hover:text-blue-700"
                                      }`}
                                    >
                                      {lesson.title}
                                    </p>
                                    <div className="mt-1 flex flex-wrap items-center gap-2 sm:gap-3">
                                      {lesson.durationMinutes && (
                                        <p className="flex items-center gap-1 text-xs text-slate-500">
                                          <Clock className="h-3 w-3" />
                                          {lesson.durationMinutes} min
                                        </p>
                                      )}
                                      {lesson.completed && (
                                        <Badge className="bg-emerald-600 text-xs">
                                          ✓ Completada
                                        </Badge>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </CardContent>
                    )}
                  </Card>
                );
              })
            )}
          </div>

          {/* Sidebar - Progress Card */}
          <div className="space-y-4 sm:space-y-6">
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
                      <span className="font-semibold">{progress}%</span>
                    </div>
                    <div className="h-2 w-full rounded-full bg-slate-200">
                      <div
                        className="h-2 rounded-full bg-blue-600 transition-all"
                        style={{ width: `${progress}%` }}
                      ></div>
                    </div>
                  </div>

                  <div className="rounded-lg border border-blue-200 bg-blue-50 p-3">
                    <div className="flex items-center gap-2 text-sm text-blue-800">
                      <Trophy className="h-4 w-4 flex-shrink-0" />
                      <span>
                        <strong>{completedLessons}</strong> de{" "}
                        <strong>{totalLessons}</strong> lecciones completadas
                      </span>
                    </div>
                  </div>

                  <div className="space-y-2">
                    {modules.map((module) => {
                      const moduleLessons = module.lessons || [];
                      const moduleCompleted = moduleLessons.filter(
                        (l) => l.completed
                      ).length;
                      const moduleProgress =
                        moduleLessons.length > 0
                          ? Math.round(
                              (moduleCompleted / moduleLessons.length) * 100
                            )
                          : 0;

                      return (
                        <div
                          key={module.id}
                          className="rounded-lg border bg-white p-3"
                        >
                          <p className="mb-1 text-sm font-medium text-slate-800">
                            Módulo {module.orderIndex}
                          </p>
                          <div className="flex items-center justify-between gap-2 text-xs text-slate-600">
                            <span>
                              {moduleCompleted}/{moduleLessons.length} lecciones
                            </span>
                            <Badge variant="outline" className="text-xs">
                              {moduleProgress}%
                            </Badge>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}
