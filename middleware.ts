import { type NextRequest, NextResponse } from "next/server";
import { updateSession } from "@/src/infrastructure/supabase/middleware";
import { createClient } from "@/src/infrastructure/supabase/server";

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Actualizar la sesión
  const response = await updateSession(request);

  // Crear cliente de Supabase para verificar autenticación
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Rutas públicas que NO requieren autenticación
  const publicRoutes = [
    "/",
    "/login",
    "/signup",
    "/forgot-password",
    "/auth/confirm",
    "/auth/update-password",
    "/error",
    "/logout",
    "/signup/check-email",
    "/signup/success",
  ];

  // Rutas protegidas que REQUIEREN autenticación
  const protectedRoutes = ["/dashboard", "/profile", "/courses", "/lessons"];

  const isPublicRoute = publicRoutes.some((route) =>
    pathname.startsWith(route)
  );
  const isProtectedRoute = protectedRoutes.some((route) =>
    pathname.startsWith(route)
  );

  // Si el usuario está autenticado y trata de acceder a rutas de auth, redirigir al dashboard
  if (user && (pathname === "/login" || pathname === "/signup")) {
    const url = request.nextUrl.clone();
    url.pathname = "/dashboard";
    return NextResponse.redirect(url);
  }

  // Si el usuario NO está autenticado y trata de acceder a una ruta protegida
  if (!user && isProtectedRoute) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("redirect", pathname);
    return NextResponse.redirect(url);
  }

  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
