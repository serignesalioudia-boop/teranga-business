"use server";

import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/session";

const addressSchema = z.object({
  label: z.string().min(1, "Label requis."),
  fullName: z.string().min(1, "Nom complet requis."),
  phone: z.string().min(8, "Numéro de téléphone invalide."),
  country: z.string().default("SN"),
  region: z.string().min(1, "Région requise."),
  city: z.string().min(1, "Ville requise."),
  addressLine: z.string().min(1, "Adresse requise."),
  isDefault: z.boolean().default(false),
});

export type AddressInput = z.infer<typeof addressSchema>;

// ─── Lister les adresses de l'utilisateur ────────────────

export async function getUserAddresses() {
  const user = await getCurrentUser();
  if (!user) throw new Error("Non autorisé.");

  return prisma.address.findMany({
    where: { userId: user.id },
    orderBy: [{ isDefault: "desc" }, { createdAt: "desc" }],
  });
}

// ─── Récupérer une adresse par ID ────────────────────────

export async function getAddressById(id: string) {
  const user = await getCurrentUser();
  if (!user) throw new Error("Non autorisé.");

  const address = await prisma.address.findUnique({ where: { id } });
  if (!address || address.userId !== user.id) throw new Error("Adresse introuvable.");
  return address;
}

// ─── Créer une adresse ───────────────────────────────────

export async function createAddress(input: AddressInput) {
  const user = await getCurrentUser();
  if (!user) throw new Error("Non autorisé.");

  const data = addressSchema.parse(input);

  // Si c'est la première adresse ou isDefault, réinitialiser les autres
  if (data.isDefault) {
    await prisma.address.updateMany({
      where: { userId: user.id, isDefault: true },
      data: { isDefault: false },
    });
  }

  return prisma.address.create({
    data: { userId: user.id, ...data },
  });
}

// ─── Mettre à jour une adresse ───────────────────────────

export async function updateAddress(id: string, input: AddressInput) {
  const user = await getCurrentUser();
  if (!user) throw new Error("Non autorisé.");

  const existing = await prisma.address.findUnique({ where: { id } });
  if (!existing || existing.userId !== user.id) throw new Error("Adresse introuvable.");

  const data = addressSchema.parse(input);

  if (data.isDefault) {
    await prisma.address.updateMany({
      where: { userId: user.id, isDefault: true, id: { not: id } },
      data: { isDefault: false },
    });
  }

  return prisma.address.update({ where: { id }, data });
}

// ─── Supprimer une adresse ───────────────────────────────

export async function deleteAddress(id: string) {
  const user = await getCurrentUser();
  if (!user) throw new Error("Non autorisé.");

  const existing = await prisma.address.findUnique({ where: { id } });
  if (!existing || existing.userId !== user.id) throw new Error("Adresse introuvable.");

  await prisma.address.delete({ where: { id } });
}

// ─── Définir comme adresse par défaut ────────────────────

export async function setDefaultAddress(id: string) {
  const user = await getCurrentUser();
  if (!user) throw new Error("Non autorisé.");

  const existing = await prisma.address.findUnique({ where: { id } });
  if (!existing || existing.userId !== user.id) throw new Error("Adresse introuvable.");

  await prisma.address.updateMany({
    where: { userId: user.id, isDefault: true },
    data: { isDefault: false },
  });

  return prisma.address.update({
    where: { id },
    data: { isDefault: true },
  });
}
