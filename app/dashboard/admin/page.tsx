import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";
import {
  LogOut,
  Users,
  GitPullRequest,
  GitBranch,
  GitMerge,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { signout } from "@/src/presentation/actions/auth.actions";
import { getAllCourses } from "@/src/presentation/actions/course.actions";
import { getCurrentProfile } from "@/src/presentation/actions/profile.actions";
import type { CourseOverview } from "@/src/presentation/types/course";

import { CourseManagementClient } from "./courses/components/CourseManagementClient";

export default async function AdminDashboardPage() {
  const profileResult = await getCurrentProfile();

  if ("error" in profileResult) {
    redirect("/login");
  }

  const { profile } = profileResult;

  if (!profile.isAdmin) {
    redirect("/dashboard");
  }

  const displayName =
    profile.displayName ?? profile.fullName ?? profile.email ?? "Administrador";
  const initials = displayName.trim().charAt(0).toUpperCase() || "A";
  const coursesResult = await getAllCourses();
  const courseData: CourseOverview[] =
    "error" in coursesResult ? [] : (coursesResult.courses ?? []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-purple-50 to-pink-50">
      <AdminHeader
        displayName={displayName}
        avatarUrl={profile.avatarUrl}
        initials={initials}
      />

      <main className="container mx-auto px-3 py-4 sm:px-4 sm:py-6 lg:px-6 lg:py-8">
        <div className="mb-6 flex flex-col gap-4 sm:mb-8 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="mb-1 text-balance text-2xl font-bold text-slate-800 sm:mb-2 sm:text-3xl md:text-4xl">
              Gestión de Cursos
            </h1>
            <p className="text-pretty text-sm text-slate-600 sm:text-base md:text-lg">
              Itera el curso principal usando ediciones de trabajo y solicitudes
              de fusión sin interrumpir a los estudiantes.
            </p>
          </div>
          <Link href="/dashboard/admin/users">
            <Button
              variant="outline"
              className="gap-2 border-purple-200 text-purple-700 hover:bg-purple-50"
            >
              <Users className="h-4 w-4" />
              Gestionar usuarios
            </Button>
          </Link>
        </div>

        {"error" in coursesResult ? (
          <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-red-800">
            <p>Error al cargar cursos: {coursesResult.error}</p>
          </div>
        ) : (
          <CoursesOverview courses={courseData} />
        )}
      </main>
    </div>
  );
}

type AdminHeaderProps = {
  displayName: string;
  avatarUrl?: string | null;
  initials: string;
};

function AdminHeader({ displayName, avatarUrl, initials }: AdminHeaderProps) {
  return (
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
              🛡️ Administrador
            </span>
            {avatarUrl ? (
              <div className="relative h-8 w-8 flex-shrink-0 overflow-hidden rounded-full sm:h-10 sm:w-10">
                <Image
                  src={avatarUrl}
                  alt={displayName}
                  fill
                  className="object-cover"
                  unoptimized
                />
              </div>
            ) : (
              <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-purple-500 to-pink-600 text-xs font-semibold text-white sm:h-10 sm:w-10 sm:text-sm">
                {initials}
              </div>
            )}
            <span className="hidden max-w-[120px] truncate text-xs font-medium text-slate-700 sm:text-sm md:inline lg:max-w-none">
              {displayName}
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
  );
}

type CoursesOverviewProps = {
  courses: CourseOverview[];
};

function CoursesOverview({ courses }: CoursesOverviewProps) {
  const openMergeRequests = courses.reduce((count, course) => {
    const openForCourse = course.pendingMergeRequests.filter(
      (mr) => mr.status === "open"
    ).length;
    return count + openForCourse;
  }, 0);
  const readyToMerge = courses.reduce((count, course) => {
    const approvedForCourse = course.pendingMergeRequests.filter(
      (mr) => mr.status === "approved"
    ).length;
    return count + approvedForCourse;
  }, 0);
  const draftBranches = courses.reduce((count, course) => {
    const hasPending = course.branches.some(
      (branch) =>
        branch.tipVersionStatus === "draft" ||
        branch.tipVersionStatus === "pending_review"
    );

    return hasPending ? count + 1 : count;
  }, 0);

  return (
    <>
      <div className="mb-6 grid grid-cols-1 gap-4 sm:mb-8 sm:grid-cols-3">
        <Card className="border-2">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
              <GitMerge className="h-5 w-5 text-emerald-600" />
              Listas para fusionar
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-emerald-600">
              {readyToMerge}
            </p>
            <p className="mt-2 text-sm text-slate-500">
              Solicitudes ya aprobadas esperando ser fusionadas a la edición
              principal.
            </p>
          </CardContent>
        </Card>

        <Card className="border-2">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
              <GitBranch className="h-5 w-5 text-slate-600" />
              Ediciones con trabajo pendiente
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-slate-600">{draftBranches}</p>
            <p className="mt-2 text-sm text-slate-500">
              Cursos con contenido nuevo en ediciones alternativas listo para
              revisión.
            </p>
          </CardContent>
        </Card>

        <Card className="border-2">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
              <GitPullRequest className="h-5 w-5 text-purple-600" />
              Solicitudes abiertas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-purple-600">
              {openMergeRequests}
            </p>
          </CardContent>
        </Card>
      </div>

      <CourseManagementClient courses={courses} />
    </>
  );
}
