interface VariantIndicatorProps {
  changedCount: number
  onReset: () => void
}

export function VariantIndicator({ changedCount, onReset }: VariantIndicatorProps) {
  return (
    <div className="flex items-center gap-3 bg-amber-50 border border-amber-200 rounded-md px-3 py-2">
      <div className="flex items-center gap-2 text-sm text-amber-700">
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
          />
        </svg>
        <span>
          {changedCount} {changedCount === 1 ? 'timme andrad' : 'timmar andrade'}
        </span>
      </div>
      <button
        onClick={onReset}
        className="text-sm text-amber-700 hover:text-amber-900 underline"
      >
        Visa ursprunglig
      </button>
    </div>
  )
}
