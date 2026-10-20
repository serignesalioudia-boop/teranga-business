"use client";

import { useActionState, useState } from "react";
import { useRouter } from "next/navigation";
import {
  getStoreContactSettings,
  updateStoreContact,
  updateStoreSocials,
  updateStoreDeliveryRules,
} from "@/server/actions/store-contact";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Check, Phone, Mail, Share2, Truck, Plus, Trash2 } from "lucide-react";

type FormState = { error?: string; success?: string };

const SOCIAL_FIELDS = [
  { key: "facebook", label: "Facebook", placeholder: "https://facebook.com/ma-boutique" },
  { key: "instagram", label: "Instagram", placeholder: "https://instagram.com/ma-boutique" },
  { key: "twitter", label: "X / Twitter", placeholder: "https://x.com/ma-boutique" },
  { key: "tiktok", label: "TikTok", placeholder: "https://tiktok.com/@ma-boutique" },
] as const;

const METHODS = [
  { value: "STANDARD", label: "Standard" },
  { value: "EXPRESS", label: "Express" },
  { value: "PICKUP", label: "Retrait en point" },
] as const;

type Props = {
  initial: Awaited<ReturnType<typeof getStoreContactSettings>>;
};

function err(e: unknown): string {
  return e instanceof Error ? e.message : "Erreur inconnue.";
}

