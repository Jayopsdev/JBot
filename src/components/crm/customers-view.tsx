"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { UserAvatar } from "@/components/user-avatar";
import { StatusBadge } from "@/components/status-badge";
import { formatRelativeTime } from "@/lib/format";
import { Users } from "lucide-react";
import { EmptyState } from "@/components/empty-state";
import type { CustomerListItem } from "@/lib/data/customers";

export function CustomersView({
  customers,
  total,
  page,
  pageCount,
  query,
  status,
  sort,
}: {
  customers: CustomerListItem[];
  total: number;
  page: number;
  pageCount: number;
  query: string;
  status: string;
  sort: string;
}) {
  const router = useRouter();
  const [search, setSearch] = useState(query);

  function pushParams(next: {
    q?: string;
    status?: string;
    page?: number;
    sort?: string;
  }) {
    const params = new URLSearchParams();
    const q = next.q ?? search;
    const selectedStatus = next.status ?? status;
    const selectedSort = next.sort ?? sort;
    const selectedPage = next.page ?? 1;
    if (q) params.set("q", q);
    if (selectedStatus && selectedStatus !== "ALL") params.set("status", selectedStatus);
    if (selectedSort && selectedSort !== "activity") params.set("sort", selectedSort);
    if (selectedPage > 1) params.set("page", String(selectedPage));
    router.push(`/customers${params.toString() ? `?${params}` : ""}`);
  }

  function handleSearch(event: FormEvent) {
    event.preventDefault();
    pushParams({ q: search, page: 1 });
  }

  return (
    <div className="space-y-6 pb-16 md:pb-0">
      <div className="flex flex-col justify-between gap-3 md:flex-row md:items-end">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Customers</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {total} records in the local CRM, sorted by recent activity.
          </p>
        </div>
        <form onSubmit={handleSearch} className="flex flex-wrap items-center gap-2">
          <Input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search name, email, company"
            className="h-9 w-64 bg-background"
          />
          <select
            value={status}
            onChange={(event) => pushParams({ status: event.target.value, page: 1 })}
            className="h-9 rounded-lg border bg-background px-2 text-sm"
          >
            <option value="ALL">All statuses</option>
            <option value="ACTIVE">Active</option>
            <option value="INACTIVE">Inactive</option>
          </select>
          <select
            value={sort}
            onChange={(event) => pushParams({ sort: event.target.value, page: 1 })}
            className="h-9 rounded-lg border bg-background px-2 text-sm"
          >
            <option value="activity">Recent activity</option>
            <option value="name">Name</option>
          </select>
          <Button type="submit">Search</Button>
        </form>
      </div>

      <Card className="shadow-sm">
        <CardContent className="p-0">
          {customers.length === 0 ? (
            <EmptyState
              icon={Users}
              title="No customers match this search"
              description="Try a different name, email, company, or status filter."
            />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Customer</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead>Company</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Chats</TableHead>
                  <TableHead>Tickets</TableHead>
                  <TableHead>Last activity</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {customers.map((customer) => (
                  <TableRow key={customer.id}>
                    <TableCell>
                      <Link
                        href={`/customers/${customer.id}`}
                        className="flex items-center gap-3 font-medium hover:text-indigo-700"
                      >
                        <UserAvatar name={customer.name} avatar={customer.avatar} />
                        {customer.name}
                      </Link>
                    </TableCell>
                    <TableCell>{customer.email}</TableCell>
                    <TableCell>{customer.phone ?? "—"}</TableCell>
                    <TableCell>{customer.company ?? "—"}</TableCell>
                    <TableCell>
                      <StatusBadge status={customer.status} />
                    </TableCell>
                    <TableCell>{customer.conversationCount}</TableCell>
                    <TableCell>{customer.ticketCount}</TableCell>
                    <TableCell className="text-muted-foreground">
                      {formatRelativeTime(new Date(customer.lastActivity))}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <div className="flex items-center justify-between text-sm">
        <p className="text-muted-foreground">
          Page {page} of {pageCount}
        </p>
        <div className="flex gap-2">
          <Button
            variant="outline"
            disabled={page <= 1}
            onClick={() => pushParams({ page: page - 1 })}
          >
            Previous
          </Button>
          <Button
            variant="outline"
            disabled={page >= pageCount}
            onClick={() => pushParams({ page: page + 1 })}
          >
            Next
          </Button>
        </div>
      </div>
    </div>
  );
}
