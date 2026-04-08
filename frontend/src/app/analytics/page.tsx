"use client";

import { useRouter } from "next/navigation";
import { useScenario } from "@/components/ScenarioProvider";
import SessionSummary from "@/components/SessionSummary";
import { motion } from "framer-motion";
import { ArrowLeft } from "lucide-react";

/* ═══════════════════════════════════════════════════════════════════════════
   Analytics Page — End-of-Session Dashboard
   Shows the session summary once the experiment is complete.
   ═══════════════════════════════════════════════════════════════════════════ */

export default function AnalyticsPage() {
  const router = useRouter();
  const { isComplete, roundResults } = useScenario();

  // If no results, redirect to experiment
  if (!isComplete && roundResults.length === 0) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center bg-neutral-950 text-white px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center space-y-6"
        >
          <h1 className="text-3xl font-bold tracking-tight">
            Trust<span className="text-blue-400">Lab</span>
          </h1>
          <p className="text-neutral-500 text-sm max-w-md">
            No experiment data found. Complete an experiment first to see your analytics dashboard.
          </p>
          <button
            onClick={() => router.push("/experiment")}
            className="inline-flex items-center gap-2 rounded-xl border border-blue-500/30 bg-blue-500/10 px-6 py-3 text-sm font-semibold text-blue-300 transition-all hover:bg-blue-500/20"
          >
            Start Experiment
          </button>
          <div>
            <button
              onClick={() => router.push("/landing")}
              className="group inline-flex items-center gap-1.5 text-xs text-neutral-600 hover:text-neutral-400 transition-colors mt-4"
            >
              <ArrowLeft size={12} className="transition-transform group-hover:-translate-x-0.5" />
              Back to Home
            </button>
          </div>
        </motion.div>
      </main>
    );
  }

  return (
    <main className="flex min-h-screen flex-col items-center bg-neutral-950 text-white px-6 py-12">
      {/* Header */}
      <header className="mb-8 text-center space-y-2">
        <h1 className="text-4xl font-bold tracking-tight">
          Trust<span className="text-blue-400">Lab</span>
        </h1>
        <p className="text-neutral-500 text-sm">
          Human–AI Trust Calibration Platform
        </p>
      </header>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
        className="w-full"
      >
        <SessionSummary />
      </motion.div>

      {/* Navigation buttons */}
      <div className="mt-8 flex items-center gap-4">
        <button
          onClick={() => router.push("/landing")}
          className="group flex items-center gap-1.5 text-xs text-neutral-600 hover:text-neutral-400 transition-colors"
        >
          <ArrowLeft size={12} className="transition-transform group-hover:-translate-x-0.5" />
          Back to Home
        </button>
      </div>
    </main>
  );
}
