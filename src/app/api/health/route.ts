import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const userCount = await prisma.user.count();
    const dbUrl = process.env.DATABASE_URL ?? "NOT SET";
    const masked = dbUrl.replace(/:[^:@]+@/, ":***@");
    return NextResponse.json({
      status: "ok",
      userCount,
      databaseUrl: masked,
      nodeEnv: process.env.NODE_ENV,
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ status: "error", error: msg }, { status: 500 });
  }
}
