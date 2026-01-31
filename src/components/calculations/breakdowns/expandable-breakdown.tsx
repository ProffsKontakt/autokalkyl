'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { useState } from 'react'

interface ExpandableBreakdownProps {
  title: string
  subtitle?: string
  icon?: React.ReactNode
  color: 'green' | 'blue' | 'purple'
  defaultOpen?: boolean
  children: React.ReactNode
}

export function ExpandableBreakdown({
  title,
  subtitle,
  icon,
  color,
  defaultOpen = false,
  children,
}: ExpandableBreakdownProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen)

  const colorClasses = {
    green: {
      bg: 'bg-green-50 dark:bg-green-900/20',
      border: 'border-green-200 dark:border-green-800',
      text: 'text-green-700 dark:text-green-400',
      icon: 'text-green-600 dark:text-green-400',
    },
    blue: {
      bg: 'bg-blue-50 dark:bg-blue-900/20',
      border: 'border-blue-200 dark:border-blue-800',
      text: 'text-blue-700 dark:text-blue-400',
      icon: 'text-blue-600 dark:text-blue-400',
    },
    purple: {
      bg: 'bg-purple-50 dark:bg-purple-900/20',
      border: 'border-purple-200 dark:border-purple-800',
      text: 'text-purple-700 dark:text-purple-400',
      icon: 'text-purple-600 dark:text-purple-400',
    },
  }

  const colors = colorClasses[color] || colorClasses.green

  return (
    <div className={`border ${colors.border} rounded-lg overflow-hidden`}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full px-4 py-3 flex items-center justify-between ${colors.bg} hover:opacity-90 transition-opacity`}
      >
        <div className="flex items-center gap-3">
          {icon && <span className={colors.icon}>{icon}</span>}
          <div className="text-left">
            <span className={`font-medium ${colors.text}`}>{title}</span>
            {subtitle && (
              <span className="ml-2 text-sm text-gray-500 dark:text-gray-400">
                {subtitle}
              </span>
            )}
          </div>
        </div>
        <motion.span
          animate={{ rotate: isOpen ? 180 : 0 }}
          transition={{ duration: 0.2 }}
          className={colors.text}
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </motion.span>
      </button>

      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: [0.04, 0.62, 0.23, 0.98] }}
          >
            <div className="px-4 py-3 border-t border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800">
              {children}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
