"use client";

import { useActionState } from "react";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  createProduct,
  updateProduct,
  addProductMediaUrl,
  deleteProductMedia,
  type ProductInput,
} from "@/server/actions/products";

type Store = { id: string; name: string; slug: string };
type Category = { id: string; name: string; slug: string };
type Product = {
  id: string;
  name: string;
  description: string | null;
  price: number | bigint;
  discountPrice: number | bigint | null;
  stock: number;
  sku: string | null;
  lowStockThreshold: number;
  status: string;
  isFeatured: boolean;
  storeId: string;
  categoryId: string;
  isDigital: boolean;
  digitalFileUrl: string | null;
  digitalFileSize: number | null;
};
type Media = { id: string; url: string; alt: string | null; position: number };

type PendingImage =
  | { kind: "file"; file: File; preview: string }
  | { kind: "url"; url: string; alt: string };

function formatPriceBP(bp: number | bigint) {
  return Number(bp).toString();
}

export function ProductForm({
  product,
  stores,
  categories,
  existingMedia = [],
}: {
  product?: Product;
  stores: Store[];
  categories: Category[];
  existingMedia?: Media[];
}) {
  const router = useRouter();
  const isEdit = !!product;
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [savedMedia, setSavedMedia] = useState<Media[]>(existingMedia);
  const [pendingImages, setPendingImages] = useState<PendingImage[]>([]);
  const [urlInput, setUrlInput] = useState("");
  const [altInput, setAltInput] = useState("");
  const [processing, setProcessing] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isDigital, setIsDigital] = useState(product?.isDigital ?? false);
  const [digitalFileUrl, setDigitalFileUrl] = useState(product?.digitalFileUrl ?? "");
  const [digitalFileSize, setDigitalFileSize] = useState(product?.digitalFileSize ?? 0);
  const [uploadingDigital, setUploadingDigital] = useState(false);
  const digitalFileRef = useRef<HTMLInputElement>(null);
  const [storeId, setStoreId] = useState(product?.storeId ?? stores[0]?.id ?? "");
  const [categoryId, setCategoryId] = useState(product?.categoryId ?? "");
  const [customCategoryName, setCustomCategoryName] = useState("");
  const [status, setStatus] = useState(product?.status ?? "DRAFT");

  const totalImages = savedMedia.length + pendingImages.length;
  const maxImages = 8;

  async function handleAction(_prev: unknown, formData: FormData) {
    const input: ProductInput = {
      storeId,
      categoryId,
      customCategoryName: categoryId === "__custom__" ? customCategoryName : "",
      name: String(formData.get("name") ?? ""),
      description: String(formData.get("description") ?? ""),
      price: Math.round(Number(formData.get("price") ?? 0)),
      discountPrice: Math.round(Number(formData.get("discountPrice") ?? 0)),
      stock: isDigital ? 999999 : Number(formData.get("stock") ?? 0),
      sku: String(formData.get("sku") ?? ""),
      lowStockThreshold: Number(formData.get("lowStockThreshold") ?? 0),
      status: status as ProductInput["status"],
      isFeatured: formData.get("isFeatured") === "on",
      isDigital,
      digitalFileUrl: digitalFileUrl || "",
      digitalFileSize: digitalFileSize || 0,
    };

    setProcessing(true);
    setErrorMsg(null);

    try {
      let productId: string;

      if (isEdit) {
        await updateProduct(product.id, input);
        productId = product.id;
      } else {
        const created = await createProduct(input);
        productId = created.id;
      }

      if (pendingImages.length > 0) {
        const errors: string[] = [];

        for (const img of pendingImages) {
          try {
            if (img.kind === "url") {
              await addProductMediaUrl(productId, img.url, img.alt);
            } else {
              const fd = new FormData();
              fd.append("file", img.file);
              fd.append("target", "product");
              fd.append("targetId", productId);
              fd.append("alt", img.file.name.replace(/\.[^.]+$/, ""));

              const res = await fetch("/api/media/upload", {
                method: "POST",
                body: fd,
              });

              if (!res.ok) {
                const err = await res.json();
                throw new Error(err.error || "Upload échoué");
              }

              const data = await res.json();
              setSavedMedia((prev) => [
                ...prev,
                { id: data.media.id, url: data.media.url, alt: data.media.alt ?? "", position: data.media.position },
              ]);
            }
          } catch (e) {
            errors.push(e instanceof Error ? e.message : String(e));
          }
        }

        if (errors.length > 0) {
          setErrorMsg(`${errors.length} image(s) en erreur : ${errors.join("; ")}`);
          setPendingImages([]);
          setSuccessMsg(isEdit ? "Produit mis à jour." : "Produit créé ! Certaines images ont échoué.");
          return "error";
        }
      }

      setPendingImages([]);
      setSuccessMsg(
        isEdit
          ? "Produit mis à jour avec succès."
          : "Produit créé avec succès !",
      );

      if (!isEdit) {
        const path = window.location.pathname;
        if (path.includes("/seller/")) {
          router.push("/seller/products");
        } else {
          router.push("/admin/products");
        }
      }
    } catch (e) {
      return String(e instanceof Error ? e.message : e);
    } finally {
      setProcessing(false);
    }
  }

  const [state, formAction, isPending] = useActionState(handleAction, null);

  function addUrlImage() {
    const trimmed = urlInput.trim();
    if (!trimmed) return;
    if (!/^https?:\/\//.test(trimmed)) {
      setErrorMsg("L'URL doit commencer par http:// ou https://");
      return;
    }
    setPendingImages((prev) => [
      ...prev,
      { kind: "url", url: trimmed, alt: altInput.trim() || trimmed },
    ]);
    setUrlInput("");
    setAltInput("");
    setErrorMsg(null);
  }

  async function handleDigitalFileUpload(file: File) {
    setUploadingDigital(true);
    setErrorMsg(null);
    try {
      const fd = new FormData();
      fd.append("file", file);
      fd.append("productId", product?.id ?? "pending");

      const res = await fetch("/api/products/digital-upload", {
        method: "POST",
        body: fd,
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Upload échoué");
      }

      const data = await res.json();
      setDigitalFileUrl(data.file.url);
      setDigitalFileSize(data.file.size);
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : "Erreur upload fichier digital");
    } finally {
      setUploadingDigital(false);
    }
  }

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files;
    if (!files) return;
    const remaining = maxImages - totalImages;
    const toAdd = Array.from(files).slice(0, remaining);
    const newImages: PendingImage[] = toAdd.map((f) => ({
      kind: "file" as const,
      file: f,
      preview: URL.createObjectURL(f),
    }));
    setPendingImages((prev) => [...prev, ...newImages]);
    if (inputRef.current) inputRef.current.value = "";
  }

  function removePendingImage(index: number) {
    setPendingImages((prev) => {
      const img = prev[index];
      if (img?.kind === "file") URL.revokeObjectURL(img.preview);
      return prev.filter((_, i) => i !== index);
    });
  }

  async function removeSavedMedia(mediaId: string) {
    await deleteProductMedia(mediaId);
    setSavedMedia((prev) => prev.filter((m) => m.id !== mediaId));
  }

  let inputRef = fileInputRef;

  return (
    <div className="max-w-2xl space-y-6">
      <form action={formAction} className="space-y-4">
        <input type="hidden" name="storeId" value={storeId} />
        <input type="hidden" name="categoryId" value={categoryId} />
        <input type="hidden" name="customCategoryName" value={customCategoryName} />
        <input type="hidden" name="status" value={status} />

        {state && typeof state === "string" && (
          <p className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
            {state}
          </p>
        )}

        {successMsg && (
          <p className="rounded-md bg-green-50 p-3 text-sm text-green-700 dark:bg-green-950 dark:text-green-300">
            {successMsg}
          </p>
        )}

        {errorMsg && (
          <p className="rounded-md bg-orange-50 p-3 text-sm text-orange-700 dark:bg-orange-950 dark:text-orange-300">
            {errorMsg}
          </p>
        )}

        <div className="space-y-2">
          <Label htmlFor="name">Nom *</Label>
          <Input
            id="name"
            name="name"
            defaultValue={product?.name}
            required
            maxLength={200}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="description">Description</Label>
          <Textarea
            id="description"
            name="description"
            defaultValue={product?.description ?? ""}
            rows={4}
            maxLength={5000}
          />
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label>Boutique *</Label>
            <Select name="storeId" defaultValue={product?.storeId ?? stores[0]?.id ?? ""} value={storeId} onValueChange={setStoreId}>
              <SelectTrigger>
                <SelectValue placeholder="Choisir..." />
              </SelectTrigger>
              <SelectContent>
                {stores.map((s) => (
                  <SelectItem key={s.id} value={s.id}>
                    {s.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Catégorie *</Label>
            <Select name="categoryId" defaultValue={product?.categoryId ?? ""} value={categoryId} onValueChange={(v) => { setCategoryId(v); if (v !== "__custom__") setCustomCategoryName(""); }}>
              <SelectTrigger>
                <SelectValue placeholder="Choisir..." />
              </SelectTrigger>
              <SelectContent>
                {categories.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.name}
                  </SelectItem>
                ))}
                <SelectItem value="__custom__">Autre (catégorie personnalisée)</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {categoryId === "__custom__" && (
          <div className="space-y-2">
            <Label htmlFor="customCategoryName">Nom de la catégorie *</Label>
            <Input
              id="customCategoryName"
              placeholder="Ex: Cosmétiques, Alimentation..."
              value={customCategoryName}
              onChange={(e) => setCustomCategoryName(e.target.value)}
              maxLength={100}
              required
            />
          </div>
        )}

        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
          <div className="space-y-2">
            <Label htmlFor="price">Prix (XOF) *</Label>
            <Input
              id="price"
              name="price"
              type="number"
              min={1}
              defaultValue={product ? formatPriceBP(product.price) : ""}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="discountPrice">Prix barré (XOF)</Label>
            <Input
              id="discountPrice"
              name="discountPrice"
              type="number"
              min={0}
              defaultValue={
                product?.discountPrice
                  ? formatPriceBP(product.discountPrice)
                  : ""
              }
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="sku">SKU</Label>
            <Input
              id="sku"
              name="sku"
              defaultValue={product?.sku ?? ""}
              maxLength={100}
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
          {!isDigital && (
            <>
              <div className="space-y-2">
                <Label htmlFor="stock">Stock *</Label>
                <Input
                  id="stock"
                  name="stock"
                  type="number"
                  min={0}
                  defaultValue={product?.stock ?? 0}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="lowStockThreshold">Seuil stock faible</Label>
                <Input
                  id="lowStockThreshold"
                  name="lowStockThreshold"
                  type="number"
                  min={0}
                  defaultValue={product?.lowStockThreshold ?? 0}
                />
              </div>
            </>
          )}
          {isDigital && (
            <div className="space-y-2">
              <Label>Stock</Label>
              <p className="flex h-10 items-center rounded-md border bg-muted/50 px-3 text-sm text-muted-foreground">
                Illimité
              </p>
            </div>
          )}
          <div className="space-y-2">
            <Label>Statut</Label>
            <Select name="status" defaultValue={product?.status ?? "DRAFT"} value={status} onValueChange={setStatus}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="DRAFT">Brouillon</SelectItem>
                <SelectItem value="PUBLISHED">Publié</SelectItem>
                <SelectItem value="ARCHIVED">Archivé</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            name="isFeatured"
            id="isFeatured"
            defaultChecked={product?.isFeatured ?? false}
            className="h-4 w-4"
          />
          <Label htmlFor="isFeatured" className="font-normal">
            Produit vedette
          </Label>
        </div>

        <div className="space-y-3 rounded-lg border p-4">
          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              id="isDigital"
              checked={isDigital}
              onChange={(e) => setIsDigital(e.target.checked)}
              className="h-4 w-4"
            />
            <Label htmlFor="isDigital" className="font-normal">
              Produit digital
            </Label>
          </div>

          {isDigital && (
            <div className="space-y-3 rounded-md bg-muted/50 p-3">
              <p className="text-xs text-muted-foreground">
                Le fichier sera accessible à l&apos;acheteur après confirmation de la commande.
              </p>
              <input type="hidden" name="digitalFileUrl" value={digitalFileUrl} />
              <input type="hidden" name="digitalFileSize" value={digitalFileSize} />

              {digitalFileUrl ? (
                <div className="flex items-center justify-between rounded-md border bg-background p-2">
                  <div className="flex items-center gap-2 text-sm">
                    <svg className="h-4 w-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span>Fichier uploadé</span>
                    {digitalFileSize > 0 && (
                      <span className="text-xs text-muted-foreground">
                        ({(digitalFileSize / (1024 * 1024)).toFixed(2)} Mo)
                      </span>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => digitalFileRef.current?.click()}
                      className="rounded-md border px-2 py-1 text-xs hover:bg-accent"
                    >
                      Remplacer
                    </button>
                    <button
                      type="button"
                      onClick={() => { setDigitalFileUrl(""); setDigitalFileSize(0); }}
                      className="rounded-md border border-destructive/40 px-2 py-1 text-xs text-destructive hover:bg-destructive/10"
                    >
                      Supprimer
                    </button>
                  </div>
                </div>
              ) : (
                <div
                  onClick={() => digitalFileRef.current?.click()}
                  className="flex cursor-pointer flex-col items-center gap-2 rounded-md border-2 border-dashed p-6 text-center transition hover:border-primary/50 hover:bg-accent/50"
                >
                  {uploadingDigital ? (
                    <p className="text-sm text-muted-foreground">Upload en cours...</p>
                  ) : (
                    <>
                      <svg className="h-8 w-8 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                      </svg>
                      <p className="text-sm font-medium">Cliquez pour uploader un fichier</p>
                      <p className="text-xs text-muted-foreground">
                        PDF, ZIP, images, vidéos — max 100 Mo
                      </p>
                    </>
                  )}
                </div>
              )}

              <input
                ref={digitalFileRef}
                type="file"
                accept=".pdf,.zip,.rar,.7z,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.mp4,.mp3,.png,.jpg,.jpeg,.webp"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleDigitalFileUpload(file);
                  e.target.value = "";
                }}
              />
            </div>
          )}
        </div>

        {/* ── Section images ── */}
        <div className="space-y-3 rounded-lg border p-4">
          <div className="flex items-center justify-between">
            <h3 className="font-medium">Images du produit</h3>
            <span className="text-xs text-muted-foreground">
              {totalImages} / {maxImages}
            </span>
          </div>

          {/* Images sauvegardées (déjà en base) */}
          <div className="flex flex-wrap gap-3">
            {savedMedia.map((m) => (
              <div key={m.id} className="group relative h-24 w-24 overflow-hidden rounded-lg border">
                <img
                  src={m.url}
                  alt={m.alt ?? ""}
                  className="h-full w-full object-cover"
                />
                <button
                  type="button"
                  onClick={() => removeSavedMedia(m.id)}
                  className="absolute right-1 top-1 rounded-full bg-destructive p-1 text-white opacity-0 transition group-hover:opacity-100"
                >
                  <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            ))}

            {/* Aperçus des images en attente */}
            {pendingImages.map((img, i) => (
              <div key={i} className="group relative h-24 w-24 overflow-hidden rounded-lg border">
                <img
                  src={img.kind === "file" ? img.preview : img.url}
                  alt={img.kind === "file" ? img.file.name : img.alt}
                  className="h-full w-full object-cover"
                />
                <span className="absolute bottom-0 left-0 right-0 bg-black/60 px-1 text-center text-[9px] text-white">
                  {img.kind === "file" ? "Fichier" : "URL"}
                </span>
                <button
                  type="button"
                  onClick={() => removePendingImage(i)}
                  className="absolute right-1 top-1 rounded-full bg-destructive p-1 text-white opacity-0 transition group-hover:opacity-100"
                >
                  <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            ))}
          </div>

          {totalImages >= maxImages && (
            <p className="text-xs text-orange-600 dark:text-orange-400">
              Maximum {maxImages} images atteint.
            </p>
          )}

          {/* Ajouter par fichier */}
          {totalImages < maxImages && (
            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => fileInputRef.current?.click()}
              >
                <svg className="mr-1.5 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                Insérer depuis l&apos;appareil
              </Button>

              <input
                ref={inputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif,image/avif"
                multiple
                className="hidden"
                onChange={handleFileSelect}
              />
            </div>
          )}

          {/* Ajouter par URL */}
          {totalImages < maxImages && (
            <div className="space-y-2">
              <p className="text-xs text-muted-foreground">ou coller un lien image :</p>
              <div className="flex gap-2">
                <Input
                  type="url"
                  placeholder="https://exemple.com/photo.jpg"
                  value={urlInput}
                  onChange={(e) => setUrlInput(e.target.value)}
                  className="flex-1"
                />
                <Input
                  type="text"
                  placeholder="Légende (optionnel)"
                  value={altInput}
                  onChange={(e) => setAltInput(e.target.value)}
                  className="w-40"
                />
                <Button type="button" variant="secondary" size="sm" onClick={addUrlImage}>
                  Ajouter
                </Button>
              </div>
            </div>
          )}
        </div>

        <div className="flex gap-3 pt-2">
          <Button type="submit" disabled={isPending || processing}>
            {isPending || processing
              ? isEdit
                ? "Enregistrement..."
                : "Création..."
              : isEdit
                ? "Enregistrer"
                : "Créer le produit"}
          </Button>
          <Button type="button" variant="outline" onClick={() => router.back()}>
            Annuler
          </Button>
        </div>
      </form>
    </div>
  );
}
