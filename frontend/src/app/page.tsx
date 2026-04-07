"use client";

import { useSession } from "@/components/SessionProvider";

export default function Home() {
  const { participantId } = useSession();

  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-6 bg-neutral-950 text-white p-8">
      <h1 className="text-4xl font-bold tracking-tight">
        Trust<span className="text-blue-400">Lab</span>
      </h1>
      <p className="text-neutral-400 text-lg max-w-md text-center">
        Human–AI Trust Calibration Platform
      </p>
      <div className="mt-4 rounded-lg border border-neutral-800 bg-neutral-900 px-6 py-4 text-sm font-mono">
        <span className="text-neutral-500">participant:</span>{" "}
        <span className="text-emerald-400">{participantId}</span>
      </div>
    </main>
  );
}
