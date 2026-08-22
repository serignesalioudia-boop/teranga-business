import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";
import bcrypt from "bcryptjs";
import { PrismaClient } from "../src/generated/prisma/client";

async function main() {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  const adapter = new PrismaPg(pool);
  const prisma = new PrismaClient({ adapter });

  const hash = await bcrypt.hash("admin", 12);
  const admin = await prisma.user.upsert({
    where: { email: "admin@terangabusiness.sn" },
    update: {},
    create: {
      name: "Admin TB",
      email: "admin@terangabusiness.sn",
      passwordHash: hash,
      phone: "+221 77 000 00 00",
      role: "ADMIN",
    },
  });
  console.log("Admin cree:", admin.email, "| Mot de passe: admin");
  await prisma.$disconnect();
  await pool.end();
}
main().catch((e) => {
  console.error(e);
  process.exit(1);
});
