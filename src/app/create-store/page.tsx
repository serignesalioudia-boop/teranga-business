import Link from "next/link";
import {
  Store,
  ShoppingCart,
  CreditCard,
  Truck,
  BarChart3,
  Palette,
  Check,
  ArrowRight,
  Zap,
  Shield,
  Users,
  Globe,
} from "lucide-react";
import { Logo } from "@/components/layout/logo";

export const metadata = {
  title: "Créez votre boutique en ligne — Teranga Business",
  description:
    "Lancez votre e-commerce au Sénégal en quelques minutes. Gestion des produits, paiements, livraisons, tout est inclus.",
};

const STEPS = [
  {
    num: "1",
    title: "Créez votre compte",
    desc: "Inscrivez-vous gratuitement en 2 minutes. Pas besoin de carte bancaire.",
  },
  {
    num: "2",
    title: "Configurez votre boutique",
    desc: "Ajoutez votre nom, logo, description et choisissez un thème parmi 6 designs professionnels.",
  },
  {
    num: "3",
    title: "Ajoutez vos produits",
    desc: "Photos, prix, descriptions, stock — tout est simple et rapide.",
  },
  {
    num: "4",
    title: "Commencez à vendre",
    desc: "Recevez des commandes, gérez les paiements Wave/Orange Money et suivez les livraisons.",
  },
];

const FEATURES = [
  {
    icon: Store,
    title: "Boutique personnalisée",
    desc: "6 thèmes professionnels. Votre boutique ressemble à un vrai site e-commerce.",
  },
  {
    icon: ShoppingCart,
    title: "Panier & commandes",
    desc: "Gestion automatique des stocks, paniers et commandes multi-vendeurs.",
  },
  {
    icon: CreditCard,
    title: "Paiements mobiles",
    desc: "Wave, Orange Money ou paiement à la livraison. Les clients paient facilement.",
  },
  {
    icon: Truck,
    title: "Livraison intégrée",
    desc: "Suivi de livraison en temps réel pour vos clients. Pas de logistique à gérer.",
  },
  {
    icon: BarChart3,
    title: "Analytics & rapports",
    desc: "Revenus, top produits, tendances — tout est visualisé en temps réel.",
  },
  {
    icon: Palette,
    title: "Thèmes responsives",
    desc: "Mobile, tablette, ordinateur — votre boutique s'adapte à tous les écrans.",
  },
  {
    icon: Globe,
    title: "Partage social",
    desc: "Partagez vos produits sur WhatsApp, Facebook, Twitter en un clic.",
  },
  {
    icon: Users,
    title: "Multi-utilisateurs",
    desc: "Invitez vos employés à gérer la boutique avec le plan Pro.",
  },
];

