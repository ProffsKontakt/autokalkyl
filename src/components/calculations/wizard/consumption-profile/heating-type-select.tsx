'use client'

/**
 * Heating type radio button selection component.
 *
 * Displays 5 Swedish heating types with descriptions:
 * - Direktverkande el (direct electric) - highest seasonal variation
 * - Luft-luft VP (air-to-air heat pump) - moderate variation
 * - Luft-vatten VP (air-to-water heat pump) - similar to bergvarme
 * - Bergvarme (ground source heat pump) - most stable
 * - Fjarrvarme (district heating) - flat profile, only household electricity
 *
 * @see HEATING_TYPE_PROFILES for consumption distribution factors
 */

import type { HeatingType } from '@prisma/client'
import { HEATING_TYPE_PROFILES } from '@/lib/calculations/consumption-profiles'

interface HeatingTypeSelectProps {
  value: HeatingType | null
  onChange: (value: HeatingType) => void
}

const HEATING_TYPES: HeatingType[] = [
  'DIREKTVERKANDE',
  'LUFT_LUFT_VP',
  'LUFT_VATTEN_VP',
  'BERGVARME',
  'FJARRVARME',
]

export function HeatingTypeSelect({ value, onChange }: HeatingTypeSelectProps) {
  return (
    <fieldset className="space-y-3">
      <legend className="block text-sm font-medium text-gray-700 dark:text-gray-300">
        Uppvarmningstyp *
      </legend>

      <div className="space-y-2" role="radiogroup" aria-label="Valj uppvarmningstyp">
        {HEATING_TYPES.map((type) => {
          const profile = HEATING_TYPE_PROFILES[type]
          const isSelected = value === type

          return (
            <label
              key={type}
              className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                isSelected
                  ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 dark:border-blue-400'
                  : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
              }`}
            >
              <input
                type="radio"
                name="heatingType"
                value={type}
                checked={isSelected}
                onChange={() => onChange(type)}
                className="mt-1 h-4 w-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                aria-describedby={`${type}-description`}
              />
              <div className="flex-1">
                <span className={`text-sm font-medium ${
                  isSelected
                    ? 'text-blue-900 dark:text-blue-100'
                    : 'text-gray-900 dark:text-gray-100'
                }`}>
                  {profile.name}
                </span>
                <p
                  id={`${type}-description`}
                  className={`text-xs mt-0.5 ${
                    isSelected
                      ? 'text-blue-700 dark:text-blue-300'
                      : 'text-gray-500 dark:text-gray-400'
                  }`}
                >
                  {profile.description}
                </p>
              </div>
            </label>
          )
        })}
      </div>
    </fieldset>
  )
}
