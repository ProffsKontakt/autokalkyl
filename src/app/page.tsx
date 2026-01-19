export default function Home() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 font-sans dark:bg-black">
      <main className="flex w-full max-w-3xl flex-col items-center justify-center gap-8 py-32 px-8 text-center">
        <h1 className="text-4xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50 sm:text-5xl">
          Kalkyla.se
        </h1>
        <p className="text-xl text-zinc-600 dark:text-zinc-400">
          Professional Battery ROI Calculator
        </p>
        <p className="max-w-lg text-zinc-500 dark:text-zinc-500">
          Calculate energy savings, visualize returns, and share professional proposals with your customers.
        </p>
      </main>
    </div>
  );
}
