import { decode } from "next-auth/jwt";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const PUBLIC_PATHS = [
  "/",
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

async function getToken(request: NextRequest) {
  const secret = process.env.NEXTAUTH_SECRET;
  if (!secret) return null;

  const candidates = [
    "__Secure-next-auth.session-token",
    "next-auth.session-token",
  ];

  for (const name of candidates) {
    const value = request.cookies.get(name)?.value;
    if (!value) continue;
    try {
      const decoded = await decode({ token: value, secret });
      return decoded;
    } catch {
      continue;
    }
  }
  return null;
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const token = await getToken(request);

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

  // Authenticated users may proceed. Role/status-specific access is enforced
  // by the corresponding layouts: /admin checks user.role === ADMIN, and
  // /seller checks sellerProfile.status === ACTIVE.
  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico|manifest.json|sw\\.js|.*\\.(?:png|jpg|jpeg|svg|webp|gif|ico)$).*)",
  ],
};
