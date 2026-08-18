import { getSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import type { UserRole, UserStatus } from "@prisma/client";

export type AuthUser = {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatar: string | null;
  status: UserStatus;
};

export async function getCurrentUser(): Promise<AuthUser | null> {
  const session = await getSession();
  if (!session) return null;

  return prisma.user.findUnique({
    where: { id: session.sub },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      avatar: true,
      status: true,
    },
  });
}
