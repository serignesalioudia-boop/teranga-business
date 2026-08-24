import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { authOptions } from "@/lib/auth";
import { checkRateLimit } from "@/lib/rate-limit";
import bcrypt from "bcryptjs";
import { encode } from "next-auth/jwt";

export async function POST(request: Request) {
  try {
    const { email, password, callbackUrl } = await request.json();

    if (!email || !password) {
      return NextResponse.json({ error: "Email et mot de passe requis." }, { status: 400 });
    }

    const rl = checkRateLimit(`login:${email.trim().toLowerCase()}`, 5, 60_000);
    if (!rl.allowed) {
      return NextResponse.json({ error: "Trop de tentatives. Réessayez dans 1 minute." }, { status: 429 });
    }

    const user = await prisma.user.findUnique({
      where: { email: email.trim().toLowerCase() },
    });

    if (!user || !user.passwordHash || !user.isActive) {
      return NextResponse.json({ error: "E-mail ou mot de passe incorrect." }, { status: 401 });
    }

    let valid = false;
    try {
      valid = await bcrypt.compare(password, user.passwordHash);
    } catch (e) {
      console.error("[loginAPI] bcrypt error:", e);
      return NextResponse.json({ error: "Erreur interne." }, { status: 500 });
    }

    if (!valid) {
      return NextResponse.json({ error: "E-mail ou mot de passe incorrect." }, { status: 401 });
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

    const isProd = process.env.NODE_ENV === "production";
    const safeUrl =
      callbackUrl &&
      callbackUrl.startsWith("/") &&
      !callbackUrl.startsWith("//")
        ? callbackUrl
        : "/";

    const response = NextResponse.json({ ok: true, redirect: safeUrl });

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
  } catch (err: unknown) {
    console.error("[loginAPI] Error:", err);
    const msg = err instanceof Error ? err.message : String(err);
    if (msg.includes("ENETUNREACH") || msg.includes("ECONNREFUSED") || msg.includes("timeout")) {
      return NextResponse.json({ error: "Impossible de se connecter au serveur." }, { status: 503 });
    }
    return NextResponse.json({ error: "Erreur de connexion." }, { status: 500 });
  }
}
