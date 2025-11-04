"use client";

import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
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
import {
  markTopicComplete,
  markTopicIncomplete,
} from "@/src/presentation/actions/student.actions";
import { useRouter } from "next/navigation";
import { signout } from "@/src/presentation/actions/auth.actions";
import { useToast } from "@/components/ui/toast-provider";

interface Resource {
  id: string;
  topicId: string;
  title: string;
  description: string | null;
  resourceType: string;
  fileUrl: string | null;
  externalUrl: string | null;
  orderIndex: number;
}

interface Topic {
  id: string;
  courseVersionId: string;
  title: string;
  description: string | null;
  orderIndex: number;
  resources: Resource[];
  completed?: boolean;
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
  topics: Topic[];
  studentId: string;
  profile: Profile;
}

export function StudentCourseView({
  course,
  topics,
  studentId,
  profile,
}: StudentCourseViewProps) {
  const router = useRouter();
  const { showToast } = useToast();
  const [expandedTopics, setExpandedTopics] = useState<Set<string>>(
    new Set(topics.map((t) => t.id))
  );
  const [processingTopics, setProcessingTopics] = useState<Set<string>>(
    new Set()
  );
  const [localTopics, setLocalTopics] = useState<Topic[]>(topics);

  // Sync when topics change from server
  useEffect(() => {
    setLocalTopics(topics);
  }, [topics]);

  const toggleTopic = (topicId: string) => {
    const newExpanded = new Set(expandedTopics);
    if (newExpanded.has(topicId)) {
      newExpanded.delete(topicId);
    } else {
      newExpanded.add(topicId);
    }
    setExpandedTopics(newExpanded);
  };

  const handleToggleComplete = async (topic: Topic) => {
    if (processingTopics.has(topic.id)) return;

    setProcessingTopics(new Set(processingTopics).add(topic.id));

    // Update UI immediately
    const updatedTopics = localTopics.map((t) =>
      t.id === topic.id ? { ...t, completed: !t.completed } : t
    );
    setLocalTopics(updatedTopics);

    try {
      const result = topic.completed
        ? await markTopicIncomplete(topic.id)
        : await markTopicComplete(topic.id);

      if ("error" in result) {
        // Revertir cambio si hay error
        setLocalTopics(topics);
        showToast(result.error || "Error al actualizar progreso", "error");
      } else {
        // Mostrar mensaje de éxito
        showToast(
          topic.completed
            ? "Tópico marcado como no completado"
            : "¡Tópico completado! 🎉",
          "success"
        );
        // Refrescar desde servidor para estar sincronizado
        router.refresh();
      }
    } catch (error) {
      // Revertir cambio si hay error
      setLocalTopics(topics);
      showToast("Error al actualizar progreso", "error");
    } finally {
      const newProcessing = new Set(processingTopics);
      newProcessing.delete(topic.id);
      setProcessingTopics(newProcessing);
    }
  };

  const totalTopics = localTopics.length;
  const completedTopics = localTopics.filter((t) => t.completed).length;
  const progress =
    totalTopics > 0 ? Math.round((completedTopics / totalTopics) * 100) : 0;

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
                  Tópicos Completados
                </p>
                <p className="text-xl font-semibold text-slate-900 sm:text-2xl">
                  {completedTopics} / {totalTopics}
                </p>
              </div>
              <div>
                <p className="text-xs text-slate-600 sm:text-sm">Tópicos</p>
                <p className="text-xl font-semibold text-slate-900 sm:text-2xl">
                  {localTopics.length}
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
            {localTopics.length === 0 ? (
              <Card className="border-2">
                <CardContent className="p-8 text-center">
                  <BookOpen className="mx-auto mb-4 h-12 w-12 text-slate-400" />
                  <p className="text-lg font-semibold text-slate-700">
                    No hay tópicos disponibles
                  </p>
                  <p className="text-sm text-slate-500">
                    El contenido de este curso estará disponible próximamente.
                  </p>
                </CardContent>
              </Card>
            ) : (
              localTopics.map((topic) => {
                const topicResources = topic.resources || [];
                const isExpanded = expandedTopics.has(topic.id);

                return (
                  <Card key={topic.id} className="border-2">
                    <CardHeader
                      className="cursor-pointer p-4 transition-colors hover:bg-slate-50 sm:p-6"
                      onClick={() => toggleTopic(topic.id)}
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
                              {topic.orderIndex}. {topic.title}
                            </CardTitle>
                          </div>
                          {topic.description && (
                            <p className="ml-7 mt-1 text-sm text-slate-600">
                              {topic.description}
                            </p>
                          )}
                        </div>
                        <div className="flex flex-shrink-0 items-center gap-2">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleToggleComplete(topic);
                            }}
                            disabled={processingTopics.has(topic.id)}
                            className="flex-shrink-0 transition-all hover:scale-110 disabled:opacity-50 disabled:hover:scale-100"
                            title={
                              topic.completed
                                ? "Marcar como no completado"
                                : "Marcar como completado"
                            }
                          >
                            {topic.completed ? (
                              <CheckCircle2 className="h-6 w-6 text-emerald-600" />
                            ) : (
                              <Circle className="h-6 w-6 text-slate-300 hover:text-blue-400" />
                            )}
                          </button>
                        </div>
                      </div>
                    </CardHeader>

                    {isExpanded && (
                      <CardContent className="p-4 sm:p-6">
                        {topicResources.length === 0 ? (
                          <p className="py-4 text-center text-sm text-slate-500">
                            No hay recursos disponibles en este tópico
                          </p>
                        ) : (
                          <div className="space-y-2">
                            {topicResources.map((resource) => (
                              <div
                                key={resource.id}
                                className="group flex items-center justify-between rounded-lg border border-slate-200 p-3 transition-all hover:border-blue-300 hover:bg-blue-50/50 hover:shadow-md sm:p-4"
                              >
                                <div className="flex flex-1 items-center gap-3">
                                  <FileText className="h-5 w-5 flex-shrink-0 text-blue-600" />
                                  <div className="min-w-0 flex-1">
                                    <p className="text-sm font-medium text-slate-900 group-hover:text-blue-700 sm:text-base">
                                      {resource.title}
                                    </p>
                                    {resource.description && (
                                      <p className="mt-1 text-xs text-slate-500">
                                        {resource.description}
                                      </p>
                                    )}
                                    <div className="mt-1 flex flex-wrap items-center gap-2">
                                      <Badge
                                        variant="outline"
                                        className="text-xs"
                                      >
                                        {resource.resourceType}
                                      </Badge>
                                      {(resource.fileUrl ||
                                        resource.externalUrl) && (
                                        <a
                                          href={
                                            resource.fileUrl ||
                                            resource.externalUrl ||
                                            "#"
                                          }
                                          target="_blank"
                                          rel="noopener noreferrer"
                                          className="text-xs text-blue-600 hover:underline"
                                          onClick={(e) => e.stopPropagation()}
                                        >
                                          Abrir recurso →
                                        </a>
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
                        <strong>{completedTopics}</strong> de{" "}
                        <strong>{totalTopics}</strong> tópicos completados
                      </span>
                    </div>
                  </div>

                  <div className="space-y-2">
                    {localTopics.map((topic) => {
                      const topicResources = topic.resources || [];

                      return (
                        <div
                          key={topic.id}
                          className="rounded-lg border bg-white p-3"
                        >
                          <div className="flex items-center justify-between gap-2">
                            <p className="text-sm font-medium text-slate-800">
                              {topic.orderIndex}. {topic.title}
                            </p>
                            {topic.completed && (
                              <CheckCircle2 className="h-4 w-4 flex-shrink-0 text-emerald-600" />
                            )}
                          </div>
                          <div className="mt-1 text-xs text-slate-600">
                            {topicResources.length} recursos disponibles
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
