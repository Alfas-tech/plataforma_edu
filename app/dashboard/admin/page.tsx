import Link from "next/link";
import { redirect } from "next/navigation";
import { Users } from "lucide-react";

import { Button } from "@/components/ui/button";
import { AdminHeader } from "@/components/dashboard/AdminHeader";
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
  const roleLabel = "🛡️ Administrador";
  const coursesResult = await getAllCourses();
  const courseData: CourseOverview[] =
    "error" in coursesResult ? [] : (coursesResult.courses ?? []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-purple-50 to-pink-50">
      <AdminHeader
        displayName={displayName}
        avatarUrl={profile.avatarUrl}
        initials={initials}
        roleLabel={roleLabel}
      />

      <main className="container mx-auto px-3 py-4 sm:px-4 sm:py-6 lg:px-6 lg:py-8">
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-2xl font-bold text-slate-800 sm:text-3xl">
            Panel de administración
          </h1>
          <Link href="/dashboard/admin/users">
            <Button
              variant="outline"
              className="gap-2 border-purple-200 text-purple-700 hover:bg-purple-50"
            >
              <Users className="h-4 w-4" />
              Usuarios
            </Button>
          </Link>
        </div>

        {"error" in coursesResult ? (
          <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-red-800">
            <p>Error: {coursesResult.error}</p>
          </div>
        ) : (
          <CourseManagementClient courses={courseData} />
        )}
      </main>
    </div>
  );
}
