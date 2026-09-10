import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  const orderId = request.nextUrl.searchParams.get("orderId");
  if (!orderId) {
    return NextResponse.json({ error: "orderId required" }, { status: 400 });
  }

  const payment = await prisma.payment.findUnique({
    where: { orderId },
    select: { status: true, method: true, amount: true },
  });

  if (!payment) {
    return NextResponse.json({ status: "NOT_FOUND" }, { status: 404 });
  }

  return NextResponse.json({ status: payment.status });
}
