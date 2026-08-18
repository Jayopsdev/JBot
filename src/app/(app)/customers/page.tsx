"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { CustomersView } from "@/components/crm/customers-view";
import { listCustomers } from "@/lib/local-db/queries";
import { useDatabase } from "@/lib/local-db/store";
import { Skeleton } from "@/components/ui/skeleton";

function CustomersPageInner() {
  const searchParams = useSearchParams();
  const db = useDatabase();
  const query = searchParams.get("q") ?? "";
  const status = searchParams.get("status") ?? "ALL";
  const sort = searchParams.get("sort") ?? "activity";
  const page = Number(searchParams.get("page") ?? "1");

  if (!db) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-80 w-full" />
      </div>
    );
  }

  const result = listCustomers(db, { query, status, page, sort });

  return (
    <CustomersView
      customers={result.customers}
      total={result.total}
      page={result.page}
      pageCount={result.pageCount}
      query={query}
      status={status}
      sort={sort}
    />
  );
}

export default function CustomersPage() {
  return (
    <Suspense
      fallback={
        <div className="space-y-6">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-80 w-full" />
        </div>
      }
    >
      <CustomersPageInner />
    </Suspense>
  );
}
