import { prisma } from "@/lib/prisma";

export async function notifyUsers(input: {
  userIds: string[];
  type: string;
  title: string;
  message: string;
  href?: string | null;
}) {
  const uniqueIds = [...new Set(input.userIds.filter(Boolean))];
  if (uniqueIds.length === 0) return;

  await prisma.notification.createMany({
    data: uniqueIds.map((userId) => ({
      userId,
      type: input.type,
      title: input.title,
      message: input.message,
      href: input.href ?? null,
    })),
  });
}

export async function allAgentIds() {
  const agents = await prisma.user.findMany({ select: { id: true } });
  return agents.map((agent) => agent.id);
}
