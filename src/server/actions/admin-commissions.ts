"use server";

import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/session";

export async function getAdminCommissions(options?: {
  status?: string;
  storeId?: string;
  page?: number;
  pageSize?: number;
}) {
  const user = await getCurrentUser();
  if (!user || user.role !== "ADMIN") throw new Error("Non autorisé.");

  const { status, storeId, page = 1, pageSize = 20 } = options ?? {};

  const where: Record<string, unknown> = {};
  if (status) where.status = status;
  if (storeId) where.storeId = storeId;

  const [commissions, total] = await Promise.all([
    prisma.commission.findMany({
      where,
      include: {
        order: { select: { number: true, createdAt: true } },
        subOrder: { select: { payableAmount: true } },
        store: { select: { name: true, sellerProfile: { select: { user: { select: { name: true, email: true } } } } } },
      },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.commission.count({ where }),
  ]);

  return {
    commissions,
    total,
    page,
    pageSize,
    totalPages: Math.ceil(total / pageSize),
  };
}

export async function getCommissionStats() {
  const user = await getCurrentUser();
  if (!user || user.role !== "ADMIN") throw new Error("Non autorisé.");

  const [pending, paid, total] = await Promise.all([
    prisma.commission.aggregate({ _sum: { amount: true }, _count: { id: true }, where: { status: "PENDING" } }),
    prisma.commission.aggregate({ _sum: { amount: true }, _count: { id: true }, where: { status: "PAID" } }),
    prisma.commission.aggregate({ _sum: { amount: true }, _count: { id: true } }),
  ]);

  return {
    pendingAmount: pending._sum.amount ?? BigInt(0),
    pendingCount: pending._count.id,
    paidAmount: paid._sum.amount ?? BigInt(0),
    paidCount: paid._count.id,
    totalAmount: total._sum.amount ?? BigInt(0),
    totalCount: total._count.id,
  };
}

export async function markCommissionPaid(commissionId: string) {
  const user = await getCurrentUser();
  if (!user || user.role !== "ADMIN") throw new Error("Non autorisé.");

  await prisma.commission.update({
    where: { id: commissionId },
    data: { status: "PAID", paidAt: new Date() },
  });
}

export async function getCommissionByStore() {
  const user = await getCurrentUser();
  if (!user || user.role !== "ADMIN") throw new Error("Non autorisé.");

  const stores = await prisma.store.findMany({
    select: {
      id: true,
      name: true,
      sellerProfile: { select: { user: { select: { name: true, email: true } } } },
    },
    where: { isActive: true },
  });

  const result = [];
  for (const store of stores) {
    const [pending, paid] = await Promise.all([
      prisma.commission.aggregate({
        _sum: { amount: true },
        _count: { id: true },
        where: { storeId: store.id, status: "PENDING" },
      }),
      prisma.commission.aggregate({
        _sum: { amount: true },
        _count: { id: true },
        where: { storeId: store.id, status: "PAID" },
      }),
    ]);

    if (pending._count.id > 0 || paid._count.id > 0) {
      result.push({
        storeId: store.id,
        storeName: store.name,
        sellerName: store.sellerProfile?.user.name ?? "—",
        sellerEmail: store.sellerProfile?.user.email ?? "—",
        pendingAmount: pending._sum.amount ?? BigInt(0),
        pendingCount: pending._count.id,
        paidAmount: paid._sum.amount ?? BigInt(0),
        paidCount: paid._count.id,
      });
    }
  }

  return result;
}
