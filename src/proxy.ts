import { getToken } from "next-auth/jwt";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const PUBLIC_PAGES = ["/login", "/register"];

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const token = await getToken({
    req: request,
    secret: process.env.NEXTAUTH_SECRET,
  });

  // Pages publiques (login/register)
  const isPublicPage = PUBLIC_PAGES.includes(pathname);
  if (isPublicPage && token) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  // TOUT le reste nécessite une authentification
  if (!token && !isPublicPage) {
    const url = new URL("/login", request.url);
    url.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(url);
  }

  // Admin role check
  const isAdmin =
    pathname === "/admin" || pathname.startsWith("/admin/");
  if (isAdmin && token && token.role !== "ADMIN") {
    return NextResponse.redirect(new URL("/", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:png|jpg|jpeg|svg|webp|gif|ico)$).*)",
  ],
};
