export const dynamic = "force-dynamic";

import { getNotifications } from "@/server/actions/notifications";
import { formatDistanceToNow } from "@/lib/utils";
import { MarkAllReadButton } from "./_components/mark-all-read";
import { MarkReadButton } from "./_components/mark-read";


export const metadata = { title: "Notifications — Teranga Business" };

const TYPE_ICONS: Record<string, string> = {
  ORDER: "📦",
  PAYMENT: "💰",
  DELIVERY: "🚚",
  SYSTEM: "🔔",
};

const TYPE_LABELS: Record<string, string> = {
  ORDER: "Commande",
  PAYMENT: "Paiement",
  DELIVERY: "Livraison",
  SYSTEM: "Système",
};

export default async function NotificationsPage() {
  const notifications = await getNotifications(50);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Notifications</h1>
        {notifications.some((n) => !n.isRead) && <MarkAllReadButton />}
      </div>

      {notifications.length === 0 ? (
        <p className="text-center py-8 text-muted-foreground">Aucune notification.</p>
      ) : (
        <div className="space-y-2">
          {notifications.map((n) => (
            <div
              key={n.id}
              className={`flex items-start gap-3 rounded-xl border p-4 transition ${
                !n.isRead ? "bg-primary/5 border-primary/20" : ""
              }`}
            >
              <span className="text-2xl">{TYPE_ICONS[n.type] ?? "🔔"}</span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium">
                    {TYPE_LABELS[n.type] ?? n.type}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {formatDistanceToNow(n.createdAt)}
                  </span>
                </div>
                <p className={`mt-1 ${!n.isRead ? "font-medium" : "text-muted-foreground"}`}>
                  {n.title}
                </p>
                {n.content && (
                  <p className="text-sm text-muted-foreground mt-0.5">{n.content}</p>
                )}
              </div>
              {!n.isRead && (
                <MarkReadButton notificationId={n.id} />
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
