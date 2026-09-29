import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/session";

export async function GET(request: NextRequest) {
  const orderId = request.nextUrl.searchParams.get("orderId");
  if (!orderId) {
    return NextResponse.json({ error: "orderId required" }, { status: 400 });
  }

  // Le statut d'un paiement ne doit être lisible que par son propriétaire
  // (l'acheteur) ou par un administrateur.
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Non autorisé." }, { status: 401 });
  }

  const payment = await prisma.payment.findUnique({
    where: { orderId },
    select: {
      status: true,
      method: true,
      amount: true,
      order: { select: { userId: true, guestPhone: true } },
    },
  });

  if (!payment) {
    return NextResponse.json({ status: "NOT_FOUND" }, { status: 404 });
  }

  const isAdmin = user.role === "ADMIN";
  const isBuyer = payment.order.userId === user.id;
  // Commande invité : autorisée si l'e-mail de session correspond, sinon non.
  if (!isAdmin && !isBuyer) {
    return NextResponse.json({ error: "Non autorisé." }, { status: 403 });
  }

  return NextResponse.json({ status: payment.status });
}
