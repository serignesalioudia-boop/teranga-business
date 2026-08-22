import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";
import { PrismaClient } from "../src/generated/prisma/client";

async function main() {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  const adapter = new PrismaPg(pool);
  const prisma = new PrismaClient({ adapter });

  const num = "TB-MSZJFVEQ-R1L5CM";

  // Delete in FK order
  await prisma.orderStatusHistory.deleteMany({ where: { order: { number: num } } });
  await prisma.orderItem.deleteMany({ where: { subOrder: { order: { number: num } } } });
  await prisma.delivery.deleteMany({ where: { subOrder: { order: { number: num } } } });
  await prisma.commission.deleteMany({ where: { order: { number: num } } });
  await prisma.paymentSplit.deleteMany({ where: { payment: { order: { number: num } } } });
  await prisma.payment.deleteMany({ where: { order: { number: num } } });
  await prisma.subOrder.deleteMany({ where: { order: { number: num } } });
  const deleted = await prisma.order.deleteMany({ where: { number: num } });
  console.log(`Deleted corrupted order ${num}: ${deleted.count}`);

  await prisma.$disconnect();
  await pool.end();
}

main().catch((e) => { console.error(e); process.exit(1); });
