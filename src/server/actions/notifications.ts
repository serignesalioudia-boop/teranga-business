"use server";

import { NotificationType } from "@/generated/prisma/enums";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/session";

export async function getNotifications(limit = 20) {
  const user = await getCurrentUser();
  if (!user) return [];

  return prisma.notification.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
    take: limit,
  });
}

export async function getUnreadCount() {
  const user = await getCurrentUser();
  if (!user) return 0;

  return prisma.notification.count({
    where: { userId: user.id, isRead: false },
  });
}

export async function markAsRead(id: string) {
  const user = await getCurrentUser();
  if (!user) throw new Error("Non autorisé.");

  await prisma.notification.updateMany({
    where: { id, userId: user.id },
    data: { isRead: true },
  });
}

export async function markAllAsRead() {
  const user = await getCurrentUser();
  if (!user) throw new Error("Non autorisé.");

  await prisma.notification.updateMany({
    where: { userId: user.id, isRead: false },
    data: { isRead: true },
  });
}

export async function createNotification(input: {
  userId: string;
  type: NotificationType;
  title: string;
  content?: string;
  link?: string;
}) {
  const user = await getCurrentUser();
  if (!user) throw new Error("Non autorisé.");

  if (user.role !== "ADMIN" && user.id !== input.userId) {
    throw new Error("Non autorisé.");
  }

  return prisma.notification.create({ data: input });
}
