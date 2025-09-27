import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Play, Code, Zap, Award, BookOpen, Users } from "lucide-react"
import Link from "next/link"
import Image from "next/image"
import UserGreetText from "@/components/UserGreetText"
import LoginButton from "@/components/LoginLogoutButton"
import MobileMenu from "@/components/MobileMenu"

function CodeEditorPreview() {
  const nombre = "Estudiante"

  return (
    <Card className="bg-slate-900 text-slate-100 p-4 sm:p-6 font-mono text-xs sm:text-sm overflow-hidden shadow-2xl">
      <div className="flex items-center gap-2 mb-4">
        <div className="w-3 h-3 rounded-full bg-red-500"></div>
        <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
        <div className="w-3 h-3 rounded-full bg-green-500"></div>
        <span className="ml-2 text-slate-400 text-xs">aprende_code.py</span>
      </div>
      <div className="space-y-2">
        <div className="text-slate-500"># Tu primer programa en Python</div>
        <div className="text-green-400">def saludar(nombre):</div>
        <div className="ml-4 text-slate-100">print(f&quot;¡Hola, {"{nombre}"}&quot;!)</div>
        <div className="ml-4 text-slate-100">print(&quot;¡Bienvenido a Aprende Code!&quot;)</div>
        <div className="text-green-400 mt-4">saludar(&quot;{nombre}&quot;)</div>
        <div className="text-slate-500 mt-4"># Salida:</div>
        <div className="text-yellow-300"># ¡Hola, Estudiante!</div>
        <div className="text-yellow-300"># ¡Bienvenido a Aprende Code!</div>
      </div>
    </Card>
  )
}

