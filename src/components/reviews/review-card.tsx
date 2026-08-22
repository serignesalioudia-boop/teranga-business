import { StarRating } from "./star-rating";
import { formatDistanceToNow } from "@/lib/utils";

type ReviewCardProps = {
  review: {
    id: string;
    rating: number;
    title: string | null;
    content: string | null;
    createdAt: Date;
    user: { id: string; name: string | null };
  };
};

export function ReviewCard({ review }: ReviewCardProps) {
  return (
    <div className="rounded-xl border p-4 space-y-2">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <p className="font-medium">{review.user.name ?? "Anonyme"}</p>
          <StarRating value={review.rating} readonly size="sm" />
        </div>
        <span className="text-xs text-muted-foreground">
          {formatDistanceToNow(review.createdAt)}
        </span>
      </div>
      {review.title && (
        <p className="font-medium">{review.title}</p>
      )}
      {review.content && (
        <p className="text-sm text-muted-foreground">{review.content}</p>
      )}
    </div>
  );
}
