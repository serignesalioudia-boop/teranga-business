import type { PrismaClient } from "@/generated/prisma/client";

// Client Prisma utilisable aussi bien à l'intérieur d'une transaction ($transaction)
// que sur le client principal : dans Prisma 7 le type TransactionClient n'est pas
// exporté, on reproduit donc le même contrat via Omit.
export type DbClient = Omit<
  PrismaClient,
  "$connect" | "$disconnect" | "$on" | "$transaction" | "$use" | "$extends"
>;

export class StockError extends Error {
  readonly productName: string;
  readonly available: number;

  constructor(productName: string, available: number) {
    super(
      `Stock insuffisant pour "${productName}" (disponible : ${available}).`,
    );
    this.name = "StockError";
    this.productName = productName;
    this.available = available;
  }
}

/**
 * Réserve du stock de façon atomique.
 *
 * Le `where: { stock: { gte: quantity } }` est exécuté par PostgreSQL dans la
 * même instruction que le décrément : deux commandes simultanées sur le dernier
 * article ne peuvent donc pas passer toutes les deux (avant, le stock était lu,
 * vérifié puis décrémenté en trois temps — fenêtre de race).
 */
export async function reserveStock(
  tx: DbClient,
  productId: string,
  quantity: number,
): Promise<void> {
  if (quantity <= 0) return;

  const product = await tx.product.findUnique({
    where: { id: productId },
    select: { name: true, isDigital: true, stock: true },
  });

  if (!product) throw new Error("Produit introuvable.");
  if (product.isDigital) return;

  const result = await tx.product.updateMany({
    where: { id: productId, stock: { gte: quantity } },
    data: { stock: { decrement: quantity }, soldCount: { increment: quantity } },
  });

  if (result.count === 0) {
    throw new StockError(product.name, product.stock);
  }
}

/**
 * Remet en stock les articles d'une sous-commande, une seule fois.
 *
 * L'idempotence est garantie par le drapeau `stockRestored` sur la sous-commande :
 * le UPDATE conditionnel n'agit que si le drapeau est encore à false, donc un
 * double appel (annulation + remboursement, par exemple) ne duplique jamais le
 * stock. Les produits digitaux ne sont pas concerned.
 */
export async function restockSubOrder(
  tx: DbClient,
  subOrderId: string,
): Promise<boolean> {
  const claimed = await tx.subOrder.updateMany({
    where: { id: subOrderId, stockRestored: false },
    data: { stockRestored: true },
  });

  if (claimed.count === 0) return false;

  const items = await tx.orderItem.findMany({
    where: { subOrderId },
    select: { productId: true, quantity: true },
  });

  for (const item of items) {
    if (!item.productId) continue;
    const updated = await tx.product.updateMany({
      where: { id: item.productId, isDigital: false },
      data: {
        stock: { increment: item.quantity },
        soldCount: { decrement: item.quantity },
      },
    });
    if (updated.count === 0) continue;
  }

  return true;
}

/**
 * Remet en stock toutes les sous-commandes d'une commande.
 * Utilisé quand une commande entière est annulée ou remboursée.
 */
export async function restockOrder(
  tx: DbClient,
  orderId: string,
): Promise<number> {
  const subOrders = await tx.subOrder.findMany({
    where: { orderId },
    select: { id: true },
  });

  let restored = 0;
  for (const subOrder of subOrders) {
    if (await restockSubOrder(tx, subOrder.id)) restored += 1;
  }
  return restored;
}
