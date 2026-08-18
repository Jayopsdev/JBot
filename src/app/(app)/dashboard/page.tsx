import Link from "next/link";
import {
  CheckCircle2,
  Clock3,
  MessageSquare,
  Ticket,
  UserCheck,
  Users,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { StatCard } from "@/components/dashboard/stat-card";
import {
  DistributionBars,
  VolumeChart,
} from "@/components/dashboard/charts";
import { UserAvatar } from "@/components/user-avatar";
import { PriorityBadge, StatusBadge } from "@/components/status-badge";
import { getDashboardData } from "@/lib/data/dashboard";
import { formatRelativeTime } from "@/lib/format";
import { APP_NAME } from "@/lib/brand";
import { TicketPriority, TicketStatus } from "@prisma/client";
import { EmptyState } from "@/components/empty-state";

function prettyLabel(value: string) {
  return value
    .toLowerCase()
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

const STATUS_ORDER: TicketStatus[] = [
  TicketStatus.OPEN,
  TicketStatus.IN_PROGRESS,
  TicketStatus.PENDING,
  TicketStatus.RESOLVED,
];

const PRIORITY_ORDER: TicketPriority[] = [
  TicketPriority.LOW,
  TicketPriority.MEDIUM,
  TicketPriority.HIGH,
  TicketPriority.URGENT,
];

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const data = await getDashboardData();
  const { stats } = data;

  const ticketStatusItems = STATUS_ORDER.map((status) => ({
    label: prettyLabel(status),
    count:
      data.ticketsByStatus.find((item) => item.status === status)?._count.status ??
      0,
  }));

  const ticketPriorityItems = PRIORITY_ORDER.map((priority) => ({
    label: prettyLabel(priority),
    count:
      data.ticketsByPriority.find((item) => item.priority === priority)?._count
        .priority ?? 0,
  }));

  const conversationItems = [
    {
      label: "Open",
      count:
        data.conversationsByStatus.find((item) => item.status === "OPEN")?._count
          .status ?? 0,
    },
    {
      label: "Closed",
      count:
        data.conversationsByStatus.find((item) => item.status === "CLOSED")
          ?._count.status ?? 0,
    },
  ];

  return (
    <div className="space-y-6 pb-16 md:pb-0">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Live workspace metrics from the local {APP_NAME} database.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <StatCard
          label="Active Chats"
          value={stats.activeChats}
          hint="Open conversations"
          icon={MessageSquare}
          accent="bg-sky-50 text-sky-700"
          href="/chat"
        />
        <StatCard
          label="Open Tickets"
          value={stats.openTickets}
          hint="Waiting for an agent"
          icon={Ticket}
          accent="bg-indigo-50 text-indigo-700"
          href="/tickets?status=OPEN"
        />
        <StatCard
          label="Pending Tickets"
          value={stats.pendingTickets}
          hint="Waiting on customer or vendor"
          icon={Clock3}
          accent="bg-amber-50 text-amber-700"
          href="/tickets?status=PENDING"
        />
        <StatCard
          label="Resolved Tickets"
          value={stats.resolvedTickets}
          hint="Closed in the workspace"
          icon={CheckCircle2}
          accent="bg-emerald-50 text-emerald-700"
          href="/tickets?status=RESOLVED"
        />
        <StatCard
          label="Total Customers"
          value={stats.totalCustomers}
          hint="Records in CRM"
          icon={Users}
          accent="bg-violet-50 text-violet-700"
          href="/customers"
        />
        <StatCard
          label="Online Agents"
          value={stats.onlineAgents}
          hint="Currently available"
          icon={UserCheck}
          accent="bg-teal-50 text-teal-700"
          href="/settings"
        />
      </div>

      <div className="grid gap-4 xl:grid-cols-3">
        <div className="xl:col-span-2">
          <VolumeChart
            title="Conversation statistics"
            description="Messages received over the last 7 days"
            items={data.messageVolume}
          />
        </div>
        <DistributionBars
          title="Ticket statistics"
          description="Current tickets by status"
          items={ticketStatusItems}
          colorClass="bg-indigo-500"
        />
      </div>

      <div className="grid gap-4 xl:grid-cols-3">
        <Card className="shadow-sm xl:col-span-1">
          <CardHeader>
            <CardTitle>Recent conversations</CardTitle>
            <CardDescription>Latest customer threads</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {data.recentConversations.length === 0 ? (
              <EmptyState
                icon={MessageSquare}
                title="No conversations yet"
                description="New chats from the customer widget will appear here."
              />
            ) : (
              data.recentConversations.map((conversation) => {
              const lastMessage = conversation.messages[0];
              return (
                <Link
                  key={conversation.id}
                  href={`/chat?conversation=${conversation.id}`}
                  className="flex items-start gap-3 rounded-lg p-2 hover:bg-muted/60"
                >
                  <UserAvatar name={conversation.customer.name} />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-3">
                      <p className="truncate text-sm font-medium">
                        {conversation.customer.name}
                      </p>
                      <span className="shrink-0 text-[11px] text-muted-foreground">
                        {formatRelativeTime(conversation.updatedAt)}
                      </span>
                    </div>
                    <p className="truncate text-xs text-muted-foreground">
                      {lastMessage?.content ?? "No messages yet"}
                    </p>
                  </div>
                </Link>
              );
              })
            )}
          </CardContent>
        </Card>

        <Card className="shadow-sm xl:col-span-1">
          <CardHeader>
            <CardTitle>Recent tickets</CardTitle>
            <CardDescription>Newest workspace issues</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {data.recentTickets.length === 0 ? (
              <EmptyState
                icon={Ticket}
                title="No tickets yet"
                description="Tickets created from chat or CRM will show up here."
              />
            ) : (
              data.recentTickets.map((ticket) => (
              <Link
                key={ticket.id}
                href={`/tickets/${ticket.id}`}
                className="block rounded-lg p-2 hover:bg-muted/60"
              >
                <div className="flex items-center justify-between gap-3">
                  <p className="text-xs font-medium text-muted-foreground">
                    {ticket.ticketNumber}
                  </p>
                  <StatusBadge status={ticket.status} />
                </div>
                <p className="mt-1 truncate text-sm font-medium">
                  {ticket.subject}
                </p>
                <div className="mt-2 flex items-center justify-between gap-3">
                  <p className="truncate text-xs text-muted-foreground">
                    {ticket.customer.name}
                  </p>
                  <PriorityBadge priority={ticket.priority} />
                </div>
              </Link>
              ))
            )}
          </CardContent>
        </Card>

        <div className="space-y-4">
          <DistributionBars
            title="Priority mix"
            description="Tickets grouped by urgency"
            items={ticketPriorityItems}
            colorClass="bg-rose-500"
          />
          <DistributionBars
            title="Inbox mix"
            description="Open versus closed conversations"
            items={conversationItems}
            colorClass="bg-sky-500"
          />
        </div>
      </div>

      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle>Customer activity</CardTitle>
          <CardDescription>Latest internal notes across CRM records</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {data.recentNotes.length === 0 ? (
            <EmptyState
              icon={Users}
              title="No recent activity"
              description="Internal notes added on customer records will appear here."
            />
          ) : (
            data.recentNotes.map((note) => (
            <div key={note.id} className="flex items-start gap-3">
              <UserAvatar name={note.author.name} size="sm" />
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="text-sm font-medium">{note.author.name}</p>
                  <span className="text-xs text-muted-foreground">
                    noted on {note.customer.name}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {formatRelativeTime(note.createdAt)}
                  </span>
                </div>
                <p className="mt-1 text-sm text-muted-foreground">
                  {note.content}
                </p>
              </div>
            </div>
          ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}
