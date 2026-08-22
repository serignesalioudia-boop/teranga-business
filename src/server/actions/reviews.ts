"use server";

import { z } from "zod";
import { ReviewStatus, NotificationType } from "@/generated/prisma/enums";
import type { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import { requireUser, getCurrentUser } from "@/lib/session";
import { createNotificationInternal } from "@/lib/notifications-internal";
import { logAction } from "@/lib/audit-log-helper";

const reviewSchema = z.object({
  productId: z.string().min(1),
  rating: z.coerce.number().int().min(1, "Note requise (1-5).").max(5, "Note maximale : 5."),
  title: z.string().max(200).default(""),
  content: z.string().max(2000).default(""),
  orderItemId: z.string().default(""),
});

export type ReviewInput = z.infer<typeof reviewSchema>;

export async function createReview(input: ReviewInput) {
  const user = await requireUser();
  const data = reviewSchema.parse(input);

  const existing = await prisma.review.findUnique({
    where: { productId_userId: { productId: data.productId, userId: user.id } },
  });
  if (existing) throw new Error("Vous avez déjà donné votre avis sur ce produit.");

  const product = await prisma.product.findUnique({ where: { id: data.productId } });
  if (!product) throw new Error("Produit introuvable.");

  if (data.orderItemId) {
    const item = await prisma.orderItem.findUnique({
      where: { id: data.orderItemId },
      include: { subOrder: { include: { order: { select: { userId: true } } } } },
    });
    if (!item || item.productId !== data.productId) {
      throw new Error("Article de commande invalide.");
    }
    if (item.subOrder.order.userId !== user.id && user.role !== "ADMIN") {
      throw new Error("Cet article ne vous appartient pas.");
    }
  }

  await prisma.review.create({
    data: {
      productId: data.productId,
      userId: user.id,
      rating: data.rating,
      title: data.title || null,
      content: data.content || null,
      orderItemId: data.orderItemId || null,
      status: ReviewStatus.PENDING,
    },
  });

  await recalculateRating(data.productId);

  // Notify the seller
  const fullProduct = await prisma.product.findUnique({
    where: { id: data.productId },
    include: {
      store: {
        include: { sellerProfile: { select: { userId: true } } },
      },
    },
  });

  if (fullProduct?.store.sellerProfile.userId) {
    await createNotificationInternal({
      userId: fullProduct.store.sellerProfile.userId,
      type: NotificationType.SYSTEM,
      title: "Nouveau avis sur votre produit",
      content: `${user.name ?? "Un client"} a laissé ${data.rating}/5 sur "${fullProduct.name}".`,
      link: "/seller/products",
    });
  }
}

export async function getProductReviews(productId: string) {
  return prisma.review.findMany({
    where: { productId, status: ReviewStatus.APPROVED },
    include: { user: { select: { id: true, name: true } } },
    orderBy: { createdAt: "desc" },
  });
}

export async function getUserReviews() {
  const user = await requireUser();
  return prisma.review.findMany({
    where: { userId: user.id },
    include: {
      product: { select: { id: true, name: true, slug: true } },
    },
    orderBy: { createdAt: "desc" },
  });
}

export async function hasUserReviewed(productId: string) {
  const user = await getCurrentUser();
  if (!user) return false;
  const review = await prisma.review.findUnique({
    where: { productId_userId: { productId, userId: user.id } },
  });
  return !!review;
}

export async function deleteReview(reviewId: string) {
  const user = await requireUser();
  const review = await prisma.review.findUnique({ where: { id: reviewId } });
  if (!review) throw new Error("Avis introuvable.");
  if (user.role !== "ADMIN" && review.userId !== user.id) {
    throw new Error("Non autorisé.");
  }
  await prisma.review.delete({ where: { id: reviewId } });
  await recalculateRating(review.productId);
}

export async function moderateReview(reviewId: string, status: "APPROVED" | "REJECTED") {
  const user = await requireUser();
  if (user.role !== "ADMIN") throw new Error("Accès réservé à l'administration.");

  const review = await prisma.review.findUnique({ where: { id: reviewId } });
  if (!review) throw new Error("Avis introuvable.");

  await prisma.review.update({
    where: { id: reviewId },
    data: { status },
  });

  await logAction({
    action: status === "APPROVED" ? "REVIEW_APPROVED" : "REVIEW_REJECTED",
    entityType: "Review",
    entityId: reviewId,
    before: { status: review.status },
    after: { status },
  });

  await recalculateRating(review.productId);
}

export async function bulkModerateReviews(
  reviewIds: string[],
  status: "APPROVED" | "REJECTED"
) {
  const user = await requireUser();
  if (user.role !== "ADMIN") throw new Error("Accès réservé à l'administration.");

  const reviews = await prisma.review.findMany({
    where: { id: { in: reviewIds } },
    select: { id: true, productId: true },
  });

  await prisma.review.updateMany({
    where: { id: { in: reviewIds } },
    data: { status },
  });

  const productIds = [...new Set(reviews.map((r) => r.productId))];
  for (const pid of productIds) {
    await recalculateRating(pid);
  }

  return { updated: reviews.length };
}

export async function getPendingReviewCount() {
  const user = await getCurrentUser();
  if (!user || user.role !== "ADMIN") throw new Error("Non autorisé.");

  return prisma.review.count({ where: { status: ReviewStatus.PENDING } });
}

export async function getAdminReviews(status?: ReviewStatus) {
  const user = await requireUser();
  if (user.role !== "ADMIN") throw new Error("Accès réservé à l'administration.");

  const where: Prisma.ReviewWhereInput = {};
  if (status) where.status = status;

  return prisma.review.findMany({
    where,
    include: {
      user: { select: { id: true, name: true, email: true } },
      product: { select: { id: true, name: true, slug: true } },
    },
    orderBy: { createdAt: "desc" },
  });
}

async function recalculateRating(productId: string) {
  const agg = await prisma.review.aggregate({
    where: { productId, status: ReviewStatus.APPROVED },
    _avg: { rating: true },
    _count: { rating: true },
  });

  await prisma.product.update({
    where: { id: productId },
    data: {
      ratingAvg: agg._avg.rating ? agg._avg.rating.toFixed(2) : "0.00",
      ratingCount: agg._count.rating,
    },
  });

  const product = await prisma.product.findUnique({ where: { id: productId }, select: { storeId: true } });
  if (!product) return;

  const storeAgg = await prisma.review.aggregate({
    where: {
      status: ReviewStatus.APPROVED,
      product: { storeId: product.storeId },
    },
    _avg: { rating: true },
    _count: { rating: true },
  });

  await prisma.store.update({
    where: { id: product.storeId },
    data: {
      ratingAvg: storeAgg._avg.rating ? storeAgg._avg.rating.toFixed(2) : "0.00",
      ratingCount: storeAgg._count.rating,
    },
  });
}
