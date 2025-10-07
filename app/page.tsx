import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Play, Code, Zap, Award, BookOpen, Users } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import UserGreetText from "@/components/UserGreetText";
import LoginButton from "@/components/LoginLogoutButton";
import MobileMenu from "@/components/MobileMenu";
import { createClient } from "@/src/infrastructure/supabase/server";
import { redirect } from "next/navigation";

function CodeEditorPreview() {
  const nombre = "Estudiante";

  return (
    <Card className="overflow-hidden bg-slate-900 p-4 font-mono text-xs text-slate-100 shadow-2xl sm:p-6 sm:text-sm">
      <div className="mb-4 flex items-center gap-2">
        <div className="h-3 w-3 rounded-full bg-red-500"></div>
        <div className="h-3 w-3 rounded-full bg-yellow-500"></div>
        <div className="h-3 w-3 rounded-full bg-green-500"></div>
        <span className="ml-2 text-xs text-slate-400">aprende_code.py</span>
      </div>
      <div className="space-y-2">
        <div className="text-slate-500"># Tu primer programa en Python</div>
        <div className="text-green-400">def saludar(nombre):</div>
        <div className="ml-4 text-slate-100">
          print(f&quot;¡Hola, {"{nombre}"}&quot;!)
        </div>
        <div className="ml-4 text-slate-100">
          print(&quot;¡Bienvenido a Aprende Code!&quot;)
        </div>
        <div className="mt-4 text-green-400">saludar(&quot;{nombre}&quot;)</div>
        <div className="mt-4 text-slate-500"># Salida:</div>
        <div className="text-yellow-300"># ¡Hola, Estudiante!</div>
        <div className="text-yellow-300"># ¡Bienvenido a Aprende Code!</div>
      </div>
    </Card>
  );
}

