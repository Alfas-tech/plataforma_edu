import Link from "next/link";
import Image from "next/image";
import { redirect } from "next/navigation";
import { ArrowLeft, BookOpen, Layers, Link as LinkIcon, LogOut } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { getCurrentProfile } from "@/src/presentation/actions/profile.actions";
import { signout } from "@/src/presentation/actions/auth.actions";
import { getCourseWithTeachers } from "@/src/presentation/actions/course.actions";
import { getResourcesByTopic } from "@/src/presentation/actions/content.actions";
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
  
  // Solo se puede editar si:
  // 1. Existe effectiveVersionId Y
  // 2. NO es versión archivada (las archivadas son solo lectura) Y
  // 3. (Es una versión NO publicada) O (Es admin editando versión publicada)
  const canMutateContent = Boolean(effectiveVersionId) && 
    !isViewingArchivedVersion &&
    (!isViewingPublishedVersion || canEditPublishedVersion);

  const totalResources = resources.length;
  const externalResources = resources.filter(
    (resource) => Boolean(resource.externalUrl)
  ).length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-purple-50 to-pink-50">
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
                {profile.isAdmin
                  ? "🛡️ Administrador"
                  : profile.isEditor
                    ? "✏️ Editor"
                    : "👨‍🏫 Docente"}
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

      <main className="container mx-auto px-3 py-4 sm:px-4 sm:py-6 lg:px-6 lg:py-8">
        <div className="mb-6 flex flex-col gap-3 sm:mb-8 sm:flex-row sm:items-center sm:justify-between">
          <Link
            href={{
              pathname: `/dashboard/admin/courses/${courseId}/content`,
              query: {
                branchId: requestedBranchId ?? undefined,
                versionId: requestedVersionId ?? undefined,
              },
            }}
          >
            <Button variant="outline" size="sm">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Volver a tópicos
            </Button>
          </Link>
          <div className="text-right">
            <p className="text-xs uppercase tracking-wide text-purple-600">
              Versión activa
            </p>
            {effectiveVersionId && (
              <p className="text-xs text-slate-500">
                ID: {effectiveVersionId}
              </p>
            )}
          </div>
        </div>

        <div className="mb-6 space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="secondary" className="gap-1 bg-purple-100 text-purple-700">
              <Layers className="h-3.5 w-3.5" />
              Tópico #{topic.orderIndex}
            </Badge>
            <h1 className="text-balance text-2xl font-bold text-slate-800 sm:text-3xl md:text-4xl">
              {topic.title}
            </h1>
          </div>
          {topic.description && (
            <p className="max-w-3xl text-pretty text-sm text-slate-600 sm:text-base">
              {topic.description}
            </p>
          )}
          <p className="text-sm text-slate-500">
            Curso: <span className="font-semibold text-slate-700">{course.title}</span>
          </p>
        </div>

        <div className="mb-6 grid grid-cols-1 gap-4 sm:mb-8 sm:grid-cols-2">
          <Card className="border-2">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                <BookOpen className="h-5 w-5 text-purple-600" />
                Total de recursos
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-purple-600">{totalResources}</p>
            </CardContent>
          </Card>
          <Card className="border-2">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                <LinkIcon className="h-5 w-5 text-blue-600" />
                Recursos externos
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-blue-600">{externalResources}</p>
            </CardContent>
          </Card>
        </div>

        <ResourceManagementClient
          courseVersionId={effectiveVersionId}
          branchName="principal"
          isDefaultBranch={true}
          isViewingDraftVersion={isViewingDraftVersion}
          isViewingPublishedVersion={isViewingPublishedVersion}
          isViewingArchivedVersion={isViewingArchivedVersion}
          canEditPublishedVersion={canEditPublishedVersion}
          courseId={courseId}
          topic={{
            id: topic.id,
            title: topic.title,
            description: topic.description,
            orderIndex: topic.orderIndex,
          }}
          resources={resources}
        />
      </main>
    </div>
  );
}