export default function CreateStorePage() {
  return (
    <div className="space-y-0">
      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-br from-primary/5 via-background to-primary/10 py-20 md:py-28">
        <div className="mx-auto max-w-7xl px-4 text-center">
          <span className="inline-block rounded-full bg-primary/10 px-4 py-1.5 text-xs font-medium text-primary">
            🇸🇳 Propulsez votre business au Sénégal
          </span>
          <h1 className="mt-6 text-4xl font-bold leading-tight md:text-6xl">
            Créez votre boutique
            <br />
            <span className="text-primary">en ligne</span>
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground">
            Vendez vos produits au Sénégal et en Afrique de l&apos;Ouest. 
            Panier, paiements mobiles, livraisons, analytics — tout est inclus.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-4">
            <Link
              href="/account/become-seller"
              className="inline-flex h-12 items-center gap-2 rounded-xl bg-primary px-8 text-sm font-medium text-primary-foreground transition hover:bg-primary/90"
            >
              <Store className="h-4 w-4" />
              Créer ma boutique
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="/shop"
              className="inline-flex h-12 items-center gap-2 rounded-xl border px-8 text-sm font-medium transition hover:bg-accent"
            >
              Voir des exemples
            </Link>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="border-y bg-background py-12">
        <div className="mx-auto max-w-7xl px-4">
          <div className="grid grid-cols-2 gap-8 text-center md:grid-cols-4">
            <div>
              <p className="text-3xl font-bold text-primary">6</p>
              <p className="mt-1 text-sm text-muted-foreground">Thèmes professionnels</p>
            </div>
            <div>
              <p className="text-3xl font-bold text-primary">2 min</p>
              <p className="mt-1 text-sm text-muted-foreground">Setup complet</p>
            </div>
            <div>
              <p className="text-3xl font-bold text-primary">0 FCFA</p>
              <p className="mt-1 text-sm text-muted-foreground">Pour commencer</p>
            </div>
            <div>
              <p className="text-3xl font-bold text-primary">3</p>
              <p className="mt-1 text-sm text-muted-foreground">Moyens de paiement</p>
            </div>
          </div>
        </div>
      </section>

      {/* Votre site web */}
      <section className="py-16 md:py-24">
        <div className="mx-auto max-w-7xl px-4">
          <div className="grid gap-12 md:grid-cols-2 md:items-center">
            <div>
              <span className="inline-block rounded-full bg-primary/10 px-4 py-1.5 text-xs font-medium text-primary">
                Votre site web e-commerce
              </span>
              <h2 className="mt-4 text-3xl font-bold">
                Votre boutique,<br />votre site web
              </h2>
              <p className="mt-4 text-muted-foreground">
                Après inscription, vous obtenez votre propre site web e-commerce personnalisé.
                Vos clients y accèdent directement pour parcourir et acheter vos produits.
              </p>
              <div className="mt-6 rounded-xl border bg-muted/50 p-4">
                <p className="text-xs text-muted-foreground">Votre URL unique</p>
                <code className="mt-1 block text-sm font-mono text-primary">
                  terangabusiness.store/ma-boutique
                </code>
              </div>
              <ul className="mt-6 space-y-3">
                {[
                  "Site responsive (mobile, tablette, ordinateur)",
                  "Paiements intégrés (Wave, Orange Money)",
                  "Gestion des commandes et livraisons",
                  "Analytics et statistiques en temps réel",
                ].map((item) => (
                  <li key={item} className="flex items-start gap-2 text-sm">
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-green-500" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
            <div className="relative">
              {/* Mockup browser */}
              <div className="overflow-hidden rounded-2xl border bg-card shadow-xl">
                <div className="flex items-center gap-2 border-b bg-muted/50 px-4 py-3">
                  <div className="flex gap-1.5">
                    <div className="h-3 w-3 rounded-full bg-red-400" />
                    <div className="h-3 w-3 rounded-full bg-yellow-400" />
                    <div className="h-3 w-3 rounded-full bg-green-400" />
                  </div>
                  <div className="flex-1 rounded-lg bg-background px-3 py-1.5 text-xs text-muted-foreground">
                    terangabusiness.store/ma-boutique
                  </div>
                </div>
                <div className="p-6">
                  <div className="mb-4 flex items-center gap-3">
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
                      <Store className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <p className="font-bold">Ma Boutique</p>
                      <p className="text-xs text-muted-foreground">Vêtements & Accessoires</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    {[1, 2, 3, 4, 5, 6].map((i) => (
                      <div key={i} className="aspect-square rounded-lg bg-muted" />
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Votre tableau de bord */}
      <section className="border-y bg-muted/30 py-16 md:py-24">
        <div className="mx-auto max-w-7xl px-4">
          <div className="grid gap-12 md:grid-cols-2 md:items-center">
            <div className="order-2 md:order-1">
              {/* Mockup dashboard */}
              <div className="overflow-hidden rounded-2xl border bg-card shadow-xl">
                <div className="border-b bg-muted/50 px-4 py-3 text-xs font-medium">
                  Tableau de bord vendeur
                </div>
                <div className="grid grid-cols-2 gap-3 p-4">
                  <div className="rounded-lg border bg-background p-3">
                    <p className="text-xs text-muted-foreground">Commandes</p>
                    <p className="text-xl font-bold">127</p>
                  </div>
                  <div className="rounded-lg border bg-background p-3">
                    <p className="text-xs text-muted-foreground">Revenus</p>
                    <p className="text-xl font-bold">2.4M FCFA</p>
                  </div>
                  <div className="rounded-lg border bg-background p-3">
                    <p className="text-xs text-muted-foreground">Produits</p>
                    <p className="text-xl font-bold">45</p>
                  </div>
                  <div className="rounded-lg border bg-background p-3">
                    <p className="text-xs text-muted-foreground">Note moyenne</p>
                    <p className="text-xl font-bold">4.8★</p>
                  </div>
                </div>
              </div>
            </div>
            <div className="order-1 md:order-2">
              <span className="inline-block rounded-full bg-primary/10 px-4 py-1.5 text-xs font-medium text-primary">
                Espace vendeur
              </span>
              <h2 className="mt-4 text-3xl font-bold">
                Gérez tout depuis<br />votre dashboard
              </h2>
              <p className="mt-4 text-muted-foreground">
                Un tableau de bord complet pour suivre vos ventes, gérer vos produits,
                et analyser vos performances. Tout est en temps réel.
              </p>
              <ul className="mt-6 space-y-3">
                {[
                  "Ajoutez des produits en quelques clics",
                  "Suivez les commandes et livraisons",
                  "Consultez vos revenus et commissions",
                  "Gérez les avis et retours clients",
                ].map((item) => (
                  <li key={item} className="flex items-start gap-2 text-sm">
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-green-500" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Comment ça marche */}
      <section className="py-16 md:py-24">
        <div className="mx-auto max-w-7xl px-4">
          <h2 className="mb-4 text-center text-3xl font-bold">Comment ça marche ?</h2>
          <p className="mx-auto mb-12 max-w-xl text-center text-muted-foreground">
            En 4 étapes simples, votre boutique est en ligne.
          </p>
          <div className="grid gap-8 md:grid-cols-4">
            {STEPS.map((step) => (
              <div key={step.num} className="relative text-center">
                <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary text-lg font-bold text-primary-foreground">
                  {step.num}
                </div>
                <h3 className="mb-2 text-lg font-semibold">{step.title}</h3>
                <p className="text-sm text-muted-foreground">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Fonctionnalités */}
      <section className="border-y bg-muted/30 py-16 md:py-24">
        <div className="mx-auto max-w-7xl px-4">
          <h2 className="mb-4 text-center text-3xl font-bold">Tout ce dont vous avez besoin</h2>
          <p className="mx-auto mb-12 max-w-xl text-center text-muted-foreground">
            Une plateforme complète pour gérer votre e-commerce.
          </p>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {FEATURES.map((f) => (
              <div key={f.title} className="rounded-2xl border bg-card p-6 shadow-sm transition hover:shadow-md">
                <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
                  <f.icon className="h-5 w-5 text-primary" />
                </div>
                <h3 className="mb-1.5 font-semibold">{f.title}</h3>
                <p className="text-sm text-muted-foreground">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Thèmes */}
      <section className="py-16 md:py-24">
        <div className="mx-auto max-w-7xl px-4">
          <h2 className="mb-4 text-center text-3xl font-bold">6 thèmes pour votre boutique</h2>
          <p className="mx-auto mb-12 max-w-xl text-center text-muted-foreground">
            Choisissez le style qui correspond à votre marque.
          </p>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[
              { name: "Bannière", desc: "Hero image + grille responsive", color: "from-blue-500/20 to-blue-600/10" },
              { name: "Sidebar", desc: "Catégories toujours visibles", color: "from-green-500/20 to-green-600/10" },
              { name: "Éditorial", desc: "Style magazine, produit featured", color: "from-purple-500/20 to-purple-600/10" },
              { name: "Galerie", desc: "Minimaliste, photos d'abord", color: "from-pink-500/20 to-pink-600/10" },
              { name: "Vitrine", desc: "Produit star en spotlight", color: "from-orange-500/20 to-orange-600/10" },
              { name: "Mosaïque", desc: "Dense, vivant, beaucoup de produits", color: "from-red-500/20 to-red-600/10" },
            ].map((theme) => (
              <div key={theme.name} className={`rounded-2xl border bg-gradient-to-br ${theme.color} p-6 transition hover:shadow-md`}>
                <h3 className="mb-1 font-semibold">{theme.name}</h3>
                <p className="text-sm text-muted-foreground">{theme.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pourquoi Teranga */}
      <section className="py-16 md:py-24">
        <div className="mx-auto max-w-7xl px-4">
          <h2 className="mb-12 text-center text-3xl font-bold">Pourquoi Teranga Business ?</h2>
          <div className="grid gap-8 md:grid-cols-3">
            <div className="rounded-2xl border bg-card p-8 text-center shadow-sm">
              <span className="mx-auto flex size-14 items-center justify-center rounded-xl bg-primary/10">
                <Zap className="size-7 text-primary" />
              </span>
              <h3 className="mt-4 text-lg font-semibold">Ultra rapide</h3>
              <p className="mt-2 text-sm text-muted-foreground">
                Temps de charge &lt; 2 secondes. Vos clients ne partiront jamais.
              </p>
            </div>
            <div className="rounded-2xl border bg-card p-8 text-center shadow-sm">
              <span className="mx-auto flex size-14 items-center justify-center rounded-xl bg-primary/10">
                <Shield className="size-7 text-primary" />
              </span>
              <h3 className="mt-4 text-lg font-semibold">100% sécurisé</h3>
              <p className="mt-2 text-sm text-muted-foreground">
                Paiements cryptés, données protégées. La confiance avant tout.
              </p>
            </div>
            <div className="rounded-2xl border bg-card p-8 text-center shadow-sm">
              <span className="mx-auto flex size-14 items-center justify-center rounded-xl bg-primary/10">
                <Users className="size-7 text-primary" />
              </span>
              <h3 className="mt-4 text-lg font-semibold">Communauté</h3>
              <p className="mt-2 text-sm text-muted-foreground">
                Rejoignez des centaines de vendeurs sénégalais qui font confiance à Teranga.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA final */}
      <section className="bg-primary py-16 text-primary-foreground md:py-20">
        <div className="mx-auto max-w-7xl px-4 text-center">
          <h2 className="text-3xl font-bold md:text-4xl">
            Prêt à lancer votre boutique ?
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-primary-foreground/80">
            Créez votre compte gratuit et commencez à vendre en quelques minutes.
          </p>
          <Link
            href="/account/become-seller"
            className="mt-8 inline-flex h-12 items-center gap-2 rounded-xl bg-white px-8 text-sm font-medium text-primary transition hover:bg-white/90"
          >
            <Store className="h-4 w-4" />
            Créer ma boutique gratuitement
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>
    </div>
  );
}
