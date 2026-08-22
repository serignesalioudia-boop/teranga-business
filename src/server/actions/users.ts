"use server";

import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/session";
import { logAction } from "@/lib/audit-log-helper";

export async function getUsers(options?: {
  search?: string;
  role?: string;
  page?: number;
  pageSize?: number;
}) {
  const user = await getCurrentUser();
  if (!user || user.role !== "ADMIN") throw new Error("Non autorisé.");

  const { search, role, page = 1, pageSize = 20 } = options ?? {};

  const where: Record<string, unknown> = {};

  if (role) where.role = role;
  if (search && search.trim()) {
    const term = search.trim();
    where.OR = [
      { name: { contains: term, mode: "insensitive" } },
      { email: { contains: term, mode: "insensitive" } },
    ];
  }

  const [users, total] = await Promise.all([
    prisma.user.findMany({
      where,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        isActive: true,
        lastLoginAt: true,
        createdAt: true,
        sellerProfile: {
          select: {
            status: true,
            isVerified: true,
            store: { select: { name: true } },
          },
        },
        _count: { select: { orders: true, reviews: true } },
      },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.user.count({ where }),
  ]);

  return {
    users,
    total,
    page,
    pageSize,
    totalPages: Math.ceil(total / pageSize),
  };
}

export async function updateUserRole(userId: string, role: "USER" | "ADMIN") {
  const user = await getCurrentUser();
  if (!user || user.role !== "ADMIN") throw new Error("Non autorisé.");

  const target = await prisma.user.findUnique({ where: { id: userId }, select: { role: true } });
  if (!target) throw new Error("Utilisateur introuvable.");
  await prisma.user.update({ where: { id: userId }, data: { role } });

  await logAction({
    action: "USER_ROLE_CHANGED",
    entityType: "User",
    entityId: userId,
    before: { role: target.role },
    after: { role },
  });
}

export async function toggleUserActive(userId: string) {
  const user = await getCurrentUser();
  if (!user || user.role !== "ADMIN") throw new Error("Non autorisé.");

  const target = await prisma.user.findUnique({ where: { id: userId }, select: { isActive: true } });
  if (!target) throw new Error("Utilisateur introuvable");
  await prisma.user.update({ where: { id: userId }, data: { isActive: !target.isActive } });

  await logAction({
    action: "USER_TOGGLED",
    entityType: "User",
    entityId: userId,
    before: { isActive: target.isActive },
    after: { isActive: !target.isActive },
  });
}
