"use server";

import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { slugify } from "@/lib/slug";
import { requireUser, getCurrentUser } from "@/lib/session";
import { getSellerStore } from "@/server/actions/seller-stats";

const categorySchema = z.object({
  name: z.string().min(1, "Le nom est requis.").max(100),
  description: z.string().max(500).optional().default(""),
  imageUrl: z.string().url().optional().or(z.literal("")).default(""),
  icon: z.string().max(50).optional().or(z.literal("")).default(""),
  parentId: z.string().optional().or(z.literal("")).default(""),
  sortOrder: z.coerce.number().int().min(0).default(0),
  isActive: z.coerce.boolean().default(true),
});

export type CategoryInput = z.infer<typeof categorySchema>;

export async function getCategories(includeInactive = false) {
  return prisma.category.findMany({
    where: includeInactive ? {} : { isActive: true },
    include: {
      _count: { select: { products: true, children: true } },
      parent: { select: { id: true, name: true, slug: true } },
    },
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
  });
}

export async function getCategoryBySlug(slug: string) {
  return prisma.category.findUnique({
    where: { slug },
    include: {
      parent: { select: { id: true, name: true, slug: true } },
      children: {
        where: { isActive: true },
        include: { _count: { select: { products: true } } },
        orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
      },
      _count: { select: { products: true } },
    },
  });
}

export async function getCategoryById(id: string) {
  return prisma.category.findUnique({
    where: { id },
    include: {
      parent: { select: { id: true, name: true, slug: true } },
      _count: { select: { products: true, children: true } },
    },
  });
}

export async function createCategory(input: CategoryInput) {
  const user = await requireUser();
  if (user.role !== "ADMIN") {
    throw new Error("Accès réservé aux administrateurs.");
  }

  const data = categorySchema.parse(input);
  const slug = slugify(data.name);

  const existing = await prisma.category.findUnique({ where: { slug } });
  if (existing) {
    throw new Error("Une catégorie avec ce nom existe déjà.");
  }

  if (data.parentId) {
    const parent = await prisma.category.findUnique({
      where: { id: data.parentId },
    });
    if (!parent) throw new Error("Catégorie parente introuvable.");
  }

  return prisma.category.create({
    data: {
      name: data.name,
      slug,
      description: data.description || null,
      imageUrl: data.imageUrl || null,
      icon: data.icon || null,
      parentId: data.parentId || null,
      sortOrder: data.sortOrder,
      isActive: data.isActive,
    },
  });
}

export async function updateCategory(id: string, input: CategoryInput) {
  const user = await requireUser();
  if (user.role !== "ADMIN") {
    throw new Error("Accès réservé aux administrateurs.");
  }

  const data = categorySchema.parse(input);

  const existing = await prisma.category.findUnique({ where: { id } });
  if (!existing) throw new Error("Catégorie introuvable.");

  if (data.parentId === id) {
    throw new Error("Une catégorie ne peut pas être sa propre parente.");
  }

  // Détecter les cycles profonds (A → B → C → A)
  if (data.parentId) {
    let cursor: string | null = data.parentId;
    const visited = new Set<string>([id]);
    while (cursor) {
      if (visited.has(cursor)) {
        throw new Error("Un cycle détecté dans les catégories parentes.");
      }
      visited.add(cursor);
      const row: { parentId: string | null } | null = await prisma.category.findUnique({
        where: { id: cursor },
        select: { parentId: true },
      });
      cursor = row?.parentId ?? null;
    }
  }

  const slug = slugify(data.name);
  const slugConflict = await prisma.category.findUnique({ where: { slug } });
  if (slugConflict && slugConflict.id !== id) {
    throw new Error("Une catégorie avec ce nom existe déjà.");
  }

  return prisma.category.update({
    where: { id },
    data: {
      name: data.name,
      slug,
      description: data.description || null,
      imageUrl: data.imageUrl || null,
      icon: data.icon || null,
      parentId: data.parentId || null,
      sortOrder: data.sortOrder,
      isActive: data.isActive,
    },
  });
}

export async function deleteCategory(id: string) {
  const user = await requireUser();
  if (user.role !== "ADMIN") {
    throw new Error("Accès réservé aux administrateurs.");
  }

  const existing = await prisma.category.findUnique({
    where: { id },
    include: { _count: { select: { products: true, children: true } } },
  });
  if (!existing) throw new Error("Catégorie introuvable.");
  if (existing._count.products > 0) {
    throw new Error(
      "Impossible de supprimer une catégorie qui contient des produits.",
    );
  }
  if (existing._count.children > 0) {
    throw new Error(
      "Impossible de supprimer une catégorie qui contient des sous-catégories.",
    );
  }

  return prisma.category.delete({ where: { id } });
}

export async function getSellerCategories() {
  const { store } = await getSellerStore();

  const categories = await prisma.category.findMany({
    where: { isActive: true },
    include: {
      _count: { select: { products: true } },
      products: {
        where: { storeId: store.id },
        select: { id: true },
      },
    },
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
  });

  return categories.map((cat) => ({
    id: cat.id,
    name: cat.name,
    slug: cat.slug,
    icon: cat.icon,
    imageUrl: cat.imageUrl,
    totalProducts: cat._count.products,
    myProductCount: cat.products.length,
  }));
}
