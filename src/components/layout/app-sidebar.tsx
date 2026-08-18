"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BrandMark } from "@/components/brand-mark";
import { APP_NAV } from "@/lib/nav";
import { APP_NAME } from "@/lib/brand";
import { cn } from "@/lib/utils";

export function AppSidebar({
  unreadChats = 0,
  unreadNotifications = 0,
}: {
  unreadChats?: number;
  unreadNotifications?: number;
}) {
  const pathname = usePathname();

  return (
    <aside className="flex h-full w-64 shrink-0 flex-col border-r border-sidebar-border bg-sidebar text-sidebar-foreground">
      <div className="flex h-16 items-center px-5">
        <BrandMark inverted />
      </div>
      <nav className="flex flex-1 flex-col gap-1 px-3 py-3">
        {APP_NAV.map((item) => {
          const isActive =
            pathname === item.href || pathname.startsWith(`${item.href}/`);
          const badge =
            "badgeKey" in item && item.badgeKey === "chat" ? unreadChats : 0;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                isActive
                  ? "bg-sidebar-accent text-white shadow-sm"
                  : "text-sidebar-foreground/70 hover:bg-sidebar-accent/70 hover:text-sidebar-accent-foreground",
              )}
            >
              <item.icon className="size-4" />
              <span className="flex-1">{item.label}</span>
              {badge > 0 ? (
                <span className="inline-flex min-w-5 items-center justify-center rounded-full bg-indigo-400 px-1.5 text-[10px] font-semibold text-white">
                  {badge > 9 ? "9+" : badge}
                </span>
              ) : null}
            </Link>
          );
        })}
      </nav>
      <div className="border-t border-sidebar-border px-4 py-4">
        <p className="text-[11px] font-medium uppercase tracking-wider text-sidebar-foreground/45">
          Demo workspace
        </p>
        <p className="mt-1 text-xs text-sidebar-foreground/70">
          Browser storage · {APP_NAME}
        </p>
        {unreadNotifications > 0 ? (
          <p className="mt-2 text-[11px] text-indigo-200">
            {unreadNotifications} unread notification
            {unreadNotifications === 1 ? "" : "s"}
          </p>
        ) : null}
      </div>
    </aside>
  );
}
