import { redirect } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { LogOut, ArrowLeft } from "lucide-react";

import { Button } from "@/components/ui/button";
import { getCurrentProfile } from "@/src/presentation/actions/profile.actions";
import { signout } from "@/src/presentation/actions/auth.actions";
import { getCourseWithTeachers } from "@/src/presentation/actions/course.actions";
import { getTopicsWithResourcesByCourse } from "@/src/presentation/actions/content.actions";

import { TopicManagementClient } from "./components/TopicManagementClient";

interface PageProps {
  params: {
    courseId: string;
  };
  searchParams?: {
    branchId?: string;
    versionId?: string;
    from?: string;
  };
}

export default async function CourseContentPage({
  params,
  searchParams,
}: PageProps) {
  const { courseId } = params;
  const requestedBranchId = searchParams?.branchId ?? null;
  const requestedVersionId = searchParams?.versionId ?? null;
  const comingFrom = searchParams?.from ?? null;

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

  // Type guard to filter valid branches
  type ValidBranch = { id: string; name: string; isDefault: boolean; tipVersionId: string | null };
  const isValidBranch = (b: unknown): b is ValidBranch => {
    return b !== null && typeof b === 'object' && 'id' in b && 'name' in b;
  };
  
  const branchCandidates = [course.defaultBranch, ...(course.branches ?? [])].filter(isValidBranch);

  const selectedBranch = requestedBranchId
    ? branchCandidates.find((branch) => branch.id === requestedBranchId) ?? null
    : (isValidBranch(course.defaultBranch) ? course.defaultBranch : null);

  const effectiveBranch = selectedBranch ?? (isValidBranch(course.defaultBranch) ? course.defaultBranch : null);

  const effectiveVersionId = (() => {
    if (requestedVersionId) {
      return requestedVersionId;
    }

    if (effectiveBranch?.tipVersionId) {
      return effectiveBranch.tipVersionId;
    }

    if (effectiveBranch?.isDefault) {
      // Los editores y docentes ven el borrador por defecto, los admins ven la versión activa
      if (profile.isEditor || profile.isTeacher) {
        return course.draftVersion?.id ?? course.activeVersion?.id ?? null;
      }
      return course.activeVersion?.id ?? null;
    }

    return null;
  })();

  const topicsQueryVersionId = effectiveVersionId ?? course.activeVersion?.id ?? course.draftVersion?.id ?? undefined;

  const topicsResult = await getTopicsWithResourcesByCourse(courseId, {
    courseVersionId: topicsQueryVersionId,
  });
  const topics = "error" in topicsResult ? [] : topicsResult.topics ?? [];

  const resolvedVersionId = effectiveVersionId
    ?? topics[0]?.courseVersionId
    ?? course.activeVersion?.id
    ?? course.draftVersion?.id
    ?? null;

  const isViewingDraftVersion = Boolean(
    resolvedVersionId && course.draftVersion?.id === resolvedVersionId
  );

  const isViewingPublishedVersion = Boolean(
    resolvedVersionId && course.activeVersion?.id === resolvedVersionId
  );

  const isViewingArchivedVersion = Boolean(
    resolvedVersionId && course.archivedVersions?.some((version) => version.id === resolvedVersionId)
  );

  const canEditPublishedVersion = Boolean(
    (profile.isAdmin || profile.isEditor) && isViewingPublishedVersion
  );

  const resourceManagementBasePath = profile.isAdmin
    ? "/dashboard/admin/courses"
    : profile.isEditor
      ? "/dashboard/editor/courses"
      : "/dashboard/admin/courses";

  const resourceManagementQuery = profile.isEditor && !profile.isAdmin
    ? {
        from: "editor",
      }
    : undefined;

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
        <div className="mb-6 flex items-center gap-4 sm:mb-8">
          <Link
            href={
              comingFrom === "archived"
                ? "/dashboard/editor/archived"
                : profile.isAdmin
                  ? "/dashboard/admin/courses"
                  : profile.isEditor
                    ? "/dashboard/editor"
                    : "/dashboard/teacher"
            }
          >
            <Button variant="outline" size="sm">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Volver
            </Button>
          </Link>
          <div>
            <h1 className="mb-1 text-balance text-2xl font-bold text-slate-800 sm:mb-2 sm:text-3xl md:text-4xl">
              Gestión de contenido
            </h1>
            <p className="text-pretty text-sm text-slate-600 sm:text-base md:text-lg">
              {course.title}
            </p>
            {resolvedVersionId && (
              <p className="text-xs text-slate-500 sm:text-sm">
                Versión activa en edición: {resolvedVersionId.slice(0, 8)}
              </p>
            )}
          </div>
        </div>

        <TopicManagementClient
          courseId={courseId}
          branchId={effectiveBranch?.id ?? null}
          courseVersionId={resolvedVersionId}
          branchName={effectiveBranch?.name ?? "principal"}
          isDefaultBranch={effectiveBranch?.isDefault ?? true}
          isViewingDraftVersion={isViewingDraftVersion}
          isViewingPublishedVersion={isViewingPublishedVersion}
          isViewingArchivedVersion={isViewingArchivedVersion}
          canEditPublishedVersion={canEditPublishedVersion}
          isAdmin={profile.isAdmin}
          resourceManagementBasePath={resourceManagementBasePath}
          resourceManagementQuery={resourceManagementQuery}
          topics={topics}
        />
      </main>
    </div>
  );
}
