export type RateLimitResult = { allowed: boolean; remaining: number };

/**
 * IP réelle du visiteur. Vercel place l'IP dans x-forwarded-for (et
 * x-real-ip en secours).
 */
export function extractIp(headers: Headers): string {
  const forwarded = headers.get("x-forwarded-for");
  if (forwarded) {
    const first = forwarded.split(",")[0]?.trim();
    if (first) return first;
  }
  return headers.get("x-real-ip") ?? headers.get("cf-connecting-ip") ?? "unknown";
}

// Repli en mémoire : sert uniquement si la base est injoignable, pour ne pas
// ouvrir la porte à un bruteforce parce que la base est tombée.
const fallback = new Map<string, { count: number; resetAt: number }>();

function checkInMemory(
  key: string,
  maxRequests: number,
  windowMs: number,
): RateLimitResult {
  const now = Date.now();
  const entry = fallback.get(key);

  if (!entry || now > entry.resetAt) {
    fallback.set(key, { count: 1, resetAt: now + windowMs });
    return { allowed: true, remaining: maxRequests - 1 };
  }

  if (entry.count >= maxRequests) return { allowed: false, remaining: 0 };

  entry.count += 1;
  return { allowed: true, remaining: Math.max(0, maxRequests - entry.count) };
}

/**
 * Limiteur de débit persisté en base.
 *
 * Sur Vercel (serverless) un compteur en mémoire ne protège de rien : chaque
 * instance a la sienne et un cold start la réinitialise. Le compteur vit donc
 * en base, ce qui le rend réellement partagé entre toutes les instances.
 */
export async function checkRateLimit(
  key: string,
  maxRequests: number = 10,
  windowMs: number = 60_000,
): Promise<RateLimitResult> {
  const now = new Date();

  try {
    // Import paresseux : ce module reste utilisable hors application (tests,
    // scripts) sans charger le client Prisma ESM au chargement du module.
    const { prisma } = await import("@/lib/prisma");
    // Purge opportuniste des fenêtres expirées (évite la croissance de la table).
    await prisma.rateLimit.deleteMany({
      where: { resetAt: { lt: new Date(now.getTime() - windowMs) } },
    });

    const existing = await prisma.rateLimit.findUnique({ where: { key } });

    if (!existing || existing.resetAt <= now) {
      await prisma.rateLimit.upsert({
        where: { key },
        create: { key, count: 1, resetAt: new Date(now.getTime() + windowMs) },
        update: { count: 1, resetAt: new Date(now.getTime() + windowMs) },
      });
      return { allowed: true, remaining: maxRequests - 1 };
    }

    if (existing.count >= maxRequests) {
      return { allowed: false, remaining: 0 };
    }

    const updated = await prisma.rateLimit.update({
      where: { key },
      data: { count: { increment: 1 } },
      select: { count: true },
    });

    return {
      allowed: true,
      remaining: Math.max(0, maxRequests - updated.count),
    };
  } catch (error) {
    console.error("[rate-limit] repli en mémoire:", error);
    return checkInMemory(key, maxRequests, windowMs);
  }
}
