"use client";

import { useActionState } from "react";
import { updatePlatformSettings } from "@/server/actions/platform-settings";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Check } from "lucide-react";

type FormState = { error?: string; success?: boolean };

async function handleUpdate(_prev: FormState, formData: FormData): Promise<FormState> {
  try {
    await updatePlatformSettings({
      site_name: formData.get("site_name") as string,
      site_description: (formData.get("site_description") as string) || undefined,
      contact_email: (formData.get("contact_email") as string) || undefined,
      contact_phone: (formData.get("contact_phone") as string) || undefined,
      social_facebook: (formData.get("social_facebook") as string) || undefined,
      social_instagram: (formData.get("social_instagram") as string) || undefined,
      social_twitter: (formData.get("social_twitter") as string) || undefined,
      social_tiktok: (formData.get("social_tiktok") as string) || undefined,
      maintenance_mode: formData.get("maintenance_mode") === "on",
      default_delivery_fee: Number(formData.get("default_delivery_fee")) || 500,
      default_commission_rate: Number(formData.get("default_commission_rate")) || 10,
    });
    return { success: true };
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Erreur." };
  }
}

export function PlatformSettingsForm({ settings }: { settings: Record<string, string | number | boolean> }) {
  const [state, formAction, pending] = useActionState(handleUpdate, {});

  return (
    <form action={formAction} className="space-y-6">
      {state.error && (
        <p className="rounded-lg border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {state.error}
        </p>
      )}
      {state.success && (
        <p className="flex items-center gap-1 rounded-lg border border-green-500/40 bg-green-500/10 px-3 py-2 text-sm text-green-600">
          <Check className="size-4" /> Paramètres sauvegardés.
        </p>
      )}

      {/* Général */}
      <section className="rounded-xl border bg-card p-6 space-y-4">
        <h2 className="text-lg font-semibold">Général</h2>
        <div className="space-y-2">
          <Label htmlFor="site_name">Nom du site</Label>
          <Input id="site_name" name="site_name" defaultValue={String(settings.site_name)} required />
        </div>
        <div className="space-y-2">
          <Label htmlFor="site_description">Description</Label>
          <textarea
            id="site_description"
            name="site_description"
            rows={2}
            defaultValue={String(settings.site_description ?? "")}
            className="w-full rounded-md border bg-transparent px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
          />
        </div>
      </section>

      {/* Contact */}
      <section className="rounded-xl border bg-card p-6 space-y-4">
        <h2 className="text-lg font-semibold">Contact</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="contact_email">E-mail contact</Label>
            <Input id="contact_email" name="contact_email" type="email" defaultValue={String(settings.contact_email ?? "")} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="contact_phone">Téléphone</Label>
            <Input id="contact_phone" name="contact_phone" type="tel" defaultValue={String(settings.contact_phone ?? "")} />
          </div>
        </div>
      </section>

      {/* Réseaux sociaux */}
      <section className="rounded-xl border bg-card p-6 space-y-4">
        <h2 className="text-lg font-semibold">Réseaux sociaux</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="social_facebook">Facebook</Label>
            <Input id="social_facebook" name="social_facebook" type="url" placeholder="https://facebook.com/..." defaultValue={String(settings.social_facebook ?? "")} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="social_instagram">Instagram</Label>
            <Input id="social_instagram" name="social_instagram" type="url" placeholder="https://instagram.com/..." defaultValue={String(settings.social_instagram ?? "")} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="social_twitter">Twitter / X</Label>
            <Input id="social_twitter" name="social_twitter" type="url" placeholder="https://x.com/..." defaultValue={String(settings.social_twitter ?? "")} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="social_tiktok">TikTok</Label>
            <Input id="social_tiktok" name="social_tiktok" type="url" placeholder="https://tiktok.com/..." defaultValue={String(settings.social_tiktok ?? "")} />
          </div>
        </div>
      </section>

      {/* Paiements & Livraison */}
      <section className="rounded-xl border bg-card p-6 space-y-4">
        <h2 className="text-lg font-semibold">Paiements & Livraison</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="default_delivery_fee">Frais de livraison par défaut (FCFA)</Label>
            <Input id="default_delivery_fee" name="default_delivery_fee" type="number" min="0" defaultValue={String(settings.default_delivery_fee)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="default_commission_rate">Taux de commission (%)</Label>
            <Input id="default_commission_rate" name="default_commission_rate" type="number" min="0" max="100" defaultValue={String(settings.default_commission_rate)} />
          </div>
        </div>
      </section>

      {/* Maintenance */}
      <section className="rounded-xl border bg-card p-6 space-y-4">
        <h2 className="text-lg font-semibold">Maintenance</h2>
        <label className="flex items-center gap-3">
          <input
            type="checkbox"
            name="maintenance_mode"
            defaultChecked={Boolean(settings.maintenance_mode)}
            className="h-4 w-4"
          />
          <div>
            <p className="font-medium">Mode maintenance</p>
            <p className="text-xs text-muted-foreground">
              Active la page de maintenance pour les utilisateurs non-admin.
            </p>
          </div>
        </label>
      </section>

      <Button type="submit" disabled={pending}>
        {pending ? <Loader2 className="mr-2 size-4 animate-spin" /> : null}
        Enregistrer les paramètres
      </Button>
    </form>
  );
}
