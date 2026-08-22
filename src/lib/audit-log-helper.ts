import { prisma } from "@/lib/prisma";

type LogActionInput = {
  action: string;
  entityType: string;
  entityId?: string;
  before?: Record<string, unknown>;
  after?: Record<string, unknown>;
  ip?: string;
};

export async function logAction(input: LogActionInput) {
  await prisma.auditLog.create({
    data: {
      userId: null,
      action: input.action,
      entityType: input.entityType,
      entityId: input.entityId ?? null,
      before: input.before ? JSON.parse(JSON.stringify(input.before)) : undefined,
      after: input.after ? JSON.parse(JSON.stringify(input.after)) : undefined,
      ip: input.ip ?? null,
    },
  });
}
