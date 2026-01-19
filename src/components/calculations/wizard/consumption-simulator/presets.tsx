'use client'

/**
 * Preset selector for consumption profiles.
 *
 * Displays available consumption pattern templates that can be
 * applied to quickly set up a realistic consumption profile.
 */

import { SYSTEM_PRESETS } from '@/lib/calculations/presets'

interface PresetsProps {
  onApply: (presetId: string) => void
}

export function Presets({ onApply }: PresetsProps) {
  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-gray-700">
        Snabbval - forbrukningsmonster
      </label>
      <div className="grid grid-cols-2 gap-2">
        {SYSTEM_PRESETS.map((preset) => (
          <button
            key={preset.id}
            type="button"
            onClick={() => onApply(preset.id)}
            className="p-3 text-left border border-gray-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors"
          >
            <span className="block text-sm font-medium text-gray-900">{preset.name}</span>
            <span className="block text-xs text-gray-500 mt-1">{preset.description}</span>
          </button>
        ))}
      </div>
    </div>
  )
}
