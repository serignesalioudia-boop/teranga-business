"use server";

import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/session";
import { revalidatePath } from "next/cache";

const platformSettingsSchema = z.object({
  site_name: z.string().min(1, "Le nom du site est requis."),
  site_description: z.string().optional().nullable(),
  contact_email: z.email("E-mail invalide.").optional().nullable(),
  contact_phone: z.string().optional().nullable(),
  social_facebook: z.string().url("URL invalide.").optional().nullable(),
  social_instagram: z.string().url("URL invalide.").optional().nullable(),
  social_twitter: z.string().url("URL invalide.").optional().nullable(),
  social_tiktok: z.string().url("URL invalide.").optional().nullable(),
  maintenance_mode: z.boolean().default(false),
  default_delivery_fee: z.number().min(0).default(500),
  default_commission_rate: z.number().min(0).max(100).default(10),
});

export type PlatformSettingsInput = z.infer<typeof platformSettingsSchema>;

const DEFAULT_SETTINGS: Record<string, string | number | boolean> = {
  site_name: "Teranga Business",
  site_description: "La marketplace du Sénégal",
  contact_email: "",
  contact_phone: "",
  social_facebook: "",
  social_instagram: "",
  social_twitter: "",
  social_tiktok: "",
  maintenance_mode: false,
  default_delivery_fee: 500,
  default_commission_rate: 10,
};

export async function getPlatformSettings() {
  const user = await getCurrentUser();
  if (!user || user.role !== "ADMIN") throw new Error("Accès réservé aux administrateurs.");

  const settings = await prisma.setting.findMany();
  const map: Record<string, string | number | boolean> = {};

  for (const s of settings) {
    map[s.key] = s.value as string | number | boolean;
  }

  return { ...DEFAULT_SETTINGS, ...map };
}

export async function updatePlatformSettings(input: Partial<PlatformSettingsInput>) {
  const user = await getCurrentUser();
  if (!user || user.role !== "ADMIN") throw new Error("Accès réservé aux administrateurs.");

  for (const [key, value] of Object.entries(input)) {
    if (value === undefined) continue;

    await prisma.setting.upsert({
      where: { key },
      create: { key, value: value as unknown as object },
      update: { value: value as unknown as object },
    });
  }

  revalidatePath("/admin/settings");
  revalidatePath("/");
  return { success: true };
}

export async function getPublicSettings() {
  const settings = await prisma.setting.findMany({
    where: { key: { in: ["site_name", "site_description", "maintenance_mode", "social_facebook", "social_instagram", "social_twitter", "social_tiktok"] } },
  });

  const map: Record<string, string | number | boolean> = {};
  for (const s of settings) {
    map[s.key] = s.value as string | number | boolean;
  }

  return { ...DEFAULT_SETTINGS, ...map };
}
