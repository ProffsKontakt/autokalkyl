import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Batterikalkyl | Kalkyla.se',
  description: 'Din personliga batterikalkyl',
}

export default function PublicLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // Minimal layout - no nav, no auth context
  return (
    <div className="min-h-screen bg-gray-50">
      {children}
    </div>
  )
}
