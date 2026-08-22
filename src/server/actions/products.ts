"use server";

import { z } from "zod";
import { ProductStatus } from "@/generated/prisma/enums";
import type { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import { slugify } from "@/lib/slug";
import { requireUser, getCurrentUser } from "@/lib/session";
import { serialize } from "@/lib/serialize";

const productSchema = z.object({
  storeId: z.string().min(1, "La boutique est requise."),
  categoryId: z.string().min(1, "La catégorie est requise."),
  customCategoryName: z.string().max(100).optional().default(""),
  name: z.string().min(1, "Le nom est requis.").max(200),
  description: z.string().max(5000).optional().default(""),
  price: z.coerce.number().int().min(1, "Le prix doit être supérieur à 0."),
  discountPrice: z.coerce
    .number()
    .int()
    .min(0)
    .optional()
    .default(0),
  stock: z.coerce.number().int().min(0).default(0),
  sku: z.string().max(100).optional().or(z.literal("")).default(""),
  lowStockThreshold: z.coerce.number().int().min(0).default(0),
  status: z.enum(["DRAFT", "PUBLISHED", "ARCHIVED"]).default("DRAFT"),
  isFeatured: z.coerce.boolean().default(false),
  isDigital: z.coerce.boolean().default(false),
  digitalFileUrl: z.string().optional().or(z.literal("")).default(""),
  digitalFileSize: z.coerce.number().int().min(0).optional().default(0),
});

export type ProductInput = z.infer<typeof productSchema>;

export async function getProducts(options?: {
  status?: ProductStatus;
  storeId?: string;
  categoryId?: string;
  featured?: boolean;
  includeInactive?: boolean;
  search?: string;
  minPrice?: number;
  maxPrice?: number;
  inStock?: boolean;
  minRating?: number;
  sort?: "newest" | "price_asc" | "price_desc" | "popular" | "rating";
  page?: number;
  pageSize?: number;
}) {
  const {
    status,
    storeId,
    categoryId,
    featured,
    includeInactive = false,
    search,
    minPrice,
    maxPrice,
    inStock,
    minRating,
    sort = "newest",
    page = 1,
    pageSize = 20,
  } = options ?? {};

  const where: Prisma.ProductWhereInput = {};

  if (!includeInactive) {
    where.status = status ?? { notIn: ["ARCHIVED"] };
  } else if (status) {
    where.status = status;
  }

  if (includeInactive && storeId) {
    const user = await getCurrentUser();
    if (!user || (user.role !== "ADMIN")) {
      const seller = user
        ? await prisma.sellerProfile.findUnique({
            where: { userId: user.id },
          })
        : null;
      if (!seller) {
        return { products: [], total: 0, page, pageSize, totalPages: 0 };
      }
      const store = await prisma.store.findUnique({
        where: { id: storeId },
        select: { sellerProfileId: true },
      });
      if (!store || store.sellerProfileId !== seller.id) {
        return { products: [], total: 0, page, pageSize, totalPages: 0 };
      }
    }
  }

  if (storeId) where.storeId = storeId;
  if (categoryId) where.categoryId = categoryId;
  if (featured !== undefined) where.isFeatured = featured;

  if (search && search.trim()) {
    const term = search.trim();
    where.OR = [
      { name: { contains: term, mode: "insensitive" } },
      { description: { contains: term, mode: "insensitive" } },
      { sku: { contains: term, mode: "insensitive" } },
    ];
  }

  if (minPrice !== undefined || maxPrice !== undefined) {
    where.price = {};
    if (minPrice !== undefined) where.price.gte = BigInt(Math.round(minPrice));
    if (maxPrice !== undefined) where.price.lte = BigInt(Math.round(maxPrice));
  }

  if (inStock) {
    where.stock = { gt: 0 };
  }

  if (minRating !== undefined && minRating > 0) {
    where.ratingAvg = { gte: minRating };
    where.ratingCount = { gte: 1 };
  }

  const orderBy: Prisma.ProductOrderByWithRelationInput =
    sort === "price_asc"
      ? { price: "asc" }
      : sort === "price_desc"
        ? { price: "desc" }
        : sort === "popular"
          ? { soldCount: "desc" }
          : sort === "rating"
            ? { ratingAvg: "desc" }
            : { createdAt: "desc" };

  const [products, total] = await Promise.all([
    prisma.product.findMany({
      where,
      include: {
        store: { select: { id: true, name: true, slug: true } },
        category: { select: { id: true, name: true, slug: true } },
        media: {
          where: { position: 0 },
          take: 1,
          select: { url: true, alt: true },
        },
        _count: { select: { reviews: true } },
      },
      orderBy,
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.product.count({ where }),
  ]);

  return {
    products: products.map((p) => serialize(p)),
    total,
    page,
    pageSize,
    totalPages: Math.ceil(total / pageSize),
  };
}

export async function getProductBySlug(slug: string) {
  const product = await prisma.product.findUnique({
    where: { slug },
    include: {
      store: {
        select: {
          id: true,
          name: true,
          slug: true,
          logoUrl: true,
          whatsapp: true,
          ratingAvg: true,
          ratingCount: true,
          sellerProfile: {
            select: { user: { select: { name: true } } },
          },
        },
      },
      category: { select: { id: true, name: true, slug: true } },
      media: { orderBy: { position: "asc" }, select: { url: true, alt: true, type: true, position: true } },
      _count: { select: { reviews: true } },
    },
  });

  if (!product) return null;

  return serialize(product);
}

export async function getProductById(id: string) {
  const product = await prisma.product.findUnique({
    where: { id },
    include: {
      store: { select: { id: true, name: true, slug: true, sellerProfileId: true } },
      category: { select: { id: true, name: true, slug: true } },
      media: { orderBy: { position: "asc" } },
    },
  });

  if (!product) return null;

  if (product.status === "DRAFT" || product.status === "ARCHIVED") {
    const user = await getCurrentUser();
    if (!user) return null;
    if (user.role !== "ADMIN") {
      const seller = await prisma.sellerProfile.findUnique({
        where: { userId: user.id },
      });
      if (!seller || product.store.sellerProfileId !== seller.id) {
        return null;
      }
    }
  }

  return product;
}

export async function createProduct(input: ProductInput) {
  const user = await requireUser();
  if (user.role !== "ADMIN") {
    const seller = await prisma.sellerProfile.findUnique({
      where: { userId: user.id },
    });
    if (!seller || seller.status !== "ACTIVE") {
      throw new Error("Accès réservé aux vendeurs actifs.");
    }
    const store = await prisma.store.findUnique({
      where: { sellerProfileId: seller.id },
    });
    if (!store || store.id !== input.storeId) {
      throw new Error("Vous ne pouvez créer des produits que dans votre propre boutique.");
    }
  }

  const data = productSchema.parse(input);
  const slug = slugify(data.name);

  const slugConflict = await prisma.product.findUnique({ where: { slug } });
  if (slugConflict) {
    throw new Error("Un produit avec ce nom existe déjà.");
  }

  let categoryId = data.categoryId;

  if (categoryId === "__custom__") {
    const name = data.customCategoryName?.trim();
    if (!name) {
      throw new Error("Le nom de la catégorie personnalisée est requis.");
    }
    const catSlug = slugify(name);
    const existing = await prisma.category.findUnique({ where: { slug: catSlug } });
    if (existing) {
      categoryId = existing.id;
    } else {
      const created = await prisma.category.create({
        data: { name, slug: catSlug, isActive: true },
      });
      categoryId = created.id;
    }
  }

  const [store, category] = await Promise.all([
    prisma.store.findUnique({ where: { id: data.storeId } }),
    prisma.category.findUnique({ where: { id: categoryId } }),
  ]);
  if (!store) throw new Error("Boutique introuvable.");
  if (!category) throw new Error("Catégorie introuvable.");

  const discountPrice =
    data.discountPrice && data.discountPrice > 0 ? data.discountPrice : null;

  const stock = data.isDigital ? 999999 : data.stock;
  const digitalFileUrl = data.isDigital && data.digitalFileUrl ? data.digitalFileUrl : null;
  const digitalFileSize = data.isDigital && data.digitalFileSize ? data.digitalFileSize : null;

  const created = await prisma.product.create({
    data: {
      storeId: data.storeId,
      categoryId,
      name: data.name,
      slug,
      description: data.description || null,
      price: data.price,
      discountPrice,
      stock,
      sku: data.sku || null,
      lowStockThreshold: data.lowStockThreshold,
      status: data.status as ProductStatus,
      isFeatured: data.isFeatured,
      isDigital: data.isDigital,
      digitalFileUrl,
      digitalFileSize,
    },
  });

  return { id: created.id };
}

export async function updateProduct(id: string, input: ProductInput) {
  const user = await requireUser();

  const existing = await prisma.product.findUnique({
    where: { id },
    include: { store: { select: { sellerProfileId: true } } },
  });
  if (!existing) throw new Error("Produit introuvable.");

  if (user.role !== "ADMIN") {
    const seller = await prisma.sellerProfile.findUnique({
      where: { userId: user.id },
    });
    if (!seller || existing.store.sellerProfileId !== seller.id) {
      throw new Error("Vous ne pouvez modifier que vos propres produits.");
    }
  }

  const data = productSchema.parse(input);
  const slug = slugify(data.name);

  const slugConflict = await prisma.product.findUnique({ where: { slug } });
  if (slugConflict && slugConflict.id !== id) {
    throw new Error("Un produit avec ce nom existe déjà.");
  }

  const discountPrice =
    data.discountPrice && data.discountPrice > 0 ? data.discountPrice : null;

  const stock = data.isDigital ? 999999 : data.stock;
  const digitalFileUrl = data.isDigital && data.digitalFileUrl ? data.digitalFileUrl : null;
  const digitalFileSize = data.isDigital && data.digitalFileSize ? data.digitalFileSize : null;

  return prisma.product.update({
    where: { id },
    data: {
      storeId: data.storeId,
      categoryId: data.categoryId,
      name: data.name,
      slug,
      description: data.description || null,
      price: data.price,
      discountPrice,
      stock,
      sku: data.sku || null,
      lowStockThreshold: data.lowStockThreshold,
      status: data.status as ProductStatus,
      isFeatured: data.isFeatured,
      isDigital: data.isDigital,
      digitalFileUrl,
      digitalFileSize,
    },
  });
}

export async function deleteProduct(id: string) {
  const user = await requireUser();

  const existing = await prisma.product.findUnique({
    where: { id },
    include: { store: { select: { sellerProfileId: true } } },
  });
  if (!existing) throw new Error("Produit introuvable.");

  if (user.role !== "ADMIN") {
    const seller = await prisma.sellerProfile.findUnique({
      where: { userId: user.id },
    });
    if (!seller || existing.store.sellerProfileId !== seller.id) {
      throw new Error("Vous ne pouvez supprimer que vos propres produits.");
    }
  }

  return prisma.product.delete({ where: { id } });
}

export async function getStores() {
  return prisma.store.findMany({
    where: { isActive: true },
    select: { id: true, name: true, slug: true },
    orderBy: { name: "asc" },
  });
}

export async function getProductMedia(productId: string) {
  const product = await prisma.product.findUnique({
    where: { id: productId },
    select: { status: true, store: { select: { sellerProfileId: true } } },
  });
  if (!product) return [];

  if (product.status === "DRAFT" || product.status === "ARCHIVED") {
    const user = await getCurrentUser();
    if (!user) return [];
    if (user.role !== "ADMIN") {
      const seller = await prisma.sellerProfile.findUnique({
        where: { userId: user.id },
      });
      if (!seller || product.store.sellerProfileId !== seller.id) return [];
    }
  }

  return prisma.mediaAsset.findMany({
    where: { productId },
    orderBy: { position: "asc" },
    select: { id: true, url: true, alt: true, position: true },
  });
}

export async function addProductMediaUrl(
  productId: string,
  url: string,
  alt?: string,
) {
  const user = await requireUser();

  const product = await prisma.product.findUnique({
    where: { id: productId },
    include: { store: { select: { sellerProfileId: true } } },
  });
  if (!product) throw new Error("Produit introuvable.");

  if (user.role !== "ADMIN") {
    const seller = await prisma.sellerProfile.findUnique({
      where: { userId: user.id },
    });
    if (!seller || product.store.sellerProfileId !== seller.id) {
      throw new Error("Vous ne pouvez modifier que vos propres produits.");
    }
  }

  const count = await prisma.mediaAsset.count({ where: { productId } });
  if (count >= 8) {
    throw new Error("Maximum 8 images par produit.");
  }

  const media = await prisma.mediaAsset.create({
    data: {
      productId,
      url,
      publicId: null,
      alt: alt || product.name,
      type: "IMAGE",
      position: count,
    },
  });

  return { id: media.id, url: media.url, alt: media.alt, position: media.position };
}

export async function deleteProductMedia(mediaId: string) {
  const user = await requireUser();

  const media = await prisma.mediaAsset.findUnique({
    where: { id: mediaId },
    include: { product: { include: { store: { select: { sellerProfileId: true } } } } },
  });
  if (!media) throw new Error("Image introuvable.");

  if (user.role !== "ADMIN") {
    const seller = await prisma.sellerProfile.findUnique({
      where: { userId: user.id },
    });
    if (!seller || !media.product || media.product.store.sellerProfileId !== seller.id) {
      throw new Error("Vous ne pouvez modifier que vos propres produits.");
    }
  }

  await prisma.mediaAsset.delete({ where: { id: mediaId } });
  return { ok: true };
}

export async function getSearchSuggestions(query: string) {
  if (!query || query.trim().length < 2) return { products: [], categories: [] };

  const term = query.trim();

  const [products, categories] = await Promise.all([
    prisma.product.findMany({
      where: {
        status: { notIn: ["ARCHIVED", "DRAFT"] },
        OR: [
          { name: { contains: term, mode: "insensitive" } },
          { sku: { contains: term, mode: "insensitive" } },
        ],
      },
      select: { id: true, name: true, slug: true, price: true, media: { where: { position: 0 }, take: 1, select: { url: true } } },
      take: 5,
      orderBy: { soldCount: "desc" },
    }),
    prisma.category.findMany({
      where: { isActive: true, name: { contains: term, mode: "insensitive" } },
      select: { id: true, name: true, slug: true },
      take: 3,
    }),
  ]);

  return { products, categories };
}

export async function addProductDigitalFile(
  productId: string,
  fileUrl: string,
  fileSize: number,
) {
  const user = await requireUser();

  const product = await prisma.product.findUnique({
    where: { id: productId },
    include: { store: { select: { sellerProfileId: true } } },
  });
  if (!product) throw new Error("Produit introuvable.");

  if (user.role !== "ADMIN") {
    const seller = await prisma.sellerProfile.findUnique({
      where: { userId: user.id },
    });
    if (!seller || product.store.sellerProfileId !== seller.id) {
      throw new Error("Vous ne pouvez modifier que vos propres produits.");
    }
  }

  return prisma.product.update({
    where: { id: productId },
    data: {
      isDigital: true,
      digitalFileUrl: fileUrl,
      digitalFileSize: fileSize,
      stock: 999999,
    },
  });
}
