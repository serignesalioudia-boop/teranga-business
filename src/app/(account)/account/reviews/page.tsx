export const dynamic = "force-dynamic";

import Link from "next/link";
import { getUserReviews } from "@/server/actions/reviews";
import { StarRating } from "@/components/reviews/star-rating";
import { Badge } from "@/components/ui/badge";
import { formatDistanceToNow } from "@/lib/utils";
import { DeleteReviewButton } from "./_components/delete-button";


export const metadata = { title: "Mes avis — Teranga Business" };

export default async function AccountReviewsPage() {
  const reviews = await getUserReviews();

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Mes avis</h1>

      {reviews.length === 0 ? (
        <div className="text-center py-8 space-y-2">
          <p className="text-muted-foreground">Vous n&apos;avez pas encore donné d&apos;avis.</p>
          <Link href="/products" className="text-sm text-primary hover:underline">
            Découvrir les produits
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {reviews.map((review) => (
            <div key={review.id} className="rounded-xl border p-4 space-y-2">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <Link
                    href={`/product/${review.product.slug}`}
                    className="font-medium hover:text-primary"
                  >
                    {review.product.name}
                  </Link>
                  <StarRating value={review.rating} readonly size="sm" />
                </div>
                <div className="flex items-center gap-3">
                  <Badge
                    className={
                      review.status === "APPROVED"
                        ? "bg-green-100 text-green-700"
                        : review.status === "PENDING"
                          ? "bg-yellow-100 text-yellow-700"
                          : "bg-red-100 text-red-700"
                    }
                  >
                    {review.status === "APPROVED"
                      ? "Approuvé"
                      : review.status === "PENDING"
                        ? "En attente"
                        : "Rejeté"}
                  </Badge>
                  <span className="text-xs text-muted-foreground">
                    {formatDistanceToNow(review.createdAt)}
                  </span>
                </div>
              </div>
              {review.title && <p className="font-medium">{review.title}</p>}
              {review.content && (
                <p className="text-sm text-muted-foreground">{review.content}</p>
              )}
              <DeleteReviewButton reviewId={review.id} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
