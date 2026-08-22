"use server";

import { z } from "zod";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/session";
import { revalidatePath } from "next/cache";

const profileSchema = z.object({
  name: z.string().min(2, "Le nom doit contenir au moins 2 caractères."),
  email: z.email("Adresse e-mail invalide.").trim().toLowerCase(),
  phone: z.string().optional().nullable(),
});

export async function updateProfile(input: { name: string; email: string; phone?: string }) {
  const user = await getCurrentUser();
  if (!user) throw new Error("Connexion requise.");

  const data = profileSchema.parse(input);

  const existing = await prisma.user.findUnique({
    where: { email: data.email },
    select: { id: true },
  });
  if (existing && existing.id !== user.id) {
    throw new Error("Cet e-mail est déjà utilisé.");
  }

  await prisma.user.update({
    where: { id: user.id },
    data: {
      name: data.name,
      email: data.email,
      phone: data.phone || null,
    },
  });

  revalidatePath("/account/profile");
  revalidatePath("/account");
  return { success: true };
}

const passwordSchema = z.object({
  currentPassword: z.string().min(1, "Mot de passe actuel requis."),
  newPassword: z.string().min(8, "Le nouveau mot de passe doit contenir au moins 8 caractères."),
});

export async function changePassword(input: { currentPassword: string; newPassword: string }) {
  const user = await getCurrentUser();
  if (!user) throw new Error("Connexion requise.");

  const data = passwordSchema.parse(input);

  const fullUser = await prisma.user.findUnique({
    where: { id: user.id },
    select: { passwordHash: true },
  });

  if (!fullUser?.passwordHash) {
    throw new Error("Aucun mot de passe configuré. Utilisez la réinitialisation par e-mail.");
  }

  const valid = await bcrypt.compare(data.currentPassword, fullUser.passwordHash);
  if (!valid) {
    throw new Error("Le mot de passe actuel est incorrect.");
  }

  const newHash = await bcrypt.hash(data.newPassword, 12);
  await prisma.user.update({
    where: { id: user.id },
    data: { passwordHash: newHash },
  });

  return { success: true };
}
