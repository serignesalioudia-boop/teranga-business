import { NotificationType } from "@/generated/prisma/enums";
import { prisma } from "@/lib/prisma";

export async function createNotificationInternal(input: {
  userId: string;
  type: NotificationType;
  title: string;
  content?: string;
  link?: string;
}) {
  return prisma.notification.create({ data: input });
}
