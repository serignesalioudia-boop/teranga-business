"use client";

import { useActionState, useRef, useState } from "react";
import { updateSellerStore } from "@/server/actions/seller-store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Check, X, ImagePlus, Palette, RotateCcw } from "lucide-react";
import {
  DEFAULT_STORE_THEME,
  FONT_OPTIONS,
  RADIUS_OPTIONS,
  type StoreThemeConfig,
} from "@/lib/store-theme";

type FormState = { error?: string; success?: boolean };

function parseStoreTheme(raw: unknown): StoreThemeConfig {
  if (!raw || typeof raw !== "object") return { ...DEFAULT_STORE_THEME };
  const r = raw as Record<string, unknown>;
  return {
    primaryColor: typeof r.primaryColor === "string" ? r.primaryColor : DEFAULT_STORE_THEME.primaryColor,
    secondaryColor: typeof r.secondaryColor === "string" ? r.secondaryColor : DEFAULT_STORE_THEME.secondaryColor,
    backgroundColor: typeof r.backgroundColor === "string" ? r.backgroundColor : DEFAULT_STORE_THEME.backgroundColor,
    cardColor: typeof r.cardColor === "string" ? r.cardColor : DEFAULT_STORE_THEME.cardColor,
    textColor: typeof r.textColor === "string" ? r.textColor : DEFAULT_STORE_THEME.textColor,
    fontFamily: typeof r.fontFamily === "string" ? r.fontFamily : DEFAULT_STORE_THEME.fontFamily,
    borderRadius: typeof r.borderRadius === "string" ? r.borderRadius : DEFAULT_STORE_THEME.borderRadius,
  };
}

async function handleUpdate(_prev: FormState, formData: FormData): Promise<FormState> {
  try {
    const storeThemeRaw = formData.get("storeTheme") as string;
    let storeTheme: StoreThemeConfig | undefined;
    if (storeThemeRaw) {
      try { storeTheme = JSON.parse(storeThemeRaw); } catch { /* ignore */ }
    }

    await updateSellerStore({
      name: formData.get("name") as string,
      description: (formData.get("description") as string) || undefined,
      whatsapp: (formData.get("whatsapp") as string) || undefined,
      logoUrl: (formData.get("logoUrl") as string) || undefined,
      bannerUrl: (formData.get("bannerUrl") as string) || undefined,
      qrCodeUrl: (formData.get("qrCodeUrl") as string) || undefined,
      qrWaveUrl: (formData.get("qrWaveUrl") as string) || undefined,
      qrOrangeMoneyUrl: (formData.get("qrOrangeMoneyUrl") as string) || undefined,
      returnPolicy: (formData.get("returnPolicy") as string) || undefined,
      shippingPolicy: (formData.get("shippingPolicy") as string) || undefined,
      storeTheme,
    });
    return { success: true };
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Erreur inconnue.";
    if (msg.includes("Zod") || msg.includes("validation")) {
      return { error: "Données invalides. Vérifiez les champs." };
    }
    return { error: msg };
  }
}

function ColorField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="flex items-center gap-3">
      <div className="relative">
        <input
          type="color"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="size-10 cursor-pointer rounded-lg border p-0"
        />
      </div>
      <div className="flex-1">
        <p className="text-xs font-medium">{label}</p>
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="mt-0.5 w-full rounded-md border bg-transparent px-2 py-1 font-mono text-xs"
        />
      </div>
    </div>
  );
}

