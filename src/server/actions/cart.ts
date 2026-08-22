"use server";

import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/session";
import { getCartSessionId, readCartSessionId, clearCartSessionId } from "@/lib/guest-session";

const cartItemInclude = {
  product: {
    include: {
      media: { where: { position: 0 }, take: 1, select: { url: true } },
      store: { select: { id: true, name: true, slug: true } },
    },
  },
} as const;

// ─── Helpers ──────────────────────────────────────────────

async function findUserCart(userId: string) {
  return prisma.cart.findUnique({
    where: { userId },
    include: { items: { include: cartItemInclude, orderBy: { createdAt: "asc" } } },
  });
}

async function findGuestCart(sessionId: string) {
  return prisma.cart.findFirst({
    where: { sessionId },
    include: { items: { include: cartItemInclude, orderBy: { createdAt: "asc" } } },
  });
}

// ─── Récupérer le panier (invité ou connecté) ─────────────

export async function getCart() {
  const user = await getCurrentUser();
  if (user) return findUserCart(user.id);
  const sessionId = await readCartSessionId();
  if (!sessionId) return null;
  return findGuestCart(sessionId);
}

// ─── Nombre d'articles dans le panier ─────────────────────

export async function getCartCount(): Promise<number> {
  const user = await getCurrentUser();

  if (user) {
    const cart = await prisma.cart.findUnique({
      where: { userId: user.id },
      include: { items: { select: { quantity: true } } },
    });
    return cart?.items.reduce((s, i) => s + i.quantity, 0) ?? 0;
  }

  const sessionId = await readCartSessionId();
  if (!sessionId) return 0;
  const cart = await prisma.cart.findFirst({
    where: { sessionId },
    include: { items: { select: { quantity: true } } },
  });
  return cart?.items.reduce((s, i) => s + i.quantity, 0) ?? 0;
}

// ─── Trouver ou créer le panier ───────────────────────────

async function getOrCreateCart(
  user: { id: string } | null,
  sessionId: string,
) {
  if (user && user.id) {
    const dbUser = await prisma.user.findUnique({ where: { id: user.id }, select: { id: true } });
    if (dbUser) {
      const existing = await prisma.cart.findUnique({ where: { userId: user.id } });
      return existing ?? prisma.cart.create({ data: { userId: user.id } });
    }
  }
  const existing = await prisma.cart.findFirst({ where: { sessionId } });
  return existing ?? prisma.cart.create({ data: { sessionId } });
}

// ─── Ajouter un produit au panier ─────────────────────────

export async function addToCart(productId: string, quantity = 1) {
  if (!productId || quantity < 1) throw new Error("Paramètres invalides.");

  const user = await getCurrentUser();
  let sessionId = "";

  if (!user) {
    try {
      sessionId = await getCartSessionId();
    } catch {
      throw new Error("Impossible de créer une session. Essayez de recharger la page.");
    }
  }

  const product = await prisma.product.findUnique({ where: { id: productId } });
  if (!product) throw new Error("Produit introuvable.");
  if (product.stock < quantity) throw new Error("Stock insuffisant.");

  const cart = await getOrCreateCart(user, sessionId);

  const existing = await prisma.cartItem.findUnique({
    where: { cartId_productId: { cartId: cart.id, productId } },
  });

  if (existing) {
    const newQty = existing.quantity + quantity;
    if (newQty > product.stock) throw new Error("Stock insuffisant.");
    await prisma.cartItem.update({ where: { id: existing.id }, data: { quantity: newQty } });
  } else {
    await prisma.cartItem.create({ data: { cartId: cart.id, productId, quantity } });
  }

  return getCartCount();
}

// ─── Mettre à jour la quantité ───────────────────────────

export async function updateCartItemQty(cartItemId: string, quantity: number) {
  if (quantity < 1) return removeFromCart(cartItemId);

  const user = await getCurrentUser();
  const item = await prisma.cartItem.findUnique({
    where: { id: cartItemId },
    include: { cart: true, product: true },
  });
  if (!item) throw new Error("Article introuvable.");

  if (user) {
    if (item.cart.userId !== user.id) throw new Error("Accès refusé.");
  } else {
    const sessionId = await getCartSessionId();
    if (item.cart.sessionId !== sessionId) throw new Error("Accès refusé.");
  }

  if (quantity > item.product.stock) throw new Error("Stock insuffisant.");

  await prisma.cartItem.update({ where: { id: cartItemId }, data: { quantity } });
  return getCartCount();
}

// ─── Supprimer un article ────────────────────────────────

export async function removeFromCart(cartItemId: string) {
  const user = await getCurrentUser();
  const item = await prisma.cartItem.findUnique({
    where: { id: cartItemId },
    include: { cart: true },
  });
  if (!item) throw new Error("Article introuvable.");

  if (user) {
    if (item.cart.userId !== user.id) throw new Error("Accès refusé.");
  } else {
    const sessionId = await getCartSessionId();
    if (item.cart.sessionId !== sessionId) throw new Error("Accès refusé.");
  }

  await prisma.cartItem.delete({ where: { id: cartItemId } });
  return getCartCount();
}

// ─── Vider le panier ─────────────────────────────────────

export async function clearCart() {
  const user = await getCurrentUser();

  if (user) {
    const cart = await prisma.cart.findUnique({ where: { userId: user.id } });
    if (cart) await prisma.cartItem.deleteMany({ where: { cartId: cart.id } });
  } else {
    const sessionId = await getCartSessionId();
    const cart = await prisma.cart.findFirst({ where: { sessionId } });
    if (cart) await prisma.cartItem.deleteMany({ where: { cartId: cart.id } });
  }

  return 0;
}

// ─── Fusion panier invité → connecté ─────────────────────

export async function mergeGuestCart() {
  const user = await getCurrentUser();
  if (!user) return;

  const sessionId = await getCartSessionId();
  const guestCart = await prisma.cart.findFirst({
    where: { sessionId },
    include: { items: true },
  });
  if (!guestCart || guestCart.items.length === 0) return;

  await clearCartSessionId();

  let userCart = await prisma.cart.findUnique({ where: { userId: user.id } });
  if (!userCart) {
    userCart = await prisma.cart.create({ data: { userId: user.id } });
  }

  for (const guestItem of guestCart.items) {
    const existing = await prisma.cartItem.findUnique({
      where: { cartId_productId: { cartId: userCart.id, productId: guestItem.productId } },
    });

    if (existing) {
      const product = await prisma.product.findUnique({ where: { id: guestItem.productId } });
      const maxQty = product?.stock ?? existing.quantity + guestItem.quantity;
      const newQty = Math.min(existing.quantity + guestItem.quantity, maxQty);
      await prisma.cartItem.update({ where: { id: existing.id }, data: { quantity: newQty } });
    } else {
      await prisma.cartItem.create({
        data: { cartId: userCart.id, productId: guestItem.productId, quantity: guestItem.quantity },
      });
    }
  }

  await prisma.cart.delete({ where: { id: guestCart.id } });
}
