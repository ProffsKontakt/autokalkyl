import { redirect } from "next/navigation";
import { auth } from "@/lib/auth/auth";
import { AppShell } from "@/components/app/app-shell";

export const dynamic = "force-dynamic";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session?.user?.id) redirect("/logga-in?next=/app");
  return <AppShell user={{ name: session.user.name ?? "Du", email: session.user.email ?? "" }}>{children}</AppShell>;
}
