import { redirect } from "next/navigation";
import { createClient } from "@/src/infrastructure/supabase/server";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  BookOpen,
  Code,
  Trophy,
  TrendingUp,
  Clock,
  Star,
  LogOut,
} from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { signout } from "@/src/presentation/actions/auth.actions";

export default async function DashboardPage() {
  const supabase = createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Si no hay usuario, redirigir al login (doble seguridad con el middleware)
  if (!user) {
    redirect("/login");
  }

  // Obtener el perfil del usuario
  const { data: profile } = await supabase
    .from("profiles")
    .select("avatar_url, full_name")
    .eq("id", user.id)
    .single();

  const displayName =
    profile?.full_name ||
    user.user_metadata?.full_name ||
    user.email?.split("@")[0] ||
    "Estudiante";

  const avatarUrl = profile?.avatar_url;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      {/* Header */}
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
              {avatarUrl ? (
                <div className="relative h-8 w-8 flex-shrink-0 overflow-hidden rounded-full sm:h-10 sm:w-10">
                  <Image
                    src={avatarUrl || "/placeholder.svg"}
                    alt={displayName}
                    fill
                    className="object-cover"
                    unoptimized
                  />
                </div>
              ) : (
                <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-purple-600 text-xs font-semibold text-white sm:h-10 sm:w-10 sm:text-sm">
                  {displayName.charAt(0).toUpperCase()}
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

      {/* Main Content */}
      <main className="container mx-auto px-3 py-4 sm:px-4 sm:py-6 lg:px-6 lg:py-8">
        {/* Welcome Section */}
        <div className="mb-6 sm:mb-8">
          <h1 className="mb-1 text-balance text-2xl font-bold text-slate-800 sm:mb-2 sm:text-3xl md:text-4xl lg:text-5xl">
            ¡Bienvenido, {displayName}! 👋
          </h1>
          <p className="text-pretty text-sm text-slate-600 sm:text-base md:text-lg lg:text-xl">
            Estás listo para comenzar tu viaje en Python
          </p>
        </div>

        {/* Quick Stats */}
        <div className="mb-6 grid grid-cols-2 gap-3 sm:mb-8 sm:gap-4 lg:grid-cols-4">
          <Card className="border-2 transition-shadow hover:shadow-lg">
            <CardContent className="p-3 pt-4 sm:p-6 sm:pt-6">
              <div className="flex items-center justify-between gap-2">
                <div className="min-w-0">
                  <p className="mb-1 text-xs text-slate-600 sm:text-sm">
                    Lecciones
                  </p>
                  <p className="text-xl font-bold text-slate-800 sm:text-2xl md:text-3xl">
                    0/15
                  </p>
                </div>
                <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-blue-100 sm:h-12 sm:w-12">
                  <BookOpen className="h-5 w-5 text-blue-600 sm:h-6 sm:w-6" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-2 transition-shadow hover:shadow-lg">
            <CardContent className="p-3 pt-4 sm:p-6 sm:pt-6">
              <div className="flex items-center justify-between gap-2">
                <div className="min-w-0">
                  <p className="mb-1 text-xs text-slate-600 sm:text-sm">
                    Ejercicios
                  </p>
                  <p className="text-xl font-bold text-slate-800 sm:text-2xl md:text-3xl">
                    0/50
                  </p>
                </div>
                <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-green-100 sm:h-12 sm:w-12">
                  <Code className="h-5 w-5 text-green-600 sm:h-6 sm:w-6" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-2 transition-shadow hover:shadow-lg">
            <CardContent className="p-3 pt-4 sm:p-6 sm:pt-6">
              <div className="flex items-center justify-between gap-2">
                <div className="min-w-0">
                  <p className="mb-1 text-xs text-slate-600 sm:text-sm">
                    Puntos
                  </p>
                  <p className="text-xl font-bold text-slate-800 sm:text-2xl md:text-3xl">
                    0
                  </p>
                </div>
                <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-yellow-100 sm:h-12 sm:w-12">
                  <Trophy className="h-5 w-5 text-yellow-600 sm:h-6 sm:w-6" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-2 transition-shadow hover:shadow-lg">
            <CardContent className="p-3 pt-4 sm:p-6 sm:pt-6">
              <div className="flex items-center justify-between gap-2">
                <div className="min-w-0">
                  <p className="mb-1 text-xs text-slate-600 sm:text-sm">
                    Racha
                  </p>
                  <p className="truncate text-xl font-bold text-slate-800 sm:text-2xl md:text-3xl">
                    0 días
                  </p>
                </div>
                <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-purple-100 sm:h-12 sm:w-12">
                  <TrendingUp className="h-5 w-5 text-purple-600 sm:h-6 sm:w-6" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Grid */}
        <div className="grid gap-4 sm:gap-6 lg:grid-cols-3">
          {/* Continue Learning */}
          <div className="space-y-4 sm:space-y-6 lg:col-span-2">
            <Card className="border-2">
              <CardHeader className="p-4 sm:p-6">
                <CardTitle className="flex items-center gap-2 text-base sm:text-lg md:text-xl">
                  <Star className="h-4 w-4 flex-shrink-0 text-yellow-500 sm:h-5 sm:w-5" />
                  <span className="text-balance">Comienza tu aprendizaje</span>
                </CardTitle>
                <CardDescription className="text-pretty text-xs sm:text-sm md:text-base">
                  Tu primer módulo de Python te está esperando
                </CardDescription>
              </CardHeader>
              <CardContent className="p-4 sm:p-6">
                <div className="mb-4 rounded-lg bg-gradient-to-r from-blue-500 to-purple-600 p-4 text-white sm:p-6">
                  <h3 className="mb-2 text-balance text-lg font-bold sm:text-xl md:text-2xl">
                    Módulo 1: Introducción a Python
                  </h3>
                  <p className="mb-3 text-pretty text-xs text-blue-100 sm:mb-4 sm:text-sm md:text-base">
                    Aprende los fundamentos de Python: variables, tipos de datos
                    y operadores básicos.
                  </p>
                  <div className="mb-3 flex flex-wrap items-center gap-2 text-xs sm:mb-4 sm:text-sm">
                    <div className="flex items-center gap-1 sm:gap-2">
                      <Clock className="h-3 w-3 flex-shrink-0 sm:h-4 sm:w-4" />
                      <span>30 minutos</span>
                    </div>
                    <span className="hidden sm:inline">•</span>
                    <div className="flex items-center gap-1 sm:gap-2">
                      <BookOpen className="h-3 w-3 flex-shrink-0 sm:h-4 sm:w-4" />
                      <span>5 lecciones</span>
                    </div>
                  </div>
                  <Button className="w-full bg-white text-xs text-blue-600 hover:bg-blue-50 sm:w-auto sm:text-sm md:text-base">
                    Comenzar Módulo
                  </Button>
                </div>

                <div className="space-y-2 sm:space-y-3">
                  <div className="flex cursor-pointer items-center justify-between gap-3 rounded-lg border p-3 transition-colors hover:bg-slate-50 sm:p-4">
                    <div className="flex min-w-0 flex-1 items-center gap-2 sm:gap-3">
                      <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-slate-100 sm:h-10 sm:w-10">
                        <span className="text-sm font-semibold text-slate-600 sm:text-base">
                          1
                        </span>
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium text-slate-800 sm:text-base">
                          ¿Qué es Python?
                        </p>
                        <p className="text-xs text-slate-500 sm:text-sm">
                          5 min
                        </p>
                      </div>
                    </div>
                    <div className="h-5 w-5 flex-shrink-0 rounded-full border-2 border-slate-300 sm:h-6 sm:w-6"></div>
                  </div>

                  <div className="flex items-center justify-between gap-3 rounded-lg border p-3 opacity-50 sm:p-4">
                    <div className="flex min-w-0 flex-1 items-center gap-2 sm:gap-3">
                      <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-slate-100 sm:h-10 sm:w-10">
                        <span className="text-sm font-semibold text-slate-600 sm:text-base">
                          2
                        </span>
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium text-slate-800 sm:text-base">
                          Variables y tipos de datos
                        </p>
                        <p className="text-xs text-slate-500 sm:text-sm">
                          8 min
                        </p>
                      </div>
                    </div>
                    <div className="flex-shrink-0 text-xs text-slate-500 sm:text-sm">
                      🔒 Bloqueado
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-4 sm:space-y-6">
            {/* Progress Card */}
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
                      <span className="font-semibold">0%</span>
                    </div>
                    <div className="h-2 w-full rounded-full bg-slate-200">
                      <div
                        className="h-2 rounded-full bg-blue-600"
                        style={{ width: "0%" }}
                      ></div>
                    </div>
                  </div>

                  <div className="border-t pt-4">
                    <p className="mb-3 text-xs text-slate-600 sm:text-sm">
                      Próximos logros
                    </p>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-xs sm:text-sm">
                        <div className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-lg bg-slate-100 text-base sm:h-8 sm:w-8 sm:text-lg">
                          🎯
                        </div>
                        <span className="text-slate-700">Primera lección</span>
                      </div>
                      <div className="flex items-center gap-2 text-xs sm:text-sm">
                        <div className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-lg bg-slate-100 text-base sm:h-8 sm:w-8 sm:text-lg">
                          ⚡
                        </div>
                        <span className="text-slate-700">Primer ejercicio</span>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Quick Links */}
            <Card className="border-2">
              <CardHeader className="p-4 sm:p-6">
                <CardTitle className="text-base sm:text-lg">
                  Enlaces Rápidos
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 p-4 sm:p-6">
                <Link href="/courses" className="block">
                  <Button
                    variant="ghost"
                    className="w-full justify-start text-xs sm:text-sm"
                  >
                    <BookOpen className="mr-2 h-3 w-3 flex-shrink-0 sm:h-4 sm:w-4" />
                    <span className="truncate">Ver todos los módulos</span>
                  </Button>
                </Link>
                <Link href="/lessons" className="block">
                  <Button
                    variant="ghost"
                    className="w-full justify-start text-xs sm:text-sm"
                  >
                    <Code className="mr-2 h-3 w-3 flex-shrink-0 sm:h-4 sm:w-4" />
                    <span className="truncate">Ejercicios prácticos</span>
                  </Button>
                </Link>
                <Link href="/profile" className="block">
                  <Button
                    variant="ghost"
                    className="w-full justify-start text-xs sm:text-sm"
                  >
                    <Trophy className="mr-2 h-3 w-3 flex-shrink-0 sm:h-4 sm:w-4" />
                    <span className="truncate">Mi perfil</span>
                  </Button>
                </Link>
                <Link href="/" className="block">
                  <Button
                    variant="ghost"
                    className="w-full justify-start text-xs text-slate-600 hover:bg-slate-50 hover:text-slate-700 sm:text-sm"
                  >
                    <span className="truncate">Volver al inicio</span>
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}
