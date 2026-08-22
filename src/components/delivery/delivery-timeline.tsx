import { DELIVERY_STATUS_LABELS, DELIVERY_STATUS_COLORS } from "@/lib/order-status";
import { formatDistanceToNow } from "@/lib/utils";

type HistoryEntry = {
  status: string;
  note: string | null;
  changedBy: string;
  createdAt: Date;
};

export function DeliveryTimeline({ history }: { history: HistoryEntry[] }) {
  if (!history || history.length === 0) return null;

  return (
    <div className="relative ml-4 border-l-2 border-muted pl-6">
      {history.map((entry, i) => {
        const colorClass = DELIVERY_STATUS_COLORS[entry.status] ?? "bg-gray-100 text-gray-800";
        const label = DELIVERY_STATUS_LABELS[entry.status] ?? entry.status;

        return (
          <div key={i} className="relative mb-6 last:mb-0">
            <div className={`absolute -left-[31px] flex h-6 w-6 items-center justify-center rounded-full ${colorClass} text-xs font-bold ring-4 ring-background`}>
              {i + 1}
            </div>
            <div>
              <p className="font-medium text-sm">{label}</p>
              {entry.note && (
                <p className="text-xs text-muted-foreground mt-0.5">{entry.note}</p>
              )}
              <p className="text-[11px] text-muted-foreground mt-0.5">
                {formatDistanceToNow(entry.createdAt)}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
