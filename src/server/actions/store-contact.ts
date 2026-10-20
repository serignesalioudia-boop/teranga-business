"use server";

import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/session";
import { revalidatePath } from "next/cache";
import { SOCIAL_PLATFORMS, type SocialPlatform } from "@/lib/social-platforms";

// Coordonnees, reseaux sociaux et frais de livraison propres a une boutique.
// Ces donnees n'ont rien a voir avec la table Setting (reglages globaux de la
// plateforme dans /admin/settings) : elles appartiennent au vendeur et
// s'affichent sur son mini-site /store/[slug].

/**
 * Charge la boutique que l'utilisateur a le droit de modifier : la sienne, ou
 * n'importe laquelle si l'utilisateur est administrateur.
 */
async function resolveEditableStore(storeId?: string) {
  const user = await getCurrentUser();
  if (!user) throw new Error("Connexion requise.");

  if (storeId) {
    const store = await prisma.store.findUnique({ where: { id: storeId } });
    if (!store) throw new Error("Boutique introuvable.");
    if (user.role !== "ADMIN") {
      const owned = await prisma.sellerProfile.findUnique({
        where: { userId: user.id },
        select: { store: { select: { id: true } } },
      });
      if (owned?.store?.id !== store.id) throw new Error("Vous ne pouvez modifier que votre boutique.");
    }
    return { store, slug: store.slug };
  }

  const profile = await prisma.sellerProfile.findUnique({
    where: { userId: user.id },
    include: { store: { include: { socialLinks: true, deliveryRules: true } } },
  });
  if (!profile?.store) throw new Error("Aucune boutique associée.");
  return { store: profile.store, slug: profile.store.slug };
}

function revalidateStore(slug: string) {
  revalidatePath(`/store/${slug}`);
  revalidatePath("/shop");
  revalidatePath("/seller/settings");
  revalidatePath("/seller");
}

export async function getStoreContactSettings(storeId?: string) {
  const { store, slug } = await resolveEditableStore(storeId);

  const socialLinks = await prisma.socialLink.findMany({ where: { storeId: store.id } });
  const deliveryRules = await prisma.deliveryRule.findMany({
    where: { storeId: store.id },
    orderBy: { priority: "asc" },
  });

  const socials: Record<SocialPlatform, string> = {
    facebook: "",
    instagram: "",
    twitter: "",
    tiktok: "",
  };
  for (const link of socialLinks) {
    const p = link.platform.toLowerCase() as SocialPlatform;
    if (p in socials) socials[p] = link.url;
  }

  return {
    slug,
    contactEmail: store.contactEmail ?? "",
    contactPhone: store.contactPhone ?? "",
    whatsapp: store.whatsapp ?? "",
    qrWaveUrl: store.qrWaveUrl ?? "",
    qrOrangeMoneyUrl: store.qrOrangeMoneyUrl ?? "",
    shippingPolicy: store.shippingPolicy ?? "",
    socials,
    deliveryRules: deliveryRules.map((r) => ({
      id: r.id,
      zone: r.zone ?? "",
      method: r.method,
      fee: r.fee.toString(),
      freeAbove: r.freeAbove === null ? "" : r.freeAbove.toString(),
      isActive: r.isActive,
    })),
  };
}

const contactSchema = z.object({
  contactEmail: z.email("E-mail invalide.").or(z.literal("")).nullable(),
  contactPhone: z.string().max(40).nullable(),
  whatsapp: z.string().max(40).nullable(),
});

export async function updateStoreContact(input: z.infer<typeof contactSchema>, storeId?: string) {
  const { store, slug } = await resolveEditableStore(storeId);
  const data = contactSchema.parse(input);

  await prisma.store.update({
    where: { id: store.id },
    data: {
      contactEmail: data.contactEmail ? data.contactEmail : null,
      contactPhone: data.contactPhone?.trim() ? data.contactPhone.trim() : null,
      whatsapp: data.whatsapp?.trim() ? data.whatsapp.trim() : null,
    },
  });

  revalidateStore(slug);
  return { success: true };
}

const socialsSchema = z.object({
  facebook: z.url("URL Facebook invalide.").or(z.literal("")).nullable(),
  instagram: z.url("URL Instagram invalide.").or(z.literal("")).nullable(),
  twitter: z.url("URL X invalide.").or(z.literal("")).nullable(),
  tiktok: z.url("URL TikTok invalide.").or(z.literal("")).nullable(),
});

export async function updateStoreSocials(input: z.infer<typeof socialsSchema>, storeId?: string) {
  const { store, slug } = await resolveEditableStore(storeId);
  const data = socialsSchema.parse(input);

  for (const platform of SOCIAL_PLATFORMS) {
    const raw = data[platform];
    const url = typeof raw === "string" ? raw.trim() : "";
    if (url === "") {
      await prisma.socialLink.deleteMany({ where: { storeId: store.id, platform } });
    } else {
      await prisma.socialLink.upsert({
        where: { storeId_platform: { storeId: store.id, platform } },
        create: { storeId: store.id, platform, url },
        update: { url },
      });
    }
  }

  revalidateStore(slug);
  return { success: true };
}

const deliveryRuleSchema = z.object({
  zone: z.string().max(80),
  method: z.enum(["STANDARD", "EXPRESS", "PICKUP"]),
  fee: z.coerce.number().min(0).max(10_000_000),
  freeAbove: z.union([z.coerce.number().min(0).max(100_000_000), z.literal(""), z.null()]),
  isActive: z.boolean(),
});

const deliverySchema = z.object({ rules: z.array(deliveryRuleSchema).max(20) });

export async function updateStoreDeliveryRules(input: z.infer<typeof deliverySchema>, storeId?: string) {
  const { store, slug } = await resolveEditableStore(storeId);
  const { rules } = deliverySchema.parse(input);

  await prisma.$transaction(async (tx) => {
    const keep: string[] = [];
    for (const [index, rule] of rules.entries()) {
      const zone = rule.zone.trim();
      if (zone === "" && rule.fee === 0) continue;

      const freeAbove =
        rule.freeAbove === "" || rule.freeAbove === null
          ? null
          : BigInt(Math.trunc(rule.freeAbove));

      const row = await tx.deliveryRule.create({
        data: {
          storeId: store.id,
          scope: "VENDOR",
          method: rule.method,
          zone: zone || "Toutes zones",
          fee: BigInt(Math.trunc(rule.fee)),
          freeAbove,
          isActive: rule.isActive,
          priority: index,
        },
      });
      keep.push(row.id);
    }
    // Les lignes remplacees sont recreees : on supprime celles qui n'ont pas
    // ete reinscrites pour ne pas accumuler de doublons a chaque sauvegarde.
    await tx.deliveryRule.deleteMany({
      where: { storeId: store.id, id: { notIn: keep.length ? keep : [""] } },
    });
  });

  revalidateStore(slug);
  return { success: true };
}