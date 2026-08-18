import { notFound } from "next/navigation";
import { CustomerProfileView } from "@/components/crm/customer-profile";
import { getCustomerProfile } from "@/lib/data/customers";
import { listAgents } from "@/lib/data/tickets";
import { isCustomerOnline } from "@/lib/realtime";

export const dynamic = "force-dynamic";

export default async function CustomerDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [customer, agents] = await Promise.all([
    getCustomerProfile(id),
    listAgents(),
  ]);

  if (!customer) {
    notFound();
  }

  return (
    <CustomerProfileView
      initial={customer}
      agents={agents}
      online={isCustomerOnline(customer.id)}
    />
  );
}
