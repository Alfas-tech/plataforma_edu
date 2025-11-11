import Link from "next/link";
import { redirect } from "next/navigation";
import { BookOpen, ChevronLeft } from "lucide-react";

import { AdminHeader } from "@/components/dashboard/AdminHeader";
import { Button } from "@/components/ui/button";
import { getCurrentProfile } from "@/src/presentation/actions/profile.actions";
import { getCourseWithTeachers } from "@/src/presentation/actions/course.actions";
import {
  getResourcesByTopic,
  getTopicsByCourse,
} from "@/src/presentation/actions/content.actions";
import { ResourceManagementClient } from "@/app/dashboard/admin/courses/[courseId]/topics/[topicId]/resources/components/ResourceManagementClient";
import { RESOURCE_MANAGEMENT_ENABLED } from "@/app/dashboard/admin/courses/featureFlags";

interface PageProps {
  params: {
    courseId: string;
    topicId: string;
  };
  searchParams?: {
    branchId?: string;
    versionId?: string;
    from?: string;
  };
}

export default async function EditorTopicResourcesPage({
  params,
  searchParams,
}: PageProps) {
  const { courseId, topicId } = params;
  const requestedBranchId = searchParams?.branchId ?? null;
  const requestedVersionId = searchParams?.versionId ?? null;
  const comingFrom = searchParams?.from ?? null;

  if (!RESOURCE_MANAGEMENT_ENABLED) {
    redirect(`/dashboard/editor`);
  }

  const profileResult = await getCurrentProfile();
  if ("error" in profileResult) {
    redirect("/login");
  }

  const { profile } = profileResult;

  if (!profile.isAdmin && !profile.isEditor) {
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

  const resolvedDisplayName =
    profile.displayName ?? profile.fullName ?? profile.email ?? "Usuario";
  const resolvedInitials =
    resolvedDisplayName.trim().charAt(0).toUpperCase() || "U";
  const roleLabel = profile.isAdmin ? "🛡️ Administrador" : "✏️ Editor";

  const resourcesResult = await getResourcesByTopic(topicId);
  if ("error" in resourcesResult || !resourcesResult.topic) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-purple-50 to-pink-50">
        <div className="container mx-auto px-4 py-8">
          <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-red-800">
            <p>
              {"error" in resourcesResult
                ? resourcesResult.error
                : "Tópico no encontrado"}
            </p>
          </div>
        </div>
      </div>
    );
  }

  const topic = resourcesResult.topic;
  const resources = resourcesResult.resources ?? [];

  const effectiveVersionId = (() => {
    if (topic.courseVersionId) {
      return topic.courseVersionId;
    }

    if (requestedVersionId) {
      return requestedVersionId;
    }

    return course.activeVersion?.id ?? null;
  })();

  const isViewingDraftVersion = Boolean(
    effectiveVersionId && course.draftVersion?.id === effectiveVersionId
  );

  const isViewingPublishedVersion = Boolean(
    effectiveVersionId &&
      course.activeVersion?.id === effectiveVersionId &&
      !isViewingDraftVersion
  );

  const isViewingArchivedVersion = Boolean(
    effectiveVersionId && !isViewingDraftVersion && !isViewingPublishedVersion
  );

  const canEditPublishedVersion = profile.isAdmin || profile.isEditor;

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
    from: comingFrom,
  };

  const contentReturnPath =
    comingFrom === "editor"
      ? `/dashboard/editor/courses/${courseId}/content`
      : `/dashboard/admin/courses/${courseId}/content`;

  return (
    <div className="flex min-h-screen flex-col bg-slate-100">
      <AdminHeader
        displayName={resolvedDisplayName}
        initials={resolvedInitials}
        avatarUrl={profile.avatarUrl}
        roleLabel={roleLabel}
        subtitle="Gestión de recursos"
      />

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
                  pathname: contentReturnPath,
                  query: {
                    branchId: requestedBranchId ?? undefined,
                    versionId: requestedVersionId ?? undefined,
                    from: comingFrom ?? undefined,
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
              courseTitle={course.title ?? "Curso sin título"}
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
