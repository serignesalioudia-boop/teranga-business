import { notFound } from "next/navigation";
import { getStoreBySlug } from "@/server/actions/stores";
import { getCart } from "@/server/actions/cart";
import { StoreCartPage } from "@/components/cart/store-cart-page";
import { serialize } from "@/lib/serialize";
import type { StoreCartItem } from "@/components/cart/store-cart-page";

type Props = {
  params: Promise<{ slug: string }>;
};


export default async function StoreCart({ params }: Props) {
  const { slug } = await params;

  const store = await getStoreBySlug(slug);
  if (!store) notFound();

  const cart = await getCart();
  const rawItems = cart?.items ?? [];
  const allItems = serialize(rawItems) as unknown as StoreCartItem[];

  const items = allItems.filter((item) => item.product.store.slug === slug);

  return (
    <StoreCartPage
      items={items}
      storeSlug={store.slug}
      storeName={store.name}
      storeLogoUrl={store.logoUrl}
      whatsapp={store.whatsapp}
      qrWaveUrl={store.qrWaveUrl}
      qrOrangeMoneyUrl={store.qrOrangeMoneyUrl}
    />
  );
}