export default async function Home() {
  // Verificar si el usuario está autenticado
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    redirect("/dashboard");
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Header mejorado */}
      <header className="sticky top-0 z-50 border-b border-slate-200 bg-white shadow-sm">
        <div className="container mx-auto px-4 py-3 sm:py-4">
          <div className="flex items-center justify-between">
            <Link
              href="/"
              className="flex items-center gap-2 transition-opacity hover:opacity-80 sm:gap-3"
            >
              <div className="relative h-8 w-8 sm:h-10 sm:w-10">
                <Image
                  src="/logo.png"
                  alt="Aprende Code Logo"
                  fill
                  className="object-contain"
                  priority
                />
              </div>
              <h1 className="text-lg font-bold text-slate-800 sm:text-xl md:text-2xl">
                Aprende Code
              </h1>
            </Link>

            <nav className="hidden items-center gap-6 lg:flex">
              <a
                href="#curso"
                className="text-sm font-medium text-slate-600 transition-colors hover:text-slate-800"
              >
                El Curso
              </a>
              <a
                href="#profesores"
                className="text-sm font-medium text-slate-600 transition-colors hover:text-slate-800"
              >
                Para Profesores
              </a>
              <a
                href="#estudiantes"
                className="text-sm font-medium text-slate-600 transition-colors hover:text-slate-800"
              >
                Para Estudiantes
              </a>
              <a
                href="#recursos"
                className="text-sm font-medium text-slate-600 transition-colors hover:text-slate-800"
              >
                Recursos
              </a>
            </nav>

            <div className="hidden items-center gap-3 lg:flex">
              <UserGreetText />
              {user ? (
                <Link href="/dashboard">
                  <Button>Ir al Dashboard</Button>
                </Link>
              ) : (
                <LoginButton />
              )}
            </div>

            <MobileMenu />
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="bg-gradient-to-br from-sky-50 via-blue-50 to-indigo-50 py-12 text-slate-800 sm:py-16 md:py-20 lg:py-24">
        <div className="container mx-auto px-4 text-center">
          <div className="mb-4 inline-block rounded-full border border-sky-200 bg-white/60 px-4 py-2 text-sm font-medium text-sky-700 backdrop-blur-sm">
            🎓 Curso 100% Gratuito
          </div>
          <h1 className="mb-4 text-balance text-3xl font-bold leading-tight sm:mb-6 sm:text-4xl md:text-5xl lg:text-6xl">
            Introducción a Python
          </h1>
          <p className="mx-auto mb-6 max-w-3xl text-balance text-base leading-relaxed text-slate-600 sm:mb-8 sm:text-lg md:text-xl lg:text-2xl">
            Aprende programación desde cero con nuestro curso completo de
            Python. Totalmente gratuito y diseñado para principiantes.
          </p>
          <div className="mx-auto flex max-w-md flex-col items-center justify-center gap-3 sm:max-w-none sm:flex-row sm:gap-4">
            {user ? (
              <Link href="/dashboard" className="w-full sm:w-auto">
                <Button
                  size="lg"
                  className="w-full bg-sky-600 text-white shadow-lg transition-all hover:bg-sky-700 hover:shadow-xl sm:w-auto"
                >
                  <Play className="mr-2 h-4 w-4 sm:h-5 sm:w-5" />
                  Continuar Aprendiendo
                </Button>
              </Link>
            ) : (
              <Link href="/signup" className="w-full sm:w-auto">
                <Button
                  size="lg"
                  className="w-full bg-sky-600 text-white shadow-lg transition-all hover:bg-sky-700 hover:shadow-xl sm:w-auto"
                >
                  <Play className="mr-2 h-4 w-4 sm:h-5 sm:w-5" />
                  Comenzar Curso Gratis
                </Button>
              </Link>
            )}
            <Button
              size="lg"
              variant="outline"
              className="w-full border-sky-600 bg-white/80 text-sky-600 backdrop-blur-sm hover:bg-sky-600 hover:text-white sm:w-auto"
            >
              Ver Contenido del Curso
            </Button>
          </div>
        </div>
      </section>

      {/* Code Preview Section */}
      <section className="py-12 sm:py-16 lg:py-20">
        <div className="container mx-auto px-4">
          <div className="grid items-center gap-8 lg:grid-cols-2 lg:gap-12">
            <div className="order-2 lg:order-1">
              <div className="mb-4 inline-block rounded-full bg-sky-100 px-3 py-1 text-sm font-medium text-sky-700">
                💻 Práctica Inmediata
              </div>
              <h2 className="mb-4 text-balance text-2xl font-bold leading-tight text-slate-800 sm:mb-6 sm:text-3xl md:text-4xl">
                Tu primer programa en Python
              </h2>
              <p className="mb-6 text-base leading-relaxed text-slate-600 sm:mb-8 sm:text-lg">
                Desde &quot;Hola Mundo&quot; hasta proyectos completos. Nuestro
                curso de Introducción a Python te lleva paso a paso desde los
                conceptos básicos hasta crear tus primeras aplicaciones.
              </p>
              <div className="grid gap-3 sm:grid-cols-2 sm:gap-4">
                <div className="flex items-center gap-2 rounded-lg bg-slate-50 p-3">
                  <Code className="h-5 w-5 flex-shrink-0 text-sky-600" />
                  <span className="text-sm font-medium text-slate-700">
                    Editor integrado
                  </span>
                </div>
                <div className="flex items-center gap-2 rounded-lg bg-slate-50 p-3">
                  <Zap className="h-5 w-5 flex-shrink-0 text-sky-600" />
                  <span className="text-sm font-medium text-slate-700">
                    Práctica inmediata
                  </span>
                </div>
                <div className="flex items-center gap-2 rounded-lg bg-slate-50 p-3 sm:col-span-2 lg:col-span-1">
                  <Award className="h-5 w-5 flex-shrink-0 text-sky-600" />
                  <span className="text-sm font-medium text-slate-700">
                    Certificado gratuito
                  </span>
                </div>
              </div>
            </div>
            <div className="order-1 lg:order-2">
              <CodeEditorPreview />
            </div>
          </div>
        </div>
      </section>

      {/* User Types Section */}
      <section className="bg-slate-50 py-12 sm:py-16 lg:py-20" id="profesores">
        <div className="container mx-auto px-4">
          <div className="mb-8 text-center sm:mb-12">
            <div className="mb-4 inline-block rounded-full bg-sky-100 px-3 py-1 text-sm font-medium text-sky-700">
              👥 Para Todos
            </div>
            <h2 className="mb-3 text-balance text-2xl font-bold leading-tight sm:mb-4 sm:text-3xl md:text-4xl">
              Diseñado para todos
            </h2>
            <p className="mx-auto max-w-2xl text-base leading-relaxed text-slate-600 sm:text-lg">
              Ya seas profesor o estudiante, tenemos las herramientas perfectas
              para tu viaje de aprendizaje.
            </p>
          </div>

          <div className="mx-auto grid max-w-5xl gap-6 sm:gap-8 md:grid-cols-2">
            <Card className="border-2 p-6 transition-all duration-300 hover:border-sky-200 hover:shadow-xl sm:p-8">
              <CardHeader className="pb-6 text-center">
                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500 to-purple-600 shadow-lg">
                  <Users className="h-8 w-8 text-white" />
                </div>
                <CardTitle className="text-2xl">Para Profesores</CardTitle>
                <CardDescription className="text-base">
                  Herramientas completas para enseñar programación
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-start gap-3 rounded-lg bg-slate-50 p-3">
                  <div className="mt-2 h-2 w-2 flex-shrink-0 rounded-full bg-sky-600"></div>
                  <div>
                    <h4 className="mb-1 text-base font-semibold">
                      Gestión de Clases
                    </h4>
                    <p className="text-sm text-slate-600">
                      Organiza estudiantes y asigna tareas fácilmente
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3 rounded-lg bg-slate-50 p-3">
                  <div className="mt-2 h-2 w-2 flex-shrink-0 rounded-full bg-sky-600"></div>
                  <div>
                    <h4 className="mb-1 text-base font-semibold">
                      Seguimiento de Progreso
                    </h4>
                    <p className="text-sm text-slate-600">
                      Monitorea el avance de cada estudiante
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3 rounded-lg bg-slate-50 p-3">
                  <div className="mt-2 h-2 w-2 flex-shrink-0 rounded-full bg-sky-600"></div>
                  <div>
                    <h4 className="mb-1 text-base font-semibold">
                      Recursos Didácticos
                    </h4>
                    <p className="text-sm text-slate-600">
                      Acceso a ejercicios y proyectos prediseñados
                    </p>
                  </div>
                </div>
                {user ? (
                  <Link href="/dashboard" className="mt-6 block">
                    <Button className="w-full">Ir al Dashboard</Button>
                  </Link>
                ) : (
                  <Link href="/signup" className="mt-6 block">
                    <Button className="w-full">Comenzar como Profesor</Button>
                  </Link>
                )}
              </CardContent>
            </Card>

            <Card
              className="border-2 p-6 transition-all duration-300 hover:border-sky-200 hover:shadow-xl sm:p-8"
              id="estudiantes"
            >
              <CardHeader className="pb-6 text-center">
                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-green-500 to-emerald-600 shadow-lg">
                  <BookOpen className="h-8 w-8 text-white" />
                </div>
                <CardTitle className="text-2xl">Para Estudiantes</CardTitle>
                <CardDescription className="text-base">
                  Aprende a tu ritmo con contenido interactivo
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-start gap-3 rounded-lg bg-slate-50 p-3">
                  <div className="mt-2 h-2 w-2 flex-shrink-0 rounded-full bg-emerald-600"></div>
                  <div>
                    <h4 className="mb-1 text-base font-semibold">
                      Lecciones Interactivas
                    </h4>
                    <p className="text-sm text-slate-600">
                      Aprende con ejemplos prácticos y ejercicios
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3 rounded-lg bg-slate-50 p-3">
                  <div className="mt-2 h-2 w-2 flex-shrink-0 rounded-full bg-emerald-600"></div>
                  <div>
                    <h4 className="mb-1 text-base font-semibold">
                      Proyectos Reales
                    </h4>
                    <p className="text-sm text-slate-600">
                      Construye aplicaciones desde el primer día
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3 rounded-lg bg-slate-50 p-3">
                  <div className="mt-2 h-2 w-2 flex-shrink-0 rounded-full bg-emerald-600"></div>
                  <div>
                    <h4 className="mb-1 text-base font-semibold">
                      Comunidad de Apoyo
                    </h4>
                    <p className="text-sm text-slate-600">
                      Conecta con otros estudiantes y profesores
                    </p>
                  </div>
                </div>
                {user ? (
                  <Link href="/dashboard" className="mt-6 block">
                    <Button className="w-full">Ir al Dashboard</Button>
                  </Link>
                ) : (
                  <Link href="/signup" className="mt-6 block">
                    <Button className="w-full">Comenzar como Estudiante</Button>
                  </Link>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-12 sm:py-16 lg:py-20" id="curso">
        <div className="container mx-auto px-4">
          <div className="mb-8 text-center sm:mb-12">
            <div className="mb-4 inline-block rounded-full bg-sky-100 px-3 py-1 text-sm font-medium text-sky-700">
              ✨ Características
            </div>
            <h2 className="mb-3 text-balance text-2xl font-bold leading-tight sm:mb-4 sm:text-3xl md:text-4xl">
              Curso completo y gratuito
            </h2>
            <p className="mx-auto max-w-2xl text-base leading-relaxed text-slate-600 sm:text-lg">
              Nuestro curso de Introducción a Python incluye todo lo que
              necesitas para comenzar a programar, sin costo alguno.
            </p>
          </div>

          <div className="mx-auto grid max-w-6xl gap-6 sm:grid-cols-2 sm:gap-8 lg:grid-cols-3">
            <Card className="border-2 p-6 text-center transition-all duration-300 hover:border-sky-200 hover:shadow-xl">
              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 shadow-lg">
                <Code className="h-7 w-7 text-white" />
              </div>
              <h3 className="mb-2 text-xl font-semibold">Sin Instalaciones</h3>
              <p className="text-sm leading-relaxed text-slate-600">
                Programa Python directamente en tu navegador. Comienza el curso
                inmediatamente sin configuraciones.
              </p>
            </Card>

            <Card className="p-4 text-center sm:p-6">
              <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 sm:mb-4 sm:h-12 sm:w-12">
                <BookOpen className="h-5 w-5 text-primary sm:h-6 sm:w-6" />
              </div>
              <h3 className="mb-2 text-lg font-semibold sm:text-xl">
                Contenido Estructurado
              </h3>
              <p className="text-sm leading-relaxed text-muted-foreground sm:text-base">
                15 módulos que cubren desde variables y funciones hasta
                proyectos reales con Python.
              </p>
            </Card>

            <Card className="p-4 text-center sm:col-span-2 sm:p-6 lg:col-span-1">
              <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 sm:mb-4 sm:h-12 sm:w-12">
                <Users className="h-5 w-5 text-primary sm:h-6 sm:w-6" />
              </div>
              <h3 className="mb-2 text-lg font-semibold sm:text-xl">
                Apoyo Gratuito
              </h3>
              <p className="text-sm leading-relaxed text-muted-foreground sm:text-base">
                Acceso a profesores y comunidad de estudiantes para resolver
                dudas durante todo el curso.
              </p>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-secondary py-16 text-secondary-foreground sm:py-20">
        <div className="container mx-auto px-4 text-center">
          <h2 className="mb-4 text-balance text-2xl font-bold leading-tight sm:mb-6 sm:text-3xl md:text-4xl">
            Comienza tu curso de Python hoy
          </h2>
          <p className="mx-auto mb-6 max-w-2xl text-base leading-relaxed opacity-90 sm:mb-8 sm:text-lg">
            Únete a miles de estudiantes que ya están aprendiendo programación
            con nuestro curso gratuito de Introducción a Python.
          </p>
          <div className="mx-auto flex max-w-md flex-col justify-center gap-3 sm:max-w-none sm:flex-row sm:gap-4">
            {user ? (
              <Link href="/dashboard">
                <Button
                  size="lg"
                  className="w-full bg-primary text-primary-foreground hover:bg-primary/90 sm:w-auto"
                >
                  Ir a mi Dashboard
                </Button>
              </Link>
            ) : (
              <Link href="/signup">
                <Button
                  size="lg"
                  className="w-full bg-primary text-primary-foreground hover:bg-primary/90 sm:w-auto"
                >
                  Inscribirse Gratis al Curso
                </Button>
              </Link>
            )}
            <Button
              size="lg"
              variant="outline"
              className="w-full border-secondary-foreground bg-transparent text-secondary-foreground hover:bg-secondary-foreground hover:text-secondary sm:w-auto"
            >
              Ver Temario Completo
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer
        className="border-t border-border bg-card py-8 sm:py-12"
        id="recursos"
      >
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 gap-6 sm:gap-8 md:grid-cols-4">
            <div className="col-span-2 md:col-span-1">
              <div className="mb-3 flex items-center gap-2 sm:mb-4 sm:gap-3">
                <div className="relative h-6 w-6 sm:h-7 sm:w-7">
                  <Image
                    src="/logo.png"
                    alt="Aprende Code Logo"
                    fill
                    className="object-contain"
                  />
                </div>
                <span className="text-base font-bold sm:text-lg">
                  Aprende Code
                </span>
              </div>
              <p className="text-xs leading-relaxed text-muted-foreground sm:text-sm">
                Curso gratuito de Introducción a Python para principiantes.
              </p>
            </div>

            <div>
              <h4 className="mb-3 text-sm font-semibold sm:mb-4 sm:text-base">
                Curso
              </h4>
              <ul className="space-y-2 text-xs text-muted-foreground sm:text-sm">
                <li>
                  <a
                    href="#"
                    className="transition-colors hover:text-foreground"
                  >
                    Temario
                  </a>
                </li>
                <li>
                  <a
                    href="#"
                    className="transition-colors hover:text-foreground"
                  >
                    Ejercicios
                  </a>
                </li>
                <li>
                  <a
                    href="#"
                    className="transition-colors hover:text-foreground"
                  >
                    Proyectos
                  </a>
                </li>
                <li>
                  <a
                    href="#"
                    className="transition-colors hover:text-foreground"
                  >
                    Certificado
                  </a>
                </li>
              </ul>
            </div>

            <div>
              <h4 className="mb-3 text-sm font-semibold sm:mb-4 sm:text-base">
                Comunidad
              </h4>
              <ul className="space-y-2 text-xs text-muted-foreground sm:text-sm">
                <li>
                  <a
                    href="#"
                    className="transition-colors hover:text-foreground"
                  >
                    Foro
                  </a>
                </li>
                <li>
                  <a
                    href="#"
                    className="transition-colors hover:text-foreground"
                  >
                    Discord
                  </a>
                </li>
                <li>
                  <a
                    href="#"
                    className="transition-colors hover:text-foreground"
                  >
                    Blog
                  </a>
                </li>
                <li>
                  <a
                    href="#"
                    className="transition-colors hover:text-foreground"
                  >
                    Eventos
                  </a>
                </li>
              </ul>
            </div>

            <div>
              <h4 className="mb-3 text-sm font-semibold sm:mb-4 sm:text-base">
                Soporte
              </h4>
              <ul className="space-y-2 text-xs text-muted-foreground sm:text-sm">
                <li>
                  <a
                    href="#"
                    className="transition-colors hover:text-foreground"
                  >
                    Centro de Ayuda
                  </a>
                </li>
                <li>
                  <a
                    href="#"
                    className="transition-colors hover:text-foreground"
                  >
                    Contacto
                  </a>
                </li>
                <li>
                  <a
                    href="#"
                    className="transition-colors hover:text-foreground"
                  >
                    Términos
                  </a>
                </li>
                <li>
                  <a
                    href="#"
                    className="transition-colors hover:text-foreground"
                  >
                    Privacidad
                  </a>
                </li>
              </ul>
            </div>
          </div>

          <div className="mt-6 border-t border-border pt-6 text-center text-xs text-muted-foreground sm:mt-8 sm:pt-8 sm:text-sm">
            <p>&copy; 2025 Aprende Code. Todos los derechos reservados.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
