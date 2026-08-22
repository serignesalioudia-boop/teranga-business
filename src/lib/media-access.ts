import type { Session } from "next-auth";

import { Role, SellerStatus } from "@/generated/prisma/enums";
import { prisma } from "@/lib/prisma";

export type MediaTarget = "product" | "store";

export async function requireMediaActor(session: Session | null) {
  if (!session?.user?.id) return null;

  const sellerProfile =
    session.user.role === Role.ADMIN
      ? null
      : await prisma.sellerProfile.findUnique({
          where: { userId: session.user.id },
        });

  if (
    session.user.role !== Role.ADMIN &&
    (!sellerProfile || sellerProfile.status !== SellerStatus.ACTIVE)
  ) {
    return null;
  }

  return {
    userId: session.user.id,
    isAdmin: session.user.role === Role.ADMIN,
    sellerProfileId: sellerProfile?.id ?? null,
  };
}

export async function assertCanManageTarget(
  actor: { isAdmin: boolean; sellerProfileId: string | null },
  target: MediaTarget,
  targetId: string,
): Promise<boolean> {
  if (actor.isAdmin) return true;

  if (target === "product") {
    const product = await prisma.product.findUnique({
      where: { id: targetId },
      select: { store: { select: { sellerProfileId: true } } },
    });
    return product?.store.sellerProfileId === actor.sellerProfileId;
  }

  const store = await prisma.store.findUnique({
    where: { id: targetId },
    select: { sellerProfileId: true },
  });
  return store?.sellerProfileId === actor.sellerProfileId;
}

export async function isMediaOwnerOrAdmin(
  actor: { isAdmin: boolean; sellerProfileId: string | null },
  mediaId: string,
): Promise<boolean> {
  if (actor.isAdmin) return true;

  const media = await prisma.mediaAsset.findUnique({
    where: { id: mediaId },
    select: {
      productId: true,
      storeId: true,
      product: { select: { store: { select: { sellerProfileId: true } } } },
      store: { select: { sellerProfileId: true } },
    },
  });
  if (!media) return false;

  if (media.productId) {
    return media.product?.store.sellerProfileId === actor.sellerProfileId;
  }
  if (media.storeId) {
    return media.store?.sellerProfileId === actor.sellerProfileId;
  }
  return false;
}
