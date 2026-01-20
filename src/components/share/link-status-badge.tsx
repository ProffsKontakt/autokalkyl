interface LinkStatusBadgeProps {
  isShared: boolean
  isActive: boolean
  expiresAt?: Date | null
  viewCount?: number
  className?: string
}

export function LinkStatusBadge({
  isShared,
  isActive,
  expiresAt,
  viewCount,
  className = '',
}: LinkStatusBadgeProps) {
  if (!isShared) {
    return null
  }

  const isExpired = expiresAt && new Date(expiresAt) < new Date()

  let status: 'active' | 'inactive' | 'expired'
  let label: string
  let colorClasses: string

  if (isExpired) {
    status = 'expired'
    label = 'Utgangen'
    colorClasses = 'bg-orange-100 text-orange-700'
  } else if (!isActive) {
    status = 'inactive'
    label = 'Inaktiv'
    colorClasses = 'bg-gray-100 text-gray-600'
  } else {
    status = 'active'
    label = 'Delad'
    colorClasses = 'bg-green-100 text-green-700'
  }

  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${colorClasses} ${className}`}
    >
      <span
        className={`w-1.5 h-1.5 rounded-full ${
          status === 'active'
            ? 'bg-green-500'
            : status === 'expired'
            ? 'bg-orange-500'
            : 'bg-gray-400'
        }`}
      />
      {label}
      {viewCount !== undefined && viewCount > 0 && (
        <span className="text-gray-500 ml-1">({viewCount})</span>
      )}
    </span>
  )
}
