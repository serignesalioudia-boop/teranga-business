"use client";

import { useActionState } from "react";
import { Loader2, Store, ExternalLink, Settings, PartyPopper } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import {
  applyAsSeller,
  type ApplySellerFormState,
} from "@/server/actions/seller-registration";

const initialState: ApplySellerFormState = null;

export function BecomeSellerForm() {
  const [state, action, pending] = useActionState(applyAsSeller, initialState);
  const errors = state?.errors;

  if (state?.success && state.storeSlug) {
    return (
      <div className="rounded-2xl border-2 border-green-500/30 bg-green-500/5 p-8 text-center">
        <div className="mx-auto mb-4 flex size-16 items-center justify-center rounded-full bg-green-500/10">
          <PartyPopper className="size-8 text-green-600" />
        </div>
        <h2 className="text-xl font-bold text-green-700">Boutique créée !</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Votre boutique <strong>{state.storeSlug}</strong> est en ligne.
        </p>
        <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-center">
          <Button asChild size="lg">
            <Link href={`/store/${state.storeSlug}`} target="_blank">
              <ExternalLink className="mr-2 size-4" />
              Voir ma boutique
            </Link>
          </Button>
          <Button asChild variant="outline" size="lg">
            <Link href="/seller/settings">
              <Settings className="mr-2 size-4" />
              Personnaliser le thème
            </Link>
          </Button>
        </div>
        <p className="mt-4 text-xs text-muted-foreground">
          {state.message}
        </p>
      </div>
    );
  }

  return (
    <form action={action} className="flex flex-col gap-4">
      {errors?.form && (
        <p
          role="alert"
          className="rounded-lg border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive"
        >
          {errors.form[0]}
        </p>
      )}

      <div className="flex flex-col gap-1.5">
        <label htmlFor="storeName" className="text-sm font-medium">
          Nom de la boutique <span className="text-destructive">*</span>
        </label>
        <input
          id="storeName"
          name="storeName"
          type="text"
          required
          minLength={2}
          maxLength={100}
          placeholder="Ex : Boutique Teranga"
          aria-invalid={Boolean(errors?.storeName)}
          className="h-10 w-full rounded-lg border border-input bg-background px-3 text-sm outline-none transition-colors placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 aria-invalid:border-destructive"
        />
        {errors?.storeName && (
          <p className="text-sm text-destructive">{errors.storeName[0]}</p>
        )}
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="description" className="text-sm font-medium">
          Description
        </label>
        <textarea
          id="description"
          name="description"
          maxLength={500}
          rows={3}
          placeholder="Décrivez votre boutique en quelques mots…"
          className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none transition-colors placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
        />
        <p className="text-xs text-muted-foreground">500 caractères max.</p>
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="whatsapp" className="text-sm font-medium">
          WhatsApp
        </label>
        <input
          id="whatsapp"
          name="whatsapp"
          type="tel"
          maxLength={20}
          placeholder="+221 77 123 45 67"
          className="h-10 w-full rounded-lg border border-input bg-background px-3 text-sm outline-none transition-colors placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
        />
        <p className="text-xs text-muted-foreground">
          Optionnel — pour contacter vos clients via WhatsApp.
        </p>
      </div>

      <Button type="submit" size="lg" disabled={pending}>
        {pending ? (
          <Loader2 aria-hidden className="animate-spin" />
        ) : (
          <Store aria-hidden />
        )}
        {pending ? "Création en cours…" : "Créer ma boutique"}
      </Button>
    </form>
  );
}
