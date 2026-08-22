import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyWaveWebhook } from "@/lib/payments/wave";

export async function POST(request: NextRequest) {
  try {
    const rawBody = await request.text();
    const body = JSON.parse(rawBody);
    const signature = request.headers.get("x-wave-signature");

    const payload = verifyWaveWebhook(body, signature, rawBody);
    if (!payload) {
      return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
    }

    const payment = await prisma.payment.findFirst({
      where: { id: payload.reference },
      include: { order: true },
    });

    if (!payment) {
      const paymentByRef = await prisma.payment.findFirst({
        where: { orderId: payload.reference },
      });
      if (!paymentByRef) {
        return NextResponse.json({ error: "Payment not found" }, { status: 404 });
      }
      await updatePaymentStatus(paymentByRef.id, payload.status, payload.transactionId);
    } else {
      await updatePaymentStatus(payment.id, payload.status, payload.transactionId);
    }

    return NextResponse.json({ received: true });
  } catch {
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}

async function updatePaymentStatus(
  paymentId: string,
  status: "SUCCESS" | "FAILED" | "PENDING",
  transactionId?: string
) {
  const paymentStatus = status === "SUCCESS" ? "SUCCESS" : status === "FAILED" ? "FAILED" : "PENDING";

  await prisma.$transaction(async (tx) => {
    await tx.payment.update({
      where: { id: paymentId },
      data: {
        status: paymentStatus,
        providerTransactionId: transactionId ?? undefined,
      },
    });

    if (paymentStatus === "SUCCESS") {
      const payment = await tx.payment.findUnique({
        where: { id: paymentId },
        select: { orderId: true },
      });
      if (payment) {
        await tx.order.update({
          where: { id: payment.orderId },
          data: { paymentStatus: "SUCCESS" },
        });
      }
    }
  });
}