export default function Home() {
  return (
    <div className="min-h-screen bg-white">
      {/* Header mejorado */}
      <header className="border-b border-slate-200 bg-white sticky top-0 z-50 shadow-sm">
        <div className="container mx-auto px-4 py-3 sm:py-4">
          <div className="flex items-center justify-between">
            {/* Logo - Coloca tu imagen en /public/logo.png */}
            <Link href="/" className="flex items-center gap-2 sm:gap-3 hover:opacity-80 transition-opacity">
              <div className="relative w-8 h-8 sm:w-10 sm:h-10">
                <Image
                  src="/logo.png"
                  alt="Aprende Code Logo"
                  fill
                  className="object-contain"
                  priority
                />
              </div>
              <h1 className="text-lg sm:text-xl md:text-2xl font-bold text-slate-800">
                Aprende Code
              </h1>
            </Link>

            {/* Desktop Navigation */}
            <nav className="hidden lg:flex items-center gap-6">
              <a href="#curso" className="text-sm text-slate-600 hover:text-slate-800 transition-colors font-medium">
                El Curso
              </a>
              <a href="#profesores" className="text-sm text-slate-600 hover:text-slate-800 transition-colors font-medium">
                Para Profesores
              </a>
              <a href="#estudiantes" className="text-sm text-slate-600 hover:text-slate-800 transition-colors font-medium">
                Para Estudiantes
              </a>
              <a href="#recursos" className="text-sm text-slate-600 hover:text-slate-800 transition-colors font-medium">
                Recursos
              </a>
            </nav>

            {/* Desktop User Info & Buttons */}
            <div className="hidden lg:flex items-center gap-3">
              <UserGreetText />
              <LoginButton />
            </div>

            {/* Mobile Menu */}
            <MobileMenu />
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="bg-gradient-to-br from-sky-50 via-blue-50 to-indigo-50 text-slate-800 py-12 sm:py-16 md:py-20 lg:py-24">
        <div className="container mx-auto px-4 text-center">
          <div className="inline-block mb-4 px-4 py-2 bg-white/60 backdrop-blur-sm rounded-full text-sm font-medium text-sky-700 border border-sky-200">
            🎓 Curso 100% Gratuito
          </div>
          <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold mb-4 sm:mb-6 text-balance leading-tight">
            Introducción a Python
          </h1>
          <p className="text-base sm:text-lg md:text-xl lg:text-2xl mb-6 sm:mb-8 text-balance max-w-3xl mx-auto text-slate-600 leading-relaxed">
            Aprende programación desde cero con nuestro curso completo de Python. Totalmente gratuito y diseñado para
            principiantes.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center items-center max-w-md sm:max-w-none mx-auto">
            <Link href="/signup" className="w-full sm:w-auto">
              <Button size="lg" className="w-full sm:w-auto bg-sky-600 text-white hover:bg-sky-700 shadow-lg hover:shadow-xl transition-all">
                <Play className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
                Comenzar Curso Gratis
              </Button>
            </Link>
            <Button
              size="lg"
              variant="outline"
              className="w-full sm:w-auto border-sky-600 text-sky-600 hover:bg-sky-600 hover:text-white bg-white/80 backdrop-blur-sm"
            >
              Ver Contenido del Curso
            </Button>
          </div>
        </div>
      </section>

      {/* Code Preview Section */}
      <section className="py-12 sm:py-16 lg:py-20">
        <div className="container mx-auto px-4">
          <div className="grid lg:grid-cols-2 gap-8 lg:gap-12 items-center">
            <div className="order-2 lg:order-1">
              <div className="inline-block mb-4 px-3 py-1 bg-sky-100 rounded-full text-sm font-medium text-sky-700">
                💻 Práctica Inmediata
              </div>
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-4 sm:mb-6 text-balance leading-tight text-slate-800">
                Tu primer programa en Python
              </h2>
              <p className="text-base sm:text-lg text-slate-600 mb-6 sm:mb-8 leading-relaxed">
                Desde &quot;Hola Mundo&quot; hasta proyectos completos. Nuestro curso de Introducción a Python te lleva paso a
                paso desde los conceptos básicos hasta crear tus primeras aplicaciones.
              </p>
              <div className="grid sm:grid-cols-2 gap-3 sm:gap-4">
                <div className="flex items-center gap-2 p-3 bg-slate-50 rounded-lg">
                  <Code className="w-5 h-5 text-sky-600 flex-shrink-0" />
                  <span className="text-sm font-medium text-slate-700">Editor integrado</span>
                </div>
                <div className="flex items-center gap-2 p-3 bg-slate-50 rounded-lg">
                  <Zap className="w-5 h-5 text-sky-600 flex-shrink-0" />
                  <span className="text-sm font-medium text-slate-700">Práctica inmediata</span>
                </div>
                <div className="flex items-center gap-2 p-3 bg-slate-50 rounded-lg sm:col-span-2 lg:col-span-1">
                  <Award className="w-5 h-5 text-sky-600 flex-shrink-0" />
                  <span className="text-sm font-medium text-slate-700">Certificado gratuito</span>
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
      <section className="py-12 sm:py-16 lg:py-20 bg-slate-50" id="profesores">
        <div className="container mx-auto px-4">
          <div className="text-center mb-8 sm:mb-12">
            <div className="inline-block mb-4 px-3 py-1 bg-sky-100 rounded-full text-sm font-medium text-sky-700">
              👥 Para Todos
            </div>
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-3 sm:mb-4 text-balance leading-tight">
              Diseñado para todos
            </h2>
            <p className="text-base sm:text-lg text-slate-600 max-w-2xl mx-auto leading-relaxed">
              Ya seas profesor o estudiante, tenemos las herramientas perfectas para tu viaje de aprendizaje.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-6 sm:gap-8 max-w-5xl mx-auto">
            {/* Para Profesores */}
            <Card className="p-6 sm:p-8 hover:shadow-xl transition-all duration-300 border-2 hover:border-sky-200">
              <CardHeader className="text-center pb-6">
                <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
                  <Users className="w-8 h-8 text-white" />
                </div>
                <CardTitle className="text-2xl">Para Profesores</CardTitle>
                <CardDescription className="text-base">
                  Herramientas completas para enseñar programación
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-start gap-3 p-3 bg-slate-50 rounded-lg">
                  <div className="w-2 h-2 bg-sky-600 rounded-full mt-2 flex-shrink-0"></div>
                  <div>
                    <h4 className="font-semibold text-base mb-1">Gestión de Clases</h4>
                    <p className="text-sm text-slate-600">
                      Organiza estudiantes y asigna tareas fácilmente
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3 p-3 bg-slate-50 rounded-lg">
                  <div className="w-2 h-2 bg-sky-600 rounded-full mt-2 flex-shrink-0"></div>
                  <div>
                    <h4 className="font-semibold text-base mb-1">Seguimiento de Progreso</h4>
                    <p className="text-sm text-slate-600">Monitorea el avance de cada estudiante</p>
                  </div>
                </div>
                <div className="flex items-start gap-3 p-3 bg-slate-50 rounded-lg">
                  <div className="w-2 h-2 bg-sky-600 rounded-full mt-2 flex-shrink-0"></div>
                  <div>
                    <h4 className="font-semibold text-base mb-1">Recursos Didácticos</h4>
                    <p className="text-sm text-slate-600">
                      Acceso a ejercicios y proyectos prediseñados
                    </p>
                  </div>
                </div>
                <Link href="/signup" className="block mt-6">
                  <Button className="w-full">Comenzar como Profesor</Button>
                </Link>
              </CardContent>
            </Card>

            {/* Para Estudiantes */}
            <Card className="p-6 sm:p-8 hover:shadow-xl transition-all duration-300 border-2 hover:border-sky-200" id="estudiantes">
              <CardHeader className="text-center pb-6">
                <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
                  <BookOpen className="w-8 h-8 text-white" />
                </div>
                <CardTitle className="text-2xl">Para Estudiantes</CardTitle>
                <CardDescription className="text-base">
                  Aprende a tu ritmo con contenido interactivo
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-start gap-3 p-3 bg-slate-50 rounded-lg">
                  <div className="w-2 h-2 bg-emerald-600 rounded-full mt-2 flex-shrink-0"></div>
                  <div>
                    <h4 className="font-semibold text-base mb-1">Lecciones Interactivas</h4>
                    <p className="text-sm text-slate-600">
                      Aprende con ejemplos prácticos y ejercicios
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3 p-3 bg-slate-50 rounded-lg">
                  <div className="w-2 h-2 bg-emerald-600 rounded-full mt-2 flex-shrink-0"></div>
                  <div>
                    <h4 className="font-semibold text-base mb-1">Proyectos Reales</h4>
                    <p className="text-sm text-slate-600">
                      Construye aplicaciones desde el primer día
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3 p-3 bg-slate-50 rounded-lg">
                  <div className="w-2 h-2 bg-emerald-600 rounded-full mt-2 flex-shrink-0"></div>
                  <div>
                    <h4 className="font-semibold text-base mb-1">Comunidad de Apoyo</h4>
                    <p className="text-sm text-slate-600">
                      Conecta con otros estudiantes y profesores
                    </p>
                  </div>
                </div>
                <Link href="/signup" className="block mt-6">
                  <Button className="w-full">Comenzar como Estudiante</Button>
                </Link>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-12 sm:py-16 lg:py-20" id="curso">
        <div className="container mx-auto px-4">
          <div className="text-center mb-8 sm:mb-12">
            <div className="inline-block mb-4 px-3 py-1 bg-sky-100 rounded-full text-sm font-medium text-sky-700">
              ✨ Características
            </div>
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-3 sm:mb-4 text-balance leading-tight">
              Curso completo y gratuito
            </h2>
            <p className="text-base sm:text-lg text-slate-600 max-w-2xl mx-auto leading-relaxed">
              Nuestro curso de Introducción a Python incluye todo lo que necesitas para comenzar a programar, sin
              costo alguno.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8 max-w-6xl mx-auto">
            <Card className="text-center p-6 hover:shadow-xl transition-all duration-300 border-2 hover:border-sky-200">
              <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-xl flex items-center justify-center mx-auto mb-4 shadow-lg">
                <Code className="w-7 h-7 text-white" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Sin Instalaciones</h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                Programa Python directamente en tu navegador. Comienza el curso inmediatamente sin configuraciones.
              </p>
            </Card>

            <Card className="text-center p-4 sm:p-6">
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-primary/10 rounded-lg flex items-center justify-center mx-auto mb-3 sm:mb-4">
                <BookOpen className="w-5 h-5 sm:w-6 sm:h-6 text-primary" />
              </div>
              <h3 className="text-lg sm:text-xl font-semibold mb-2">Contenido Estructurado</h3>
              <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
                15 módulos que cubren desde variables y funciones hasta proyectos reales con Python.
              </p>
            </Card>

            <Card className="text-center p-4 sm:p-6 sm:col-span-2 lg:col-span-1">
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-primary/10 rounded-lg flex items-center justify-center mx-auto mb-3 sm:mb-4">
                <Users className="w-5 h-5 sm:w-6 sm:h-6 text-primary" />
              </div>
              <h3 className="text-lg sm:text-xl font-semibold mb-2">Apoyo Gratuito</h3>
              <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
                Acceso a profesores y comunidad de estudiantes para resolver dudas durante todo el curso.
              </p>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 sm:py-20 bg-secondary text-secondary-foreground">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-4 sm:mb-6 text-balance leading-tight">
            Comienza tu curso de Python hoy
          </h2>
          <p className="text-base sm:text-lg mb-6 sm:mb-8 max-w-2xl mx-auto opacity-90 leading-relaxed">
            Únete a miles de estudiantes que ya están aprendiendo programación con nuestro curso gratuito de
            Introducción a Python.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center max-w-md sm:max-w-none mx-auto">
            <Link href="/signup">
              <Button size="lg" className="w-full sm:w-auto bg-primary text-primary-foreground hover:bg-primary/90">
                Inscribirse Gratis al Curso
              </Button>
            </Link>
            <Button
              size="lg"
              variant="outline"
              className="w-full sm:w-auto border-secondary-foreground text-secondary-foreground hover:bg-secondary-foreground hover:text-secondary bg-transparent"
            >
              Ver Temario Completo
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-card border-t border-border py-8 sm:py-12" id="recursos">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 sm:gap-8">
            <div className="col-span-2 md:col-span-1">
              <div className="flex items-center gap-2 sm:gap-3 mb-3 sm:mb-4">
                <div className="relative w-6 h-6 sm:w-7 sm:h-7">
                  <Image
                    src="/logo.png"
                    alt="Aprende Code Logo"
                    fill
                    className="object-contain"
                  />
                </div>
                <span className="text-base sm:text-lg font-bold">Aprende Code</span>
              </div>
              <p className="text-muted-foreground text-xs sm:text-sm leading-relaxed">
                Curso gratuito de Introducción a Python para principiantes.
              </p>
            </div>

            <div>
              <h4 className="font-semibold mb-3 sm:mb-4 text-sm sm:text-base">Curso</h4>
              <ul className="space-y-2 text-xs sm:text-sm text-muted-foreground">
                <li>
                  <a href="#" className="hover:text-foreground transition-colors">
                    Temario
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-foreground transition-colors">
                    Ejercicios
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-foreground transition-colors">
                    Proyectos
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-foreground transition-colors">
                    Certificado
                  </a>
                </li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold mb-3 sm:mb-4 text-sm sm:text-base">Comunidad</h4>
              <ul className="space-y-2 text-xs sm:text-sm text-muted-foreground">
                <li>
                  <a href="#" className="hover:text-foreground transition-colors">
                    Foro
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-foreground transition-colors">
                    Discord
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-foreground transition-colors">
                    Blog
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-foreground transition-colors">
                    Eventos
                  </a>
                </li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold mb-3 sm:mb-4 text-sm sm:text-base">Soporte</h4>
              <ul className="space-y-2 text-xs sm:text-sm text-muted-foreground">
                <li>
                  <a href="#" className="hover:text-foreground transition-colors">
                    Centro de Ayuda
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-foreground transition-colors">
                    Contacto
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-foreground transition-colors">
                    Términos
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-foreground transition-colors">
                    Privacidad
                  </a>
                </li>
              </ul>
            </div>
          </div>

          <div className="border-t border-border mt-6 sm:mt-8 pt-6 sm:pt-8 text-center text-xs sm:text-sm text-muted-foreground">
            <p>&copy; 2025 Aprende Code. Todos los derechos reservados.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}