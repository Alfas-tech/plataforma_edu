import { redirect } from "next/navigation";
import {
  getCurrentProfile,
  getAllUsers,
} from "@/src/presentation/actions/profile.actions";
import { signout } from "@/src/presentation/actions/auth.actions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LogOut, ArrowLeft, Users, GraduationCap } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { Suspense } from "react";
import { UserManagementClient } from "./components/UserManagementClient";

export default async function UsersManagementPage() {
  const profileResult = await getCurrentProfile();

  if ("error" in profileResult) {
    redirect("/login");
  }

  const { profile } = profileResult;

  // Verify user is administrator
  if (!profile.isAdmin) {
    redirect("/dashboard");
  }

  const usersPromise = getAllUsers();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-purple-50 to-pink-50">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-slate-200 bg-white shadow-sm">
        <div className="container mx-auto px-3 py-3 sm:px-4 sm:py-4 lg:px-6">
          <div className="flex items-center justify-between gap-2 sm:gap-4">
            <Link
              href="/dashboard/admin"
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

      {/* Main Content */}
      <main className="container mx-auto px-3 py-4 sm:px-4 sm:py-6 lg:px-6 lg:py-8">
        {/* Header Section */}
        <div className="mb-6 flex items-center gap-4 sm:mb-8">
          <Link href="/dashboard/admin">
            <Button variant="outline" size="sm">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Volver
            </Button>
          </Link>
          <div>
            <h1 className="mb-1 text-balance text-2xl font-bold text-slate-800 sm:mb-2 sm:text-3xl md:text-4xl">
              Gestión de Usuarios
            </h1>
            <p className="text-pretty text-sm text-slate-600 sm:text-base md:text-lg">
              Administra roles y permisos de usuarios
            </p>
          </div>
        </div>

        <Suspense fallback={<UsersPageSkeleton />}>
          <UsersManagementContent
            usersPromise={usersPromise}
            currentUserId={profile.id}
          />
        </Suspense>
      </main>
    </div>
  );
}

type UsersResult = Awaited<ReturnType<typeof getAllUsers>>;

async function UsersManagementContent({
  usersPromise,
  currentUserId,
}: {
  usersPromise: Promise<UsersResult>;
  currentUserId: string;
}) {
  const usersResult = await usersPromise;

  if ("error" in usersResult) {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-red-800">
        <p>Error al cargar usuarios: {usersResult.error}</p>
      </div>
    );
  }

  const {
    students = [],
    teachers = [],
    editors = [],
    admins = [],
  } = usersResult;

  return (
    <UserManagementClient
      students={students}
      teachers={teachers}
      editors={editors}
      admins={admins}
      currentUserId={currentUserId}
    />
  );
}

function UsersPageSkeleton() {
  return (
    <div className="space-y-6">
      {/* Skeleton para barra de búsqueda y botón */}
      <div className="flex items-center justify-between gap-4">
        <div className="h-10 w-full max-w-md animate-pulse rounded-lg bg-slate-200" />
        <div className="h-10 w-40 animate-pulse rounded-lg bg-slate-200" />
      </div>

      {/* Skeleton para filtros */}
      <div className="flex gap-2">
        {[0, 1, 2, 3, 4].map((item) => (
          <div
            key={item}
            className="h-9 w-28 animate-pulse rounded-lg bg-slate-200"
          />
        ))}
      </div>

      {/* Skeleton para lista de usuarios */}
      <div className="rounded-lg border bg-white p-6">
        <div className="mb-4 h-6 w-48 animate-pulse rounded bg-slate-200" />
        <div className="space-y-3">
          {[0, 1, 2, 3, 4].map((item) => (
            <div
              key={item}
              className="h-24 animate-pulse rounded-lg border bg-slate-50"
            />
          ))}
        </div>
      </div>
    </div>
  );
}
