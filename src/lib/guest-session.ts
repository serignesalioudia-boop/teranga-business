import { cookies } from "next/headers";
import { randomUUID } from "node:crypto";

const COOKIE_NAME = "tb_cart_session";
const MAX_AGE = 60 * 60 * 24 * 90; // 90 jours

// Lecture seule — sûr pour les Server Components (header, layout)
export async function readCartSessionId(): Promise<string | null> {
  const store = await cookies();
  return store.get(COOKIE_NAME)?.value ?? null;
}

// Lecture + création — uniquement pour les Server Actions (mutations)
export async function getCartSessionId(): Promise<string> {
  const store = await cookies();
  let sid = store.get(COOKIE_NAME)?.value;
  if (!sid) {
    sid = randomUUID();
    store.set(COOKIE_NAME, sid, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: MAX_AGE,
    });
  }
  return sid;
}

export async function clearCartSessionId(): Promise<void> {
  const store = await cookies();
  store.delete(COOKIE_NAME);
}
