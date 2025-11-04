import { redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { LogOut } from "lucide-react";
import { signout } from "@/src/presentation/actions/auth.actions";
import { getCurrentProfile } from "@/src/presentation/actions/profile.actions";
import { DraftEditorClient } from "../../new/components/DraftEditorClient";

export default async function EditDraftPage({
  params,
}: {
  params: { courseId: string; draftId: string };
}) {
  const profileResult = await getCurrentProfile();

  if ("error" in profileResult) {
    redirect("/login");
  }

  const { profile } = profileResult;

  if (!profile.isAdmin && !profile.isEditor && !profile.isTeacher) {
    redirect("/dashboard");
  }

  const displayName =
    profile.displayName ?? profile.fullName ?? profile.email ?? "Administrador";
  const initials = displayName.trim().charAt(0).toUpperCase() || "A";

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

      <main className="container mx-auto px-3 py-4 sm:px-4 sm:py-6 lg:px-6 lg:py-8">
        <div className="mb-6 flex items-center gap-4">
          <Link
            href={
              profile.isEditor
                ? "/dashboard/editor"
                : profile.isTeacher
                  ? "/dashboard/teacher"
                  : "/dashboard/admin/courses"
            }
          >
            <Button variant="ghost" size="sm">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Volver
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-slate-800">
              Editar borrador
            </h1>
            <p className="text-sm text-slate-600">
              Modifica el contenido del curso y guarda los cambios
            </p>
          </div>
        </div>

        <DraftEditorClient
          courseId={params.courseId}
          draftId={params.draftId}
          mode="edit"
        />
      </main>
    </div>
  );
}