export function StoreSettingsForm({
  store,
}: {
  store: {
    name: string;
    description: string | null;
    whatsapp: string | null;
    logoUrl: string | null;
    bannerUrl: string | null;
    qrCodeUrl: string | null;
    qrWaveUrl: string | null;
    qrOrangeMoneyUrl: string | null;
    returnPolicy: string | null;
    shippingPolicy: string | null;
    id: string;
    storeTheme?: unknown;
  };
}) {
  const [state, formAction, pending] = useActionState(handleUpdate, {});
  const [logoPreview, setLogoPreview] = useState(store.logoUrl);
  const [bannerPreview, setBannerPreview] = useState(store.bannerUrl);
  const [qrPreview, setQrPreview] = useState(store.qrCodeUrl);
  const [logoUrl, setLogoUrl] = useState(store.logoUrl ?? "");
  const [bannerUrl, setBannerUrl] = useState(store.bannerUrl ?? "");
  const [qrUrl, setQrUrl] = useState(store.qrCodeUrl ?? "");
  const [qrWavePreview, setQrWavePreview] = useState(store.qrWaveUrl);
  const [qrWaveUrl, setQrWaveUrl] = useState(store.qrWaveUrl ?? "");
  const [qrOrangePreview, setQrOrangePreview] = useState(store.qrOrangeMoneyUrl);
  const [qrOrangeUrl, setQrOrangeUrl] = useState(store.qrOrangeMoneyUrl ?? "");
  const [uploading, setUploading] = useState<"logo" | "banner" | "qr" | "qr_wave" | "qr_orange" | null>(null);
  const logoRef = useRef<HTMLInputElement>(null);
  const bannerRef = useRef<HTMLInputElement>(null);
  const qrRef = useRef<HTMLInputElement>(null);
  const qrWaveRef = useRef<HTMLInputElement>(null);
  const qrOrangeRef = useRef<HTMLInputElement>(null);

  const [themeCfg, setThemeCfg] = useState<StoreThemeConfig>(() =>
    parseStoreTheme(store.storeTheme)
  );

  const updateTheme = (key: keyof StoreThemeConfig, value: string) => {
    setThemeCfg((prev) => ({ ...prev, [key]: value }));
  };

  const resetTheme = () => {
    setThemeCfg({ ...DEFAULT_STORE_THEME });
  };

  const handleImageUpload = async (file: File, type: "logo" | "banner" | "qr" | "qr_wave" | "qr_orange") => {
    setUploading(type);
    try {
      const fd = new FormData();
      fd.append("file", file);
      fd.append("target", "store");
      fd.append("targetId", store.id);
      const altLabel = type === "logo" ? "Logo" : type === "banner" ? "Bannière" : type === "qr_wave" ? "QR Code Wave" : type === "qr_orange" ? "QR Code Orange Money" : "QR Code";
      fd.append("alt", `${altLabel} de ${store.name}`);

      const res = await fetch("/api/media/upload", { method: "POST", body: fd });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Upload échoué");
      }

      const data = await res.json();
      if (type === "logo") {
        setLogoPreview(data.media.url);
        setLogoUrl(data.media.url);
      } else if (type === "banner") {
        setBannerPreview(data.media.url);
        setBannerUrl(data.media.url);
      } else if (type === "qr_wave") {
        setQrWavePreview(data.media.url);
        setQrWaveUrl(data.media.url);
      } else if (type === "qr_orange") {
        setQrOrangePreview(data.media.url);
        setQrOrangeUrl(data.media.url);
      } else {
        setQrPreview(data.media.url);
        setQrUrl(data.media.url);
      }
    } catch (err) {
      alert(err instanceof Error ? err.message : "Erreur upload");
    } finally {
      setUploading(null);
    }
  };

  return (
    <form action={formAction} className="space-y-6">
      <input type="hidden" name="logoUrl" value={logoUrl} />
      <input type="hidden" name="bannerUrl" value={bannerUrl} />
      <input type="hidden" name="qrCodeUrl" value={qrUrl} />
      <input type="hidden" name="qrWaveUrl" value={qrWaveUrl} />
      <input type="hidden" name="qrOrangeMoneyUrl" value={qrOrangeUrl} />
      <input type="hidden" name="storeTheme" value={JSON.stringify(themeCfg)} />

      {state.error && (
        <p className="rounded-lg border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {state.error}
        </p>
      )}
      {state.success && (
        <p className="flex items-center gap-1 rounded-lg border border-green-500/40 bg-green-500/10 px-3 py-2 text-sm text-green-600">
          <Check className="size-4" /> Boutique mise à jour.
        </p>
      )}

      {/* Bannière */}
      <div className="space-y-2">
        <Label>Bannière</Label>
        <div className="relative h-40 overflow-hidden rounded-lg border bg-muted">
          {bannerPreview ? (
            <img src={bannerPreview} alt="Bannière" className="h-full w-full object-cover" />
          ) : (
            <div className="flex h-full items-center justify-center text-muted-foreground">
              Pas de bannière
            </div>
          )}
          {uploading === "banner" && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/50">
              <Loader2 className="size-8 animate-spin text-white" />
            </div>
          )}
          <div className="absolute right-2 top-2 flex gap-1">
            <button
              type="button"
              onClick={() => bannerRef.current?.click()}
              className="rounded-md bg-background/80 px-2 py-1 text-xs backdrop-blur-sm hover:bg-background"
            >
              <ImagePlus className="mr-1 inline size-3" />
              Modifier
            </button>
            {bannerPreview && (
              <button
                type="button"
                onClick={() => { setBannerPreview(null); setBannerUrl(""); }}
                className="rounded-md bg-destructive/80 px-2 py-1 text-xs text-white hover:bg-destructive"
              >
                <X className="inline size-3" />
              </button>
            )}
          </div>
          <input
            ref={bannerRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) handleImageUpload(file, "banner");
              e.target.value = "";
            }}
          />
        </div>
      </div>

      {/* Logo */}
      <div className="space-y-2">
        <Label>Logo</Label>
        <div className="flex items-center gap-4">
          <div className="relative h-24 w-24 overflow-hidden rounded-lg border bg-muted">
            {logoPreview ? (
              <img src={logoPreview} alt="Logo" className="h-full w-full object-cover" />
            ) : (
              <div className="flex h-full items-center justify-center text-3xl text-muted-foreground">
                🏪
              </div>
            )}
            {uploading === "logo" && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                <Loader2 className="size-6 animate-spin text-white" />
              </div>
            )}
          </div>
          <div className="flex flex-col gap-2">
            <button
              type="button"
              onClick={() => logoRef.current?.click()}
              className="rounded-md border px-3 py-1.5 text-sm hover:bg-accent"
            >
              <ImagePlus className="mr-1 inline size-3" />
              Changer le logo
            </button>
            {logoPreview && (
              <button
                type="button"
                onClick={() => { setLogoPreview(null); setLogoUrl(""); }}
                className="rounded-md border border-destructive/40 px-3 py-1.5 text-sm text-destructive hover:bg-destructive/10"
              >
                Supprimer
              </button>
            )}
          </div>
          <input
            ref={logoRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) handleImageUpload(file, "logo");
              e.target.value = "";
            }}
          />
        </div>
      </div>

      {/* QR Code Wave */}
      <div className="space-y-2">
        <Label>QR Code Wave</Label>
        <p className="text-xs text-muted-foreground">
          Uploadez votre QR Code Wave pour que les clients puissent payer par Wave.
        </p>
        <div className="flex items-center gap-4">
          <div className="relative h-40 w-40 overflow-hidden rounded-lg border bg-muted">
            {qrWavePreview ? (
              <img src={qrWavePreview} alt="QR Code Wave" className="h-full w-full object-contain" />
            ) : (
              <div className="flex h-full items-center justify-center text-muted-foreground">
                Pas de QR Code Wave
              </div>
            )}
            {uploading === "qr_wave" && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                <Loader2 className="size-6 animate-spin text-white" />
              </div>
            )}
          </div>
          <div className="flex flex-col gap-2">
            <button
              type="button"
              onClick={() => qrWaveRef.current?.click()}
              className="rounded-md border px-3 py-1.5 text-sm hover:bg-accent"
            >
              <ImagePlus className="mr-1 inline size-3" />
              Changer le QR Code
            </button>
            {qrWavePreview && (
              <button
                type="button"
                onClick={() => { setQrWavePreview(null); setQrWaveUrl(""); }}
                className="rounded-md border border-destructive/40 px-3 py-1.5 text-sm text-destructive hover:bg-destructive/10"
              >
                Supprimer
              </button>
            )}
          </div>
          <input
            ref={qrWaveRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) handleImageUpload(file, "qr_wave");
              e.target.value = "";
            }}
          />
        </div>
      </div>

      {/* QR Code Orange Money */}
      <div className="space-y-2">
        <Label>QR Code Orange Money</Label>
        <p className="text-xs text-muted-foreground">
          Uploadez votre QR Code Orange Money pour que les clients puissent payer par Orange Money.
        </p>
        <div className="flex items-center gap-4">
          <div className="relative h-40 w-40 overflow-hidden rounded-lg border bg-muted">
            {qrOrangePreview ? (
              <img src={qrOrangePreview} alt="QR Code Orange Money" className="h-full w-full object-contain" />
            ) : (
              <div className="flex h-full items-center justify-center text-muted-foreground">
                Pas de QR Code Orange Money
              </div>
            )}
            {uploading === "qr_orange" && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                <Loader2 className="size-6 animate-spin text-white" />
              </div>
            )}
          </div>
          <div className="flex flex-col gap-2">
            <button
              type="button"
              onClick={() => qrOrangeRef.current?.click()}
              className="rounded-md border px-3 py-1.5 text-sm hover:bg-accent"
            >
              <ImagePlus className="mr-1 inline size-3" />
              Changer le QR Code
            </button>
            {qrOrangePreview && (
              <button
                type="button"
                onClick={() => { setQrOrangePreview(null); setQrOrangeUrl(""); }}
                className="rounded-md border border-destructive/40 px-3 py-1.5 text-sm text-destructive hover:bg-destructive/10"
              >
                Supprimer
              </button>
            )}
          </div>
          <input
            ref={qrOrangeRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) handleImageUpload(file, "qr_orange");
              e.target.value = "";
            }}
          />
        </div>
      </div>

      {/* PERSONNALISATION DU THÈME */}
      <div className="space-y-4 rounded-xl border-2 border-dashed p-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Palette className="size-5" style={{ color: themeCfg.primaryColor }} />
            <Label className="text-base font-bold">Personnalisation du thème</Label>
          </div>
          <button
            type="button"
            onClick={resetTheme}
            className="flex items-center gap-1 rounded-md border px-3 py-1.5 text-xs text-muted-foreground hover:bg-accent"
          >
            <RotateCcw className="size-3" />
            Réinitialiser
          </button>
        </div>
        <p className="text-xs text-muted-foreground">
          Personnalisez les couleurs, la police et le style de votre boutique.
        </p>

        {/* Couleurs */}
        <div className="grid gap-4 sm:grid-cols-2">
          <ColorField label="Couleur principale" value={themeCfg.primaryColor} onChange={(v) => updateTheme("primaryColor", v)} />
          <ColorField label="Couleur secondaire" value={themeCfg.secondaryColor} onChange={(v) => updateTheme("secondaryColor", v)} />
          <ColorField label="Couleur de fond" value={themeCfg.backgroundColor} onChange={(v) => updateTheme("backgroundColor", v)} />
          <ColorField label="Couleur des cartes" value={themeCfg.cardColor} onChange={(v) => updateTheme("cardColor", v)} />
          <ColorField label="Couleur du texte" value={themeCfg.textColor} onChange={(v) => updateTheme("textColor", v)} />
        </div>

        {/* Police */}
        <div className="space-y-1.5">
          <Label className="text-sm">Police d&apos;écriture</Label>
          <div className="flex flex-wrap gap-2">
            {FONT_OPTIONS.map((f) => (
              <button
                key={f.value}
                type="button"
                onClick={() => updateTheme("fontFamily", f.value)}
                className="rounded-lg border-2 px-4 py-2 text-sm transition"
                style={{
                  fontFamily: f.css,
                  borderColor: themeCfg.fontFamily === f.value ? themeCfg.primaryColor : undefined,
                  backgroundColor: themeCfg.fontFamily === f.value ? themeCfg.primaryColor + "15" : undefined,
                  color: themeCfg.fontFamily === f.value ? themeCfg.primaryColor : undefined,
                }}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        {/* Arrondi */}
        <div className="space-y-1.5">
          <Label className="text-sm">Arrondi des coins</Label>
          <div className="flex flex-wrap gap-2">
            {RADIUS_OPTIONS.map((r) => (
              <button
                key={r.value}
                type="button"
                onClick={() => updateTheme("borderRadius", r.value)}
                className="border-2 px-4 py-2 text-sm transition"
                style={{
                  borderRadius: r.value,
                  borderColor: themeCfg.borderRadius === r.value ? themeCfg.primaryColor : undefined,
                  backgroundColor: themeCfg.borderRadius === r.value ? themeCfg.primaryColor + "15" : undefined,
                  color: themeCfg.borderRadius === r.value ? themeCfg.primaryColor : undefined,
                }}
              >
                {r.label}
              </button>
            ))}
          </div>
        </div>

        {/* Aperçu en direct */}
        <div className="space-y-2">
          <Label className="text-sm">Aperçu</Label>
          <div
            className="overflow-hidden border p-4"
            style={{
              backgroundColor: themeCfg.backgroundColor,
              color: themeCfg.textColor,
              borderRadius: themeCfg.borderRadius,
              fontFamily: FONT_OPTIONS.find((f) => f.value === themeCfg.fontFamily)?.css,
            }}
          >
            <div
              className="mb-3 flex items-center gap-3 rounded-lg p-3"
              style={{ backgroundColor: themeCfg.secondaryColor, color: "#fff" }}
            >
              <div
                className="flex size-8 items-center justify-center rounded-full text-sm"
                style={{ backgroundColor: themeCfg.primaryColor + "40" }}
              >
                🏪
              </div>
              <div>
                <p className="text-sm font-bold">Ma Boutique</p>
                <p className="text-xs opacity-70">Votre vendeur</p>
              </div>
            </div>
            <div className="mb-3 flex gap-2">
              <span
                className="rounded-full px-3 py-1 text-xs font-medium"
                style={{ backgroundColor: themeCfg.primaryColor, color: "#fff" }}
              >
                Tous
              </span>
              <span
                className="rounded-full px-3 py-1 text-xs font-medium"
                style={{ backgroundColor: themeCfg.primaryColor + "15", color: themeCfg.primaryColor }}
              >
                Vêtements
              </span>
            </div>
            <div className="grid grid-cols-3 gap-2">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="overflow-hidden"
                  style={{ borderRadius: themeCfg.borderRadius, backgroundColor: themeCfg.cardColor }}
                >
                  <div className="aspect-square" style={{ backgroundColor: themeCfg.primaryColor + "20" }} />
                  <div className="p-2">
                    <p className="text-xs font-semibold">Produit {i}</p>
                    <p className="text-xs font-bold" style={{ color: themeCfg.primaryColor }}>10 000 FCFA</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Nom */}
      <div className="space-y-2">
        <Label htmlFor="name">Nom de la boutique</Label>
        <Input id="name" name="name" defaultValue={store.name} required />
      </div>

      {/* Description */}
      <div className="space-y-2">
        <Label htmlFor="description">Description</Label>
        <textarea
          id="description"
          name="description"
          rows={3}
          defaultValue={store.description ?? ""}
          className="w-full rounded-md border bg-transparent px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
          placeholder="Décrivez votre boutique..."
        />
      </div>

      {/* WhatsApp */}
      <div className="space-y-2">
        <Label htmlFor="whatsapp">Numéro WhatsApp</Label>
        <Input
          id="whatsapp"
          name="whatsapp"
          type="tel"
          defaultValue={store.whatsapp ?? ""}
          placeholder="+221 77 123 45 67"
        />
        <p className="text-xs text-muted-foreground">
          Pour que les clients puissent vous contacter directement.
        </p>
      </div>

      {/* Politique de retour */}
      <div className="space-y-2">
        <Label htmlFor="returnPolicy">Politique de retour</Label>
        <textarea
          id="returnPolicy"
          name="returnPolicy"
          rows={3}
          defaultValue={store.returnPolicy ?? ""}
          className="w-full rounded-md border bg-transparent px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
          placeholder="Ex: Retour accepté sous 7 jours si produit non utilisé..."
        />
      </div>

      {/* Politique de livraison */}
      <div className="space-y-2">
        <Label htmlFor="shippingPolicy">Politique de livraison</Label>
        <textarea
          id="shippingPolicy"
          name="shippingPolicy"
          rows={3}
          defaultValue={store.shippingPolicy ?? ""}
          className="w-full rounded-md border bg-transparent px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
          placeholder="Ex: Livraison gratuite à Dakar, 2000 FCFA ailleurs..."
        />
      </div>

      <Button type="submit" disabled={pending}>
        {pending ? <Loader2 className="mr-2 size-4 animate-spin" /> : null}
        Enregistrer les modifications
      </Button>
    </form>
  );
}
