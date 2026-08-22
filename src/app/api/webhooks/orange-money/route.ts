import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyOrangeMoneyWebhook } from "@/lib/payments/orange-money";

export async function POST(request: NextRequest) {
  try {
    const rawBody = await request.text();
    const body = JSON.parse(rawBody);
    const signature = request.headers.get("x-orange-signature");

    const payload = verifyOrangeMoneyWebhook(body, rawBody, signature);
    if (!payload) {
      return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
    }

    const payment = await prisma.payment.findFirst({
      where: { orderId: payload.reference },
    });

    if (!payment) {
      return NextResponse.json({ error: "Payment not found" }, { status: 404 });
    }

    const paymentStatus = payload.status === "SUCCESS" ? "SUCCESS" : payload.status === "FAILED" ? "FAILED" : "PENDING";

    await prisma.$transaction(async (tx) => {
      await tx.payment.update({
        where: { id: payment.id },
        data: {
          status: paymentStatus,
          providerTransactionId: payload.transactionId ?? undefined,
        },
      });

      if (paymentStatus === "SUCCESS") {
        await tx.order.update({
          where: { id: payment.orderId },
          data: { paymentStatus: "SUCCESS" },
        });
      }
    });

    return NextResponse.json({ received: true });
  } catch {
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
