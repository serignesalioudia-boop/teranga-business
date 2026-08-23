import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { jwtVerify } from "jose";

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

async function getSessionToken(request: NextRequest): Promise<Record<string, unknown> | null> {
  const secret = process.env.NEXTAUTH_SECRET;
  if (!secret) return null;

  // Try __Secure- cookie first (production), then fallback
  const cookie =
    request.cookies.get("__Secure-next-auth.session-token")?.value ||
    request.cookies.get("next-auth.session-token")?.value;

  if (!cookie) return null;

  try {
    const key = new TextEncoder().encode(secret);
    const { payload } = await jwtVerify(cookie, key, { algorithms: ["HS256"] });
    return payload as Record<string, unknown>;
  } catch {
    return null;
  }
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const token = await getSessionToken(request);

  // Logged-in users on login/register → redirect home
  if (["/login", "/register"].includes(pathname) && token) {
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
  if (isSeller && token.role !== "SELLER" && token.role !== "ADMIN") {
    return NextResponse.redirect(new URL("/", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico|manifest.json|.*\\.(?:png|jpg|jpeg|svg|webp|gif|ico)$).*)",
  ],
};
