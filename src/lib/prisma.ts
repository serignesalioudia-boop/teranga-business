import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@/generated/prisma/client";
import { Pool } from "pg";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
  pgPool: Pool | undefined;
};

function createPrismaClient() {
  let connectionString = (process.env.DATABASE_URL ?? "")
    .replace(/^\uFEFF/, "")
    .trim();

  // Remove sslmode from the URL so we can control TLS purely via pool ssl
  // options (pg>=8 treats sslmode=require as verify-full, which fails against
  // Supabase's pooler self-signed chain).
  connectionString = connectionString
    .replace(/[?&]sslmode=[^&]*/gi, "")
    .replace(/\?$/, "");

  const pool = new Pool({
    connectionString,
    max: 10,
    idleTimeoutMillis: 30_000,
    connectionTimeoutMillis: 10_000,
    ssl: { rejectUnauthorized: false },
  });

  pool.on("error", (err) => {
    console.error("[pg] unexpected pool error", err.message);
  });

  globalForPrisma.pgPool = pool;

  const adapter = new PrismaPg(pool);
  return new PrismaClient({ adapter });
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
