"use server";

import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/session";

export async function getAuditLogs(options?: {
  action?: string;
  entityType?: string;
  userId?: string;
  limit?: number;
  offset?: number;
}) {
  const user = await getCurrentUser();
  if (!user || user.role !== "ADMIN") throw new Error("Accès réservé aux administrateurs.");

  const where: Record<string, unknown> = {};
  if (options?.action) where.action = options.action;
  if (options?.entityType) where.entityType = options.entityType;
  if (options?.userId) where.userId = options.userId;

  const [logs, total] = await Promise.all([
    prisma.auditLog.findMany({
      where,
      include: {
        user: { select: { id: true, name: true, email: true } },
      },
      orderBy: { createdAt: "desc" },
      take: options?.limit ?? 50,
      skip: options?.offset ?? 0,
    }),
    prisma.auditLog.count({ where }),
  ]);

  return { logs, total };
}

export async function getAuditLogActions() {
  const user = await getCurrentUser();
  if (!user || user.role !== "ADMIN") throw new Error("Accès réservé aux administrateurs.");

  const result = await prisma.auditLog.groupBy({
    by: ["action"],
    _count: { action: true },
    orderBy: { _count: { action: "desc" } },
  });

  return result.map((r) => ({ action: r.action, count: r._count.action }));
}

export async function getAuditLogEntityTypes() {
  const user = await getCurrentUser();
  if (!user || user.role !== "ADMIN") throw new Error("Accès réservé aux administrateurs.");

  const result = await prisma.auditLog.groupBy({
    by: ["entityType"],
    _count: { entityType: true },
    orderBy: { _count: { entityType: "desc" } },
  });

  return result.map((r) => ({ entityType: r.entityType, count: r._count.entityType }));
}
