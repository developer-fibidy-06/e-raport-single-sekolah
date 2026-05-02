import { type NextRequest, NextResponse } from "next/server";
import { updateSession } from "@/lib/supabase/proxy";

const publicRoutes = ["/login", "/api/auth/callback"];
const adminRoutes = ["/admin"];

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Allow public routes
  if (publicRoutes.some((route) => pathname.startsWith(route))) {
    const { supabaseResponse } = await updateSession(request);
    return supabaseResponse;
  }

  // Check authentication
  const { supabaseResponse, user } = await updateSession(request);

  // Redirect to login if not authenticated
  if (!user) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("redirect", pathname);
    return NextResponse.redirect(loginUrl);
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};