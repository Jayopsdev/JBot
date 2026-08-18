"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import { getAvatarColor, getInitials } from "@/lib/format";

type UserAvatarProps = {
  name: string;
  avatar?: string | null;
  size?: "default" | "sm" | "lg";
  className?: string;
};

export function UserAvatar({
  name,
  avatar,
  size = "default",
  className,
}: UserAvatarProps) {
  return (
    <Avatar size={size} className={className}>
      {avatar ? <AvatarImage src={avatar} alt={name} /> : null}
      <AvatarFallback
        className={cn("font-medium text-white", getAvatarColor(name))}
      >
        {getInitials(name)}
      </AvatarFallback>
    </Avatar>
  );
}
