"use client";

import { useParams } from "next/navigation";
import { TicketDetailView } from "@/components/tickets/ticket-detail";
import { EmptyState } from "@/components/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import { getTicketDetail, listAgents } from "@/lib/local-db/queries";
import { useDatabase } from "@/lib/local-db/store";
import { Ticket } from "lucide-react";

export default function TicketDetailPage() {
  const params = useParams<{ id: string }>();
  const db = useDatabase();

  if (!db) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  const ticket = getTicketDetail(db, params.id);
  if (!ticket) {
    return (
      <EmptyState
        icon={Ticket}
        title="Ticket not found"
        description="This ticket is not in the browser database."
      />
    );
  }

  return <TicketDetailView key={ticket.id} initial={ticket} agents={listAgents(db)} />;
}
