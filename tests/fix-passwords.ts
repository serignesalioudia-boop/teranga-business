import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";
import bcrypt from "bcryptjs";
import { PrismaClient } from "../src/generated/prisma/client";

async function main() {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  const adapter = new PrismaPg(pool);
  const prisma = new PrismaClient({ adapter });

  const passwordHash = await bcrypt.hash("admin", 12);
  console.log("Generated hash:", passwordHash);

  const users = await prisma.user.updateMany({
    where: { email: { in: ["client@terangabusiness.sn", "vendeur@terangabusiness.sn", "admin@terangabusiness.sn"] } },
    data: { passwordHash },
  });
  console.log(`Updated ${users.count} users with new password hash`);

  // Verify
  const client = await prisma.user.findUnique({ where: { email: "client@terangabusiness.sn" } });
  const match = client!.passwordHash ? bcrypt.compareSync("admin", client!.passwordHash) : false;
  console.log(`Verify client password: ${match}`);

  await prisma.$disconnect();
  await pool.end();
}

main().catch((e) => { console.error(e); process.exit(1); });
