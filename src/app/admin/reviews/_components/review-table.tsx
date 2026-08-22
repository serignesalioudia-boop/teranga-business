"use client";

import { useState } from "react";
import { StarRating } from "@/components/reviews/star-rating";
import { Badge } from "@/components/ui/badge";
import { formatDistanceToNow } from "@/lib/utils";
import { ModerateButton } from "./moderate-button";
import { BulkModerationBar } from "./bulk-moderation";

type ReviewRow = {
  id: string;
  rating: number;
  title: string | null;
  content: string | null;
  status: string;
  createdAt: Date;
  user: { name: string; email: string };
  product: { name: string; slug: string };
};

type Props = {
  reviews: ReviewRow[];
  currentStatus?: string;
};

const statusLabels: Record<string, string> = {
  PENDING: "En attente",
  APPROVED: "Approuvé",
  REJECTED: "Rejeté",
};

export function ReviewTable({ reviews, currentStatus }: Props) {
  const [selected, setSelected] = useState<Set<string>>(new Set());

  function toggle(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleAll() {
    if (selected.size === reviews.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(reviews.map((r) => r.id)));
    }
  }

  function clearSelection() {
    setSelected(new Set());
  }

  return (
    <div className="space-y-4">
      <div className="rounded-xl border overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-muted/50">
            <tr>
              <th className="px-4 py-3 text-left w-10">
                <input
                  type="checkbox"
                  checked={selected.size === reviews.length && reviews.length > 0}
                  onChange={toggleAll}
                  className="rounded"
                />
              </th>
              <th className="px-4 py-3 text-left">Produit</th>
              <th className="px-4 py-3 text-left">Auteur</th>
              <th className="px-4 py-3 text-left">Note</th>
              <th className="px-4 py-3 text-left">Commentaire</th>
              <th className="px-4 py-3 text-left">Statut</th>
              <th className="px-4 py-3 text-left">Date</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {reviews.map((review) => (
              <tr key={review.id} className={selected.has(review.id) ? "bg-muted/30" : ""}>
                <td className="px-4 py-3">
                  <input
                    type="checkbox"
                    checked={selected.has(review.id)}
                    onChange={() => toggle(review.id)}
                    className="rounded"
                  />
                </td>
                <td className="px-4 py-3">
                  <a
                    href={`/product/${review.product.slug}`}
                    className="text-primary hover:underline"
                  >
                    {review.product.name}
                  </a>
                </td>
                <td className="px-4 py-3">
                  {review.user.name ?? review.user.email}
                </td>
                <td className="px-4 py-3">
                  <StarRating value={review.rating} readonly size="sm" />
                </td>
                <td className="px-4 py-3 max-w-xs truncate">
                  {review.title && <span className="font-medium">{review.title} — </span>}
                  {review.content ?? "—"}
                </td>
                <td className="px-4 py-3">
                  <Badge
                    className={
                      review.status === "APPROVED"
                        ? "bg-green-100 text-green-700"
                        : review.status === "PENDING"
                          ? "bg-yellow-100 text-yellow-700"
                          : "bg-red-100 text-red-700"
                    }
                  >
                    {statusLabels[review.status]}
                  </Badge>
                </td>
                <td className="px-4 py-3 text-muted-foreground">
                  {formatDistanceToNow(review.createdAt)}
                </td>
                <td className="px-4 py-3 text-right">
                  <ModerateButton reviewId={review.id} currentStatus={review.status} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <BulkModerationBar selectedIds={[...selected]} onClear={clearSelection} />
    </div>
  );
}
