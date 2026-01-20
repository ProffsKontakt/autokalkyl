interface PublicGreetingProps {
  customerName: string
  closerName: string
  customGreeting: string | null
}

const DEFAULT_GREETING = `Hej {namn}, har ar din batterikalkyl som du och {closer} har pratat om. Nedan ser du hur mycket du kan spara med ett batterisystem.`

export function PublicGreeting({
  customerName,
  closerName,
  customGreeting,
}: PublicGreetingProps) {
  // Use custom greeting or default
  const template = customGreeting || DEFAULT_GREETING

  // Replace placeholders
  const greeting = template
    .replace(/\{namn\}/gi, customerName)
    .replace(/\{closer\}/gi, closerName)

  return (
    <section className="bg-white rounded-lg shadow-sm p-6">
      <p className="text-lg text-gray-700 leading-relaxed">
        {greeting}
      </p>
    </section>
  )
}
