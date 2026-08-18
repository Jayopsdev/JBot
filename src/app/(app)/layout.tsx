import { redirect } from "next/navigation";
import { AppChrome } from "@/components/layout/app-chrome";
import { getCurrentUser } from "@/lib/auth";

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

  return <AppChrome user={user}>{children}</AppChrome>;
}
