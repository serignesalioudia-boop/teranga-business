import { NextResponse } from "next/server";
import { Pool } from "pg";

export const dynamic = "force-dynamic";

export async function GET() {
  const dbUrl = (process.env.DATABASE_URL ?? "").replace(/^\uFEFF/, "NOT SET");
  const masked = dbUrl.replace(/:[^:@]+@/, ":***@");

  try {
    const pool = new Pool({
      connectionString: (dbUrl || undefined),
      ssl: { rejectUnauthorized: false },
      connectionTimeoutMillis: 10000,
    });
    const res = await pool.query("SELECT 1 as test");
    await pool.end();
    return NextResponse.json({
      status: "ok",
      test: res.rows,
      databaseUrl: masked,
      nodeEnv: process.env.NODE_ENV,
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json(
      { status: "error", error: msg, databaseUrl: masked },
      { status: 500 }
    );
  }
}
