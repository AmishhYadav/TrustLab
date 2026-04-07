"use client";

import { useSession } from "@/components/SessionProvider";
import CounterfactualEngine from "@/components/CounterfactualEngine";

export default function Home() {
  const { participantId } = useSession();

  return (
    <main className="flex min-h-screen flex-col items-center bg-neutral-950 text-white px-6 py-12">
      {/* Header */}
      <header className="mb-12 text-center space-y-2">
        <h1 className="text-4xl font-bold tracking-tight">
          Trust<span className="text-blue-400">Lab</span>
        </h1>
        <p className="text-neutral-500 text-sm">
          Human–AI Trust Calibration Platform
        </p>
        <div className="inline-block rounded-md bg-neutral-900 border border-neutral-800 px-3 py-1 text-xs font-mono text-neutral-500 mt-2">
          participant:{" "}
          <span className="text-emerald-400">{participantId}</span>
        </div>
      </header>

      {/* Core interaction zone */}
      <CounterfactualEngine />
    </main>
  );
}
