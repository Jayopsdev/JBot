import { listAgents, listTickets } from "@/lib/data/tickets";
import { TicketsView } from "@/components/tickets/tickets-view";

export const dynamic = "force-dynamic";

export default async function TicketsPage({
  searchParams,
}: {
  searchParams: Promise<{
    q?: string;
    status?: string;
    priority?: string;
    agent?: string;
  }>;
}) {
  const params = await searchParams;
  const [tickets, agents] = await Promise.all([listTickets(), listAgents()]);

  return (
    <TicketsView
      tickets={tickets}
      agents={agents}
      initialQuery={params.q ?? ""}
      initialStatus={params.status ?? "ALL"}
      initialPriority={params.priority ?? "ALL"}
      initialAgent={params.agent ?? "ALL"}
    />
  );
}
