import Link from "next/link";
import Image from "next/image";
import { redirect } from "next/navigation";
import { BookOpen, ChevronLeft, LogOut } from "lucide-react";

import { Button } from "@/components/ui/button";
import { getCurrentProfile } from "@/src/presentation/actions/profile.actions";
import { signout } from "@/src/presentation/actions/auth.actions";
import { getCourseWithTeachers } from "@/src/presentation/actions/course.actions";
import {
  getResourcesByTopic,
  getTopicsByCourse,
} from "@/src/presentation/actions/content.actions";
import { ResourceManagementClient } from "./components/ResourceManagementClient";
import { RESOURCE_MANAGEMENT_ENABLED } from "../../../../featureFlags";

interface PageProps {
  params: {
    courseId: string;
    topicId: string;
  };
  searchParams?: {
    branchId?: string;
    versionId?: string;
  };
}

export default async function TopicResourcesPage({
  params,
  searchParams,
}: PageProps) {
  const { courseId, topicId } = params;
  const requestedBranchId = searchParams?.branchId ?? null;
  const requestedVersionId = searchParams?.versionId ?? null;

  if (!RESOURCE_MANAGEMENT_ENABLED) {
    redirect(`/dashboard/admin/courses/${courseId}/content`);
  }

  const profileResult = await getCurrentProfile();
  if ("error" in profileResult) {
    redirect("/login");
  }

  const { profile } = profileResult;

  if (!profile.isAdmin && !profile.isTeacher && !profile.isEditor) {
    redirect("/dashboard");
  }

  const courseResult = await getCourseWithTeachers(courseId);
  if ("error" in courseResult) {
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

  const resourcesResult = await getResourcesByTopic(topicId);
  if ("error" in resourcesResult || !resourcesResult.topic) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-purple-50 to-pink-50">
        <div className="container mx-auto px-4 py-8">
          <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-red-800">
            <p>{"error" in resourcesResult ? resourcesResult.error : "Tópico no encontrado"}</p>
          </div>
        </div>
      </div>
    );
  }

  const topic = resourcesResult.topic;
  const resources = resourcesResult.resources ?? [];

  // Determinar la versión efectiva que estamos viendo
  const effectiveVersionId = (() => {
    if (topic.courseVersionId) {
      return topic.courseVersionId;
    }

    if (requestedVersionId) {
      return requestedVersionId;
    }

    return course.activeVersion?.id ?? null;
  })();

  // Determinar el tipo de versión que estamos viendo
  const isViewingDraftVersion = Boolean(
    effectiveVersionId && 
    course.draftVersion?.id === effectiveVersionId
  );

  const isViewingPublishedVersion = Boolean(
    effectiveVersionId && 
    course.activeVersion?.id === effectiveVersionId &&
    !isViewingDraftVersion
  );

  const isViewingArchivedVersion = Boolean(
    effectiveVersionId &&
    !isViewingDraftVersion &&
    !isViewingPublishedVersion
  );

  // Determinar permisos de edición
  // Los admins pueden editar versiones publicadas, pero editores/teachers solo borradores
  const canEditPublishedVersion = profile.isAdmin;

  // Obtener tópicos para navegación
  let previousTopic: {
    id: string;
    title: string;
    orderIndex: number;
    courseVersionId: string | null;
  } | null = null;

  let nextTopic: {
    id: string;
    title: string;
    orderIndex: number;
    courseVersionId: string | null;
  } | null = null;

  const topicsResult = await getTopicsByCourse(courseId, {
    courseVersionId: effectiveVersionId ?? undefined,
  });

  if (!("error" in topicsResult) && topicsResult.topics.length > 0) {
    const sortedTopics = [...topicsResult.topics].sort(
      (a, b) => a.orderIndex - b.orderIndex
    );
    const currentIndex = sortedTopics.findIndex((t) => t.id === topic.id);

    if (currentIndex > 0) {
      const prev = sortedTopics[currentIndex - 1];
      previousTopic = {
        id: prev.id,
        title: prev.title,
        orderIndex: prev.orderIndex,
        courseVersionId: prev.courseVersionId,
      };
    }

    if (currentIndex > -1 && currentIndex < sortedTopics.length - 1) {
      const next = sortedTopics[currentIndex + 1];
      nextTopic = {
        id: next.id,
        title: next.title,
        orderIndex: next.orderIndex,
        courseVersionId: next.courseVersionId,
      };
    }
  }

  const navigationQuery = {
    branchId: requestedBranchId ?? null,
    versionId: requestedVersionId ?? effectiveVersionId ?? null,
  };

  return (
    <div className="flex min-h-screen flex-col bg-slate-100">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-3 px-4 sm:h-20 sm:px-6 lg:px-8">
          <Link
            href="/dashboard"
            className="flex items-center gap-2 transition-opacity hover:opacity-80"
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
            <div className="hidden flex-col sm:flex">
              <span className="text-xs font-semibold uppercase tracking-widest text-slate-400">
                Gestión de recursos
              </span>
              <span className="text-base font-semibold text-slate-900">
                Aprende Code
              </span>
            </div>
            <span className="text-sm font-semibold text-slate-900 sm:hidden">
              Aprende Code
            </span>
          </Link>

          <div className="flex items-center gap-3">
            <div className="hidden text-xs font-medium text-purple-600 sm:block">
              {profile.isAdmin
                ? "🛡️ Administrador"
                : profile.isEditor
                  ? "✏️ Editor"
                  : "👨‍🏫 Docente"}
            </div>
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
            <div className="hidden max-w-[160px] truncate text-sm font-medium text-slate-700 md:block">
              {profile.displayName}
            </div>
            <form action={signout}>
              <Button
                variant="outline"
                size="sm"
                type="submit"
                className="bg-transparent text-xs sm:text-sm"
              >
                <LogOut className="mr-2 hidden h-4 w-4 sm:block" />
                Salir
              </Button>
            </form>
          </div>
        </div>
      </header>

      <main className="flex flex-1 overflow-hidden">
        <div className="mx-auto flex w-full max-w-7xl flex-1 flex-col gap-4 px-4 py-4 sm:px-6 sm:py-6 lg:px-8">
          <div className="flex items-center justify-between gap-3">
            <Button
              variant="ghost"
              size="sm"
              asChild
              className="gap-2 text-slate-600 hover:bg-slate-200/70"
            >
              <Link
                href={{
                  pathname: `/dashboard/admin/courses/${courseId}/content`,
                  query: {
                    branchId: requestedBranchId ?? undefined,
                    versionId: requestedVersionId ?? undefined,
                  },
                }}
              >
                <ChevronLeft className="h-4 w-4" />
                Volver a tópicos
              </Link>
            </Button>
            <div className="hidden items-center gap-3 text-xs text-slate-500 sm:flex">
              <span className="inline-flex items-center gap-2 rounded-full bg-white px-3 py-1 font-medium shadow-sm">
                <BookOpen className="h-3.5 w-3.5 text-purple-500" />
                {course.title}
              </span>
              {effectiveVersionId && (
                <span className="inline-flex items-center gap-2 rounded-full bg-white px-3 py-1 font-medium shadow-sm">
                  Versión {effectiveVersionId.slice(0, 8)}
                </span>
              )}
            </div>
          </div>

          <div className="flex flex-1 flex-col overflow-hidden">
            <ResourceManagementClient
              courseVersionId={effectiveVersionId}
              branchName="principal"
              isDefaultBranch={true}
              isViewingDraftVersion={isViewingDraftVersion}
              isViewingPublishedVersion={isViewingPublishedVersion}
              isViewingArchivedVersion={isViewingArchivedVersion}
              canEditPublishedVersion={canEditPublishedVersion}
              courseId={courseId}
              courseTitle={course.title}
              topic={{
                id: topic.id,
                title: topic.title,
                description: topic.description,
                orderIndex: topic.orderIndex,
              }}
              resources={resources}
              previousTopic={previousTopic}
              nextTopic={nextTopic}
              navigationQuery={navigationQuery}
            />
          </div>
        </div>
      </main>
    </div>
  );
}
