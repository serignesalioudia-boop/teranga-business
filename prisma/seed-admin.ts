import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";
import bcrypt from "bcryptjs";

async function main() {
  const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
  const prisma = new PrismaClient({ adapter });

  const adminEmail = "admin@terangabusiness.sn";
  const existing = await prisma.user.findUnique({ where: { email: adminEmail } });
  if (existing) {
    console.log("Admin déjà existant:", adminEmail);
    await prisma.$disconnect();
    return;
  }

  const hash = await bcrypt.hash("admin", 10);
  await prisma.user.create({
    data: {
      name: "Admin TB",
      email: adminEmail,
      passwordHash: hash,
      role: "ADMIN",
      isActive: true,
    },
  });
  console.log("Admin créé:", adminEmail, "/ admin");
  await prisma.$disconnect();
}

main().catch(console.error);