export function StoreContactSettings({ initial }: Props) {
  const router = useRouter();

  const [contactState, contactAction, contactPending] = useActionState<FormState, FormData>(
    async (_prev, formData) => {
      try {
        await updateStoreContact({
          contactEmail: (formData.get("contactEmail") as string) || "",
          contactPhone: (formData.get("contactPhone") as string) || null,
          whatsapp: (formData.get("whatsapp") as string) || null,
        });
        router.refresh();
        return { success: "Contact mis a jour." };
      } catch (e) {
        return { error: err(e) };
      }
    },
    {},
  );

  const [socialState, socialAction, socialPending] = useActionState<FormState, FormData>(
    async (_prev, formData) => {
      try {
        await updateStoreSocials({
          facebook: (formData.get("facebook") as string) || "",
          instagram: (formData.get("instagram") as string) || "",
          twitter: (formData.get("twitter") as string) || "",
          tiktok: (formData.get("tiktok") as string) || "",
        });
        router.refresh();
        return { success: "Reseaux sociaux mis a jour." };
      } catch (e) {
        return { error: err(e) };
      }
    },
    {},
  );

  const [rules, setRules] = useState(initial.deliveryRules);
  const [deliveryState, deliveryAction, deliveryPending] = useActionState<FormState, FormData>(
    async (_prev, formData) => {
      try {
        const raw = JSON.parse((formData.get("rules") as string) || "[]");
        await updateStoreDeliveryRules({ rules: raw });
        router.refresh();
        return { success: "Frais de livraison mis a jour." };
      } catch (e) {
        return { error: err(e) };
      }
    },
    {},
  );

  const addRule = () =>
    setRules((r) => [...r, { id: "", zone: "", method: "STANDARD", fee: "500", freeAbove: "", isActive: true }]);

  const patchRule = (i: number, patch: Partial<(typeof rules)[number]>) =>
    setRules((r) => r.map((row, idx) => (idx === i ? { ...row, ...patch } : row)));

  return (
    <div className="space-y-6">
      {/* Contact */}
      <section className="rounded-xl border bg-card p-6 space-y-4">
        <div className="flex items-center gap-2">
          <Phone className="size-5 text-primary" />
          <h2 className="text-lg font-bold">Contact</h2>
        </div>
        <p className="text-xs text-muted-foreground">
          Ces informations apparaissent en bas de votre mini-site.
        </p>

        <form action={contactAction} className="space-y-4">
          {contactState.error && <p className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">{contactState.error}</p>}
          {contactState.success && <p className="flex items-center gap-1 rounded-lg bg-green-500/10 px-3 py-2 text-sm text-green-600"><Check className="size-4" />{contactState.success}</p>}

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="contactPhone">Telephone</Label>
              <Input id="contactPhone" name="contactPhone" type="tel" defaultValue={initial.contactPhone} placeholder="+221 77 123 45 67" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="whatsapp">WhatsApp</Label>
              <Input id="whatsapp" name="whatsapp" type="tel" defaultValue={initial.whatsapp} placeholder="+221 77 123 45 67" />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="contactEmail">E-mail</Label>
            <Input id="contactEmail" name="contactEmail" type="email" defaultValue={initial.contactEmail} placeholder="contact@ma-boutique.sn" />
          </div>

          <Button type="submit" disabled={contactPending}>
            {contactPending && <Loader2 className="mr-2 size-4 animate-spin" />}
            Enregistrer le contact
          </Button>
        </form>
      </section>

      {/* Reseaux sociaux */}
      <section className="rounded-xl border bg-card p-6 space-y-4">
        <div className="flex items-center gap-2">
          <Share2 className="size-5 text-primary" />
          <h2 className="text-lg font-bold">Reseaux sociaux</h2>
        </div>
        <p className="text-xs text-muted-foreground">
          Laissez vide un reseau que vous n&apos;utilisez pas : il ne sera pas affiche.
        </p>

        <form action={socialAction} className="space-y-4">
          {socialState.error && <p className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">{socialState.error}</p>}
          {socialState.success && <p className="flex items-center gap-1 rounded-lg bg-green-500/10 px-3 py-2 text-sm text-green-600"><Check className="size-4" />{socialState.success}</p>}

          <div className="grid gap-4 sm:grid-cols-2">
            {SOCIAL_FIELDS.map((f) => (
              <div className="space-y-2" key={f.key}>
                <Label htmlFor={f.key}>{f.label}</Label>
                <Input
                  id={f.key}
                  name={f.key}
                  type="url"
                  defaultValue={initial.socials[f.key]}
                  placeholder={f.placeholder}
                />
              </div>
            ))}
          </div>

          <Button type="submit" disabled={socialPending}>
            {socialPending && <Loader2 className="mr-2 size-4 animate-spin" />}
            Enregistrer les reseaux sociaux
          </Button>
        </form>
      </section>

      {/* Paiements & Livraison */}
      <section className="rounded-xl border bg-card p-6 space-y-4">
        <div className="flex items-center gap-2">
          <Truck className="size-5 text-primary" />
          <h2 className="text-lg font-bold">Paiements &amp; Livraison</h2>
        </div>
        <p className="text-xs text-muted-foreground">
          Les QR codes Wave et Orange Money se televersent plus bas, avec le reste des reglages
          de votre boutique.Ici vous definissez vos frais de livraison.
        </p>

        <form action={deliveryAction} className="space-y-4">
          <input type="hidden" name="rules" value={JSON.stringify(rules)} />
          {deliveryState.error && <p className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">{deliveryState.error}</p>}
          {deliveryState.success && <p className="flex items-center gap-1 rounded-lg bg-green-500/10 px-3 py-2 text-sm text-green-600"><Check className="size-4" />{deliveryState.success}</p>}

          {rules.length === 0 && (
            <p className="rounded-lg border border-dashed px-3 py-4 text-center text-sm text-muted-foreground">
              Aucune frais de livraison defini.
            </p>
          )}

          <div className="space-y-3">
            {rules.map((rule, i) => (
              <div key={i} className="grid gap-2 rounded-lg border p-3 sm:grid-cols-[1fr_auto_110px_110px_auto] sm:items-end">
                <div className="space-y-1">
                  <Label className="text-xs">Zone</Label>
                  <Input
                    value={rule.zone}
                    onChange={(e) => patchRule(i, { zone: e.target.value })}
                    placeholder="Dakar"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Mode</Label>
                  <select
                    value={rule.method}
                    onChange={(e) =>
                      patchRule(i, { method: e.target.value as (typeof rule)["method"] })
                    }
                    className="h-9 w-full rounded-md border bg-transparent px-2 text-sm"
                  >
                    {METHODS.map((m) => (
                      <option key={m.value} value={m.value}>{m.label}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Frais (FCFA)</Label>
                  <Input
                    type="number"
                    min="0"
                    value={rule.fee}
                    onChange={(e) => patchRule(i, { fee: e.target.value })}
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Gratuit au-dessus</Label>
                  <Input
                    type="number"
                    min="0"
                    value={rule.freeAbove}
                    onChange={(e) => patchRule(i, { freeAbove: e.target.value })}
                    placeholder="—"
                  />
                </div>
                <button
                  type="button"
                  onClick={() => setRules((r) => r.filter((_, idx) => idx !== i))}
                  className="flex h-9 items-center justify-center rounded-md border border-destructive/40 px-2 text-destructive hover:bg-destructive/10"
                  aria-label="Supprimer la ligne"
                >
                  <Trash2 className="size-4" />
                </button>
              </div>
            ))}
          </div>

          <div className="flex flex-wrap gap-2">
            <Button type="button" variant="outline" onClick={addRule}>
              <Plus className="mr-1 size-4" /> Ajouter une zone
            </Button>
            <Button type="submit" disabled={deliveryPending}>
              {deliveryPending && <Loader2 className="mr-2 size-4 animate-spin" />}
              Enregistrer la livraison
            </Button>
          </div>
        </form>
      </section>
    </div>
  );
}