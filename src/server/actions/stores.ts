"use server";

import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";
import { serialize } from "@/lib/serialize";
import { logAction } from "@/lib/audit-log-helper";

export async function getStoreBySlug(slug: string) {
  const store = await prisma.store.findFirst({
    where: { slug, isActive: true },
    include: {
      sellerProfile: {
        select: {
          user: { select: { name: true, image: true } },
          isVerified: true,
        },
      },
      products: {
        where: { status: "PUBLISHED" },
        include: {
          media: {
            where: { position: 0 },
            take: 1,
            select: { url: true, alt: true },
          },
          category: { select: { name: true, slug: true } },
        },
        orderBy: { createdAt: "desc" },
        take: 50,
      },
      _count: { select: { products: true } },
      socialLinks: true,
    },
  });

  if (!store) return null;

  return serialize(store);
}

export async function getStoreProducts(
  storeId: string,
  filters?: {
    categoryId?: string;
    search?: string;
    sort?: string;
    minPrice?: number;
    maxPrice?: number;
  },
) {
  const where: Record<string, unknown> = {
    storeId,
    status: "PUBLISHED",
  };

  if (filters?.categoryId) {
    where.categoryId = filters.categoryId;
  }

  if (filters?.search) {
    where.name = { contains: filters.search, mode: "insensitive" };
  }

  if (filters?.minPrice || filters?.maxPrice) {
    const priceFilter: { gte?: bigint; lte?: bigint } = {};
    if (filters.minPrice) priceFilter.gte = BigInt(Math.round(filters.minPrice * 100));
    if (filters.maxPrice) priceFilter.lte = BigInt(Math.round(filters.maxPrice * 100));
    where.price = priceFilter;
  }

  let orderBy: Record<string, string> = { createdAt: "desc" };
  if (filters?.sort === "price_asc") orderBy = { price: "asc" };
  if (filters?.sort === "price_desc") orderBy = { price: "desc" };
  if (filters?.sort === "popular") orderBy = { soldCount: "desc" };
  if (filters?.sort === "rating") orderBy = { ratingAvg: "desc" };

  return prisma.product.findMany({
    where,
    include: {
      media: { where: { position: 0 }, take: 1, select: { url: true, alt: true } },
      category: { select: { name: true, slug: true } },
      store: { select: { id: true, name: true, slug: true } },
    },
    orderBy,
    take: 50,
  });
}

export async function getStoreFeaturedProducts(storeId: string) {
  return prisma.product.findMany({
    where: {
      storeId,
      status: "PUBLISHED",
      isFeatured: true,
    },
    include: {
      media: { where: { position: 0 }, take: 1, select: { url: true, alt: true } },
      category: { select: { name: true, slug: true } },
      store: { select: { id: true, name: true, slug: true } },
    },
    orderBy: { createdAt: "desc" },
    take: 8,
  });
}

export async function getStoreCategories(storeId: string) {
  return prisma.category.findMany({
    where: {
      products: { some: { storeId, status: "PUBLISHED" } },
    },
    select: { id: true, name: true, slug: true, _count: { select: { products: true } } },
    orderBy: { name: "asc" },
  });
}

export async function getAdminStores() {
  const user = await requireUser();
  if (user.role !== "ADMIN") throw new Error("Accès réservé aux administrateurs.");

  return prisma.store.findMany({
    include: {
      sellerProfile: {
        select: {
          user: { select: { name: true, email: true } },
          status: true,
          isVerified: true,
        },
      },
      _count: { select: { products: true } },
    },
    orderBy: { createdAt: "desc" },
  });
}

export async function getStoreById(id: string) {
  const user = await requireUser();
  if (user.role !== "ADMIN") throw new Error("Accès réservé aux administrateurs.");

  return prisma.store.findUnique({
    where: { id },
    include: {
      sellerProfile: {
        select: {
          user: { select: { name: true, email: true } },
          status: true,
          isVerified: true,
        },
      },
      socialLinks: true,
      _count: { select: { products: true } },
    },
  });
}

const storeUpdateSchema = z.object({
  name: z.string().min(1, "Le nom est requis.").max(100),
  description: z.string().max(500).optional().default(""),
  whatsapp: z.string().max(20).optional().or(z.literal("")).default(""),
  isActive: z.coerce.boolean().default(true),
});

export type StoreUpdateInput = z.infer<typeof storeUpdateSchema>;

export async function updateStore(id: string, input: StoreUpdateInput) {
  const user = await requireUser();
  if (user.role !== "ADMIN") throw new Error("Accès réservé aux administrateurs.");

  const data = storeUpdateSchema.parse(input);
  const existing = await prisma.store.findUnique({ where: { id } });
  if (!existing) throw new Error("Boutique introuvable.");

  return prisma.store.update({
    where: { id },
    data: {
      name: data.name,
      description: data.description || null,
      whatsapp: data.whatsapp || null,
      isActive: data.isActive,
    },
  });
}

