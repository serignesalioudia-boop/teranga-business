import { getProductReviews } from "@/server/actions/reviews";
import { ReviewCard } from "./review-card";
import { StarRating } from "./star-rating";

type ReviewListProps = {
  productId: string;
  ratingAvg?: number;
  ratingCount?: number;
};

export async function ReviewList({ productId, ratingAvg, ratingCount }: ReviewListProps) {
  const reviews = await getProductReviews(productId);

  return (
    <div className="space-y-4">
      {ratingCount !== undefined && ratingCount > 0 && (
        <div className="flex items-center gap-3">
          <StarRating value={Math.round(ratingAvg ?? 0)} readonly size="lg" />
          <span className="text-sm text-muted-foreground">
            {Number(ratingAvg).toFixed(1)} / 5 ({ratingCount} avis)
          </span>
        </div>
      )}

      {reviews.length === 0 ? (
        <p className="text-sm text-muted-foreground">Aucun avis pour ce produit.</p>
      ) : (
        <div className="space-y-3">
          {reviews.map((review) => (
            <ReviewCard key={review.id} review={review} />
          ))}
        </div>
      )}
    </div>
  );
}
