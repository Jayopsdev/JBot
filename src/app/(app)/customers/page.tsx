import { listCustomers } from "@/lib/data/customers";
import { CustomersView } from "@/components/crm/customers-view";

export const dynamic = "force-dynamic";

export default async function CustomersPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; status?: string; page?: string; sort?: string }>;
}) {
  const params = await searchParams;
  const result = await listCustomers({
    query: params.q,
    status: params.status ?? "ALL",
    page: Number(params.page ?? "1"),
    sort: params.sort ?? "activity",
  });

  return (
    <CustomersView
      customers={result.customers}
      total={result.total}
      page={result.page}
      pageCount={result.pageCount}
      query={params.q ?? ""}
      status={params.status ?? "ALL"}
      sort={params.sort ?? "activity"}
    />
  );
}
