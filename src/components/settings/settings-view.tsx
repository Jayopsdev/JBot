"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { UserAvatar } from "@/components/user-avatar";
import { StatusBadge } from "@/components/status-badge";
import { APP_NAME } from "@/lib/brand";
import { DEMO_ACCOUNTS, DEMO_PASSWORD } from "@/lib/constants";
import { getModuleCounts } from "@/lib/local-db/queries";
import { useDatabase } from "@/lib/local-db/store";
import type { AuthUser } from "@/lib/auth";

export function SettingsView({ user }: { user: AuthUser }) {
  const db = useDatabase();
  const counts = db
    ? getModuleCounts(db)
    : { customers: 0, conversations: 0, tickets: 0 };

  return (
    <div className="mx-auto max-w-3xl space-y-6 pb-16 md:pb-0">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Settings</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Workspace profile for this {APP_NAME} demo. Data lives in this browser.
        </p>
      </div>

      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle>Signed-in agent</CardTitle>
          <CardDescription>Loaded from the demo session, not a cloud database.</CardDescription>
        </CardHeader>
        <CardContent className="flex items-center gap-4">
          <UserAvatar name={user.name} avatar={user.avatar} size="lg" />
          <div>
            <p className="font-medium">{user.name}</p>
            <p className="text-sm text-muted-foreground">{user.email}</p>
            <div className="mt-2 flex items-center gap-2">
              <StatusBadge status={user.role} />
              <StatusBadge status={user.status} />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle>Workspace</CardTitle>
          <CardDescription>
            Customers, chats, and tickets are stored in localStorage on this device.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3 sm:grid-cols-3">
          <Metric label="Customers" value={counts.customers} />
          <Metric label="Conversations" value={counts.conversations} />
          <Metric label="Tickets" value={counts.tickets} />
        </CardContent>
      </Card>

      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle>Demo agents</CardTitle>
          <CardDescription>Password for every account: {DEMO_PASSWORD}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          {DEMO_ACCOUNTS.map((account) => (
            <div
              key={account.email}
              className="flex items-center justify-between rounded-lg border px-3 py-2"
            >
              <div>
                <p className="font-medium">{account.name}</p>
                <p className="text-xs text-muted-foreground">{account.email}</p>
              </div>
              <span className="text-xs text-muted-foreground">{account.role}</span>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-lg border bg-muted/30 px-4 py-3">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-1 text-2xl font-semibold">{value}</p>
    </div>
  );
}
