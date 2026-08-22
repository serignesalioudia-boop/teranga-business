export const dynamic = "force-dynamic";

import { getAdminReviews } from "@/server/actions/reviews";
import { ReviewStatus } from "@/generated/prisma/enums";
import { ReviewTable } from "./_components/review-table";

type Props = { searchParams: Promise<{ status?: string }> };

const VALID_STATUSES = ["PENDING", "APPROVED", "REJECTED"] as const;


export const metadata = { title: "Modération des avis — Admin" };

export default async function AdminReviewsPage({ searchParams }: Props) {
  const { status: statusParam } = await searchParams;
  const statusFilter = VALID_STATUSES.includes(statusParam as typeof VALID_STATUSES[number])
    ? (statusParam as ReviewStatus)
    : undefined;
  const reviews = await getAdminReviews(statusFilter);

  const statusLabels: Record<string, string> = {
    PENDING: "En attente",
    APPROVED: "Approuvé",
    REJECTED: "Rejeté",
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Avis</h1>
        <div className="flex gap-2">
          {["PENDING", "APPROVED", "REJECTED", ""].map((s) => (
            <a
              key={s}
              href={s ? `/admin/reviews?status=${s}` : "/admin/reviews"}
              className={`rounded-lg px-3 py-1 text-xs font-medium transition ${
                statusFilter === s || (!statusFilter && !s)
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground hover:bg-accent"
              }`}
            >
              {s ? statusLabels[s] : "Tous"}
            </a>
          ))}
        </div>
      </div>

      {reviews.length === 0 ? (
        <p className="text-muted-foreground">Aucun avis à modérer.</p>
      ) : (
        <ReviewTable reviews={reviews} currentStatus={statusFilter} />
      )}
    </div>
  );
}
