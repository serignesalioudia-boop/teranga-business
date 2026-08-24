export const dynamic = "force-dynamic";

import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getCart } from "@/server/actions/cart";
import { getUserAddresses } from "@/server/actions/addresses";
import { CheckoutClient } from "./checkout-client";
import { serialize } from "@/lib/serialize";
import { prisma } from "@/lib/prisma";


export const metadata = {
  title: "Checkout — Teranga Business",
};

export default async function CheckoutPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) redirect("/login?callbackUrl=/checkout");

  let cart;
  try {
    cart = await getCart();
  } catch (e) {
    console.error("[CheckoutPage] Cart error:", e);
    redirect("/cart");
  }

  const addresses = await getUserAddresses().catch(() => []);

  if (!cart || cart.items.length === 0) redirect("/cart");

  let storeQrMap: Record<string, string | null> = {};
  try {
    const storeIds = [...new Set(cart.items.map((i) => i.product.store.id))];
    const stores = await prisma.store.findMany({
      where: { id: { in: storeIds } },
      select: { id: true, qrCodeUrl: true, name: true },
    });
    storeQrMap = Object.fromEntries(stores.map((s) => [s.id, s.qrCodeUrl]));
  } catch (e) {
    console.error("[CheckoutPage] Store fetch error:", e);
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <h1 className="mb-6 text-2xl font-bold">Finaliser la commande</h1>
      <CheckoutClient
        cartItems={serialize(cart.items) as unknown as any}
        addresses={serialize(addresses) as unknown as any}
        storeQrMap={storeQrMap}
      />
    </div>
  );
}
