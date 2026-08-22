import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";
import bcrypt from "bcryptjs";
import { PrismaClient } from "../src/generated/prisma/client";

async function main() {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  const adapter = new PrismaPg(pool);
  const prisma = new PrismaClient({ adapter });

  const users = await prisma.user.findMany({
    select: { id: true, email: true, name: true, role: true, isActive: true, passwordHash: true },
  });

  for (const u of users) {
    const hash = u.passwordHash ?? "NO HASH";
    let match = false;
    if (u.passwordHash) {
      match = bcrypt.compareSync("admin", u.passwordHash);
    }
    console.log(`${u.email} [${u.role}] active=${u.isActive} hashLen=${hash.length} match=${match} hash=${hash.substring(0, 20)}...`);
  }

  await prisma.$disconnect();
  await pool.end();
}

main().catch((e) => { console.error(e); process.exit(1); });
