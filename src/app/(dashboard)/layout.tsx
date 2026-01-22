import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth/auth'
import { ROLES } from '@/lib/auth/permissions'
import { DashboardNav } from '@/components/layout/dashboard-nav'
import { AdminSidebar } from '@/components/layout/admin-sidebar'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await auth()

  if (!session?.user) {
    redirect('/login')
  }

  const isSuperAdmin = session.user.role === ROLES.SUPER_ADMIN

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-gray-50 to-slate-100 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
      {/* Subtle background pattern */}
      <div
        className="fixed inset-0 opacity-[0.015] dark:opacity-[0.02] pointer-events-none"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23000000' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        }}
      />

      {isSuperAdmin ? (
        <>
          <AdminSidebar user={session.user} />
          <main className="lg:ml-64 min-h-screen">
            <div className="max-w-6xl mx-auto py-8 px-4 sm:px-6 lg:px-8 pt-16 lg:pt-8">
              {children}
            </div>
          </main>
        </>
      ) : (
        <div className="relative">
          <DashboardNav user={session.user} />
          <main className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
            {children}
          </main>
        </div>
      )}
    </div>
  )
}
