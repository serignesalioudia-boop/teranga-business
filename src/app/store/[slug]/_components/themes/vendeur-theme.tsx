"use client";

import { useState } from "react";
import Link from "next/link";
import {
  MessageCircle,
  Search,
  Menu,
  X,
  Star,
  ShoppingCart,
  Shield,
  Package,
  Home,
  ShoppingBag,
  Truck,
} from "lucide-react";
import { ProductCard } from "@/components/product/product-card";
import { AddToCartButton } from "@/components/product/add-to-cart-button";
import { CartBadge } from "@/components/cart/cart-badge";
import { storeThemeToCSS, DEFAULT_STORE_THEME, FONT_OPTIONS, type StoreThemeConfig } from "@/lib/store-theme";
import type { ThemeProps } from "./types";

export function VendeurTheme({
  store,
  products,
  featuredProducts,
  categories,
  favoriteIds,
  storeSlug,
  currentCategory,
  currentSearch,
  currentSort,
  storeTheme,
}: ThemeProps) {
  const themeCfg: StoreThemeConfig = storeTheme ?? DEFAULT_STORE_THEME;
  const cssVars = storeThemeToCSS(themeCfg);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [sortOpen, setSortOpen] = useState(false);

  const totalProducts = products.length;

  const sortedProducts = [...products].sort((a, b) => {
    if (currentSort === "price_asc") return Number(a.price) - Number(b.price);
    if (currentSort === "price_desc") return Number(b.price) - Number(a.price);
    return 0;
  });

  const fontCss = FONT_OPTIONS.find((f) => f.value === themeCfg.fontFamily)?.css ?? "'Inter', sans-serif";

  const S = {
    primary: themeCfg.primaryColor,
    secondary: themeCfg.secondaryColor,
    bg: themeCfg.backgroundColor,
    card: themeCfg.cardColor,
    text: themeCfg.textColor,
    radius: themeCfg.borderRadius,
    font: fontCss,
  };

  return (
    <div style={cssVars} className="min-h-screen" data-store-theme>

      {/* ══════════ HEADER ══════════ */}
      <header className="sticky top-0 z-50 border-b border-[rgba(200,146,45,0.35)]" style={{ backgroundColor: S.secondary }}>
        <div className="mx-auto flex max-w-[1200px] items-center justify-between px-3 sm:px-5 py-2.5 sm:py-3">
          <Link href={`/store/${storeSlug}`} className="flex items-center gap-2 sm:gap-3 text-white no-underline">
            {store.logoUrl ? (
              <img
                src={store.logoUrl}
                alt={store.name}
                className="h-9 w-9 sm:h-[52px] sm:w-[52px] rounded-full border-2 bg-white object-cover shadow-lg"
                style={{ borderColor: S.primary }}
              />
            ) : (
              <div
                className="flex h-9 w-9 sm:h-[52px] sm:w-[52px] items-center justify-center rounded-full border-2 bg-white text-lg sm:text-2xl shadow-lg"
                style={{ borderColor: S.primary }}
              >
                🏪
              </div>
            )}
            <span className="text-sm sm:text-[1.25rem] font-bold truncate max-w-[140px] sm:max-w-none">
              {store.name}
            </span>
          </Link>

          <nav className="hidden items-center gap-3 sm:gap-5 md:flex">
            <Link
              href={`/store/${storeSlug}`}
              className="flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium text-white transition"
              style={{ ["--hover-bg" as string]: S.primary }}
            >
              <Home className="size-4" /> Accueil
            </Link>
            <Link
              href={`/store/${storeSlug}/products`}
              className="flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium text-white transition"
            >
              <Package className="size-4" /> Produits
            </Link>
            <Link
              href={`/store/${storeSlug}/cart`}
              className="relative flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium text-white transition"
            >
              <ShoppingCart className="size-4" /> Panier
              <CartBadge />
            </Link>
          </nav>

          <div className="flex items-center gap-2 md:hidden">
            <Link
              href={`/store/${storeSlug}/cart`}
              className="relative flex items-center text-white"
            >
              <ShoppingCart className="size-5" /> <CartBadge />
            </Link>
            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              className="text-xl sm:text-2xl text-white"
            >
              {mobileOpen ? <X /> : <Menu />}
            </button>
          </div>
        </div>

        {mobileOpen && (
          <div className="border-t border-white/10 px-5 py-4 md:hidden" style={{ backgroundColor: S.secondary }}>
            <nav className="flex flex-col gap-3">
              <Link
                href={`/store/${storeSlug}`}
                className="flex items-center justify-center gap-2 rounded-md px-3 py-2.5 text-sm font-medium text-white transition"
                onClick={() => setMobileOpen(false)}
              >
                <Home className="size-4" /> Accueil
              </Link>
              <Link
                href={`/store/${storeSlug}/products`}
                className="flex items-center justify-center gap-2 rounded-md px-3 py-2.5 text-sm font-medium text-white transition"
                onClick={() => setMobileOpen(false)}
              >
                <Package className="size-4" /> Produits
              </Link>
              <Link
                href={`/store/${storeSlug}/cart`}
                className="relative flex items-center justify-center gap-2 rounded-md px-3 py-2.5 text-sm font-medium text-white transition"
                onClick={() => setMobileOpen(false)}
              >
                <ShoppingCart className="size-4" /> Panier
                <CartBadge />
              </Link>
            </nav>
          </div>
        )}
      </header>

      {/* ══════════ HERO ══════════ */}
      <section
        className="px-4 sm:px-5 py-10 sm:py-14 md:py-[60px]"
        style={{
          background: `linear-gradient(135deg, ${S.secondary} 0%, ${S.primary} 100%)`,
        }}
      >
        <div className="mx-auto grid max-w-[1200px] items-center gap-6 sm:gap-10 md:grid-cols-2">
          <div className="text-white text-center md:text-left">
            <div className="mb-3 sm:mb-4 inline-block rounded-full px-3 sm:px-4 py-1 sm:py-1.5 text-xs sm:text-sm font-bold" style={{ backgroundColor: S.primary }}>
              Bienvenue dans {store.name}
            </div>
            <h1 className="mb-3 sm:mb-4 text-2xl sm:text-[2.2rem] md:text-[2.8rem] font-bold leading-tight">
              Votre boutique de <br />
              <span style={{ color: S.primary + "cc" }}>produits</span>
            </h1>
            <p className="mb-5 sm:mb-6 mx-auto md:mx-0 max-w-[500px] text-sm sm:text-base md:text-[1.1rem] opacity-90 px-2 md:px-0">
              {store.description ?? `Découvrez une sélection de produits de qualité chez ${store.name}.`}
            </p>

            <div className="mb-6 sm:mb-8 flex flex-wrap justify-center md:justify-start gap-3 sm:gap-4">
              <a
                href="#produits"
                className="inline-flex items-center gap-2 rounded-lg px-5 sm:px-7 py-3 sm:py-3.5 text-sm sm:text-base md:text-[1.1rem] font-bold text-white transition"
                style={{ backgroundColor: S.primary }}
              >
                <ShoppingCart className="size-4 sm:size-5" /> Commander
              </a>
              <a
                href="#categories"
                className="inline-flex items-center gap-2 rounded-lg border-2 border-white px-5 sm:px-7 py-3 sm:py-3.5 text-sm sm:text-base md:text-[1.1rem] font-bold text-white transition hover:bg-white"
              >
                Catégories
              </a>
            </div>

            <div className="flex justify-center md:justify-start gap-6 sm:gap-10">
              <div>
                <span className="block text-xl sm:text-[1.8rem] font-bold" style={{ color: S.primary }}>{totalProducts}</span>
                <span className="text-[10px] sm:text-sm opacity-80">Produits</span>
              </div>
              <div>
                <span className="block text-xl sm:text-[1.8rem] font-bold" style={{ color: S.primary }}>1 200+</span>
                <span className="text-[10px] sm:text-sm opacity-80">Clients</span>
              </div>
              <div>
                <span className="block text-xl sm:text-[1.8rem] font-bold" style={{ color: S.primary }}>100%</span>
                <span className="text-[10px] sm:text-sm opacity-80">Sécurisé</span>
              </div>
            </div>
          </div>

          <div className="relative flex justify-center">
            <div className="h-[200px] w-[200px] sm:h-[280px] sm:w-[280px] md:h-[340px] md:w-[340px] overflow-hidden rounded-lg border-4 bg-white shadow-2xl" style={{ borderColor: S.primary + "aa" }}>
              {store.logoUrl ? (
                <img
                  src={store.bannerUrl ?? store.logoUrl}
                  alt={store.name}
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-4xl sm:text-5xl md:text-[6rem] text-white" style={{ backgroundColor: S.primary }}>
                  🏪
                </div>
              )}
            </div>

            {categories.length > 0 && (
              <>
                <div className="absolute -right-1 sm:-right-2 top-[5%] sm:top-[10%] rounded-[30px] border bg-white px-3 sm:px-5 py-1.5 sm:py-2.5 shadow-lg" style={{ borderColor: S.primary + "44" }}>
                  <Package className="mr-1 sm:mr-2 inline size-3.5 sm:size-4" style={{ color: S.primary }} />
                  <span className="text-[10px] sm:text-sm font-semibold" style={{ color: S.text }}>{categories[0].name}</span>
                </div>
                {categories.length > 1 && (
                  <div className="absolute -left-1 sm:-left-2 bottom-[5%] sm:bottom-[10%] rounded-[30px] border bg-white px-3 sm:px-5 py-1.5 sm:py-2.5 shadow-lg" style={{ borderColor: S.primary + "44" }}>
                    <Package className="mr-1 sm:mr-2 inline size-3.5 sm:size-4" style={{ color: S.primary }} />
                    <span className="text-[10px] sm:text-sm font-semibold" style={{ color: S.text }}>{categories[1].name}</span>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </section>

      {/* ══════════ PRODUITS VEDETTES ══════════ */}
      {featuredProducts.length > 0 && (
        <section className="px-4 sm:px-5 py-10 sm:py-14 md:py-[60px]" style={{ backgroundColor: S.bg }}>
          <div className="mx-auto max-w-[1200px]">
            <div className="mb-6 sm:mb-8 flex items-center justify-between">
              <h2 className="text-lg sm:text-[1.5rem] md:text-[2rem] font-bold" style={{ color: S.text }}>Produits vedettes</h2>
              <a href="#produits" className="text-xs sm:text-sm font-semibold" style={{ color: S.primary }}>
                Voir tout →
              </a>
            </div>
            <div className="grid grid-cols-2 gap-3 sm:gap-6">
              {featuredProducts.map((p) => (
                <div key={p.id} className="relative">
                  <ProductCard product={p} favoriteIds={favoriteIds} subtitle="category" variant="store" />
                  <AddToCartButton productId={p.id} storeSlug={storeSlug} />
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ══════════ CATEGORIES ══════════ */}
      {categories.length > 0 && (
        <section id="categories" className="px-4 sm:px-5 py-10 sm:py-14 md:py-[60px]" style={{ backgroundColor: S.bg }}>
          <div className="mx-auto max-w-[1200px]">
            <div className="mb-6 sm:mb-8 text-center">
              <h2 className="text-lg sm:text-[1.5rem] md:text-[2rem] font-bold" style={{ color: S.text }}>Nos catégories</h2>
              <p className="text-xs sm:text-sm opacity-60" style={{ color: S.text }}>Explorez nos rayons</p>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-[repeat(auto-fit,minmax(150px,1fr))] gap-3 sm:gap-5">
              {categories.map((cat) => (
                <Link
                  key={cat.id}
                  href={`/store/${storeSlug}/category/${cat.slug}`}
                  className="p-4 sm:p-6 text-center shadow-[0_2px_10px_rgba(0,0,0,0.06)] transition hover:-translate-y-1.5 hover:shadow-[0_8px_25px_rgba(0,0,0,0.1)]"
                  style={{ backgroundColor: S.card, borderRadius: S.radius }}
                >
                  <div className="mb-2 sm:mb-3 text-2xl sm:text-[2.5rem]" style={{ color: S.primary }}>📦</div>
                  <h3 className="text-xs sm:text-sm font-semibold" style={{ color: S.text }}>{cat.name}</h3>
                  <p className="mt-0.5 sm:mt-1 text-[10px] sm:text-xs opacity-60" style={{ color: S.text }}>{cat.count} produits</p>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ══════════ PRODUCTS ══════════ */}
      <section id="produits" className="px-4 sm:px-5 pb-10 sm:pb-[60px] pt-4" style={{ backgroundColor: S.bg }}>
        <div className="mx-auto max-w-[1200px]">
          <div className="mb-4 sm:mb-6 flex flex-wrap items-center justify-between gap-3 sm:gap-4">
            <h2 className="text-lg sm:text-[1.5rem] md:text-[2rem] font-bold" style={{ color: S.text }}>Nos produits</h2>
            <div className="flex items-center gap-2 sm:gap-3">
              <form
                action={`/store/${storeSlug}`}
                method="get"
                className="relative hidden sm:block"
              >
                <input
                  type="text"
                  name="search"
                  defaultValue={currentSearch ?? ""}
                  placeholder="Rechercher..."
                  className="w-[180px] md:w-[220px] rounded-lg border bg-white px-4 py-2 text-sm outline-none transition"
                  style={{ borderColor: S.primary + "44", borderRadius: S.radius }}
                />
              </form>
              <div className="relative">
                <button
                  onClick={() => setSortOpen(!sortOpen)}
                  className="px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm font-semibold text-white transition"
                  style={{ backgroundColor: S.primary, borderRadius: S.radius }}
                >
                  Trier ▾
                </button>
                {sortOpen && (
                  <div className="absolute right-0 top-full z-10 mt-1 w-44 sm:w-48 overflow-hidden shadow-lg" style={{ borderRadius: S.radius, backgroundColor: S.card, border: `1px solid ${S.primary}33` }}>
                    <Link
                      href={`/store/${storeSlug}?sort=newest${currentCategory ? `&category=${currentCategory}` : ""}${currentSearch ? `&search=${currentSearch}` : ""}`}
                      className="block px-4 py-2.5 text-sm transition"
                      style={{ color: S.text }}
                      onClick={() => setSortOpen(false)}
                    >
                      Nouveautés
                    </Link>
                    <Link
                      href={`/store/${storeSlug}?sort=price_asc${currentCategory ? `&category=${currentCategory}` : ""}${currentSearch ? `&search=${currentSearch}` : ""}`}
                      className="block px-4 py-2.5 text-sm transition"
                      style={{ color: S.text }}
                      onClick={() => setSortOpen(false)}
                    >
                      Prix croissant
                    </Link>
                    <Link
                      href={`/store/${storeSlug}?sort=price_desc${currentCategory ? `&category=${currentCategory}` : ""}${currentSearch ? `&search=${currentSearch}` : ""}`}
                      className="block px-4 py-2.5 text-sm transition"
                      style={{ color: S.text }}
                      onClick={() => setSortOpen(false)}
                    >
                      Prix décroissant
                    </Link>
                    <Link
                      href={`/store/${storeSlug}?sort=popular${currentCategory ? `&category=${currentCategory}` : ""}${currentSearch ? `&search=${currentSearch}` : ""}`}
                      className="block px-4 py-2.5 text-sm transition"
                      style={{ color: S.text }}
                      onClick={() => setSortOpen(false)}
                    >
                      Populaires
                    </Link>
                  </div>
                )}
              </div>
            </div>
          </div>

          {sortedProducts.length > 0 ? (
            <div className="grid grid-cols-2 gap-3 sm:gap-6">
              {sortedProducts.map((p) => (
                <div key={p.id} className="relative">
                  <ProductCard product={p} favoriteIds={favoriteIds} subtitle="category" variant="store" />
                  <AddToCartButton productId={p.id} storeSlug={storeSlug} />
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center gap-4 py-12 sm:py-16 text-center">
              <div className="flex size-10 sm:size-12 items-center justify-center rounded-full" style={{ backgroundColor: S.primary + "20" }}>
                <ShoppingCart className="size-5 sm:size-6" style={{ color: S.primary }} />
              </div>
              <p className="text-sm sm:text-base font-semibold" style={{ color: S.text }}>Aucun produit trouvé</p>
              <p className="text-xs sm:text-sm opacity-60 px-4" style={{ color: S.text }}>Cette boutique n&apos;a pas encore ajouté de produits.</p>
            </div>
          )}
        </div>
      </section>

      {/* ══════════ PAYMENT BANNER ══════════ */}
      <section className="px-4 sm:px-5 py-8 sm:py-10 text-white" style={{ backgroundColor: S.secondary }}>
        <div className="mx-auto flex max-w-[1200px] flex-col sm:flex-row flex-wrap items-center sm:items-start justify-between gap-5 text-center sm:text-left">
          <div>
            <h2 className="mb-2 flex items-center justify-center sm:justify-start gap-2 text-lg sm:text-[1.5rem] font-bold">
              <Shield className="size-5 sm:size-6" style={{ color: S.primary }} /> Paiement sécurisé
            </h2>
            <p className="max-w-md opacity-90 text-sm sm:text-base">
              Acceptez <strong>Wave</strong>, <strong>Orange Money</strong> et le <strong>paiement à la livraison</strong>.
            </p>
            <div className="mt-3 sm:mt-4 flex flex-wrap justify-center sm:justify-start gap-2 sm:gap-3">
              <span className="rounded-full px-3 sm:px-5 py-1.5 sm:py-2 text-xs sm:text-sm font-bold text-white" style={{ backgroundColor: S.primary }}>Wave</span>
              <span className="rounded-full px-3 sm:px-5 py-1.5 sm:py-2 text-xs sm:text-sm font-bold text-white" style={{ backgroundColor: S.primary }}>Orange Money</span>
              <span className="rounded-full px-3 sm:px-5 py-1.5 sm:py-2 text-xs sm:text-sm font-bold text-white" style={{ backgroundColor: S.primary }}>Livraison</span>
            </div>
          </div>
          {store.whatsapp && (
            <a
              href={`https://wa.me/${store.whatsapp.replace(/[^0-9]/g, "")}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-lg bg-[#22c55e] px-5 sm:px-6 py-2.5 sm:py-3 text-sm sm:text-base font-bold text-white transition hover:bg-[#166534]"
            >
              <MessageCircle className="size-4 sm:size-5" /> Contacter via WhatsApp
            </a>
          )}
        </div>
      </section>

      {/* ══════════ FOOTER ══════════ */}
      <footer className="px-4 sm:px-5 pt-10 sm:pt-[60px] pb-5 text-white" style={{ backgroundColor: S.secondary }}>
        <div className="mx-auto max-w-[1200px]">
          <div className="mb-6 sm:mb-8 grid grid-cols-1 sm:grid-cols-[repeat(auto-fit,minmax(200px,1fr))] gap-6 sm:gap-8">
            <div>
              <div className="mb-3 flex items-center gap-3 text-lg sm:text-[1.5rem] font-bold text-white">
                {store.logoUrl ? (
                  <img
                    src={store.logoUrl}
                    alt={store.name}
                    className="h-8 w-8 sm:h-[46px] sm:w-[46px] rounded-full border-2 bg-white object-cover"
                    style={{ borderColor: S.primary }}
                  />
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
                <li>
                  <Link href={`/store/${storeSlug}`} className="flex items-center gap-2 transition opacity-80 hover:opacity-100">
                    <Home className="size-3.5" /> Accueil
                  </Link>
                </li>
                <li>
                  <Link href={`/store/${storeSlug}/products`} className="flex items-center gap-2 transition opacity-80 hover:opacity-100">
                    <Package className="size-3.5" /> Produits
                  </Link>
                </li>
                <li>
                  <Link href={`/store/${storeSlug}/cart`} className="flex items-center gap-2 transition opacity-80 hover:opacity-100">
                    <ShoppingCart className="size-3.5" /> Panier
                  </Link>
                </li>
              </ul>
            </div>

            <div>
              <h4 className="mb-3 sm:mb-4 font-bold text-white text-sm">Contact</h4>
              <ul className="space-y-1.5 sm:space-y-2 text-xs sm:text-sm opacity-80">
                {store.whatsapp && (
                  <li>
                    <MessageCircle className="mr-2 inline size-3.5" />
                    {store.whatsapp}
                  </li>
                )}
                <li>
                  <Truck className="mr-2 inline size-3.5" />
                  Dakar, Sénégal
                </li>
              </ul>
            </div>
          </div>

          <div className="border-t border-white/20 pt-4 sm:pt-5 text-center text-xs sm:text-sm opacity-70">
            <p>
              &copy; 2026 {store.name}. Tous droits réservés. Propulsé par{" "}
              <Link href="/" className="font-bold no-underline" style={{ color: S.primary }}>
                Teranga Business
              </Link>
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
