'use client'

import Link from 'next/link'
import Image from 'next/image'
import { usePathname, useRouter } from 'next/navigation'
import { logoutAction } from '@/actions/auth'
import { ThemeToggle } from '@/components/theme/theme-toggle'
import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import {
  LayoutDashboard,
  Calculator,
  Users,
  LogOut,
  Network,
  Bolt,
  Battery,
  Building2,
  Menu,
  X,
  Wrench,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react'

interface AdminSidebarProps {
  user: {
    name: string
    role: string
    orgSlug: string | null
  }
}

// Tooltip component for collapsed state
const Tooltip = ({ label }: { label: string }) => (
  <div className="
    absolute left-full ml-2 px-3 py-1.5 rounded-lg
    bg-slate-900 text-white text-sm whitespace-nowrap
    opacity-0 group-hover:opacity-100
    pointer-events-none transition-opacity duration-200
    z-50
  ">
    {label}
  </div>
)

export function AdminSidebar({ user }: AdminSidebarProps) {
  const router = useRouter()
  const pathname = usePathname()
  const [isCollapsed, setIsCollapsed] = useState(false)
  const [mounted, setMounted] = useState(false)
  const [isMobileOpen, setIsMobileOpen] = useState(false)

  // Read from localStorage after mount (SSR-safe)
  useEffect(() => {
    const stored = localStorage.getItem('kalkyla-sidebar-collapsed')
    if (stored !== null) {
      setIsCollapsed(stored === 'true')
    }
    setMounted(true)
  }, [])

  // Write to localStorage when state changes
  useEffect(() => {
    if (mounted) {
      localStorage.setItem('kalkyla-sidebar-collapsed', String(isCollapsed))
    }
  }, [isCollapsed, mounted])

  const toggleCollapse = () => setIsCollapsed(prev => !prev)

  const handleLogout = async () => {
    await logoutAction()
    router.push('/login')
    router.refresh()
  }

  const isSuperAdmin = user.role === 'SUPER_ADMIN'

  const menuItems = [
    { href: '/dashboard/calculations', label: 'Kalkyler', icon: Calculator },
    { href: '/dashboard/natagare', label: 'Natagare', icon: Network },
    { href: '/dashboard/batteries', label: 'Batterier', icon: Battery },
    { href: '/dashboard/electricity', label: 'Elpriser', icon: Bolt },
    { href: '/dashboard/users', label: 'Anvandare', icon: Users },
    { href: '/admin/organizations', label: 'Organisationer', icon: Building2 },
  ]

  // Super Admin only menu items
  const superAdminItems = [
    { href: '/dashboard/admin/natagare', label: 'Natagare (Admin)', icon: Wrench },
  ]

  const isActive = (href: string) => {
    if (href === '/dashboard') return pathname === '/dashboard'
    return pathname.startsWith(href)
  }

  // Determine actual collapsed state (desktop only, never on mobile)
  const effectiveCollapsed = mounted && isCollapsed && !isMobileOpen

  return (
    <>
      {/* Mobile menu button */}
      <button
        onClick={() => setIsMobileOpen(!isMobileOpen)}
        className="lg:hidden fixed top-4 left-4 z-50 p-2 rounded-lg bg-white dark:bg-slate-800 shadow-lg border border-slate-200 dark:border-slate-700"
      >
        {isMobileOpen ? (
          <X className="w-5 h-5 text-slate-600 dark:text-slate-300" />
        ) : (
          <Menu className="w-5 h-5 text-slate-600 dark:text-slate-300" />
        )}
      </button>

      {/* Overlay for mobile - z-30 to stay behind sidebar z-40 */}
      {isMobileOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/50 z-30"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <motion.aside
        initial={false}
        animate={{
          // On mobile (isMobileOpen), always show full width; on desktop, respect collapse state
          width: isMobileOpen ? 256 : (effectiveCollapsed ? 80 : 256),
        }}
        transition={{
          duration: 0.3,
          ease: [0.22, 1, 0.36, 1],
        }}
        className={`
          fixed top-0 left-0 h-screen z-40
          bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl
          border-r border-slate-200/50 dark:border-slate-700/50
          flex flex-col overflow-hidden
          transition-transform duration-300
          ${isMobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        `}
      >
        {/* Collapse toggle - only show on desktop */}
        <button
          onClick={toggleCollapse}
          className="hidden lg:flex absolute -right-3 top-20 w-6 h-6 rounded-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm items-center justify-center hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors z-50"
        >
          {isCollapsed ? (
            <ChevronRight className="w-4 h-4 text-slate-600 dark:text-slate-400" />
          ) : (
            <ChevronLeft className="w-4 h-4 text-slate-600 dark:text-slate-400" />
          )}
        </button>

        {/* Logo */}
        <div className="p-6 border-b border-slate-200/50 dark:border-slate-700/50">
          <Link href="/dashboard" className="flex items-center gap-3 group">
            <div className="p-2 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 shadow-lg shadow-blue-500/25 group-hover:shadow-blue-500/40 transition-shadow flex-shrink-0">
              <Image
                src="/kalkyla.png"
                alt="Kalkyla"
                width={24}
                height={24}
                className="w-6 h-6"
              />
            </div>
            {!effectiveCollapsed && (
              <motion.span
                initial={false}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                className="text-xl font-bold bg-gradient-to-r from-slate-900 to-slate-600 dark:from-white dark:to-slate-300 bg-clip-text text-transparent whitespace-nowrap"
              >
                Kalkyla
              </motion.span>
            )}
          </Link>
        </div>

        {/* Navigation - ALL items visible permanently */}
        <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
          {/* Oversikt - always visible */}
          <Link
            href="/dashboard"
            onClick={() => setIsMobileOpen(false)}
            className={`
              group relative flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all
              ${isActive('/dashboard') && pathname === '/dashboard'
                ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
              }
            `}
          >
            <LayoutDashboard className="w-5 h-5 flex-shrink-0" />
            {!effectiveCollapsed && (
              <motion.span
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                transition={{ duration: 0.2 }}
                className="whitespace-nowrap"
              >
                Oversikt
              </motion.span>
            )}
            {effectiveCollapsed && <Tooltip label="Oversikt" />}
          </Link>

          {/* All regular menu items - permanently visible */}
          {menuItems.map((item) => {
            const Icon = item.icon
            const active = isActive(item.href)
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setIsMobileOpen(false)}
                className={`
                  group relative flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all
                  ${active
                    ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                  }
                `}
              >
                <Icon className="w-5 h-5 flex-shrink-0" />
                {!effectiveCollapsed && (
                  <motion.span
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -10 }}
                    transition={{ duration: 0.2 }}
                    className="whitespace-nowrap"
                  >
                    {item.label}
                  </motion.span>
                )}
                {effectiveCollapsed && <Tooltip label={item.label} />}
              </Link>
            )
          })}

          {/* Super Admin only items */}
          {isSuperAdmin && (
            <>
              <div className="border-t border-slate-200 dark:border-slate-700 my-2" />
              {superAdminItems.map((item) => {
                const Icon = item.icon
                const active = isActive(item.href)
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setIsMobileOpen(false)}
                    className={`
                      group relative flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all
                      ${active
                        ? 'bg-purple-50 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300'
                        : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                      }
                    `}
                  >
                    <Icon className="w-5 h-5 flex-shrink-0" />
                    {!effectiveCollapsed && (
                      <motion.span
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -10 }}
                        transition={{ duration: 0.2 }}
                        className="whitespace-nowrap"
                      >
                        {item.label}
                      </motion.span>
                    )}
                    {effectiveCollapsed && <Tooltip label={item.label} />}
                  </Link>
                )
              })}
            </>
          )}
        </nav>

        {/* User section at bottom */}
        <div className="p-4 border-t border-slate-200/50 dark:border-slate-700/50">
          <div className={`flex items-center gap-3 mb-4 ${effectiveCollapsed ? 'justify-center' : ''}`}>
            <div className="group relative w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center text-white font-medium shadow-lg flex-shrink-0">
              {user.name.charAt(0).toUpperCase()}
              {effectiveCollapsed && <Tooltip label={`${user.name} - Super Admin`} />}
            </div>
            {!effectiveCollapsed && (
              <motion.div
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                transition={{ duration: 0.2 }}
                className="flex-1 min-w-0"
              >
                <p className="text-sm font-medium text-slate-900 dark:text-white truncate">
                  {user.name}
                </p>
                <span className="text-xs px-2 py-0.5 rounded-full bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400">
                  Super Admin
                </span>
              </motion.div>
            )}
          </div>

          <div className={`flex items-center gap-2 ${effectiveCollapsed ? 'flex-col' : ''}`}>
            <div className="group relative">
              <ThemeToggle />
              {effectiveCollapsed && <Tooltip label="Tema" />}
            </div>
            <button
              onClick={handleLogout}
              className={`
                group relative flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors
                ${effectiveCollapsed ? '' : 'flex-1'}
              `}
            >
              <LogOut className="w-4 h-4 flex-shrink-0" />
              {!effectiveCollapsed && (
                <motion.span
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -10 }}
                  transition={{ duration: 0.2 }}
                  className="whitespace-nowrap"
                >
                  Logga ut
                </motion.span>
              )}
              {effectiveCollapsed && <Tooltip label="Logga ut" />}
            </button>
          </div>
        </div>
      </motion.aside>
    </>
  )
}
