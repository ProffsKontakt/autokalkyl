import Image from 'next/image'

interface PublicHeaderProps {
  orgName: string
  logoUrl: string | null
  primaryColor: string
}

export function PublicHeader({ orgName, logoUrl, primaryColor }: PublicHeaderProps) {
  return (
    <header
      className="bg-white border-b sticky top-0 z-40"
      style={{ borderBottomColor: primaryColor }}
    >
      <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          {logoUrl ? (
            <Image
              src={logoUrl}
              alt={`${orgName} logo`}
              width={120}
              height={40}
              className="h-10 w-auto object-contain"
            />
          ) : (
            <span
              className="text-xl font-bold"
              style={{ color: primaryColor }}
            >
              {orgName}
            </span>
          )}
        </div>
        <div className="text-sm text-gray-500">
          Batterikalkyl
        </div>
      </div>
    </header>
  )
}
