import { redirect } from "next/navigation";
import { getCurrentProfile } from "@/src/presentation/actions/profile.actions";
import {
  markLessonComplete,
  markLessonIncomplete,
} from "@/src/presentation/actions/student.actions";
import { signout } from "@/src/presentation/actions/auth.actions";
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
  ArrowLeft,
  CheckCircle2,
  Clock,
  BookOpen,
  Circle,
} from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { createClient } from "@/src/infrastructure/supabase/server";
import { LessonContentClient } from "./components/LessonContentClient";

interface PageProps {
  params: {
    courseId: string;
    moduleId: string;
    lessonId: string;
  };
}

export default async function LessonPage({ params }: PageProps) {
  const profileResult = await getCurrentProfile();

  if ("error" in profileResult) {
    redirect("/login");
  }

  const { profile } = profileResult;

  if (!profile.isStudent) {
    redirect("/dashboard");
  }

  const supabase = createClient();

  // Get lesson
  const { data: lesson, error: lessonError } = await supabase
    .from("lessons")
    .select("*")
    .eq("id", params.lessonId)
    .single();

  if (lessonError || !lesson) {
    redirect("/dashboard/student");
  }

  // Get module
  const { data: module } = await supabase
    .from("course_modules")
    .select("*")
    .eq("id", params.moduleId)
    .single();

  // Get course
  const { data: course } = await supabase
    .from("courses")
    .select("*")
    .eq("id", params.courseId)
    .single();

  // Get all lessons in module
  const { data: allLessons } = await supabase
    .from("lessons")
    .select("*")
    .eq("module_id", params.moduleId)
    .eq("is_published", true)
    .order("order_index", { ascending: true });

  // Get student progress
  const { data: progress } = await supabase
    .from("student_progress")
    .select("*")
    .eq("student_id", profile.id)
    .eq("lesson_id", params.lessonId)
    .single();

  const isCompleted = progress?.completed || false;

  // Find next and previous lessons
  const currentIndex = (allLessons || []).findIndex(
    (l) => l.id === params.lessonId
  );
  const previousLesson =
    currentIndex > 0 ? allLessons![currentIndex - 1] : null;
  const nextLesson =
    currentIndex < (allLessons || []).length - 1
      ? allLessons![currentIndex + 1]
      : null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      {/* Header */}
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
        {/* Back Button & Breadcrumb */}
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            <Link href="/dashboard/student">
              <Button variant="outline" size="sm">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Volver al curso
              </Button>
            </Link>
            <div className="flex flex-wrap items-center gap-2 text-sm text-slate-600">
              <span>{course?.title}</span>
              <span>•</span>
              <span>{module?.title}</span>
            </div>
          </div>
          {isCompleted && (
            <Badge className="bg-green-600">
              <CheckCircle2 className="mr-1 h-3 w-3" />
              Completado
            </Badge>
          )}
        </div>

        {/* Lesson Content */}
        <div className="grid gap-6 lg:grid-cols-4">
          {/* Main Content */}
          <div className="lg:col-span-3">
            <Card className="border-2">
              <CardHeader>
                <CardTitle className="text-2xl sm:text-3xl">
                  {lesson.title}
                </CardTitle>
                {lesson.duration_minutes && (
                  <CardDescription className="flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    <span>
                      Duración estimada: {lesson.duration_minutes} minutos
                    </span>
                  </CardDescription>
                )}
              </CardHeader>
              <CardContent>
                <LessonContentClient
                  lessonId={lesson.id}
                  content={lesson.content || ""}
                  isCompleted={isCompleted}
                />
              </CardContent>
            </Card>

            {/* Navigation Buttons */}
            <div className="mt-6 flex items-center justify-between">
              {previousLesson ? (
                <Link
                  href={`/courses/${params.courseId}/modules/${params.moduleId}/lessons/${previousLesson.id}`}
                >
                  <Button variant="outline">
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Anterior: {previousLesson.title}
                  </Button>
                </Link>
              ) : (
                <div />
              )}

              {nextLesson ? (
                <Link
                  href={`/courses/${params.courseId}/modules/${params.moduleId}/lessons/${nextLesson.id}`}
                >
                  <Button className="bg-blue-600 hover:bg-blue-700">
                    Siguiente: {nextLesson.title}
                    <ArrowLeft className="ml-2 h-4 w-4 rotate-180" />
                  </Button>
                </Link>
              ) : (
                <Link href="/dashboard/student">
                  <Button className="bg-green-600 hover:bg-green-700">
                    <CheckCircle2 className="mr-2 h-4 w-4" />
                    Finalizar módulo
                  </Button>
                </Link>
              )}
            </div>
          </div>

          {/* Sidebar - Lesson List */}
          <div className="lg:col-span-1">
            <Card className="border-2">
              <CardHeader>
                <CardTitle className="text-lg">Contenido del módulo</CardTitle>
                <CardDescription>{module?.title}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                {allLessons && allLessons.length > 0 ? (
                  allLessons.map((l) => {
                    const isCurrent = l.id === params.lessonId;

                    return (
                      <Link
                        key={l.id}
                        href={`/courses/${params.courseId}/modules/${params.moduleId}/lessons/${l.id}`}
                        className={`block rounded-lg border p-3 transition-all ${
                          isCurrent
                            ? "border-blue-500 bg-blue-50"
                            : "border-slate-200 bg-white hover:border-blue-300 hover:shadow-md"
                        }`}
                      >
                        <div className="flex items-start gap-2">
                          <div className="mt-1 flex-shrink-0">
                            {isCurrent ? (
                              <Circle className="h-4 w-4 fill-blue-600 text-blue-600" />
                            ) : (
                              <Circle className="h-4 w-4 text-slate-300" />
                            )}
                          </div>
                          <div className="min-w-0 flex-1">
                            <p
                              className={`text-sm font-medium ${isCurrent ? "text-blue-900" : "text-slate-700"}`}
                            >
                              {l.title}
                            </p>
                            {l.duration_minutes && (
                              <p className="mt-1 flex items-center gap-1 text-xs text-slate-500">
                                <Clock className="h-3 w-3" />
                                {l.duration_minutes} min
                              </p>
                            )}
                          </div>
                        </div>
                      </Link>
                    );
                  })
                ) : (
                  <p className="text-center text-sm text-slate-500">
                    No hay más lecciones
                  </p>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}
