"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Home,
  Package,
  ShoppingCart,
  Menu,
  X,
  MessageCircle,
  Search,
  Filter,
  ArrowLeft,
} from "lucide-react";
import { ProductCard } from "@/components/product/product-card";
import { AddToCartButton } from "@/components/product/add-to-cart-button";
import { CartBadge } from "@/components/cart/cart-badge";
import { DEFAULT_STORE_THEME, FONT_OPTIONS, type StoreThemeConfig } from "@/lib/store-theme";

type Product = {
  id: string;
  name: string;
  slug: string;
  price: number | string | bigint;
  discountPrice: number | string | bigint | null;
  ratingCount?: number;
  ratingAvg?: number | string | { toString(): string } | null;
  media: { url: string; alt: string | null }[];
  store?: { id?: string; name: string; slug?: string };
  category?: { name: string; slug: string };
};

type Category = {
  id: string;
  name: string;
  slug: string;
  count: number;
};

export function StoreProductsPage({
  store,
  products,
  categories,
  favoriteIds,
  currentCategory,
  currentSearch,
  currentSort,
  storeTheme,
}: {
  store: {
    name: string;
    slug: string;
    description: string | null;
    logoUrl: string | null;
    whatsapp: string | null;
  };
  products: Product[];
  categories: Category[];
  favoriteIds: Set<string>;
  currentCategory?: string;
  currentSearch?: string;
  currentSort?: string;
  storeTheme?: StoreThemeConfig | null;
}) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const themeCfg: StoreThemeConfig = storeTheme ?? DEFAULT_STORE_THEME;
  const S = {
    primary: themeCfg.primaryColor,
    secondary: themeCfg.secondaryColor,
    bg: themeCfg.backgroundColor,
    card: themeCfg.cardColor,
    text: themeCfg.textColor,
    radius: themeCfg.borderRadius,
  };

  const activeCat = categories.find((c) => c.id === currentCategory);

  const sortedProducts = [...products].sort((a, b) => {
    if (currentSort === "price_asc") return Number(a.price) - Number(b.price);
    if (currentSort === "price_desc") return Number(b.price) - Number(a.price);
    return 0;
  });

  function buildSortUrl(sort: string) {
    const params = new URLSearchParams();
    params.set("sort", sort);
    if (currentCategory) params.set("category", currentCategory);
    if (currentSearch) params.set("search", currentSearch);
    return `/store/${store.slug}/products?${params.toString()}`;
  }

  function buildCategoryUrl(catId: string | undefined) {
    const params = new URLSearchParams();
    params.set("sort", currentSort ?? "newest");
    if (catId) params.set("category", catId);
    if (currentSearch) params.set("search", currentSearch);
    return `/store/${store.slug}/products?${params.toString()}`;
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: S.bg, color: S.text }}>

      {/* ═══ HEADER ═══ */}
      <header className="sticky top-0 z-50 border-b border-[rgba(200,146,45,0.35)]" style={{ backgroundColor: S.secondary }}>
        <div className="mx-auto flex max-w-[1200px] items-center justify-between px-3 sm:px-5 py-2.5 sm:py-[15px]">
          <Link href={`/store/${store.slug}`} className="flex items-center gap-2 sm:gap-[10px] text-white no-underline">
            {store.logoUrl ? (
              <img src={store.logoUrl} alt={store.name} className="h-9 w-9 sm:h-[52px] sm:w-[52px] rounded-full border-2 bg-white object-cover shadow-[0_4px_14px_rgba(0,0,0,0.2)]" style={{ borderColor: S.primary }} />
            ) : (
              <div className="flex h-9 w-9 sm:h-[52px] sm:w-[52px] items-center justify-center rounded-full border-2 bg-white text-lg sm:text-2xl shadow-[0_4px_14px_rgba(0,0,0,0.2)]" style={{ borderColor: S.primary }}>
                <Package className="size-5 sm:size-6" style={{ color: S.primary }} />
              </div>
            )}
            <span className="text-sm sm:text-[1.25rem] font-bold truncate max-w-[120px] sm:max-w-none">{store.name}</span>
          </Link>

          <nav className="hidden items-center gap-[20px] md:flex">
            <Link href={`/store/${store.slug}`} className="flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium text-white transition">
              <Home className="size-4" /> Accueil
            </Link>
            <Link href={`/store/${store.slug}/products`} className="flex items-center gap-2 rounded-md px-3 py-2 text-sm font-bold text-white" style={{ backgroundColor: S.primary }}>
              <Package className="size-4" /> Produits
            </Link>
            <Link href={`/store/${store.slug}/cart`} className="relative flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium text-white transition">
              <ShoppingCart className="size-4" /> Panier
              <CartBadge />
            </Link>
          </nav>

          <div className="flex items-center gap-2 md:hidden">
            <Link href={`/store/${store.slug}/cart`} className="relative flex items-center text-white">
              <ShoppingCart className="size-5" /> <CartBadge />
            </Link>
            <button onClick={() => setMobileOpen(!mobileOpen)} className="text-2xl text-white">
              {mobileOpen ? <X /> : <Menu />}
            </button>
          </div>
        </div>

        {mobileOpen && (
          <div className="border-t border-white/10 px-5 py-4 md:hidden" style={{ backgroundColor: S.secondary }}>
            <nav className="flex flex-col gap-3">
              <Link href={`/store/${store.slug}`} className="flex items-center justify-center gap-2 rounded-md px-3 py-2 text-sm font-medium text-white transition" onClick={() => setMobileOpen(false)}>
                <Home className="size-4" /> Accueil
              </Link>
              <Link href={`/store/${store.slug}/products`} className="flex items-center justify-center gap-2 rounded-md px-3 py-2 text-sm font-bold text-white" style={{ backgroundColor: S.primary }} onClick={() => setMobileOpen(false)}>
                <Package className="size-4" /> Produits
              </Link>
              <Link href={`/store/${store.slug}/cart`} className="relative flex items-center justify-center gap-2 rounded-md px-3 py-2 text-sm font-medium text-white transition" onClick={() => setMobileOpen(false)}>
                <ShoppingCart className="size-4" /> Panier
                <CartBadge />
              </Link>
            </nav>
          </div>
        )}
      </header>

      {/* ═══ CONTENT ═══ */}
      <div className="mx-auto max-w-[1200px] px-3 sm:px-5 py-5 sm:py-8">

        {/* Page title + Back */}
        <div className="mb-4 sm:mb-6">
          <Link href={`/store/${store.slug}`} className="inline-flex items-center gap-1.5 sm:gap-2 rounded-lg border bg-white px-2.5 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm font-medium transition" style={{ borderColor: S.primary + "44", color: S.text }}>
            <ArrowLeft className="size-3.5 sm:size-4" />
            Retour
          </Link>
        </div>

        <div className="mb-4 sm:mb-6 flex items-center justify-between gap-3">
          <div>
            <h1 className="text-lg sm:text-2xl font-bold" style={{ color: S.text }}>Nos produits</h1>
            {activeCat ? (
              <p className="mt-0.5 sm:mt-1 text-xs sm:text-sm opacity-60" style={{ color: S.text }}>
                Catégorie : <span className="font-semibold">{activeCat.name}</span> — {sortedProducts.length} produit{sortedProducts.length > 1 ? "s" : ""}
              </p>
            ) : (
              <p className="mt-0.5 sm:mt-1 text-xs sm:text-sm opacity-60" style={{ color: S.text }}>
                {sortedProducts.length} produit{sortedProducts.length > 1 ? "s" : ""} au total
              </p>
            )}
          </div>
          <button onClick={() => setSidebarOpen(!sidebarOpen)} className="flex items-center gap-1.5 sm:gap-2 rounded-lg border bg-white px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm font-semibold transition md:hidden" style={{ borderColor: S.primary + "44", color: S.text }}>
            <Filter className="size-3.5 sm:size-4" /> Filtres
          </button>
        </div>

        <div className="flex gap-8">

          {/* ── SIDEBAR catégories ── */}
          <aside className={`w-[240px] flex-shrink-0 ${sidebarOpen ? "fixed inset-0 z-40 bg-black/40 md:relative md:bg-transparent" : "hidden md:block"}`}>
            {sidebarOpen && (
              <div className="absolute inset-0 md:hidden" onClick={() => setSidebarOpen(false)} />
            )}
            <div className="relative z-50 rounded-xl p-5 shadow-lg md:static" style={{ backgroundColor: S.card, borderRadius: S.radius }}>
              <div className="mb-4 flex items-center justify-between md:block">
                <h2 className="text-lg font-bold" style={{ color: S.text }}>Catégories</h2>
                <button onClick={() => setSidebarOpen(false)} className="md:hidden"><X className="size-5" /></button>
              </div>
              <nav className="flex flex-col gap-1.5">
                <Link
                  href={`/store/${store.slug}/products?sort=${currentSort ?? "newest"}${currentSearch ? `&search=${currentSearch}` : ""}`}
                  className="rounded-lg px-3 py-2.5 text-sm font-medium transition"
                  style={!currentCategory ? { backgroundColor: S.primary, color: "#fff" } : { color: S.text }}
                  onClick={() => setSidebarOpen(false)}
                >
                  Tous les produits
                  <span className="ml-1 text-xs opacity-70">({categories.reduce((s, c) => s + c.count, 0)})</span>
                </Link>
                {categories.map((cat) => (
                  <Link
                    key={cat.id}
                    href={`/store/${store.slug}/products?category=${cat.id}&sort=${currentSort ?? "newest"}${currentSearch ? `&search=${currentSearch}` : ""}`}
                    className="rounded-lg px-3 py-2.5 text-sm font-medium transition"
                    style={currentCategory === cat.id ? { backgroundColor: S.primary, color: "#fff" } : { color: S.text }}
                    onClick={() => setSidebarOpen(false)}
                  >
                    {cat.name}
                    <span className="ml-1 text-xs opacity-70">({cat.count})</span>
                  </Link>
                ))}
              </nav>
            </div>
          </aside>

          {/* ── PRODUCTS GRID ── */}
          <div className="flex-1">
            {/* Search + Sort */}
            <div className="mb-4 sm:mb-6 flex flex-col sm:flex-row sm:flex-wrap items-stretch sm:items-center gap-2 sm:gap-3">
              <form action={`/store/${store.slug}/products`} method="get" className="relative flex-1 min-w-0 sm:min-w-[200px]">
                {currentCategory && <input type="hidden" name="category" value={currentCategory} />}
                <input type="hidden" name="sort" value={currentSort ?? "newest"} />
                <input
                  type="text"
                  name="search"
                  defaultValue={currentSearch ?? ""}
                  placeholder="Rechercher un produit..."
                  className="w-full rounded-lg border bg-white px-3 sm:px-4 py-2 sm:py-2.5 pr-9 sm:pr-10 text-xs sm:text-sm outline-none transition"
                  style={{ borderColor: S.primary + "44" }}
                />
                <button type="submit" className="absolute right-2.5 sm:right-3 top-1/2 -translate-y-1/2" style={{ color: S.primary }}>
                  <Search className="size-3.5 sm:size-4" />
                </button>
              </form>

              <div className="flex gap-1.5 sm:gap-2 overflow-x-auto pb-1 sm:pb-0">
                {[
                  { value: "newest", label: "Nouveautés" },
                  { value: "price_asc", label: "Prix ↑" },
                  { value: "price_desc", label: "Prix ↓" },
                ].map((opt) => (
                  <Link
                    key={opt.value}
                    href={buildSortUrl(opt.value)}
                    className="whitespace-nowrap border bg-white px-2.5 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm font-medium transition"
                    style={(currentSort ?? "newest") === opt.value
                      ? { backgroundColor: S.primary, color: "#fff", borderRadius: S.radius }
                      : { borderColor: S.primary + "44", color: S.text, borderRadius: S.radius }
                    }
                  >
                    {opt.label}
                  </Link>
                ))}
              </div>
            </div>

            {currentSearch && (
              <div className="mb-4 flex items-center gap-2 text-sm" style={{ color: S.text }}>
                Résultats pour « <span className="font-bold">{currentSearch}</span> »
                <Link href={`/store/${store.slug}/products?sort=${currentSort ?? "newest"}${currentCategory ? `&category=${currentCategory}` : ""}`} style={{ color: S.primary }} className="underline">
                  ✕ Effacer
                </Link>
              </div>
            )}

            {sortedProducts.length > 0 ? (
              <div className="grid grid-cols-2 gap-5 sm:grid-cols-3 lg:grid-cols-4">
                {sortedProducts.map((p) => (
                  <div key={p.id} className="relative">
                    <ProductCard product={p} favoriteIds={favoriteIds} subtitle="category" variant="store" />
                    <AddToCartButton productId={p.id} />
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center gap-4 py-16 text-center">
                <div className="flex size-12 items-center justify-center rounded-full" style={{ backgroundColor: S.primary + "20" }}>
                  <ShoppingCart className="size-6" style={{ color: S.primary }} />
                </div>
                <p className="text-base font-semibold" style={{ color: S.text }}>Aucun produit trouvé</p>
                <p className="text-sm opacity-60" style={{ color: S.text }}>
                  {currentSearch
                    ? "Essayez avec d'autres mots-clés."
                    : "Cette boutique n'a pas encore ajouté de produits."}
                </p>
                <Link href={`/store/${store.slug}/products`} className="inline-flex items-center gap-2 rounded-lg bg-white px-5 py-2.5 text-sm font-bold text-white transition" style={{ backgroundColor: S.primary, borderRadius: S.radius }}>
                  Voir tous les produits
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ═══ FOOTER ═══ */}
      <footer className="px-4 sm:px-5 pt-10 sm:pt-[60px] pb-5 text-white" style={{ backgroundColor: S.secondary }}>
        <div className="mx-auto max-w-[1200px]">
          <div className="mb-6 sm:mb-8 grid grid-cols-1 sm:grid-cols-[repeat(auto-fit,minmax(200px,1fr))] gap-6 sm:gap-8">
            <div>
              <div className="mb-3 flex items-center gap-3 text-lg sm:text-[1.5rem] font-bold text-white">
                {store.logoUrl ? (
                  <img src={store.logoUrl} alt={store.name} className="h-8 w-8 sm:h-[46px] sm:w-[46px] rounded-full border-2 bg-white object-cover" style={{ borderColor: S.primary }} />
                ) : (
                  <span className="text-lg">🏪</span>
                )}
                <span className="truncate">{store.name}</span>
              </div>
              <p className="mb-4 text-xs sm:text-sm opacity-80">
                {store.description ?? "Votre boutique en ligne."}
              </p>
            </div>
            <div>
              <h4 className="mb-3 sm:mb-4 font-bold text-white text-sm">Liens</h4>
              <ul className="space-y-1.5 sm:space-y-2 text-xs sm:text-sm">
                <li><Link href={`/store/${store.slug}`} className="flex items-center gap-2 transition opacity-80 hover:opacity-100"><Home className="size-3.5" /> Accueil</Link></li>
                <li><Link href={`/store/${store.slug}/products`} className="flex items-center gap-2 transition opacity-80 hover:opacity-100"><Package className="size-3.5" /> Produits</Link></li>
                <li><Link href={`/store/${store.slug}/cart`} className="flex items-center gap-2 transition opacity-80 hover:opacity-100"><ShoppingCart className="size-3.5" /> Panier</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="mb-3 sm:mb-4 font-bold text-white text-sm">Contact</h4>
              <ul className="space-y-1.5 sm:space-y-2 text-xs sm:text-sm opacity-80">
                {store.whatsapp && <li><MessageCircle className="mr-2 inline size-3.5" /> {store.whatsapp}</li>}
                <li>Dakar, Sénégal</li>
              </ul>
            </div>
          </div>
          <div className="border-t border-white/20 pt-4 sm:pt-5 text-center text-xs sm:text-sm opacity-70">
            <p>&copy; 2026 {store.name}. Tous droits réservés. Propulsé par{" "}<Link href="/" className="font-bold no-underline" style={{ color: S.primary }}>Teranga Business</Link></p>
          </div>
        </div>
      </footer>
    </div>
  );
}
