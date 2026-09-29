import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";
import { PrismaClient } from "../src/generated/prisma/client";
import { reserveStock, restockSubOrder, StockError } from "../src/lib/stock";

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter: new PrismaPg(pool) });

let passed = 0;
let failed = 0;

function assert(label: string, condition: boolean, detail = "") {
  if (condition) {
    passed++;
    console.log(`  OK    ${label}`);
  } else {
    failed++;
    console.log(`  ECHEC ${label} ${detail}`);
  }
}

async function main() {
  const product = await prisma.product.findFirst({
    where: { isDigital: false },
    orderBy: { createdAt: "asc" },
    select: { id: true, name: true, stock: true, soldCount: true },
  });
  if (!product) throw new Error("Aucun produit non digital en base.");

  console.log(`Produit de test : "${product.name}" (stock ${product.stock})`);
  const originalStock = product.stock;
  const originalSold = product.soldCount;

  try {
    // ─── Test 1 : anti-survente ──────────────────────────────
    // On met le stock a 1 puis on tente deux reservations simultanees.
    await prisma.product.update({
      where: { id: product.id },
      data: { stock: 1, soldCount: 0 },
    });

    const results = await Promise.allSettled([
      reserveStock(prisma, product.id, 1),
      reserveStock(prisma, product.id, 1),
    ]);

    const ok = results.filter((r) => r.status === "fulfilled").length;
    const refused = results.filter(
      (r) => r.status === "rejected" && r.reason instanceof StockError,
    ).length;

    const after = await prisma.product.findUnique({
      where: { id: product.id },
      select: { stock: true, soldCount: true },
    });

    assert("1 seule reservation aboutit sur le dernier article", ok === 1, `obtenu ${ok}`);
    assert("la 2e est rejetee avec StockError", refused === 1, `obtenu ${refused}`);
    assert("stock final = 0 (pas de survente)", after?.stock === 0, `obtenu ${after?.stock}`);
    assert("soldCount = 1", after?.soldCount === 1, `obtenu ${after?.soldCount}`);

    // ─── Test 2 : restock idempotent ─────────────────────────
    await prisma.product.update({
      where: { id: product.id },
      data: { stock: 10, soldCount: 0 },
    });

    const store = await prisma.store.findFirst({
      select: { id: true, sellerProfileId: true },
    });
    if (!store) throw new Error("Aucune boutique en base.");

    // Commande jetable, supprimee a la fin.
    const order = await prisma.order.create({
      data: {
        number: `TEST-RESTOCK-${Date.now()}`,
        status: "PENDING",
        paymentStatus: "PENDING",
        subtotal: 0n,
        deliveryTotal: 0n,
        commissionTotal: 0n,
        grandTotal: 0n,
      },
    });
    const subOrder = await prisma.subOrder.create({
      data: {
        orderId: order.id,
        storeId: store.id,
        sellerProfileId: store.sellerProfileId,
        commissionRateBp: 500,
        status: "PENDING",
      },
    });
    await prisma.orderItem.create({
      data: {
        subOrderId: subOrder.id,
        productId: product.id,
        productName: product.name,
        unitPrice: 1000n,
        quantity: 3,
        lineTotal: 3000n,
      },
    });

    // On simule la reservation initiale.
    await reserveStock(prisma, product.id, 3);
    const afterReserve = await prisma.product.findUnique({
      where: { id: product.id },
      select: { stock: true },
    });
    assert("stock apres reservation de 3 = 7", afterReserve?.stock === 7, `obtenu ${afterReserve?.stock}`);

    const first = await prisma.$transaction((tx) => restockSubOrder(tx, subOrder.id));
    const second = await prisma.$transaction((tx) => restockSubOrder(tx, subOrder.id));

    const afterRestock = await prisma.product.findUnique({
      where: { id: product.id },
      select: { stock: true, soldCount: true },
    });

    assert("1er restock effectue", first === true);
    assert("2e restock sans effet (idempotent)", second === false);
    assert("stock revenu a 10", afterRestock?.stock === 10, `obtenu ${afterRestock?.stock}`);
    assert("soldCount revenu a 0", afterRestock?.soldCount === 0, `obtenu ${afterRestock?.soldCount}`);

    // ─── Test 3 : restock d'une commande entiere ─────────────
    const sub2 = await prisma.subOrder.create({
      data: {
        orderId: order.id,
        storeId: store.id,
        sellerProfileId: store.sellerProfileId,
        commissionRateBp: 500,
        status: "PENDING",
      },
    });
    await prisma.orderItem.create({
      data: {
        subOrderId: sub2.id,
        productId: product.id,
        productName: product.name,
        unitPrice: 1000n,
        quantity: 2,
        lineTotal: 2000n,
      },
    });
    await reserveStock(prisma, product.id, 2); // stock 10 -> 8

    const { restockOrder } = await import("../src/lib/stock");
    const count = await prisma.$transaction((tx) => restockOrder(tx, order.id));
    const finalStock = await prisma.product.findUnique({
      where: { id: product.id },
      select: { stock: true },
    });

    assert("restockOrder a bien rejoue 1 sous-commande", count === 1, `obtenu ${count}`);
    assert("stock revenu a 10 apres annulation globale", finalStock?.stock === 10, `obtenu ${finalStock?.stock}`);

    // Nettoyage
    await prisma.order.delete({ where: { id: order.id } });
    console.log("  (commande de test supprimee)");
  } finally {
    await prisma.product.update({
      where: { id: product.id },
      data: { stock: originalStock, soldCount: originalSold },
    });
    console.log(`Stock restaure : ${originalStock} (soldCount ${originalSold})`);
  }

  console.log(`\nResultat : ${passed} OK / ${failed} ECHEC`);
  if (failed > 0) process.exitCode = 1;
}

main()
  .catch((e) => {
    console.error("ERREUR:", e);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
