import { prisma } from "@/lib/prisma";

export async function nextTicketNumber() {
  const latest = await prisma.ticket.findMany({
    select: { ticketNumber: true },
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  const max = latest.reduce((current, ticket) => {
    const match = ticket.ticketNumber.match(/(\d+)$/);
    return match ? Math.max(current, Number(match[1])) : current;
  }, 1000);

  return `SH-${max + 1}`;
}
