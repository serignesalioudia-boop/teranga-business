import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";
import { PrismaClient } from "../src/generated/prisma/client";

async function main() {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  const adapter = new PrismaPg(pool);
  const prisma = new PrismaClient({ adapter });

  try {
    console.log("=== ÉTAT DE LA BASE ===\n");

    // 1. Users
    const users = await prisma.user.findMany({ select: { id: true, name: true, email: true, role: true } });
    console.log(`Users (${users.length}):`);
    users.forEach(u => console.log(`  - ${u.name} (${u.email}) [${u.role}]`));

    // 2. Stores
    const stores = await prisma.store.findMany({ select: { id: true, name: true, slug: true, isActive: true } });
    console.log(`\nStores (${stores.length}):`);
    stores.forEach(s => console.log(`  - ${s.name} (${s.slug}) [active=${s.isActive}]`));

    // 3. Products
    const products = await prisma.product.findMany({ select: { id: true, name: true, slug: true, price: true, stock: true, status: true, storeId: true } });
    console.log(`\nProducts (${products.length}):`);
    products.forEach(p => console.log(`  - ${p.name} — ${p.price} FCFA, stock=${p.stock} [${p.status}]`));

    // 4. Categories
    const categories = await prisma.category.findMany({ select: { id: true, name: true, slug: true } });
    console.log(`\nCategories (${categories.length}):`);
    categories.forEach(c => console.log(`  - ${c.name} (${c.slug})`));

    // 5. Addresses
    const addresses = await prisma.address.findMany({ select: { id: true, userId: true, label: true, city: true } });
    console.log(`\nAddresses (${addresses.length}):`);
    addresses.forEach(a => console.log(`  - ${a.label} — ${a.city} (user=${a.userId})`));

    // 6. Orders
    const orders = await prisma.order.findMany({ select: { id: true, number: true, status: true, paymentStatus: true, grandTotal: true } });
    console.log(`\nOrders (${orders.length}):`);
    orders.forEach(o => console.log(`  - ${o.number} [${o.status}/${o.paymentStatus}] ${o.grandTotal} FCFA`));

    // 7. SellerProfile
    const sellers = await prisma.sellerProfile.findMany({ select: { id: true, userId: true, status: true } });
    console.log(`\nSellerProfiles (${sellers.length}):`);
    sellers.forEach(s => console.log(`  - ${s.id} [${s.status}]`));

  } finally {
    await prisma.$disconnect();
    await pool.end();
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
