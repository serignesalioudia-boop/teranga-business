"use server";

import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/session";

export async function toggleFavorite(productId: string): Promise<{ favorited: boolean }> {
  const user = await getCurrentUser();
  if (!user) throw new Error("Connexion requise.");

  const existing = await prisma.favorite.findUnique({
    where: { userId_productId: { userId: user.id, productId } },
  });

  if (existing) {
    await prisma.favorite.delete({ where: { id: existing.id } });
    return { favorited: false };
  }

  await prisma.favorite.create({
    data: { userId: user.id, productId },
  });
  return { favorited: true };
}

export async function getUserFavorites() {
  const user = await getCurrentUser();
  if (!user) return [];

  const favorites = await prisma.favorite.findMany({
    where: { userId: user.id },
    include: {
      product: {
        include: {
          media: { where: { position: 0 }, take: 1, select: { url: true, alt: true } },
          store: { select: { id: true, name: true, slug: true } },
          category: { select: { name: true } },
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return favorites.map((f) => f.product);
}

export async function getFavoriteIds(): Promise<string[]> {
  const user = await getCurrentUser();
  if (!user) return [];

  const favorites = await prisma.favorite.findMany({
    where: { userId: user.id },
    select: { productId: true },
  });

  return favorites.map((f) => f.productId);
}
