"use server";

import { SellerPlan } from "@/generated/prisma/enums";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/session";
import { PLAN_LIMITS, type PlanLimits } from "@/lib/plans";

export type { PlanLimits };

export async function getSellerPlanLimits(plan: SellerPlan): Promise<PlanLimits> {
  return PLAN_LIMITS[plan];
}

function getEffectivePlan(sellerProfile: { plan: SellerPlan; planExpiresAt: Date | null }): SellerPlan {
  if (sellerProfile.planExpiresAt && sellerProfile.planExpiresAt < new Date()) {
    return "FREE";
  }
  return sellerProfile.plan;
}

export async function checkProductLimit(storeId: string) {
  const user = await getCurrentUser();
  if (!user) throw new Error("Non autorisé.");

  const store = await prisma.store.findUnique({
    where: { id: storeId },
    include: { sellerProfile: { select: { plan: true, planExpiresAt: true, userId: true } } },
  });
  if (!store) throw new Error("Boutique introuvable.");
  if (user.role !== "ADMIN" && store.sellerProfile.userId !== user.id) {
    throw new Error("Non autorisé.");
  }

  const plan = getEffectivePlan(store.sellerProfile);
  const limits = PLAN_LIMITS[plan];
  const productCount = await prisma.product.count({ where: { storeId } });

  return {
    current: productCount,
    max: limits.maxProducts,
    allowed: productCount < limits.maxProducts,
    plan,
  };
}

export async function checkPhotoLimit(storeId: string, productId?: string) {
  const user = await getCurrentUser();
  if (!user) throw new Error("Non autorisé.");

  const store = await prisma.store.findUnique({
    where: { id: storeId },
    include: { sellerProfile: { select: { plan: true, planExpiresAt: true, userId: true } } },
  });
  if (!store) throw new Error("Boutique introuvable.");
  if (user.role !== "ADMIN" && store.sellerProfile.userId !== user.id) {
    throw new Error("Non autorisé.");
  }

  const plan = getEffectivePlan(store.sellerProfile);
  const limits = PLAN_LIMITS[plan];
  const photoCount = productId
    ? await prisma.mediaAsset.count({ where: { productId } })
    : 0;

  return {
    current: photoCount,
    max: limits.maxPhotosPerProduct,
    allowed: photoCount < limits.maxPhotosPerProduct,
    plan,
  };
}

export async function checkOrderLimit(storeId: string) {
  const user = await getCurrentUser();
  if (!user) throw new Error("Non autorisé.");

  const store = await prisma.store.findUnique({
    where: { id: storeId },
    include: { sellerProfile: { select: { plan: true, planExpiresAt: true, userId: true } } },
  });
  if (!store) throw new Error("Boutique introuvable.");
  if (user.role !== "ADMIN" && store.sellerProfile.userId !== user.id) {
    throw new Error("Non autorisé.");
  }

  const plan = getEffectivePlan(store.sellerProfile);
  const limits = PLAN_LIMITS[plan];

  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const orderCount = await prisma.subOrder.count({
    where: {
      storeId,
      createdAt: { gte: monthStart },
      status: { notIn: ["CANCELLED", "REFUNDED"] },
    },
  });

  return {
    current: orderCount,
    max: limits.maxOrdersPerMonth,
    allowed: orderCount < limits.maxOrdersPerMonth,
    plan,
  };
}

export async function checkDigitalProductAllowed(storeId: string) {
  const user = await getCurrentUser();
  if (!user) throw new Error("Non autorisé.");

  const store = await prisma.store.findUnique({
    where: { id: storeId },
    include: { sellerProfile: { select: { plan: true, planExpiresAt: true, userId: true } } },
  });
  if (!store) throw new Error("Boutique introuvable.");
  if (user.role !== "ADMIN" && store.sellerProfile.userId !== user.id) {
    throw new Error("Non autorisé.");
  }

  const plan = getEffectivePlan(store.sellerProfile);
  const limits = PLAN_LIMITS[plan];

  return {
    allowed: limits.canSellDigital,
    plan,
  };
}

export async function upgradeSellerPlan(plan: SellerPlan, paymentReference?: string) {
  const user = await getCurrentUser();
  if (!user) throw new Error("Non autorisé.");

  if (plan === "FREE") throw new Error("Impossible de revenir au plan gratuit.");

  if (!paymentReference) {
    throw new Error("Référence de paiement requise pour l'upgrade.");
  }

  const payment = await prisma.payment.findFirst({
    where: { id: paymentReference, status: "SUCCESS" },
  });
  if (!payment) {
    throw new Error("Paiement non trouvé ou non confirmé.");
  }

  const sellerProfile = await prisma.sellerProfile.findUnique({
    where: { userId: user.id },
  });
  if (!sellerProfile) throw new Error("Profil vendeur introuvable.");
  if (sellerProfile.status !== "ACTIVE") {
    throw new Error("Votre compte vendeur doit être actif pour changer de plan.");
  }

  const expiresAt = new Date();
  expiresAt.setMonth(expiresAt.getMonth() + 1);

  await prisma.sellerProfile.update({
    where: { id: sellerProfile.id },
    data: {
      plan,
      planExpiresAt: expiresAt,
    },
  });

  return { success: true, plan, expiresAt };
}
