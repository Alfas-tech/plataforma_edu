import { type NextRequest, NextResponse } from "next/server";
import { updateSession } from "@/src/infrastructure/supabase/middleware";
import { createClient } from "@/src/infrastructure/supabase/server";

export async function middleware(request: NextRequest): Promise<NextResponse> {
  const { pathname } = request.nextUrl;

  // Update session
  const response = await updateSession(request);

  // Create Supabase client to verify authentication
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Public routes that do NOT require authentication
  const publicRoutes: readonly string[] = [
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

  // Protected routes that REQUIRE authentication
  const protectedRoutes: readonly string[] = ["/dashboard", "/profile", "/courses", "/lessons"];

  const isPublicRoute = publicRoutes.some((route) =>
    pathname.startsWith(route)
  );
  const isProtectedRoute = protectedRoutes.some((route) =>
    pathname.startsWith(route)
  );

  // If user is authenticated and tries to access auth routes, redirect to dashboard
  if (user && (pathname === "/login" || pathname === "/signup")) {
    const url = request.nextUrl.clone();
    url.pathname = "/dashboard";
    return NextResponse.redirect(url);
  }

  // If user is NOT authenticated and tries to access a protected route
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
