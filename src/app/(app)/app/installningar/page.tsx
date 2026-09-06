import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth/auth";
import { prisma } from "@/lib/db/client";
import { inboundAddressFor } from "@/lib/brand";
import { PageHeader } from "@/components/ui";
import { DangerZoneCard, ExportCard, InboundAddressCard, InstallAppCard, PasswordCard, ProfileCard, SettingsNav } from "@/components/settings";

export const metadata: Metadata = { title: "Inställningar" };

const LOGIN_REDIRECT = "/logga-in?next=/app/installningar";

export default async function SettingsPage() {
  const session = await auth();
  if (!session?.user?.id) redirect(LOGIN_REDIRECT);
  const userId = session.user.id;

  const [user, receiptCount, recentInbound] = await Promise.all([
    prisma.user.findUnique({
      where: { id: userId },
      select: { name: true, email: true, accountType: true, inboundToken: true, createdAt: true },
    }),
    prisma.receipt.count({ where: { userId, deletedAt: null } }),
    prisma.inboundEmail.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: 5,
      select: { id: true, status: true, fromAddress: true, subject: true, receiptId: true, createdAt: true },
    }),
  ]);
  // The session outlived the account (e.g. deleted in another tab) – start over.
  if (!user) redirect(LOGIN_REDIRECT);

  const address = inboundAddressFor(user.inboundToken);

  return (
    <div className="space-y-6">
      <PageHeader title="Inställningar" description="Ditt konto, din kvittoadress och dina data." className="mb-0" />
      <SettingsNav />

      <ProfileCard
        user={{ name: user.name, email: user.email, accountType: user.accountType, createdAt: user.createdAt }}
        receiptCount={receiptCount}
      />
      <InboundAddressCard address={address} recent={recentInbound} />
      <ExportCard receiptCount={receiptCount} />
      <PasswordCard />
      <InstallAppCard />
      <DangerZoneCard email={user.email} />
    </div>
  );
}
