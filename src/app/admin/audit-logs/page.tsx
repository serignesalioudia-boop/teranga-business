import { getAuditLogs, getAuditLogActions, getAuditLogEntityTypes } from "@/server/actions/audit-logs";
import { formatPrice } from "@/lib/format";


export const metadata = {
  title: "Journal d'audit — Admin",
};

const ACTION_LABELS: Record<string, string> = {
  REFUND_REQUESTED: "Remboursement demandé",
  REFUND_APPROVED: "Remboursement approuvé",
  REFUND_REJECTED: "Remboursement rejeté",
  ORDER_CREATED: "Commande créée",
  ORDER_STATUS_CHANGED: "Statut commande modifié",
  SUBORDER_STATUS_CHANGED: "Statut sous-commande modifié",
  STORE_UPDATED: "Boutique modifiée",
  USER_ROLE_CHANGED: "Rôle utilisateur modifié",
  USER_TOGGLED: "Utilisateur activé/désactivé",
  SELLER_APPROVED: "Vendeur approuvé",
  SELLER_REJECTED: "Vendeur rejeté",
  PRODUCT_CREATED: "Produit créé",
  PRODUCT_DELETED: "Produit supprimé",
  CATEGORY_CREATED: "Catégorie créée",
  CATEGORY_UPDATED: "Catégorie modifiée",
  REVIEW_APPROVED: "Avis approuvé",
  REVIEW_REJECTED: "Avis rejeté",
  DELIVERY_STATUS_CHANGED: "Statut livraison modifié",
};

export default async function AuditLogsPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const sp = await searchParams;
  const action = typeof sp.action === "string" ? sp.action : undefined;
  const entityType = typeof sp.entityType === "string" ? sp.entityType : undefined;
  const page = Math.max(1, Number(sp.page) || 1);
  const limit = 50;
  const offset = (page - 1) * limit;

  const [{ logs, total }, actions, entityTypes] = await Promise.all([
    getAuditLogs({ action, entityType, limit, offset }),
    getAuditLogActions(),
    getAuditLogEntityTypes(),
  ]);

  const totalPages = Math.ceil(total / limit);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Journal d&apos;audit</h1>

      {/* Filtres */}
      <div className="flex flex-wrap gap-2">
        <a
          href="/admin/audit-logs"
          className={`rounded-full border px-3 py-1.5 text-xs transition ${
            !action && !entityType ? "border-primary bg-primary text-primary-foreground" : "hover:bg-accent"
          }`}
        >
          Tous ({total})
        </a>
        {actions.slice(0, 10).map((a) => (
          <a
            key={a.action}
            href={`/admin/audit-logs?action=${a.action}`}
            className={`rounded-full border px-3 py-1.5 text-xs transition ${
              action === a.action ? "border-primary bg-primary text-primary-foreground" : "hover:bg-accent"
            }`}
          >
            {ACTION_LABELS[a.action] ?? a.action} ({a.count})
          </a>
        ))}
      </div>

      {/* Filtre par type d'entité */}
      <div className="flex flex-wrap gap-2">
        {entityTypes.map((e) => (
          <a
            key={e.entityType}
            href={`/admin/audit-logs?entityType=${e.entityType}${action ? `&action=${action}` : ""}`}
            className={`rounded-full border px-3 py-1.5 text-xs transition ${
              entityType === e.entityType ? "border-primary bg-primary text-primary-foreground" : "hover:bg-accent"
            }`}
          >
            {e.entityType} ({e.count})
          </a>
        ))}
      </div>

      {/* Liste */}
      {logs.length === 0 ? (
        <div className="py-12 text-center text-muted-foreground">Aucun log.</div>
      ) : (
        <div className="space-y-2">
          {logs.map((log) => (
            <div key={log.id} className="rounded-xl border bg-card p-4">
              <div className="flex items-start justify-between gap-4">
                <div className="space-y-1 text-sm">
                  <div className="flex items-center gap-2">
                    <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
                      {ACTION_LABELS[log.action] ?? log.action}
                    </span>
                    <span className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
                      {log.entityType}
                    </span>
                    {log.entityId && (
                      <span className="font-mono text-xs text-muted-foreground">
                        {log.entityId.slice(0, 8)}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {log.user ? `${log.user.name} (${log.user.email})` : "Système"}
                  </p>
                </div>
                <span className="text-xs text-muted-foreground whitespace-nowrap">
                  {new Date(log.createdAt).toLocaleDateString("fr-SN", {
                    day: "numeric",
                    month: "short",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </span>
              </div>

              {(log.before || log.after) && (
                <details className="mt-2">
                  <summary className="cursor-pointer text-xs text-muted-foreground hover:text-foreground">
                    Détails
                  </summary>
                  <div className="mt-2 grid gap-2 text-xs sm:grid-cols-2">
                    {log.before && (
                      <div className="rounded-lg bg-muted/50 p-2">
                        <p className="mb-1 font-medium">Avant</p>
                        <pre className="whitespace-pre-wrap break-all text-muted-foreground">
                          {JSON.stringify(log.before, null, 2)}
                        </pre>
                      </div>
                    )}
                    {log.after && (
                      <div className="rounded-lg bg-muted/50 p-2">
                        <p className="mb-1 font-medium">Après</p>
                        <pre className="whitespace-pre-wrap break-all text-muted-foreground">
                          {JSON.stringify(log.after, null, 2)}
                        </pre>
                      </div>
                    )}
                  </div>
                </details>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center gap-2">
          {Array.from({ length: Math.min(totalPages, 10) }, (_, i) => i + 1).map((p) => (
            <a
              key={p}
              href={`/admin/audit-logs?page=${p}${action ? `&action=${action}` : ""}${entityType ? `&entityType=${entityType}` : ""}`}
              className={`rounded-lg border px-3 py-1.5 text-sm transition ${
                p === page ? "border-primary bg-primary text-primary-foreground" : "hover:bg-accent"
              }`}
            >
              {p}
            </a>
          ))}
        </div>
      )}
    </div>
  );
}
