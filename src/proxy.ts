import { getToken } from "next-auth/jwt";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const PUBLIC_PATHS = [
  "/login",
  "/register",
  "/shop",
  "/products",
  "/categories",
  "/create-store",
];

function isPublicPath(pathname: string): boolean {
  if (PUBLIC_PATHS.includes(pathname)) return true;
  if (pathname.startsWith("/store/")) return true;
  if (pathname.startsWith("/category/")) return true;
  if (pathname.startsWith("/product/")) return true;
  if (pathname.startsWith("/share/")) return true;
  if (pathname === "/robots.txt" || pathname === "/sitemap.xml") return true;
  return false;
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const token = await getToken({
    req: request,
    secret: process.env.NEXTAUTH_SECRET,
  });

  // Logged-in users on login/register → redirect home
  if (isPublicPath(pathname) && ["/login", "/register"].includes(pathname) && token) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  // Public pages → allow everyone
  if (isPublicPath(pathname)) {
    return NextResponse.next();
  }

  // Everything else requires auth
  if (!token) {
    const url = new URL("/login", request.url);
    url.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(url);
  }

  // Admin role check
  const isAdmin = pathname === "/admin" || pathname.startsWith("/admin/");
  if (isAdmin && token.role !== "ADMIN") {
    return NextResponse.redirect(new URL("/", request.url));
  }

  // Seller role check
  const isSeller = pathname === "/seller" || pathname.startsWith("/seller/");
  if (isSeller && token.role !== ("SELLER" as string) && token.role !== ("ADMIN" as string)) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico|manifest.json|.*\\.(?:png|jpg|jpeg|svg|webp|gif|ico)$).*)",
  ],
};
