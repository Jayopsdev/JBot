"use client";

import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { UserMenu } from "@/components/layout/user-menu";
import {
  NotificationsMenu,
  type HeaderNotification,
} from "@/components/layout/notifications-menu";
import type { AuthUser } from "@/lib/auth";

export function AppHeader({
  user,
  notifications,
  unreadCount,
}: {
  user: AuthUser;
  notifications: HeaderNotification[];
  unreadCount: number;
}) {
  const router = useRouter();
  const [query, setQuery] = useState("");

  function handleSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const value = query.trim();
    if (!value) return;
    if (/^#?sh-?\d+/i.test(value) || /^#\d+/.test(value)) {
      router.push(`/tickets?q=${encodeURIComponent(value.replace(/^#/, ""))}`);
      return;
    }
    router.push(`/customers?q=${encodeURIComponent(value)}`);
  }

  return (
    <header className="relative z-50 flex h-16 items-center justify-between gap-4 border-b bg-background px-4 md:px-6">
      <form onSubmit={handleSearch} className="relative w-full max-w-md">
        <Search className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search customers or tickets..."
          className="h-9 bg-muted/40 pl-8"
        />
      </form>
      <div className="flex items-center gap-2">
        <NotificationsMenu
          notifications={notifications}
          unreadCount={unreadCount}
        />
        <UserMenu user={user} />
      </div>
    </header>
  );
}
