import { notFound } from "next/navigation";
import { TicketDetailView } from "@/components/tickets/ticket-detail";
import { getTicketDetail, listAgents } from "@/lib/data/tickets";

export const dynamic = "force-dynamic";

export default async function TicketDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [ticket, agents] = await Promise.all([getTicketDetail(id), listAgents()]);

  if (!ticket) {
    notFound();
  }

  return <TicketDetailView initial={ticket} agents={agents} />;
}
