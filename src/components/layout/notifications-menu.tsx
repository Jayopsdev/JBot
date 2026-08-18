"use client";

import { useRouter } from "next/navigation";
import {
  Bell,
  MessageSquare,
  Ticket,
  UserRound,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { formatRelativeTime } from "@/lib/format";
import { requestJson } from "@/lib/request-json";
import { cn } from "@/lib/utils";

export type HeaderNotification = {
  id: string;
  type?: string | null;
  title: string;
  message: string;
  read: boolean;
  createdAt: Date | string;
  href?: string | null;
};

function NotificationIcon({ type, title }: { type?: string | null; title: string }) {
  const label = `${type ?? ""} ${title}`.toLowerCase();
  if (label.includes("message") || label.includes("conversation")) {
    return <MessageSquare className="mt-0.5 size-3.5 text-sky-600" />;
  }
  if (label.includes("assign")) {
    return <UserRound className="mt-0.5 size-3.5 text-violet-600" />;
  }
  if (label.includes("ticket") || label.includes("status")) {
    return <Ticket className="mt-0.5 size-3.5 text-indigo-600" />;
  }
  return <Bell className="mt-0.5 size-3.5 text-muted-foreground" />;
}

export function NotificationsMenu({
  notifications,
  unreadCount,
}: {
  notifications: HeaderNotification[];
  unreadCount: number;
}) {
  const router = useRouter();

  async function openNotification(notification: HeaderNotification) {
    if (!notification.read) {
      await requestJson(`/api/notifications/${notification.id}/read`, {
        method: "POST",
      });
    }
    if (notification.href) {
      router.push(notification.href);
    }
    router.refresh();
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button variant="ghost" size="icon" className="relative" />
        }
      >
        <Bell className="size-4" />
        {unreadCount > 0 ? (
          <span className="absolute -top-0.5 -right-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-indigo-600 px-1 text-[10px] font-semibold text-white">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        ) : null}
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="z-[80] w-80">
        <DropdownMenuLabel>Notifications</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {notifications.length === 0 ? (
          <div className="px-3 py-6 text-center text-sm text-muted-foreground">
            You are all caught up.
          </div>
        ) : (
          notifications.map((notification) => (
            <DropdownMenuItem
              key={notification.id}
              className={cn(
                "items-start gap-2 py-2",
                !notification.read && "bg-indigo-50/80",
              )}
              onClick={() => void openNotification(notification)}
            >
              <NotificationIcon type={notification.type} title={notification.title} />
              <div className="min-w-0">
                <p
                  className={cn(
                    "truncate text-sm",
                    notification.read ? "font-medium" : "font-semibold",
                  )}
                >
                  {notification.title}
                </p>
                <p className="truncate text-xs text-muted-foreground">
                  {notification.message}
                </p>
                <p className="mt-1 text-[11px] text-muted-foreground">
                  {formatRelativeTime(new Date(notification.createdAt))}
                </p>
              </div>
            </DropdownMenuItem>
          ))
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
