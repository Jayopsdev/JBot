import { redirect } from "next/navigation";
import { AppHeader } from "@/components/layout/app-header";
import { AppSidebar } from "@/components/layout/app-sidebar";
import { MobileNav } from "@/components/layout/mobile-nav";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login");
  }

  const [notifications, unreadCount, unreadChats] = await Promise.all([
    prisma.notification.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
      take: 8,
      select: {
        id: true,
        type: true,
        title: true,
        message: true,
        read: true,
        createdAt: true,
        href: true,
      },
    }),
    prisma.notification.count({
      where: { userId: user.id, read: false },
    }),
    prisma.conversation.count({
      where: {
        messages: { some: { senderType: "CUSTOMER", read: false } },
      },
    }),
  ]);

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
