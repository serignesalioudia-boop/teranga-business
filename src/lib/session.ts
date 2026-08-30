import { cookies } from "next/headers";
import { decode } from "next-auth/jwt";
import { redirect } from "next/navigation";

import { authOptions } from "@/lib/auth";

function mapUser(token: Record<string, unknown>) {
  const id = String(token.sub ?? token.id ?? "");
  if (!id) return null;
  return {
    id,
    email: (token.email as string) ?? "",
    name: (token.name as string) ?? "",
    image: (token.image as string) ?? null,
    role: (token.role as string) ?? "USER",
    isActive: token.isActive !== false,
  };
}

export async function getCurrentUser() {
  const secret = authOptions.secret!;
  const cookieStore = await cookies();
  const tokenValue =
    cookieStore.get("__Secure-next-auth.session-token")?.value ??
    cookieStore.get("next-auth.session-token")?.value;

  if (!tokenValue) return null;

  try {
    const token = await decode({ token: tokenValue, secret });
    if (!token) return null;
    return mapUser(token as unknown as Record<string, unknown>);
  } catch (e) {
    console.error("[session] decode error:", e);
    return null;
  }
}

export async function requireUser() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  return user;
}
