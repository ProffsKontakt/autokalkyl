import Link from 'next/link'

export default function NotFound() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="max-w-md text-center">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">
          Kalkylen hittades inte
        </h1>
        <p className="text-gray-600 mb-6">
          Lanken kan ha gatt ut eller sa har kalkylen tagits bort.
          Kontakta din saljare for att fa en ny lank.
        </p>
        <div className="bg-white rounded-lg shadow p-6">
          <p className="text-sm text-gray-500 mb-2">Behover du hjalp?</p>
          <p className="text-gray-700">
            Kontakta saljaren som skickade lanken till dig.
          </p>
        </div>
        <Link
          href="https://kalkyla.se"
          className="inline-block mt-6 text-blue-600 hover:underline"
        >
          Besok Kalkyla.se
        </Link>
      </div>
    </div>
  )
}