export async function approveSeller(storeId: string) {
  const user = await requireUser();
  if (user.role !== "ADMIN") throw new Error("Accès réservé aux administrateurs.");

  const store = await prisma.store.findUnique({
    where: { id: storeId },
    select: {
      sellerProfileId: true,
      name: true,
      sellerProfile: {
        select: {
          userId: true,
          user: { select: { name: true, email: true } },
        },
      },
    },
  });
  if (!store) throw new Error("Boutique introuvable.");

  await prisma.sellerProfile.update({
    where: { id: store.sellerProfileId },
    data: { status: "ACTIVE", isVerified: true },
  });

  await logAction({
    action: "SELLER_APPROVED",
    entityType: "SellerProfile",
    entityId: store.sellerProfileId,
    before: { status: "PENDING", isVerified: false },
    after: { status: "ACTIVE", isVerified: true },
  });

  // Notify the seller
  const sellerId = store.sellerProfile.userId;
  if (sellerId) {
    const { createNotificationInternal } = await import("@/lib/notifications-internal");
    const { NotificationType } = await import("@/generated/prisma/enums");
    await createNotificationInternal({
      userId: sellerId,
      type: NotificationType.SYSTEM,
      title: "Votre boutique a été approuvée !",
      content: `Félicitations ! Votre boutique « ${store.name} » est maintenant active. Vous pouvez commencer à publier vos produits.`,
      link: "/seller",
    });

    // Send email
    const { sendEmail } = await import("@/lib/email");
    const sellerEmail = store.sellerProfile.user.email;
    if (sellerEmail) {
      const sellerName = store.sellerProfile.user.name ?? "Vendeur";
      const html = `
        <div style="font-family:system-ui,sans-serif;color:#111827;max-width:600px;margin:0 auto;padding:24px">
          <h2 style="color:#16a34a">Boutique approuvée !</h2>
          <p>Bonjour ${sellerName},</p>
          <p>Votre boutique <strong>« ${store.name} »</strong> a été approuvée par l&apos;administration.</p>
          <p>Vous pouvez dès maintenant vous connecter à votre espace vendeur et commencer à publier vos produits.</p>
          <a href="${process.env.NEXTAUTH_URL ?? "https://terangabusiness.sn"}/seller"
             style="display:inline-block;background:#16a34a;color:#fff;padding:10px 24px;border-radius:6px;text-decoration:none;font-weight:600;margin-top:12px">
            Accéder à mon espace vendeur
          </a>
        </div>`;
      sendEmail({ to: sellerEmail, subject: "Votre boutique a été approuvée !", html }).catch(() => {});
    }
  }

  return { success: true };
}

export async function rejectSeller(storeId: string, reason?: string) {
  const user = await requireUser();
  if (user.role !== "ADMIN") throw new Error("Accès réservé aux administrateurs.");

  const store = await prisma.store.findUnique({
    where: { id: storeId },
    select: {
      sellerProfileId: true,
      name: true,
      sellerProfile: {
        select: {
          userId: true,
          user: { select: { name: true, email: true } },
        },
      },
    },
  });
  if (!store) throw new Error("Boutique introuvable.");

  await prisma.sellerProfile.update({
    where: { id: store.sellerProfileId },
    data: {
      status: "REJECTED",
      isVerified: false,
      verificationNote: reason ?? null,
    },
  });

  await logAction({
    action: "SELLER_REJECTED",
    entityType: "SellerProfile",
    entityId: store.sellerProfileId,
    before: { status: "PENDING", isVerified: false },
    after: { status: "REJECTED", isVerified: false, reason: reason ?? null },
  });

  // Notify the seller
  const sellerId = store.sellerProfile.userId;
  if (sellerId) {
    const { createNotificationInternal } = await import("@/lib/notifications-internal");
    const { NotificationType } = await import("@/generated/prisma/enums");
    await createNotificationInternal({
      userId: sellerId,
      type: NotificationType.SYSTEM,
      title: "Candidature vendeur refusée",
      content: reason
        ? `Votre candidature pour « ${store.name} » a été refusée. Motif : ${reason}`
        : `Votre candidature pour « ${store.name} » a été refusée. Vous pouvez corriger les informations et soumettre une nouvelle demande.`,
      link: "/account/become-seller",
    });

    // Send email
    const { sendEmail } = await import("@/lib/email");
    const sellerEmail = store.sellerProfile.user.email;
    if (sellerEmail) {
      const sellerName = store.sellerProfile.user.name ?? "Vendeur";
      const html = `
        <div style="font-family:system-ui,sans-serif;color:#111827;max-width:600px;margin:0 auto;padding:24px">
          <h2 style="color:#dc2626">Candidature refusée</h2>
          <p>Bonjour ${sellerName},</p>
          <p>Votre candidature pour la boutique <strong>« ${store.name} »</strong> n&apos;a pas été acceptée.</p>
          ${reason ? `<p><strong>Motif :</strong> ${reason}</p>` : ""}
          <p>Vous pouvez modifier vos informations et soumettre une nouvelle demande.</p>
          <a href="${process.env.NEXTAUTH_URL ?? "https://terangabusiness.sn"}/account/become-seller"
             style="display:inline-block;background:#16a34a;color:#fff;padding:10px 24px;border-radius:6px;text-decoration:none;font-weight:600;margin-top:12px">
            Soumettre une nouvelle candidature
          </a>
        </div>`;
      sendEmail({ to: sellerEmail, subject: "Votre candidature vendeur a été refusée", html }).catch(() => {});
    }
  }

  return { success: true };
}
