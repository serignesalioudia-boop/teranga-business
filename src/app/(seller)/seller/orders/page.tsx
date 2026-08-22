import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { formatPrice } from "@/lib/format";
import { Badge } from "@/components/ui/badge";
import { SUBORDER_STATUS_LABELS, SUBORDER_STATUS_COLORS } from "@/lib/order-status";


export const metadata = { title: "Commandes vendeur — Teranga Business" };

export default async function SellerOrdersPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const sellerProfile = await prisma.sellerProfile.findUnique({
    where: { userId: user.id },
    include: { store: true },
  });

  if (!sellerProfile?.store) redirect("/");

  const subOrders = await prisma.subOrder.findMany({
    where: { storeId: sellerProfile.store.id },
    include: {
      order: { select: { number: true, createdAt: true } },
      items: { select: { productName: true, quantity: true } },
      delivery: { select: { status: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Commandes</h1>

      {subOrders.length === 0 ? (
        <p className="text-muted-foreground">Aucune commande.</p>
      ) : (
        <div className="space-y-3">
          {subOrders.map((sub) => (
            <Link
              key={sub.id}
              href={`/seller/orders/${sub.id}`}
              className="flex items-center justify-between rounded-xl border p-4 transition hover:border-primary/50 hover:bg-accent/50"
            >
              <div className="space-y-1">
                <p className="font-mono text-sm font-bold">{sub.order.number}</p>
                <p className="text-xs text-muted-foreground">
                  {sub.items.map((i) => `${i.productName} ×${i.quantity}`).join(", ")}
                </p>
                <p className="text-xs text-muted-foreground">
                  {new Date(sub.order.createdAt).toLocaleDateString("fr-SN")}
                </p>
              </div>
              <div className="text-right">
                <Badge className={SUBORDER_STATUS_COLORS[sub.status] ?? ""}>
                  {SUBORDER_STATUS_LABELS[sub.status] ?? sub.status}
                </Badge>
                <p className="mt-1 text-sm font-bold">{formatPrice(sub.payableAmount)}</p>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
