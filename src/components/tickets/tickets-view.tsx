"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
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
import { PriorityBadge, StatusBadge } from "@/components/status-badge";
import { formatRelativeTime } from "@/lib/format";
import { Ticket } from "lucide-react";
import { EmptyState } from "@/components/empty-state";
import type { TicketListItem } from "@/lib/data/tickets";

export function TicketsView({
  tickets,
  agents,
  initialQuery = "",
  initialStatus = "ALL",
  initialPriority = "ALL",
  initialAgent = "ALL",
}: {
  tickets: TicketListItem[];
  agents: { id: string; name: string }[];
  initialQuery?: string;
  initialStatus?: string;
  initialPriority?: string;
  initialAgent?: string;
}) {
  const [search, setSearch] = useState(initialQuery);
  const [status, setStatus] = useState(initialStatus);
  const [priority, setPriority] = useState(initialPriority);
  const [agentId, setAgentId] = useState(initialAgent);

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    return tickets.filter((ticket) => {
      const matchesQuery =
        !query ||
        ticket.ticketNumber.toLowerCase().includes(query) ||
        ticket.subject.toLowerCase().includes(query) ||
        ticket.customer.name.toLowerCase().includes(query) ||
        ticket.customer.email.toLowerCase().includes(query);
      const matchesStatus = status === "ALL" || ticket.status === status;
      const matchesPriority = priority === "ALL" || ticket.priority === priority;
      const matchesAgent =
        agentId === "ALL" || ticket.assignedAgent?.id === agentId;
      return matchesQuery && matchesStatus && matchesPriority && matchesAgent;
    });
  }, [tickets, search, status, priority, agentId]);

  return (
    <div className="space-y-6 pb-16 md:pb-0">
      <div className="flex flex-col justify-between gap-3 md:flex-row md:items-end">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Tickets</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {filtered.length} of {tickets.length} tickets in the workspace.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search ticket, subject, customer"
            className="h-9 w-64 bg-background"
          />
          <FilterSelect
            value={status}
            onChange={setStatus}
            options={[
              ["ALL", "All statuses"],
              ["OPEN", "Open"],
              ["IN_PROGRESS", "In Progress"],
              ["PENDING", "Pending"],
              ["RESOLVED", "Resolved"],
            ]}
          />
          <FilterSelect
            value={priority}
            onChange={setPriority}
            options={[
              ["ALL", "All priorities"],
              ["LOW", "Low"],
              ["MEDIUM", "Medium"],
              ["HIGH", "High"],
              ["URGENT", "Urgent"],
            ]}
          />
          <FilterSelect
            value={agentId}
            onChange={setAgentId}
            options={[
              ["ALL", "All agents"],
              ...agents.map((agent) => [agent.id, agent.name] as const),
            ]}
          />
        </div>
      </div>

      <Card className="shadow-sm">
        <CardContent className="p-0">
          {filtered.length === 0 ? (
            <EmptyState
              icon={Ticket}
              title="No tickets match these filters"
              description="Try a different search, status, priority, or agent."
            />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Ticket #</TableHead>
                  <TableHead>Subject</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Priority</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Assigned Agent</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead>Updated</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((ticket) => (
                  <TableRow key={ticket.id}>
                    <TableCell>
                      <Link
                        href={`/tickets/${ticket.id}`}
                        className="font-medium text-indigo-700 hover:underline"
                      >
                        {ticket.ticketNumber}
                      </Link>
                    </TableCell>
                    <TableCell className="max-w-64 truncate">{ticket.subject}</TableCell>
                    <TableCell>
                      <Link
                        href={`/customers/${ticket.customer.id}`}
                        className="hover:text-indigo-700"
                      >
                        {ticket.customer.name}
                      </Link>
                    </TableCell>
                    <TableCell>
                      <PriorityBadge priority={ticket.priority} />
                    </TableCell>
                    <TableCell>
                      <StatusBadge status={ticket.status} />
                    </TableCell>
                    <TableCell>{ticket.assignedAgent?.name ?? "Unassigned"}</TableCell>
                    <TableCell className="text-muted-foreground">
                      {formatRelativeTime(new Date(ticket.createdAt))}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {formatRelativeTime(new Date(ticket.updatedAt))}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function FilterSelect({
  value,
  onChange,
  options,
}: {
  value: string;
  onChange: (value: string) => void;
  options: readonly (readonly [string, string])[];
}) {
  return (
    <select
      value={value}
      onChange={(event) => onChange(event.target.value)}
      className="h-9 rounded-lg border bg-background px-2 text-sm"
    >
      {options.map(([optionValue, label]) => (
        <option key={optionValue} value={optionValue}>
          {label}
        </option>
      ))}
    </select>
  );
}
