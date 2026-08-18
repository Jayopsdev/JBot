"use client";

import { AppHeader } from "@/components/layout/app-header";
import { AppSidebar } from "@/components/layout/app-sidebar";
import { MobileNav } from "@/components/layout/mobile-nav";
import type { AuthUser } from "@/lib/auth";
import {
  listNotifications,
  unreadChatCount,
} from "@/lib/local-db/queries";
import { useDatabase } from "@/lib/local-db/store";

export function AppChrome({
  user,
  children,
}: {
  user: AuthUser;
  children: React.ReactNode;
}) {
  const db = useDatabase();
  const notifications = db ? listNotifications(db, user.id) : [];
  const unreadCount = notifications.filter((item) => !item.read).length;
  const unreadChats = db ? unreadChatCount(db) : 0;

  return (
    <div className="flex min-h-screen bg-slate-50">
      <div className="hidden md:block">
        <div className="sticky top-0 h-screen">
          <AppSidebar
            unreadChats={unreadChats}
            unreadNotifications={unreadCount}
          />
        </div>
      </div>
      <div className="flex min-w-0 flex-1 flex-col">
        <AppHeader
          user={user}
          notifications={notifications}
          unreadCount={unreadCount}
        />
        <main className="flex-1 p-4 md:p-6">{children}</main>
      </div>
      <MobileNav unreadChats={unreadChats} />
    </div>
  );
}
