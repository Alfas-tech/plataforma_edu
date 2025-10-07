import { redirect } from "next/navigation"
import { createClient } from "@/src/infrastructure/supabase/server"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { BookOpen, Code, Trophy, TrendingUp, Clock, Star, LogOut } from "lucide-react"
import Link from "next/link"
import Image from "next/image"
import { signout } from "@/src/presentation/actions/auth.actions"

export default async function DashboardPage() {
  const supabase = createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  // Si no hay usuario, redirigir al login (doble seguridad con el middleware)
  if (!user) {
    redirect("/login")
  }

  // Obtener el perfil del usuario
  const { data: profile } = await supabase.from("profiles").select("avatar_url, full_name").eq("id", user.id).single()

  const displayName = profile?.full_name || user.user_metadata?.full_name || user.email?.split("@")[0] || "Estudiante"

  const avatarUrl = profile?.avatar_url

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-50 shadow-sm">
        <div className="container mx-auto px-3 sm:px-4 lg:px-6 py-3 sm:py-4">
          <div className="flex items-center justify-between gap-2 sm:gap-4">
            <Link href="/dashboard" className="flex items-center gap-2 sm:gap-3 hover:opacity-80 transition-opacity">
              <div className="relative w-8 h-8 sm:w-10 sm:h-10 flex-shrink-0">
                <Image src="/logo.png" alt="Aprende Code Logo" fill className="object-contain" priority />
              </div>
              <h1 className="text-lg sm:text-xl md:text-2xl font-bold text-slate-800 truncate">Aprende Code</h1>
            </Link>

            <div className="flex items-center gap-2 sm:gap-3">
              {avatarUrl ? (
                <div className="relative w-8 h-8 sm:w-10 sm:h-10 rounded-full overflow-hidden flex-shrink-0">
                  <Image
                    src={avatarUrl || "/placeholder.svg"}
                    alt={displayName}
                    fill
                    className="object-cover"
                    unoptimized
                  />
                </div>
              ) : (
                <div className="flex items-center justify-center w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 text-white font-semibold text-xs sm:text-sm flex-shrink-0">
                  {displayName.charAt(0).toUpperCase()}
                </div>
              )}
              <span className="hidden md:inline text-xs sm:text-sm font-medium text-slate-700 max-w-[120px] lg:max-w-none truncate">
                {displayName}
              </span>
              <form action={signout}>
                <Button variant="outline" size="sm" type="submit" className="text-xs sm:text-sm bg-transparent">
                  <LogOut className="w-3 h-3 sm:w-4 sm:h-4 sm:mr-2" />
                  <span className="hidden sm:inline">Salir</span>
                </Button>
              </form>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-3 sm:px-4 lg:px-6 py-4 sm:py-6 lg:py-8">
        {/* Welcome Section */}
        <div className="mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-slate-800 mb-1 sm:mb-2 text-balance">
            ¡Bienvenido, {displayName}! 👋
          </h1>
          <p className="text-sm sm:text-base md:text-lg lg:text-xl text-slate-600 text-pretty">
            Estás listo para comenzar tu viaje en Python
          </p>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6 sm:mb-8">
          <Card className="border-2 hover:shadow-lg transition-shadow">
            <CardContent className="pt-4 sm:pt-6 p-3 sm:p-6">
              <div className="flex items-center justify-between gap-2">
                <div className="min-w-0">
                  <p className="text-xs sm:text-sm text-slate-600 mb-1">Lecciones</p>
                  <p className="text-xl sm:text-2xl md:text-3xl font-bold text-slate-800">0/15</p>
                </div>
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <BookOpen className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-2 hover:shadow-lg transition-shadow">
            <CardContent className="pt-4 sm:pt-6 p-3 sm:p-6">
              <div className="flex items-center justify-between gap-2">
                <div className="min-w-0">
                  <p className="text-xs sm:text-sm text-slate-600 mb-1">Ejercicios</p>
                  <p className="text-xl sm:text-2xl md:text-3xl font-bold text-slate-800">0/50</p>
                </div>
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Code className="w-5 h-5 sm:w-6 sm:h-6 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-2 hover:shadow-lg transition-shadow">
            <CardContent className="pt-4 sm:pt-6 p-3 sm:p-6">
              <div className="flex items-center justify-between gap-2">
                <div className="min-w-0">
                  <p className="text-xs sm:text-sm text-slate-600 mb-1">Puntos</p>
                  <p className="text-xl sm:text-2xl md:text-3xl font-bold text-slate-800">0</p>
                </div>
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-yellow-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Trophy className="w-5 h-5 sm:w-6 sm:h-6 text-yellow-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-2 hover:shadow-lg transition-shadow">
            <CardContent className="pt-4 sm:pt-6 p-3 sm:p-6">
              <div className="flex items-center justify-between gap-2">
                <div className="min-w-0">
                  <p className="text-xs sm:text-sm text-slate-600 mb-1">Racha</p>
                  <p className="text-xl sm:text-2xl md:text-3xl font-bold text-slate-800 truncate">0 días</p>
                </div>
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-purple-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <TrendingUp className="w-5 h-5 sm:w-6 sm:h-6 text-purple-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Grid */}
        <div className="grid lg:grid-cols-3 gap-4 sm:gap-6">
          {/* Continue Learning */}
          <div className="lg:col-span-2 space-y-4 sm:space-y-6">
            <Card className="border-2">
              <CardHeader className="p-4 sm:p-6">
                <CardTitle className="flex items-center gap-2 text-base sm:text-lg md:text-xl">
                  <Star className="w-4 h-4 sm:w-5 sm:h-5 text-yellow-500 flex-shrink-0" />
                  <span className="text-balance">Comienza tu aprendizaje</span>
                </CardTitle>
                <CardDescription className="text-xs sm:text-sm md:text-base text-pretty">
                  Tu primer módulo de Python te está esperando
                </CardDescription>
              </CardHeader>
              <CardContent className="p-4 sm:p-6">
                <div className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg p-4 sm:p-6 text-white mb-4">
                  <h3 className="text-lg sm:text-xl md:text-2xl font-bold mb-2 text-balance">
                    Módulo 1: Introducción a Python
                  </h3>
                  <p className="text-xs sm:text-sm md:text-base text-blue-100 mb-3 sm:mb-4 text-pretty">
                    Aprende los fundamentos de Python: variables, tipos de datos y operadores básicos.
                  </p>
                  <div className="flex flex-wrap items-center gap-2 text-xs sm:text-sm mb-3 sm:mb-4">
                    <div className="flex items-center gap-1 sm:gap-2">
                      <Clock className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" />
                      <span>30 minutos</span>
                    </div>
                    <span className="hidden sm:inline">•</span>
                    <div className="flex items-center gap-1 sm:gap-2">
                      <BookOpen className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" />
                      <span>5 lecciones</span>
                    </div>
                  </div>
                  <Button className="bg-white text-blue-600 hover:bg-blue-50 text-xs sm:text-sm md:text-base w-full sm:w-auto">
                    Comenzar Módulo
                  </Button>
                </div>

                <div className="space-y-2 sm:space-y-3">
                  <div className="flex items-center justify-between p-3 sm:p-4 border rounded-lg hover:bg-slate-50 cursor-pointer transition-colors gap-3">
                    <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
                      <div className="w-8 h-8 sm:w-10 sm:h-10 bg-slate-100 rounded-lg flex items-center justify-center flex-shrink-0">
                        <span className="font-semibold text-slate-600 text-sm sm:text-base">1</span>
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="font-medium text-slate-800 text-sm sm:text-base truncate">¿Qué es Python?</p>
                        <p className="text-xs sm:text-sm text-slate-500">5 min</p>
                      </div>
                    </div>
                    <div className="w-5 h-5 sm:w-6 sm:h-6 rounded-full border-2 border-slate-300 flex-shrink-0"></div>
                  </div>

                  <div className="flex items-center justify-between p-3 sm:p-4 border rounded-lg opacity-50 gap-3">
                    <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
                      <div className="w-8 h-8 sm:w-10 sm:h-10 bg-slate-100 rounded-lg flex items-center justify-center flex-shrink-0">
                        <span className="font-semibold text-slate-600 text-sm sm:text-base">2</span>
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="font-medium text-slate-800 text-sm sm:text-base truncate">
                          Variables y tipos de datos
                        </p>
                        <p className="text-xs sm:text-sm text-slate-500">8 min</p>
                      </div>
                    </div>
                    <div className="text-xs sm:text-sm text-slate-500 flex-shrink-0">🔒 Bloqueado</div>
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
                <CardTitle className="text-base sm:text-lg">Tu Progreso</CardTitle>
              </CardHeader>
              <CardContent className="p-4 sm:p-6">
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between text-xs sm:text-sm mb-2">
                      <span className="text-slate-600">Curso completo</span>
                      <span className="font-semibold">0%</span>
                    </div>
                    <div className="w-full bg-slate-200 rounded-full h-2">
                      <div className="bg-blue-600 h-2 rounded-full" style={{ width: "0%" }}></div>
                    </div>
                  </div>

                  <div className="pt-4 border-t">
                    <p className="text-xs sm:text-sm text-slate-600 mb-3">Próximos logros</p>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-xs sm:text-sm">
                        <div className="w-7 h-7 sm:w-8 sm:h-8 bg-slate-100 rounded-lg flex items-center justify-center text-base sm:text-lg flex-shrink-0">
                          🎯
                        </div>
                        <span className="text-slate-700">Primera lección</span>
                      </div>
                      <div className="flex items-center gap-2 text-xs sm:text-sm">
                        <div className="w-7 h-7 sm:w-8 sm:h-8 bg-slate-100 rounded-lg flex items-center justify-center text-base sm:text-lg flex-shrink-0">
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
                <CardTitle className="text-base sm:text-lg">Enlaces Rápidos</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 p-4 sm:p-6">
                <Link href="/courses" className="block">
                  <Button variant="ghost" className="w-full justify-start text-xs sm:text-sm">
                    <BookOpen className="w-3 h-3 sm:w-4 sm:h-4 mr-2 flex-shrink-0" />
                    <span className="truncate">Ver todos los módulos</span>
                  </Button>
                </Link>
                <Link href="/lessons" className="block">
                  <Button variant="ghost" className="w-full justify-start text-xs sm:text-sm">
                    <Code className="w-3 h-3 sm:w-4 sm:h-4 mr-2 flex-shrink-0" />
                    <span className="truncate">Ejercicios prácticos</span>
                  </Button>
                </Link>
                <Link href="/profile" className="block">
                  <Button variant="ghost" className="w-full justify-start text-xs sm:text-sm">
                    <Trophy className="w-3 h-3 sm:w-4 sm:h-4 mr-2 flex-shrink-0" />
                    <span className="truncate">Mi perfil</span>
                  </Button>
                </Link>
                <Link href="/" className="block">
                  <Button
                    variant="ghost"
                    className="w-full justify-start text-slate-600 hover:text-slate-700 hover:bg-slate-50 text-xs sm:text-sm"
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
  )
}
