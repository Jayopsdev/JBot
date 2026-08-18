"use client";

import { LogOut, UserRound } from "lucide-react";
import { UserAvatar } from "@/components/user-avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { AuthUser } from "@/lib/auth";
import { clearCurrentAgentId } from "@/lib/local-db/store";

export function UserMenu({ user }: { user: AuthUser }) {
  async function handleLogout() {
    try {
      clearCurrentAgentId();
      await fetch("/api/auth/logout", {
        method: "POST",
        credentials: "include",
        cache: "no-store",
      });
    } finally {
      window.location.replace("/login?loggedOut=1");
    }
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="inline-flex items-center gap-2 rounded-lg px-1.5 py-1 text-left hover:bg-muted">
        <UserAvatar name={user.name} avatar={user.avatar} size="sm" />
        <span className="hidden leading-tight md:inline-block">
          <span className="block text-sm font-medium">{user.name}</span>
          <span className="block text-[11px] font-normal text-muted-foreground">
            {user.role}
          </span>
        </span>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="z-[80] w-56">
        <DropdownMenuLabel>
          <span className="block text-sm text-foreground">{user.name}</span>
          <span className="block text-xs font-normal text-muted-foreground">
            {user.email}
          </span>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => window.location.assign("/settings")}>
          <UserRound className="size-4" />
          Profile & settings
        </DropdownMenuItem>
        <DropdownMenuItem
          variant="destructive"
          onClick={() => void handleLogout()}
        >
          <LogOut className="size-4" />
          Log out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
