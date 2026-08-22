"use server";

import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";
import { slugify } from "@/lib/slug";

const applySchema = z.object({
  storeName: z
    .string()
    .min(2, "Le nom de la boutique est requis (2 caractères min).")
    .max(100),
  description: z.string().max(500).optional().default(""),
  whatsapp: z.string().max(20).optional().or(z.literal("")).default(""),
});

export type ApplySellerInput = z.infer<typeof applySchema>;
export type ApplySellerFormState = {
  errors?: Record<string, string[]>;
  success?: boolean;
  message?: string;
  storeSlug?: string;
} | null;

export async function applyAsSeller(
  _prev: ApplySellerFormState,
  formData: FormData,
): Promise<ApplySellerFormState> {
  const user = await requireUser();

  const input = {
    storeName: formData.get("storeName") as string,
    description: formData.get("description") as string,
    whatsapp: formData.get("whatsapp") as string,
  };

  const parsed = applySchema.safeParse(input);
  if (!parsed.success) {
    return { errors: parsed.error.flatten().fieldErrors };
  }

  const data = parsed.data;

  // Already an active seller
  const existing = await prisma.sellerProfile.findUnique({
    where: { userId: user.id },
  });

  if (existing?.status === "ACTIVE") {
    return { errors: { form: ["Vous êtes déjà vendeur actif."] } };
  }

  const slug = slugify(data.storeName);
  const slugConflict = await prisma.store.findUnique({ where: { slug } });
  if (slugConflict) {
    return { errors: { storeName: ["Ce nom de boutique est déjà utilisé."] } };
  }

  if (existing) {
    // Reapply after rejection/suspension → reactivate directly
    const store = await prisma.store.findUnique({
      where: { sellerProfileId: existing.id },
    });

    if (store) {
      await prisma.$transaction([
        prisma.sellerProfile.update({
          where: { id: existing.id },
          data: { status: "ACTIVE", isVerified: true, verificationNote: null },
        }),
        prisma.store.update({
          where: { id: store.id },
          data: {
            name: data.storeName,
            slug,
            description: data.description || null,
            whatsapp: data.whatsapp || null,
          },
        }),
      ]);
    } else {
      await prisma.$transaction([
        prisma.sellerProfile.update({
          where: { id: existing.id },
          data: { status: "ACTIVE", isVerified: true, verificationNote: null },
        }),
        prisma.store.create({
          data: {
            sellerProfileId: existing.id,
            name: data.storeName,
            slug,
            description: data.description || null,
            whatsapp: data.whatsapp || null,
          },
        }),
      ]);
    }

    return { success: true, message: "Votre boutique est de nouveau active !", storeSlug: slug };
  }

  // New seller → ACTIVE immediately
  await prisma.$transaction(async (tx) => {
    const profile = await tx.sellerProfile.create({
      data: {
        userId: user.id,
        status: "ACTIVE",
        isVerified: true,
      },
    });

    await tx.store.create({
      data: {
        sellerProfileId: profile.id,
        name: data.storeName,
        slug,
        description: data.description || null,
        whatsapp: data.whatsapp || null,
      },
    });
  });

  return { success: true, message: "Votre boutique a été créée avec succès !", storeSlug: slug };
}
