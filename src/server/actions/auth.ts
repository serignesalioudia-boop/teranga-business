"use server";

import bcrypt from "bcryptjs";
import { redirect } from "next/navigation";
import { z } from "zod";

import { Role } from "@/generated/prisma/enums";
import { prisma } from "@/lib/prisma";
import { checkRateLimit } from "@/lib/rate-limit";

const registerSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, { error: "Le nom doit contenir au moins 2 caractères." })
    .max(80, { error: "Le nom est trop long." }),
  email: z.email({ error: "Adresse e-mail invalide." }).trim().toLowerCase(),
  password: z
    .string()
    .min(8, { error: "Le mot de passe doit contenir au moins 8 caractères." })
    .max(128, { error: "Le mot de passe est trop long." }),
});

export type RegisterFormState =
  | {
      errors?: {
        name?: string[];
        email?: string[];
        password?: string[];
        form?: string[];
      };
    }
  | undefined;

export async function register(
  _prevState: RegisterFormState,
  formData: FormData,
): Promise<RegisterFormState> {
  const rl = checkRateLimit("register", 5, 60_000);
  if (!rl.allowed) {
    return { errors: { form: ["Trop de tentatives. Réessayez dans 1 minute."] } };
  }

  const parsed = registerSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!parsed.success) {
    return { errors: parsed.error.flatten().fieldErrors };
  }

  const { name, email, password } = parsed.data;

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return {
      errors: { email: ["Un compte existe déjà avec cette adresse e-mail."] },
    };
  }

  const passwordHash = await bcrypt.hash(password, 12);

  try {
    await prisma.user.create({
      data: { name, email, passwordHash, role: Role.USER },
    });
  } catch (error) {
    if ((error as { code?: string }).code === "P2002") {
      return {
        errors: { email: ["Un compte existe déjà avec cette adresse e-mail."] },
      };
    }
    return {
      errors: { form: ["Une erreur est survenue. Veuillez réessayer."] },
    };
  }

  // Email de bienvenue (fire-and-forget)
  const { sendEmail, welcomeEmail: welcomeEmailTpl } = await import("@/lib/email");
  const welcome = welcomeEmailTpl(name);
  sendEmail({ to: email, subject: welcome.subject, html: welcome.html }).catch(() => {});

  redirect(`/login?registered=1&email=${encodeURIComponent(email)}`);
}
