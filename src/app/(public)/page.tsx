import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { formatPrice } from "@/lib/format";
import {
  Store,
  ShoppingBag,
  Shield,
  Truck,
  CreditCard,
  Star,
  ArrowRight,
  CheckCircle,
  Package,
  MapPin,
} from "lucide-react";


export const metadata = {
  title: "Accueil — Teranga Business",
  description:
    "Découvrez les meilleurs produits des vendeurs sénégalais sur Teranga Business.",
};

export default async function HomePage() {
  const [totalProducts, totalStores, totalOrders, categories] =
    await Promise.all([
      prisma.product.count({ where: { status: "PUBLISHED" } }),
      prisma.store.count({ where: { isActive: true } }),
      prisma.order.count({ where: { status: { not: "CANCELLED" } } }),
      prisma.category.findMany({
        take: 6,
        orderBy: { name: "asc" },
        include: { _count: { select: { products: true } } },
      }),
    ]);

  return (
    <div className="space-y-0">
      {/* ═══════════ HERO ═══════════ */}
      <section className="relative overflow-hidden bg-gradient-to-br from-[#24160c] via-[#3a200e] to-[#1a1a2e] py-16 sm:py-20 md:py-28 lg:py-32">
        {/* Decorative blobs */}
        <div className="absolute -top-24 -left-24 h-64 w-64 rounded-full bg-[#c8922d]/10 blur-3xl sm:h-96 sm:w-96" />
        <div className="absolute -bottom-32 -right-32 h-80 w-80 rounded-full bg-[#c8922d]/8 blur-3xl" />
        <div className="absolute top-1/2 left-1/2 h-40 w-40 -translate-x-1/2 -translate-y-1/2 rounded-full bg-green-900/10 blur-3xl" />

        {/* Subtle grid pattern */}
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage:
              "linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)",
            backgroundSize: "60px 60px",
          }}
        />

        <div className="relative mx-auto max-w-7xl px-4 text-center">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-[#c8922d]/30 bg-[#c8922d]/10 px-4 py-1.5 text-[10px] sm:text-xs font-medium text-[#c8922d]">
            <span className="inline-block size-1.5 rounded-full bg-[#c8922d] animate-pulse" />
            🇸🇳 Fabriqué au Sénégal
          </span>

          <h1 className="mt-6 text-3xl sm:text-5xl md:text-6xl lg:text-7xl font-extrabold leading-[1.1] text-white">
            La marketplace
            <br />
            <span className="bg-gradient-to-r from-[#c8922d] via-[#f1d37a] to-[#c8922d] bg-clip-text text-transparent">
              Teranga{" "}
            </span>
            <span className="bg-gradient-to-r from-green-500 to-emerald-400 bg-clip-text text-transparent">
              Business
            </span>
          </h1>

          <p className="mx-auto mt-6 max-w-xl text-sm sm:text-base md:text-lg text-white/60 leading-relaxed px-2">
            Des milliers de produits locaux, des vendeurs vérifiés, des paiements
            sécurisés. Commandez en quelques clics.
          </p>

          <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center sm:gap-4">
            <Link
              href="/shop"
              className="group inline-flex h-12 items-center gap-2 rounded-xl bg-gradient-to-r from-[#c8922d] to-[#a87a1f] px-8 text-sm font-semibold text-white shadow-lg shadow-[#c8922d]/25 transition hover:shadow-xl hover:shadow-[#c8922d]/30 hover:scale-[1.02] active:scale-[0.98]"
            >
              <ShoppingBag className="h-4 w-4" />
              Explorer la boutique
              <ArrowRight className="h-4 w-4 transition group-hover:translate-x-0.5" />
            </Link>
            <Link
              href="/create-store"
              className="inline-flex h-12 items-center gap-2 rounded-xl border border-border bg-background px-8 text-sm font-semibold text-foreground transition hover:bg-accent active:scale-[0.98]"
            >
              <Store className="h-4 w-4" />
              Devenir vendeur
            </Link>
          </div>

          {/* Trust badges */}
          <div className="mt-10 flex flex-wrap items-center justify-center gap-4 sm:gap-6 text-[10px] sm:text-xs text-white/40">
            <span className="flex items-center gap-1.5">
              <CheckCircle className="size-3.5 text-green-500" />
              Paiements sécurisés
            </span>
            <span className="flex items-center gap-1.5">
              <CheckCircle className="size-3.5 text-green-500" />
              Livraison rapide
            </span>
            <span className="flex items-center gap-1.5">
              <CheckCircle className="size-3.5 text-green-500" />
              Satisfait ou remboursé
            </span>
          </div>
        </div>
      </section>

      {/* ═══════════ STATS ═══════════ */}
      <section className="relative -mt-6 z-10 mx-auto max-w-4xl px-4">
        <div className="grid grid-cols-3 gap-3 sm:gap-6 rounded-2xl border bg-white/80 dark:bg-card/80 backdrop-blur-md p-4 sm:p-6 shadow-xl">
          <div className="text-center">
            <p className="text-xl sm:text-3xl font-extrabold text-[#c8922d]">
              {totalProducts}+
            </p>
            <p className="mt-0.5 text-[9px] sm:text-xs text-muted-foreground">
              Produits
            </p>
          </div>
          <div className="text-center border-x border-border/50">
            <p className="text-xl sm:text-3xl font-extrabold text-[#c8922d]">
              {totalStores}+
            </p>
            <p className="mt-0.5 text-[9px] sm:text-xs text-muted-foreground">
              Vendeurs actifs
            </p>
          </div>
          <div className="text-center">
            <p className="text-xl sm:text-3xl font-extrabold text-[#c8922d]">
              {totalOrders}+
            </p>
            <p className="mt-0.5 text-[9px] sm:text-xs text-muted-foreground">
              Commandes
            </p>
          </div>
        </div>
      </section>

      {/* ═══════════ CATÉGORIES ═══════════ */}
      {categories.length > 0 && (
        <section className="py-12 sm:py-16 md:py-20">
          <div className="mx-auto max-w-7xl px-4">
            <div className="flex items-end justify-between mb-6 sm:mb-10">
              <div>
                <h2 className="text-xl sm:text-2xl md:text-3xl font-bold">
                  Explorez nos catégories
                </h2>
                <p className="mt-1 text-xs sm:text-sm text-muted-foreground">
                  Tout ce dont vous avez besoin, en un clic
                </p>
              </div>
              <Link
                href="/categories"
                className="hidden sm:inline-flex items-center gap-1 text-sm font-medium text-[#c8922d] hover:underline"
              >
                Tout voir <ArrowRight className="size-4" />
              </Link>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3 sm:gap-4">
              {categories.map((cat) => (
                <Link
                  key={cat.id}
                  href={`/category/${cat.slug}`}
                  className="group relative overflow-hidden rounded-2xl border bg-gradient-to-br from-[#c8922d]/5 to-[#c8922d]/0 p-4 sm:p-6 text-center transition hover:shadow-lg hover:shadow-[#c8922d]/10 hover:border-[#c8922d]/30 hover:-translate-y-0.5"
                >
                  <div className="mx-auto mb-3 flex size-12 items-center justify-center rounded-xl bg-[#c8922d]/10 text-lg transition group-hover:bg-[#c8922d]/20 group-hover:scale-110">
                    {cat.icon || "📦"}
                  </div>
                  <p className="text-xs sm:text-sm font-semibold truncate">
                    {cat.name}
                  </p>
                  <p className="text-[10px] text-muted-foreground mt-0.5">
                    {cat._count.products} produits
                  </p>
                </Link>
              ))}
            </div>
            <div className="mt-4 text-center sm:hidden">
              <Link
                href="/categories"
                className="inline-flex items-center gap-1 text-sm font-medium text-[#c8922d]"
              >
                Voir toutes les catégories <ArrowRight className="size-4" />
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* ═══════════ AVANTAGES ═══════════ */}
      <section className="bg-gradient-to-b from-muted/30 to-background py-12 sm:py-16 md:py-20">
        <div className="mx-auto max-w-7xl px-4">
          <div className="text-center mb-8 sm:mb-12">
            <h2 className="text-xl sm:text-2xl md:text-3xl font-bold">
              Pourquoi{" "}
              <span className="text-[#c8922d]">Teranga Business</span> ?
            </h2>
            <p className="mt-2 text-xs sm:text-sm text-muted-foreground max-w-lg mx-auto">
              Une expérience d&apos;achat pensée pour le Sénégal
            </p>
          </div>
          <div className="grid gap-4 sm:gap-6 md:grid-cols-2 lg:grid-cols-4">
            {[
              {
                icon: Store,
                title: "Boutiques vérifiées",
                desc: "Chaque vendeur est certifié. Achetez en toute confiance.",
                color: "from-blue-500/10 to-blue-600/5",
                iconColor: "text-blue-500",
              },
              {
                icon: CreditCard,
                title: "Paiement flexible",
                desc: "Wave, Orange Money ou paiement à la livraison.",
                color: "from-[#c8922d]/10 to-[#c8922d]/5",
                iconColor: "text-[#c8922d]",
              },
              {
                icon: Truck,
                title: "Livraison rapide",
                desc: "Livraison dans tout le Sénégal, suivi en temps réel.",
                color: "from-green-500/10 to-green-600/5",
                iconColor: "text-green-500",
              },
              {
                icon: Shield,
                title: "100% sécurisé",
                desc: "Vos données et paiements sont protégés.",
                color: "from-purple-500/10 to-purple-600/5",
                iconColor: "text-purple-500",
              },
            ].map((item) => (
              <div
                key={item.title}
                className="group relative rounded-2xl border bg-card p-5 sm:p-6 transition hover:shadow-lg hover:-translate-y-0.5"
              >
                <span
                  className={`flex size-12 items-center justify-center rounded-xl bg-gradient-to-br ${item.color}`}
                >
                  <item.icon className={`size-6 ${item.iconColor}`} />
                </span>
                <h3 className="mt-4 text-sm sm:text-base font-bold">
                  {item.title}
                </h3>
                <p className="mt-2 text-xs sm:text-sm text-muted-foreground leading-relaxed">
                  {item.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════ COMMENT ÇA MARCHE ═══════════ */}
      <section className="py-12 sm:py-16 md:py-20">
        <div className="mx-auto max-w-7xl px-4">
          <div className="text-center mb-8 sm:mb-12">
            <h2 className="text-xl sm:text-2xl md:text-3xl font-bold">
              Comment ça marche ?
            </h2>
            <p className="mt-2 text-xs sm:text-sm text-muted-foreground">
              3 étapes simples pour recevoir vos produits
            </p>
          </div>
          <div className="grid gap-6 sm:gap-8 md:grid-cols-3">
            {[
              {
                step: "01",
                icon: Package,
                title: "Choisissez vos produits",
                desc: "Parcourez notre catalogue et trouvez ce qu&apos;il vous faut.",
              },
              {
                step: "02",
                icon: MapPin,
                title: "Livraison à domicile",
                desc: "Indiquez votre adresse et recevez vos commandes partout au Sénégal.",
              },
              {
                step: "03",
                icon: CreditCard,
                title: "Payez facilement",
                desc: "Wave, Orange Money ou à la livraison. Vous choisissez.",
              },
            ].map((item, i) => (
              <div key={item.step} className="relative text-center">
                {i < 2 && (
                  <div className="hidden md:block absolute top-10 left-[60%] w-[80%] border-t border-dashed border-[#c8922d]/30" />
                )}
                <div className="relative mx-auto mb-4 flex size-16 items-center justify-center rounded-2xl bg-gradient-to-br from-[#c8922d] to-[#a87a1f] text-white shadow-lg shadow-[#c8922d]/20">
                  <item.icon className="size-7" />
                </div>
                <span className="text-[10px] font-bold text-[#c8922d] uppercase tracking-widest">
                  Étape {item.step}
                </span>
                <h3 className="mt-2 text-sm sm:text-base font-bold">
                  {item.title}
                </h3>
                <p className="mt-1.5 text-xs sm:text-sm text-muted-foreground max-w-[240px] mx-auto">
                  {item.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════ AVIS CLIENTS ═══════════ */}
      <section className="bg-gradient-to-b from-muted/30 to-background py-12 sm:py-16 md:py-20">
        <div className="mx-auto max-w-7xl px-4">
          <div className="text-center mb-8 sm:mb-12">
            <h2 className="text-xl sm:text-2xl md:text-3xl font-bold">
              Ce que disent nos clients
            </h2>
          </div>
          <div className="grid gap-4 sm:gap-6 md:grid-cols-3">
            {[
              {
                name: "Fatou D.",
                text: "Livraison rapide et produits de qualité. Je recommande vivement !",
                stars: 5,
              },
              {
                name: "Moussa S.",
                text: "La meilleure plateforme pour acheter local. Wave intégré, c'est pratique.",
                stars: 5,
              },
              {
                name: "Aissatou N.",
                text: "J'ai créé ma boutique en 5 minutes. Les ventes ont démarré tout de suite.",
                stars: 5,
              },
            ].map((review) => (
              <div
                key={review.name}
                className="rounded-2xl border bg-card p-5 sm:p-6 shadow-sm"
              >
                <div className="flex gap-0.5 mb-3">
                  {Array.from({ length: review.stars }).map((_, i) => (
                    <Star
                      key={i}
                      className="size-4 fill-[#c8922d] text-[#c8922d]"
                    />
                  ))}
                </div>
                <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                  &quot;{review.text}&quot;
                </p>
                <p className="mt-3 text-xs sm:text-sm font-bold text-foreground">
                  — {review.name}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════ CTA VENDEURS ═══════════ */}
      <section className="relative overflow-hidden bg-gradient-to-br from-[#24160c] via-[#3a200e] to-[#1a1a2e] py-14 sm:py-20 text-white">
        <div className="absolute -top-20 -right-20 h-60 w-60 rounded-full bg-[#c8922d]/10 blur-3xl" />
        <div className="absolute -bottom-20 -left-20 h-60 w-60 rounded-full bg-green-900/10 blur-3xl" />

        <div className="relative mx-auto max-w-7xl px-4 text-center">
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-extrabold">
            Vous êtes{" "}
            <span className="bg-gradient-to-r from-[#c8922d] to-[#f1d37a] bg-clip-text text-transparent">
              vendeur
            </span>{" "}
            ?
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-xs sm:text-sm md:text-base text-white/60 px-2 leading-relaxed">
            Créez votre boutique en ligne en quelques minutes. Gérez vos
            commandes, vos paiements et vos livraisons depuis une seule
            plateforme.
          </p>
          <Link
            href="/create-store"
            className="mt-8 inline-flex h-12 items-center gap-2 rounded-xl bg-gradient-to-r from-[#c8922d] to-[#a87a1f] px-8 text-sm font-semibold text-white shadow-lg shadow-[#c8922d]/25 transition hover:shadow-xl hover:scale-[1.02] active:scale-[0.98]"
          >
            Créer ma boutique
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>
    </div>
  );
}
