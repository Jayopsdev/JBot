"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { APP_NAV } from "@/lib/nav";
import { cn } from "@/lib/utils";

export function MobileNav({ unreadChats = 0 }: { unreadChats?: number }) {
  const pathname = usePathname();

  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 border-t bg-background/95 px-2 py-2 backdrop-blur md:hidden">
      <div className="grid grid-cols-5 gap-1">
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
                "relative flex flex-col items-center gap-1 rounded-lg py-1 text-[11px]",
                isActive ? "text-indigo-600" : "text-muted-foreground",
              )}
            >
              <item.icon className="size-4" />
              {item.label === "Live Chat" ? "Chat" : item.label}
              {badge > 0 ? (
                <span className="absolute top-0 right-3 size-1.5 rounded-full bg-indigo-600" />
              ) : null}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
