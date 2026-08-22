"use server";

import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/session";
import { slugify } from "@/lib/slug";
import { revalidatePath } from "next/cache";

const storeSettingsSchema = z.object({
  name: z.string().min(2, "Le nom doit contenir au moins 2 caractères."),
  description: z.string().optional().nullable(),
  whatsapp: z.string().optional().nullable(),
  logoUrl: z.string().optional().nullable(),
  bannerUrl: z.string().optional().nullable(),
  qrCodeUrl: z.string().optional().nullable(),
  qrWaveUrl: z.string().optional().nullable(),
  qrOrangeMoneyUrl: z.string().optional().nullable(),
  returnPolicy: z.string().optional().nullable(),
  shippingPolicy: z.string().optional().nullable(),
  theme: z.enum(["BANNER", "SIDEBAR", "EDITORIAL", "GALLERY", "SHOWCASE", "MOSAIC"]).optional(),
  storeTheme: z
    .object({
      primaryColor: z.string().optional(),
      secondaryColor: z.string().optional(),
      backgroundColor: z.string().optional(),
      cardColor: z.string().optional(),
      textColor: z.string().optional(),
      fontFamily: z.string().optional(),
      borderRadius: z.string().optional(),
    })
    .optional()
    .nullable(),
});

export type StoreSettingsInput = z.infer<typeof storeSettingsSchema>;

export async function getSellerStore() {
  const user = await getCurrentUser();
  if (!user) throw new Error("Connexion requise.");

  const profile = await prisma.sellerProfile.findUnique({
    where: { userId: user.id },
    include: { store: true },
  });

  if (!profile?.store) throw new Error("Aucune boutique associée.");

  const store = profile.store;
  return {
    ...store,
    ratingAvg: Number(store.ratingAvg),
  };
}

export async function updateSellerStore(input: StoreSettingsInput) {
  const user = await getCurrentUser();
  if (!user) throw new Error("Connexion requise.");

  const profile = await prisma.sellerProfile.findUnique({
    where: { userId: user.id },
    include: { store: { select: { id: true, slug: true } } },
  });

  if (!profile?.store) throw new Error("Aucune boutique associée.");

  const data = storeSettingsSchema.parse(input);

  let slug = profile.store.slug;
  if (data.name.trim() !== "" && slugify(data.name) !== profile.store.slug) {
    const newSlug = slugify(data.name);
    const existing = await prisma.store.findUnique({ where: { slug: newSlug } });
    if (existing && existing.id !== profile.store.id) {
      throw new Error("Ce nom de boutique est déjà pris.");
    }
    slug = newSlug;
  }

  const clean = (v: string | null | undefined) => (v && v.trim() !== "" ? v.trim() : null);

  await prisma.store.update({
    where: { id: profile.store.id },
    data: {
      name: data.name,
      slug,
      description: clean(data.description),
      whatsapp: clean(data.whatsapp),
      logoUrl: clean(data.logoUrl),
      bannerUrl: clean(data.bannerUrl),
      qrCodeUrl: clean(data.qrCodeUrl),
      qrWaveUrl: clean(data.qrWaveUrl),
      qrOrangeMoneyUrl: clean(data.qrOrangeMoneyUrl),
      returnPolicy: clean(data.returnPolicy),
      shippingPolicy: clean(data.shippingPolicy),
      theme: data.theme ?? undefined,
      storeTheme: data.storeTheme ?? undefined,
    },
  });

  revalidatePath("/seller/settings");
  revalidatePath("/seller");
  revalidatePath(`/store/${profile.store.slug}`);
  return { success: true };
}
