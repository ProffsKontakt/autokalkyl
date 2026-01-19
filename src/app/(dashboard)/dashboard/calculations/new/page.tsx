import Link from 'next/link';

export const metadata = {
  title: 'Ny kalkyl - Kalkyla.se',
};

export default function NewCalculationPage() {
  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h1 className="text-2xl font-bold text-gray-900 mb-4">Skapa ny kalkyl</h1>
      <p className="text-gray-600 mb-6">
        Kalkylmotorn byggs i Fas 3. Denna sida ar en platshallare.
      </p>
      <Link
        href="/dashboard/calculations"
        className="text-blue-600 hover:text-blue-800"
      >
        ← Tillbaka till kalkyler
      </Link>
    </div>
  );
}
