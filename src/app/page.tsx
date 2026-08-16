import { Store } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function Home() {
  return (
    <main className="flex flex-1 items-center justify-center px-6">
      <section className="flex max-w-2xl flex-col items-center gap-6 py-20 text-center">
        <div className="flex size-16 items-center justify-center rounded-2xl bg-primary/10">
          <Store className="size-8 text-primary" aria-hidden />
        </div>
        <div className="flex flex-col gap-3">
          <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
            Teranga Business
          </h1>
          <p className="text-lg leading-8 text-muted-foreground">
            Découvrez les produits et les talents du Sénégal.
            Marketplace multi-vendeurs : mode, artisanat, alimentation, services
            et bien plus.
          </p>
        </div>
        <div className="flex flex-wrap items-center justify-center gap-3">
          <Button size="lg" asChild>
            <a href="/categories">Explorer le catalogue</a>
          </Button>
          <Button size="lg" variant="outline" asChild>
            <a href="/vendors">Vendre sur Teranga Business</a>
          </Button>
        </div>
        <p className="text-sm text-muted-foreground">
          Phase 2 — plateforme initialisée. Le catalogue arrive à la phase 5.
        </p>
      </section>
    </main>
  );
}
