"use client";

import { StoreHeader } from "./store-header";
import { StoreSidebar } from "./store-sidebar";
import { WhatsAppFloat } from "@/components/social/whatsapp-float";

export function StoreLayout({
  store,
  categories,
  children,
}: {
  store: {
    name: string;
    slug: string;
    logoUrl: string | null;
    whatsapp: string | null;
  };
  categories: { id: string; name: string; slug: string; count: number }[];
  children: React.ReactNode;
}) {
  return (
    <>
      <StoreHeader
        storeName={store.name}
        storeSlug={store.slug}
        logoUrl={store.logoUrl}
        whatsapp={store.whatsapp}
      />
      <div className="mx-auto flex w-full max-w-7xl gap-0 px-4">
        <StoreSidebar storeSlug={store.slug} categories={categories} />
        <main className="flex-1 py-6">{children}</main>
      </div>
      {store.whatsapp && (
        <WhatsAppFloat storeWhatsapp={store.whatsapp} storeName={store.name} />
      )}
    </>
  );
}
