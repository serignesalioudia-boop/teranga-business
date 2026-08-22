"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Home, Package, ShoppingCart, MessageCircle, Truck, Smartphone, Phone, ShieldCheck, Trash2, Minus, Plus, Store, ArrowLeft } from "lucide-react";
import { updateCartItemQty, removeFromCart } from "@/server/actions/cart";
import { placeStoreOrder } from "@/server/actions/place-store-order";
import { formatPrice } from "@/lib/format";

export type StoreCartItem = {
  id: string;
  quantity: number;
  product: {
    id: string;
    name: string;
    slug: string;
    price: string;
    discountPrice: string | null;
    stock: number;
    media: { url: string }[];
    store: { id: string; name: string; slug: string };
  };
};

export function StoreCartPage({
  items,
  storeSlug,
  storeName,
  storeLogoUrl,
  whatsapp,
  qrWaveUrl,
  qrOrangeMoneyUrl,
}: {
  items: StoreCartItem[];
  storeSlug: string;
  storeName: string;
  storeLogoUrl: string | null;
  whatsapp: string | null;
  qrWaveUrl?: string | null;
  qrOrangeMoneyUrl?: string | null;
}) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [nom, setNom] = useState("");
  const [adresse, setAdresse] = useState("");
  const [telephone, setTelephone] = useState("");
  const [modePaiement, setModePaiement] = useState("");
  const [flash, setFlash] = useState<{ msg: string; type: "info" | "error" } | null>(null);

  const subtotal = items.reduce((s, i) => {
    const price = BigInt(i.product.discountPrice && BigInt(i.product.discountPrice) > 0 ? i.product.discountPrice : i.product.price);
    return s + price * BigInt(i.quantity);
  }, BigInt(0));

  const totalItems = items.reduce((s, i) => s + i.quantity, 0);
  const waNumber = whatsapp?.replace(/[^0-9]/g, "") ?? "";

  async function handleQty(itemId: string, newQty: number) {
    setPending(true);
    try {
      await updateCartItemQty(itemId, newQty);
      router.refresh();
    } catch { /* ignore */ }
    setPending(false);
  }

  async function handleRemove(itemId: string) {
    setPending(true);
    try {
      await removeFromCart(itemId);
      router.refresh();
    } catch { /* ignore */ }
    setPending(false);
  }

  function buildWhatsAppMessage() {
    const lines = items.map((i) => {
      const price = Number(i.product.discountPrice && BigInt(i.product.discountPrice) > 0 ? BigInt(i.product.discountPrice) : BigInt(i.product.price));
      return `- ${i.product.name} x${i.quantity} = ${formatPrice(price * i.quantity)}`;
    });
    return [
      "Bonjour, je veux passer une commande.",
      "",
      `Client : ${nom || "Non renseigné"}`,
      `Adresse : ${adresse || "Non renseignée"}`,
      `Contact : ${telephone || "Non renseigné"}`,
      "",
      "Produits :",
      ...lines,
      "",
      `Total : ${formatPrice(subtotal)}`,
      `Paiement : ${modePaiement === "wave" ? "Wave" : modePaiement === "orange_money" ? "Orange Money" : "Paiement à la livraison"}`,
    ].join("\n");
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!nom.trim()) { setFlash({ msg: "Veuillez saisir votre nom.", type: "error" }); return; }
    if (!adresse.trim()) { setFlash({ msg: "Veuillez saisir une adresse.", type: "error" }); return; }
    if (!telephone.trim()) { setFlash({ msg: "Veuillez saisir un contact.", type: "error" }); return; }
    if (!modePaiement) { setFlash({ msg: "Choisissez un mode de paiement.", type: "error" }); return; }

    setPending(true);
    try {
      const methodMap: Record<string, "WAVE" | "ORANGE_MONEY" | "COD"> = {
        wave: "WAVE",
        orange_money: "ORANGE_MONEY",
        livraison: "COD",
      };
      const result = await placeStoreOrder({
        storeSlug,
        nom,
        adresse,
        telephone,
        modePaiement: methodMap[modePaiement],
      });
      setFlash({ msg: `Commande ${result.orderNumber} confirmée ! Merci ${nom}.`, type: "info" });
      router.refresh();
    } catch (err) {
      setFlash({ msg: err instanceof Error ? err.message : "Erreur lors de la commande.", type: "error" });
    }
    setPending(false);
  }

  return (
    <div className="min-h-screen bg-[#fffaf0] text-[#1e293b]">

      {/* ═══ HEADER ═══ */}
      <header className="sticky top-0 z-50 bg-[#24160c] border-b border-[rgba(241,211,122,0.35)]">
        <div className="mx-auto flex max-w-[1200px] items-center justify-between px-3 sm:px-5 py-2.5 sm:py-[15px]">
          <Link href={`/store/${storeSlug}`} className="flex items-center gap-2 sm:gap-[10px] text-white no-underline">
            {storeLogoUrl ? (
              <img src={storeLogoUrl} alt={storeName} className="h-9 w-9 sm:h-[52px] sm:w-[52px] rounded-full border-2 border-[#f1d37a] bg-white object-cover shadow-[0_4px_14px_rgba(0,0,0,0.2)]" />
            ) : (
              <div className="flex h-9 w-9 sm:h-[52px] sm:w-[52px] items-center justify-center rounded-full border-2 border-[#f1d37a] bg-white text-lg sm:text-2xl shadow-[0_4px_14px_rgba(0,0,0,0.2)]">
                <Store className="size-5 sm:size-6 text-[#c8922d]" />
              </div>
            )}
            <span className="text-sm sm:text-[1.25rem] font-bold truncate max-w-[120px] sm:max-w-none">{storeName}</span>
          </Link>

          <nav className="hidden items-center gap-3 sm:gap-[20px] md:flex">
            <Link href={`/store/${storeSlug}`} className="flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium text-[#f8ead0] transition hover:bg-[#c8922d] hover:text-white">
              <Home className="size-4" /> Accueil
            </Link>
            <Link href={`/store/${storeSlug}/products`} className="flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium text-[#f8ead0] transition hover:bg-[#c8922d] hover:text-white">
              <Package className="size-4" /> Produits
            </Link>
            <Link href={`/store/${storeSlug}/cart`} className="relative flex items-center gap-2 rounded-md bg-[#c8922d] px-3 py-2 text-sm font-bold text-white">
              <ShoppingCart className="size-4" /> Panier {totalItems > 0 && <span className="rounded-full bg-white/20 px-2 py-0.5 text-xs">{totalItems}</span>}
            </Link>
          </nav>
        </div>
      </header>

      {/* ═══ CONTENT ═══ */}
      <div className="mx-auto max-w-[1200px] px-3 sm:px-5 py-5 sm:py-8">
        <div className="mb-3 sm:mb-4">
          <Link href={`/store/${storeSlug}`} className="inline-flex items-center gap-1.5 sm:gap-2 rounded-lg border border-[#cbd5e1] bg-white px-2.5 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm font-medium text-[#24160c] transition hover:border-[#c8922d] hover:bg-[#fff7e6] hover:text-[#c8922d]">
            <ArrowLeft className="size-3.5 sm:size-4" />
            Retour
          </Link>
        </div>
        <h1 className="mb-2 text-xl sm:text-2xl font-bold text-[#24160c]">Passer à la caisse</h1>

        {flash && (
          <div className={`mb-4 rounded-lg px-4 py-3 text-sm font-semibold ${flash.type === "error" ? "bg-red-100 text-red-700" : "bg-[#fff0c7] text-[#7a4712]"}`}>
            {flash.msg}
          </div>
        )}

        {items.length === 0 ? (
          <div className="flex flex-col items-center gap-5 py-20 text-center">
            <div className="rounded-full bg-[#f7ead3] p-6">
              <ShoppingCart className="h-12 w-12 text-[#c8922d]" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-[#24160c]">Votre panier est vide</h2>
              <p className="mt-2 text-[#7a4712]">Parcourez les produits de {storeName} et ajoutez ce qui vous plaît.</p>
            </div>
            <Link href={`/store/${storeSlug}`} className="inline-flex items-center gap-2 rounded-lg bg-[#c8922d] px-6 py-3 font-bold text-white transition hover:bg-[#7a4712]">
              Découvrir la boutique
            </Link>
          </div>
        ) : (
          <div className="grid gap-5 sm:gap-[40px] lg:grid-cols-2">

            {/* ── RÉCAPITULATIF ── */}
            <div className="rounded-xl bg-[#fffdf8] p-4 sm:p-5 shadow-[0_4px_18px_rgba(122,71,18,0.08)]">
              <h2 className="mb-3 sm:mb-4 text-base sm:text-lg font-bold text-[#24160c]">Récapitulatif</h2>
              <div className="space-y-3">
                {items.map((item) => {
                  const p = item.product;
                  const unitPrice = BigInt(p.discountPrice && BigInt(p.discountPrice) > 0 ? p.discountPrice : p.price);
                  const lineTotal = unitPrice * BigInt(item.quantity);
                  const hasDiscount = p.discountPrice && BigInt(p.discountPrice) > 0;

                  return (
                    <div key={item.id} className="flex items-center justify-between gap-3 border-b border-[#e2e8f0] pb-3 last:border-0 last:pb-0">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="h-14 w-14 flex-shrink-0 overflow-hidden rounded-lg bg-[#f7ead3]">
                          {p.media[0] ? (
                            <img src={p.media[0].url} alt={p.name} className="h-full w-full object-cover" />
                          ) : (
                            <div className="flex h-full items-center justify-center text-[#c8922d]">📦</div>
                          )}
                        </div>
                        <div className="min-w-0">
                          <p className="line-clamp-1 text-sm font-semibold text-[#1e293b]">{p.name}</p>
                          <div className="mt-1 flex items-center gap-1.5">
                            <button onClick={() => handleQty(item.id, item.quantity - 1)} disabled={pending || item.quantity <= 1}
                              className="flex h-6 w-6 items-center justify-center rounded border border-[#cbd5e1] text-xs text-[#7a4712] transition hover:bg-[#f7ead3] disabled:opacity-40">
                              <Minus className="size-3" />
                            </button>
                            <span className="w-6 text-center text-sm font-medium">{item.quantity}</span>
                            <button onClick={() => handleQty(item.id, item.quantity + 1)} disabled={pending || item.quantity >= p.stock}
                              className="flex h-6 w-6 items-center justify-center rounded border border-[#cbd5e1] text-xs text-[#7a4712] transition hover:bg-[#f7ead3] disabled:opacity-40">
                              <Plus className="size-3" />
                            </button>
                          </div>
                          {hasDiscount && (
                            <p className="mt-0.5 text-[10px] text-gray-400 line-through">{formatPrice(BigInt(p.price))}</p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-[#7a4712]">{formatPrice(lineTotal)}</span>
                        <button onClick={() => handleRemove(item.id)} disabled={pending}
                          className="flex h-6 w-6 items-center justify-center rounded text-gray-400 transition hover:bg-red-50 hover:text-red-500 disabled:opacity-40">
                          <Trash2 className="size-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
              <div className="mt-4 border-t border-[#e2e8f0] pt-3">
                <div className="flex justify-between text-lg font-bold">
                  <span className="text-[#24160c]">Total</span>
                  <span className="text-[#7a4712]">{formatPrice(subtotal)}</span>
                </div>
              </div>
            </div>

            {/* ── FORMULAIRE PAIEMENT ── */}
            <div className="rounded-xl bg-[#fffdf8] p-4 sm:p-5 shadow-[0_4px_18px_rgba(122,71,18,0.08)]">
              <h2 className="mb-3 sm:mb-4 text-base sm:text-lg font-bold text-[#24160c]">Mode de paiement</h2>
              <form onSubmit={handleSubmit} className="space-y-4">

                <div>
                  <label className="mb-1 block text-sm font-semibold text-[#1e293b]">Nom et prénom</label>
                  <textarea name="nom_prenom" value={nom} onChange={(e) => setNom(e.target.value)} required rows={2}
                    placeholder="Ex: SALIOU DIA"
                    className="w-full rounded-lg border border-[#cbd5e1] bg-white px-3 py-2.5 text-sm outline-none transition focus:border-[#c8922d] focus:ring-1 focus:ring-[#c8922d]" />
                </div>

                <div>
                  <label className="mb-1 block text-sm font-semibold text-[#1e293b]">Adresse de livraison</label>
                  <textarea name="adresse" value={adresse} onChange={(e) => setAdresse(e.target.value)} required rows={2}
                    placeholder="Ex: Ville, Quartier, point de repère"
                    className="w-full rounded-lg border border-[#cbd5e1] bg-white px-3 py-2.5 text-sm outline-none transition focus:border-[#c8922d] focus:ring-1 focus:ring-[#c8922d]" />
                </div>

                <div>
                  <label className="mb-1 block text-sm font-semibold text-[#1e293b]">Contact</label>
                  <textarea name="numero" value={telephone} onChange={(e) => setTelephone(e.target.value)} required rows={2}
                    placeholder="Ex: +221 76 514 99 10"
                    className="w-full rounded-lg border border-[#cbd5e1] bg-white px-3 py-2.5 text-sm outline-none transition focus:border-[#c8922d] focus:ring-1 focus:ring-[#c8922d]" />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-semibold text-[#1e293b]">Choisissez votre mode de paiement</label>
                  <div className="flex flex-col sm:flex-row flex-wrap items-stretch sm:items-center gap-2 sm:gap-3">
                    {[
                      { value: "wave", label: "Wave", Icon: Smartphone },
                      { value: "orange_money", label: "Orange Money", Icon: Phone },
                      { value: "livraison", label: "Paiement à la livraison", Icon: Truck },
                    ].map(({ value, label, Icon }) => (
                      <label key={value}
                        className={`flex min-h-[44px] sm:min-h-[48px] cursor-pointer items-center gap-2 rounded-lg border px-3 sm:px-3.5 py-2 sm:py-2.5 text-xs sm:text-sm font-medium transition ${modePaiement === value ? "border-[#c8922d] bg-[#fff7e6] text-[#24160c]" : "border-[rgba(200,146,45,0.35)] bg-[#fffdf8] text-[#1e293b] hover:border-[#c8922d] hover:bg-[#fff7e6]"}`}>
                        <input type="radio" name="mode_paiement" value={value} checked={modePaiement === value}
                          onChange={(e) => setModePaiement(e.target.value)} className="accent-[#c8922d]" />
                        <span className="inline-flex items-center gap-2"><Icon className="size-4" /> {label}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* QR Codes — show only the selected payment method */}
                {modePaiement === "wave" && qrWaveUrl && (
                  <div className="my-4">
                    <figure className="m-0 rounded-lg bg-[#fffdf8] p-2.5 text-center text-[#1e293b] shadow-[0_6px_18px_rgba(36,22,12,0.15)] border border-[rgba(200,146,45,0.35)]">
                      <div className="mx-auto flex aspect-square w-[220px] items-center justify-center rounded-md bg-white overflow-hidden">
                        <img src={qrWaveUrl} alt="QR Code Wave" className="h-full w-full object-contain p-2" />
                      </div>
                      <figcaption className="mt-2 flex items-center justify-center gap-2 text-sm font-bold text-[#1e293b]">
                        <Smartphone className="size-4 text-[#c8922d]" /> Scannez pour payer avec Wave
                      </figcaption>
                    </figure>
                  </div>
                )}
                {modePaiement === "orange_money" && qrOrangeMoneyUrl && (
                  <div className="my-4">
                    <figure className="m-0 rounded-lg bg-[#fffdf8] p-2.5 text-center text-[#1e293b] shadow-[0_6px_18px_rgba(36,22,12,0.15)] border border-[rgba(200,146,45,0.35)]">
                      <div className="mx-auto flex aspect-square w-[220px] items-center justify-center rounded-md bg-white overflow-hidden">
                        <img src={qrOrangeMoneyUrl} alt="QR Code Orange Money" className="h-full w-full object-contain p-2" />
                      </div>
                      <figcaption className="mt-2 flex items-center justify-center gap-2 text-sm font-bold text-[#1e293b]">
                        <Phone className="size-4 text-[#c8922d]" /> Scannez pour payer avec Orange Money
                      </figcaption>
                    </figure>
                  </div>
                )}

                {/* Actions */}
                <div className="mt-3 flex flex-col sm:flex-row flex-wrap items-stretch sm:items-end gap-3 sm:gap-4">
                  <button type="submit" disabled={pending}
                    className="inline-flex items-center justify-center gap-2 rounded-lg bg-[#c8922d] px-6 sm:px-8 py-3 sm:py-3.5 text-sm sm:text-base font-bold text-white transition hover:bg-[#7a4712] disabled:opacity-60 min-h-[48px] sm:min-h-[52px]">
                    <ShieldCheck className="size-4 sm:size-5" /> Passer la commande
                  </button>

                  {waNumber && (
                    <div className="flex flex-col gap-1.5">
                      <span className="text-xs sm:text-sm font-extrabold text-[#7a4712]">Passer la commande sur WhatsApp</span>
                      <a href={`https://wa.me/${waNumber}?text=${encodeURIComponent(buildWhatsAppMessage())}`}
                        target="_blank" rel="noopener noreferrer"
                        className="inline-flex min-h-[44px] items-center justify-center gap-2 rounded-lg border border-[#22c55e] bg-[#ecfdf5] px-3.5 py-2.5 font-bold text-[#15803d] transition hover:bg-[#dcfce7] hover:text-[#166534]">
                        <MessageCircle className="size-5 text-[#22c55e]" />
                        <span>WhatsApp</span>
                      </a>
                    </div>
                  )}
                </div>
              </form>
            </div>
          </div>
        )}
      </div>

      {/* ═══ FOOTER ═══ */}
      <footer className="mt-12 bg-[#24160c] px-5 py-6 text-center text-sm text-[#f8ead0] opacity-80">
        Propulsé par <Link href="/" className="font-bold text-[#f1d37a] no-underline">Teranga Business</Link>
      </footer>
    </div>
  );
}
