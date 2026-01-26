'use client'

import { createContext, useContext, useEffect, useState, useCallback } from 'react'

type Theme = 'light' | 'dark' | 'system'

interface ThemeContextType {
  theme: Theme
  setTheme: (theme: Theme) => void
  resolvedTheme: 'light' | 'dark'
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined)

// Get the resolved theme from current DOM state (set by inline script in layout.tsx)
function getResolvedThemeFromDOM(): 'light' | 'dark' {
  if (typeof document === 'undefined') return 'dark'
  return document.documentElement.classList.contains('dark') ? 'dark' : 'light'
}

// Get system preference
function getSystemTheme(): 'light' | 'dark' {
  if (typeof window === 'undefined') return 'dark'
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  // Initialize state from DOM to match what inline script already set (prevents FOUC)
  const [theme, setThemeState] = useState<Theme>('system')
  const [resolvedTheme, setResolvedTheme] = useState<'light' | 'dark'>('dark')
  const [mounted, setMounted] = useState(false)

  // Apply theme to document
  const applyTheme = useCallback((resolved: 'light' | 'dark') => {
    const root = document.documentElement
    root.classList.remove('light', 'dark')
    root.classList.add(resolved)
    setResolvedTheme(resolved)
  }, [])

  // Set theme and persist
  const setTheme = useCallback((newTheme: Theme) => {
    setThemeState(newTheme)
    localStorage.setItem('kalkyla-theme', newTheme)

    const resolved = newTheme === 'system' ? getSystemTheme() : newTheme
    applyTheme(resolved)
  }, [applyTheme])

  // Initialize on mount - sync React state with what inline script already did
  useEffect(() => {
    // Read stored preference
    const stored = localStorage.getItem('kalkyla-theme') as Theme | null
    const initial = stored || 'system'
    setThemeState(initial)

    // Read resolved theme from DOM (already set by inline script, no flicker)
    setResolvedTheme(getResolvedThemeFromDOM())
    setMounted(true)

    // Listen for system theme changes
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
    const handleChange = () => {
      const currentStored = localStorage.getItem('kalkyla-theme') as Theme | null
      if (!currentStored || currentStored === 'system') {
        applyTheme(getSystemTheme())
      }
    }
    mediaQuery.addEventListener('change', handleChange)
    return () => mediaQuery.removeEventListener('change', handleChange)
  }, [applyTheme])

  // Always render children - no conditional rendering to avoid hydration mismatch
  // The inline script in layout.tsx handles initial theme, so there's no FOUC
  return (
    <ThemeContext.Provider value={{ theme, setTheme, resolvedTheme: mounted ? resolvedTheme : 'dark' }}>
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme() {
  const context = useContext(ThemeContext)
  // Return safe defaults if not inside provider (during SSR/hydration)
  if (context === undefined) {
    return {
      theme: 'system' as const,
      setTheme: () => {},
      resolvedTheme: 'dark' as const,
    }
  }
  return context
}
