"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { TicketsView } from "@/components/tickets/tickets-view";
import { listAgents, listTickets } from "@/lib/local-db/queries";
import { useDatabase } from "@/lib/local-db/store";
import { Skeleton } from "@/components/ui/skeleton";

function TicketsPageInner() {
  const searchParams = useSearchParams();
  const db = useDatabase();

  if (!db) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-80 w-full" />
      </div>
    );
  }

  return (
    <TicketsView
      tickets={listTickets(db)}
      agents={listAgents(db)}
      initialQuery={searchParams.get("q") ?? ""}
      initialStatus={searchParams.get("status") ?? "ALL"}
      initialPriority={searchParams.get("priority") ?? "ALL"}
      initialAgent={searchParams.get("agent") ?? "ALL"}
    />
  );
}

export default function TicketsPage() {
  return (
    <Suspense
      fallback={
        <div className="space-y-6">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-80 w-full" />
        </div>
      }
    >
      <TicketsPageInner />
    </Suspense>
  );
}
