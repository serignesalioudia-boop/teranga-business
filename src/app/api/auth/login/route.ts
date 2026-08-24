import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { authOptions } from "@/lib/auth";
import { checkRateLimit } from "@/lib/rate-limit";
import bcrypt from "bcryptjs";
import { encode } from "next-auth/jwt";

type AuthError = { ok: false; error: string };
type AuthOk = { ok: true; token: string };
type AuthResult = AuthError | AuthOk;

async function authenticate(email: string, password: string): Promise<AuthResult> {
  if (!email || !password) {
    return { ok: false, error: "Email et mot de passe requis." };
  }

  const rl = checkRateLimit(`login:${email.trim().toLowerCase()}`, 5, 60_000);
  if (!rl.allowed) {
    return { ok: false, error: "Trop de tentatives. Réessayez dans 1 minute." };
  }

  const user = await prisma.user.findUnique({
    where: { email: email.trim().toLowerCase() },
  });

  if (!user || !user.passwordHash || !user.isActive) {
    return { ok: false, error: "E-mail ou mot de passe incorrect." };
  }

  let valid = false;
  try {
    valid = await bcrypt.compare(password, user.passwordHash);
  } catch (e) {
    console.error("[loginAPI] bcrypt error:", e);
    return { ok: false, error: "Erreur interne." };
  }

  if (!valid) {
    return { ok: false, error: "E-mail ou mot de passe incorrect." };
  }

  const token = await encode({
    token: {
      sub: user.id,
      id: user.id,
      email: user.email,
      name: user.name,
      image: user.image,
      role: user.role,
      isActive: user.isActive,
    },
    secret: authOptions.secret!,
    maxAge: 7 * 24 * 60 * 60,
  });

  return { ok: true, token };
}

function setCookies(response: NextResponse, token: string) {
  const isProd = process.env.NODE_ENV === "production";

  response.cookies.set("next-auth.session-token", token, {
    httpOnly: true,
    secure: isProd,
    sameSite: "lax",
    path: "/",
    maxAge: 7 * 24 * 60 * 60,
  });

  response.cookies.set("__Secure-next-auth.session-token", token, {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    path: "/",
    maxAge: 7 * 24 * 60 * 60,
  });

  return response;
}

function safeRedirect(callbackUrl: string | null) {
  const url =
    callbackUrl &&
    callbackUrl.startsWith("/") &&
    !callbackUrl.startsWith("//")
      ? callbackUrl
      : "/";
  return url;
}

export async function POST(request: Request) {
  try {
    const contentType = request.headers.get("content-type") || "";

    let email: string;
    let password: string;
    let callbackUrl: string | null = null;

    if (contentType.includes("application/json")) {
      const body = await request.json();
      email = body.email;
      password = body.password;
      callbackUrl = body.callbackUrl ?? null;
    } else {
      const formData = await request.formData();
      email = String(formData.get("email") ?? "");
      password = String(formData.get("password") ?? "");
      callbackUrl = String(formData.get("callbackUrl") ?? null);
    }

    const result = await authenticate(email, password);

    if (!result.ok) {
      if (contentType.includes("application/json")) {
        return NextResponse.json({ error: result.error }, { status: 401 });
      }
      const loginUrl = new URL("/login", request.url);
      loginUrl.searchParams.set("error", result.error);
      return NextResponse.redirect(loginUrl, 303);
    }

    const redirectUrl = safeRedirect(callbackUrl);

    if (contentType.includes("application/json")) {
      const response = NextResponse.json({ ok: true, redirect: redirectUrl });
      return setCookies(response, result.token);
    }

    const response = NextResponse.redirect(new URL(redirectUrl, request.url), 303);
    return setCookies(response, result.token);
  } catch (err: unknown) {
    console.error("[loginAPI] Error:", err);
    const msg = err instanceof Error ? err.message : String(err);
    if (msg.includes("ENETUNREACH") || msg.includes("ECONNREFUSED") || msg.includes("timeout")) {
      return NextResponse.json({ error: "Impossible de se connecter au serveur." }, { status: 503 });
    }
    return NextResponse.json({ error: "Erreur de connexion." }, { status: 500 });
  }
}
