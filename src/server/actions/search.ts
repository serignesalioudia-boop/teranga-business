"use server";

import { prisma } from "@/lib/prisma";

export async function globalSearch(query: string) {
  if (!query || query.trim().length < 2) {
    return { products: [], stores: [], categories: [] };
  }

  const term = query.trim();

  const [products, stores, categories] = await Promise.all([
    prisma.product.findMany({
      where: {
        status: "PUBLISHED",
        name: { contains: term, mode: "insensitive" },
      },
      select: {
        id: true,
        name: true,
        slug: true,
        price: true,
        discountPrice: true,
        store: { select: { name: true } },
        media: { where: { position: 0 }, take: 1, select: { url: true } },
      },
      take: 5,
      orderBy: { soldCount: "desc" },
    }),
    prisma.store.findMany({
      where: {
        isActive: true,
        OR: [
          { name: { contains: term, mode: "insensitive" } },
          { description: { contains: term, mode: "insensitive" } },
        ],
      },
      select: { id: true, name: true, slug: true, description: true },
      take: 3,
    }),
    prisma.category.findMany({
      where: { isActive: true, name: { contains: term, mode: "insensitive" } },
      select: { id: true, name: true, slug: true },
      take: 3,
    }),
  ]);

  return {
    products: products.map((p) => ({
      id: p.id,
      name: p.name,
      slug: p.slug,
      type: "product" as const,
      price: Number(p.price),
      discountPrice: p.discountPrice ? Number(p.discountPrice) : null,
      storeName: p.store.name,
      imageUrl: p.media[0]?.url ?? null,
    })),
    stores: stores.map((s) => ({
      id: s.id,
      name: s.name,
      slug: s.slug,
      type: "store" as const,
      description: s.description ?? null,
    })),
    categories: categories.map((c) => ({
      id: c.id,
      name: c.name,
      slug: c.slug,
      type: "category" as const,
    })),
  };
}
