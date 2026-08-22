"use server";

import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/session";
import type { ShareTargetType } from "@/generated/prisma/enums";

const BASE_URL = process.env.NEXTAUTH_URL || "http://localhost:3000";

function buildShareUrl(targetType: ShareTargetType, slug: string): string {
  switch (targetType) {
    case "PRODUCT":
      return `${BASE_URL}/product/${slug}`;
    case "STORE":
      return `${BASE_URL}/store/${slug}`;
    case "CATEGORY":
      return `${BASE_URL}/category/${slug}`;
  }
}

export async function trackShare(
  targetType: ShareTargetType,
  targetId: string,
  targetSlug: string,
  channel: string,
) {
  const url = buildShareUrl(targetType, targetSlug);
  const user = await getCurrentUser();

  // Upsert le ShareLink (aggregate)
  const shareLink = await prisma.shareLink.upsert({
    where: {
      targetType_targetId_channelId: {
        targetType,
        targetId,
        channelId: channel,
      },
    },
    update: { shares: { increment: 1 }, url },
    create: {
      targetType,
      targetId,
      channelId: channel,
      url,
      shares: 1,
    },
  });

  // Enregistrer l'événement
  await prisma.shareEvent.create({
    data: {
      shareLinkId: shareLink.id,
      userId: user?.id ?? null,
      channel,
    },
  });

  return { url, shareLinkId: shareLink.id };
}

export async function trackClick(
  targetType: ShareTargetType,
  targetId: string,
  targetSlug: string,
  channel: string,
) {
  const url = buildShareUrl(targetType, targetSlug);

  const shareLink = await prisma.shareLink.upsert({
    where: {
      targetType_targetId_channelId: {
        targetType,
        targetId,
        channelId: channel,
      },
    },
    update: { clicks: { increment: 1 }, url },
    create: {
      targetType,
      targetId,
      channelId: channel,
      url,
      clicks: 1,
    },
  });

  return { url };
}

export async function getShareStats(
  targetType: ShareTargetType,
  targetId: string,
) {
  const user = await getCurrentUser();
  if (!user) throw new Error("Non autorisé.");
  if (user.role !== "ADMIN") throw new Error("Accès réservé aux administrateurs.");

  const links = await prisma.shareLink.findMany({
    where: { targetType, targetId },
    orderBy: { shares: "desc" },
  });

  const totalShares = links.reduce((acc, l) => acc + l.shares, 0);
  const totalClicks = links.reduce((acc, l) => acc + l.clicks, 0);

  return {
    links,
    totalShares,
    totalClicks,
    byChannel: links.map((l) => ({
      channelId: l.channelId,
      shares: l.shares,
      clicks: l.clicks,
    })),
  };
}

export async function getShareUrl(
  targetType: ShareTargetType,
  targetId: string,
) {
  const link = await prisma.shareLink.findFirst({
    where: { targetType, targetId, channelId: "copy" },
  });
  return link?.url ?? null;
}

export async function getSellerShareStats(sellerProfileId: string) {
  const user = await getCurrentUser();
  if (!user) throw new Error("Non autorisé.");

  if (user.role !== "ADMIN") {
    const profile = await prisma.sellerProfile.findUnique({
      where: { id: sellerProfileId },
      select: { userId: true },
    });
    if (!profile || profile.userId !== user.id) {
      throw new Error("Non autorisé.");
    }
  }

  const store = await prisma.store.findUnique({
    where: { sellerProfileId },
    select: { id: true },
  });
  if (!store) return { totalShares: 0, totalClicks: 0, byChannel: [] };

  const storeLinks = await prisma.shareLink.findMany({
    where: { targetType: "STORE", targetId: store.id },
  });

  const productIds = await prisma.product.findMany({
    where: { storeId: store.id },
    select: { id: true },
  });

  const productLinks = await prisma.shareLink.findMany({
    where: {
      targetType: "PRODUCT",
      targetId: { in: productIds.map((p) => p.id) },
    },
  });

  const allLinks = [...storeLinks, ...productLinks];

  const totalShares = allLinks.reduce((acc, l) => acc + l.shares, 0);
  const totalClicks = allLinks.reduce((acc, l) => acc + l.clicks, 0);

  const channelMap = new Map<string, { shares: number; clicks: number }>();
  for (const l of allLinks) {
    const existing = channelMap.get(l.channelId) ?? { shares: 0, clicks: 0 };
    channelMap.set(l.channelId, {
      shares: existing.shares + l.shares,
      clicks: existing.clicks + l.clicks,
    });
  }

  return {
    totalShares,
    totalClicks,
    byChannel: Array.from(channelMap.entries()).map(([channelId, data]) => ({
      channelId,
      ...data,
    })),
  };
}
