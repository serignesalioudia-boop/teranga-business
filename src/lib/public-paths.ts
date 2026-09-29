export const PUBLIC_PATHS = [
  "/",
  "/login",
  "/register",
  "/shop",
  "/products",
  "/categories",
  "/create-store",
];

const PUBLIC_PREFIXES = ["/store/", "/category/", "/product/", "/share/"];

const PUBLIC_FILES = ["/robots.txt", "/sitemap.xml"];

export function isPublicPath(pathname: string): boolean {
  if (PUBLIC_PATHS.includes(pathname)) return true;
  if (PUBLIC_PREFIXES.some((prefix) => pathname.startsWith(prefix))) return true;
  if (PUBLIC_FILES.includes(pathname)) return true;
  return false;
}
