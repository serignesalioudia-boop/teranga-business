"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { StarRating } from "./star-rating";
import { createReview } from "@/server/actions/reviews";

type ReviewFormProps = {
  productId: string;
  orderItemId?: string;
  onSuccess?: () => void;
};

export function ReviewForm({ productId, orderItemId, onSuccess }: ReviewFormProps) {
  const [rating, setRating] = useState(0);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [error, setError] = useState("");
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (rating === 0) {
      setError("Veuillez sélectionner une note.");
      return;
    }
    startTransition(async () => {
      try {
        await createReview({ productId, rating, title, content, orderItemId: orderItemId ?? "" });
        router.refresh();
        onSuccess?.();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Erreur lors de l'envoi.");
      }
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 rounded-xl border p-4">
      <h3 className="font-bold">Donner votre avis</h3>

      <div className="space-y-1">
        <label className="text-sm font-medium">Note *</label>
        <StarRating value={rating} onChange={setRating} size="lg" />
      </div>

      <div className="space-y-1">
        <label className="text-sm font-medium">Titre (optionnel)</label>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Résumez votre avis..."
          className="w-full rounded-lg border bg-background px-3 py-2 text-sm"
          maxLength={200}
        />
      </div>

      <div className="space-y-1">
        <label className="text-sm font-medium">Commentaire (optionnel)</label>
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Partagez votre expérience..."
          className="w-full rounded-lg border bg-background px-3 py-2 text-sm"
          rows={4}
          maxLength={2000}
        />
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}

      <button
        type="submit"
        disabled={isPending}
        className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition hover:bg-primary/90 disabled:opacity-50"
      >
        {isPending ? "Envoi..." : "Publier mon avis"}
      </button>
    </form>
  );
}
