"use server";

import { prisma } from "@/lib/prisma";
import { authOptions } from "@/lib/auth";
import { checkRateLimit } from "@/lib/rate-limit";
import bcrypt from "bcryptjs";
import { encode } from "next-auth/jwt";
import { cookies } from "next/headers";

export async function loginAction(email: string, password: string) {
  if (!email || !password) {
    return { error: "Email et mot de passe requis." };
  }

  const rl = checkRateLimit(`login:${email.trim().toLowerCase()}`, 5, 60_000);
  if (!rl.allowed) {
    return { error: "Trop de tentatives. Réessayez dans 1 minute." };
  }

  try {
    const user = await prisma.user.findUnique({
      where: { email: email.trim().toLowerCase() },
    });

    if (!user || !user.passwordHash || !user.isActive) {
      return { error: "E-mail ou mot de passe incorrect." };
    }

    let valid = false;
    try {
      valid = await bcrypt.compare(password, user.passwordHash);
    } catch (e) {
      console.error("[loginAction] bcrypt error:", e);
      return { error: "Erreur interne. Veuillez réessayer." };
    }
    if (!valid) {
      return { error: "E-mail ou mot de passe incorrect." };
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
    const cookieStore = await cookies();

    // Match NextAuth v4 cookie strategy: only __Secure- in production (https),
    // only plain in development. Setting both desynced NextAuth's
    // /api/auth/session from the server-side session readers and could cause
    // spurious disconnections.
    if (isProd) {
      cookieStore.set("__Secure-next-auth.session-token", token, {
        httpOnly: true,
        secure: true,
        sameSite: "lax",
        path: "/",
        maxAge: 7 * 24 * 60 * 60,
      });
    } else {
      cookieStore.set("next-auth.session-token", token, {
        httpOnly: true,
        secure: false,
        sameSite: "lax",
        path: "/",
        maxAge: 7 * 24 * 60 * 60,
      });
    }

    return { ok: true };
  } catch (err: unknown) {
    console.error("[loginAction] Error:", err);
    const msg = err instanceof Error ? err.message : String(err);
    if (msg.includes("ENETUNREACH") || msg.includes("ECONNREFUSED") || msg.includes("timeout")) {
      return { error: "Impossible de se connecter au serveur. Réessayez dans quelques instants." };
    }
    return { error: "Erreur de connexion. Veuillez réessayer." };
  }
}
