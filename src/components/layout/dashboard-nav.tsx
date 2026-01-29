'use client'

import Link from 'next/link'
import Image from 'next/image'
import { usePathname, useRouter } from 'next/navigation'
import { logoutAction } from '@/actions/auth'
import { ROLES } from '@/lib/auth/permissions'
import { ThemeToggle } from '@/components/theme/theme-toggle'
import {
  LayoutDashboard,
  Calculator,
  Users,
  Settings,
  Shield,
  LogOut,
  ChevronDown,
  Network,
  Bolt,
  Battery,
} from 'lucide-react'
import { useState } from 'react'

interface DashboardNavProps {
  user: {
    name: string
    role: string
    orgSlug: string | null
  }
}

export function DashboardNav({ user }: DashboardNavProps) {
  const router = useRouter()
  const pathname = usePathname()
  const [isProfileOpen, setIsProfileOpen] = useState(false)

  const isSuperAdmin = user.role === ROLES.SUPER_ADMIN
  const isOrgAdmin = user.role === ROLES.ORG_ADMIN

  const handleLogout = async () => {
    await logoutAction()
    router.push('/login')
    router.refresh()
  }

  const navItems = [
    {
      href: '/dashboard',
      label: 'Översikt',
      icon: LayoutDashboard,
      show: true,
    },
    {
      href: '/dashboard/calculations',
      label: 'Kalkyler',
      icon: Calculator,
      show: true,
    },
    {
      href: '/dashboard/natagare',
      label: 'Nätägare',
      icon: Network,
      show: isSuperAdmin,
    },
    {
      href: '/dashboard/batteries',
      label: 'Batterier',
      icon: Battery,
      show: isSuperAdmin,
    },
    {
      href: '/dashboard/electricity',
      label: 'Elpriser',
      icon: Bolt,
      show: isSuperAdmin,
    },
    {
      href: '/dashboard/users',
      label: 'Användare',
      icon: Users,
      show: isSuperAdmin || isOrgAdmin,
    },
    {
      href: '/dashboard/settings',
      label: 'Inställningar',
      icon: Settings,
      show: isOrgAdmin,
    },
    {
      href: '/admin/organizations',
      label: 'Admin',
      icon: Shield,
      show: isSuperAdmin,
    },
  ]

  const isActive = (href: string) => {
    if (href === '/dashboard') return pathname === '/dashboard'
    return pathname.startsWith(href)
  }

  const getRoleBadge = () => {
    switch (user.role) {
      case 'SUPER_ADMIN':
        return { label: 'Super Admin', color: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400' }
      case 'ORG_ADMIN':
        return { label: 'Admin', color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' }
      default:
        return { label: 'Closer', color: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-400' }
    }
  }

  const roleBadge = getRoleBadge()

  return (
    <nav className="sticky top-0 z-50 backdrop-blur-xl bg-white/80 dark:bg-slate-900/80 border-b border-slate-200/50 dark:border-slate-700/50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          {/* Logo and nav */}
          <div className="flex items-center gap-8">
            <Link
              href="/dashboard"
              className="flex items-center gap-2.5 group"
            >
              <div className="p-1.5 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 shadow-md shadow-blue-500/20 group-hover:shadow-blue-500/30 transition-shadow">
                <Image
                  src="/kalkyla.png"
                  alt="Kalkyla"
                  width={22}
                  height={22}
                  className="w-5 h-5"
                />
              </div>
              <span className="text-lg font-semibold bg-gradient-to-r from-slate-900 to-slate-600 dark:from-white dark:to-slate-300 bg-clip-text text-transparent">
                Kalkyla
              </span>
            </Link>

            <div className="hidden md:flex items-center gap-1">
              {navItems
                .filter((item) => item.show)
                .map((item) => {
                  const Icon = item.icon
                  const active = isActive(item.href)
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={`
                        flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200
                        ${
                          active
                            ? 'bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white'
                            : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-800/50'
                        }
                      `}
                    >
                      <Icon className={`w-4 h-4 ${active ? 'text-blue-600 dark:text-blue-400' : ''}`} />
                      {item.label}
                    </Link>
                  )
                })}
            </div>
          </div>

          {/* Right side */}
          <div className="flex items-center gap-3">
            <ThemeToggle />

            {/* Profile dropdown */}
            <div className="relative">
              <button
                onClick={() => setIsProfileOpen(!isProfileOpen)}
                className="flex items-center gap-3 pl-3 pr-2 py-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                <div className="text-right hidden sm:block">
                  <p className="text-sm font-medium text-slate-900 dark:text-white">
                    {user.name}
                  </p>
                  <span className={`text-xs px-1.5 py-0.5 rounded ${roleBadge.color}`}>
                    {roleBadge.label}
                  </span>
                </div>
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-medium text-sm shadow-md">
                  {user.name.charAt(0).toUpperCase()}
                </div>
                <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${isProfileOpen ? 'rotate-180' : ''}`} />
              </button>

              {isProfileOpen && (
                <>
                  <div
                    className="fixed inset-0 z-10"
                    onClick={() => setIsProfileOpen(false)}
                  />
                  <div className="absolute right-0 mt-2 w-56 z-20 py-2 bg-white dark:bg-slate-800 rounded-xl shadow-xl border border-slate-200 dark:border-slate-700 animate-fade-in">
                    <div className="px-4 py-2 border-b border-slate-100 dark:border-slate-700">
                      <p className="text-sm font-medium text-slate-900 dark:text-white">
                        {user.name}
                      </p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        {user.role.replace('_', ' ')}
                      </p>
                    </div>
                    <button
                      onClick={handleLogout}
                      className="w-full flex items-center gap-2 px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                    >
                      <LogOut className="w-4 h-4" />
                      Logga ut
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </nav>
  )
}
