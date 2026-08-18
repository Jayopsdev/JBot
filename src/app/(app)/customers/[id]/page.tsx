"use client";

import { useParams } from "next/navigation";
import { CustomerProfileView } from "@/components/crm/customer-profile";
import { EmptyState } from "@/components/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import { getCustomerProfile, listAgents } from "@/lib/local-db/queries";
import { useDatabase } from "@/lib/local-db/store";
import { Users } from "lucide-react";

export default function CustomerDetailPage() {
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

  const customer = getCustomerProfile(db, params.id);
  if (!customer) {
    return (
      <EmptyState
        icon={Users}
        title="Customer not found"
        description="This record is not in the browser database."
      />
    );
  }

  return (
    <CustomerProfileView
      key={customer.id}
      initial={customer}
      agents={listAgents(db)}
      online={db.onlineCustomerIds.includes(customer.id)}
    />
  );
}
