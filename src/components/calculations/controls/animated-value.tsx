'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { useEffect, useState } from 'react'

interface AnimatedValueProps {
  value: number
  formatter: (n: number) => string
  label?: string
  className?: string
  highlightColor?: string
}

export function AnimatedValue({
  value,
  formatter,
  label,
  className = '',
  highlightColor = 'rgba(59, 130, 246, 0.1)',
}: AnimatedValueProps) {
  const [isChanging, setIsChanging] = useState(false)

  useEffect(() => {
    setIsChanging(true)
    const timer = setTimeout(() => setIsChanging(false), 500)
    return () => clearTimeout(timer)
  }, [value])

  return (
    <div className={`relative ${className}`}>
      <AnimatePresence mode="wait">
        <motion.div
          key={value}
          initial={{ opacity: 0, y: -10 }}
          animate={{
            opacity: 1,
            y: 0,
            backgroundColor: isChanging ? highlightColor : 'transparent',
          }}
          exit={{ opacity: 0, y: 10 }}
          transition={{ duration: 0.3 }}
          className="rounded px-2 py-1"
        >
          {label && (
            <div className="text-sm text-gray-600 dark:text-gray-400">{label}</div>
          )}
          <div className="text-2xl font-bold text-gray-900 dark:text-white tabular-nums">
            {formatter(value)}
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  )
}
