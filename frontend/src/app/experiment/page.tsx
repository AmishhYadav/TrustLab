"use client";

import { useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  FlaskConical,
  Gamepad2,
  ArrowRight,
  ArrowLeft,
  Sparkles,
  BarChart3,
  Shield,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useSession } from "@/components/SessionProvider";
import { useScenario } from "@/components/ScenarioProvider";
import CounterfactualEngine from "@/components/CounterfactualEngine";
import ProgressBar from "@/components/ProgressBar";

/* ═══════════════════════════════════════════════════════════════════════════
   Experiment Page — Mode Selection + Experiment Flow + Playground
   Matches existing logic with routing integration.
   ═══════════════════════════════════════════════════════════════════════════ */

export default function ExperimentPage() {
  const router = useRouter();
  const { participantId, user } = useSession();
  const {
    mode,
    setMode,
    currentScenario,
    isComplete,
    completeRound,
  } = useScenario();

  // Navigate to analytics when experiment completes
  useEffect(() => {
    if (isComplete) {
      router.push("/analytics");
    }
  }, [isComplete, router]);

  const handleRoundComplete = useCallback(
    (userDecision: "approve" | "reject", responseTimeMs: number, cueData?: {
      wasOverReliantCued: boolean;
      originalDecision: "approve" | "reject" | null;
      changedAfterCue: boolean;
    }) => {
      completeRound(userDecision, responseTimeMs, cueData);
    },
    [completeRound],
  );

  return (
    <main className="flex min-h-screen flex-col items-center bg-neutral-950 text-white px-6 py-12">
      {/* Header */}
      <header className="mb-12 text-center space-y-2">
        <h1 className="text-4xl font-bold tracking-tight">
          Ale<span className="text-blue-400">theia</span>
        </h1>
        <p className="text-neutral-500 text-sm">
          Human–AI Trust Calibration Platform
        </p>
        <div className="inline-block rounded-md bg-neutral-900 border border-neutral-800 px-3 py-1 text-xs font-mono text-neutral-500 mt-2">
          participant:{" "}
          <span className="text-emerald-400">{user?.username || "anonymous"}</span>
        </div>
      </header>

      <AnimatePresence mode="wait">
        {/* ── Mode Selection ─────────────────────────────────────── */}
        {!mode && !isComplete && (
          <motion.div
            key="mode-select"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
            className="w-full max-w-2xl space-y-8"
          >
            <div className="text-center space-y-3">
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.15 }}
                className="inline-flex items-center gap-2 rounded-full border border-blue-500/30 bg-blue-500/10 px-4 py-1.5 text-xs text-blue-300 uppercase tracking-wider"
              >
                <Sparkles size={12} />
                Choose Your Mode
              </motion.div>
              <h2 className="text-2xl font-semibold text-white">
                How would you like to explore?
              </h2>
              <p className="text-sm text-neutral-500 max-w-md mx-auto">
                Run a structured experiment to analyze your trust calibration, or
                freely explore AI predictions in playground mode.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {/* Experiment Mode Card */}
              <motion.button
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 }}
                whileHover={{ scale: 1.02, y: -3 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setMode("experiment")}
                className="group relative rounded-2xl border border-blue-500/30 bg-gradient-to-br from-blue-950/40 to-neutral-900/80 backdrop-blur-sm p-6 text-left transition-all duration-300 hover:border-blue-400/50 hover:shadow-[0_0_30px_rgba(59,130,246,0.1)] focus:outline-none focus:ring-2 focus:ring-blue-400/30"
              >
                <div className="absolute -top-3 right-4 rounded-full border border-blue-400/40 bg-blue-500/15 px-3 py-0.5 text-[10px] font-semibold text-blue-300 uppercase tracking-wider">
                  Recommended
                </div>

                <div className="space-y-4">
                  <div className="h-11 w-11 rounded-xl bg-blue-500/15 border border-blue-500/30 flex items-center justify-center">
                    <FlaskConical size={22} className="text-blue-400" />
                  </div>

                  <div className="space-y-1.5">
                    <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                      Experiment Mode
                      <ArrowRight
                        size={16}
                        className="text-blue-400 opacity-0 group-hover:opacity-100 transition-opacity"
                      />
                    </h3>
                    <p className="text-sm text-neutral-400 leading-relaxed">
                      10 curated scenarios designed to test different trust
                      calibration patterns. Full analytics at the end.
                    </p>
                  </div>

                  <div className="flex flex-wrap gap-2 pt-1">
                    {["Trust Analysis", "10 Scenarios", "Full Report"].map(
                      (tag) => (
                        <span
                          key={tag}
                          className="rounded-full border border-blue-500/20 bg-blue-500/10 px-2.5 py-0.5 text-[10px] text-blue-300 font-medium"
                        >
                          {tag}
                        </span>
                      ),
                    )}
                  </div>
                </div>
              </motion.button>

              {/* Playground Mode Card */}
              <motion.button
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.25 }}
                whileHover={{ scale: 1.02, y: -3 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setMode("playground")}
                className="group rounded-2xl border border-neutral-700 bg-gradient-to-br from-neutral-800/40 to-neutral-900/80 backdrop-blur-sm p-6 text-left transition-all duration-300 hover:border-emerald-500/30 hover:shadow-[0_0_30px_rgba(16,185,129,0.08)] focus:outline-none focus:ring-2 focus:ring-emerald-400/30"
              >
                <div className="space-y-4">
                  <div className="h-11 w-11 rounded-xl bg-emerald-500/10 border border-emerald-500/25 flex items-center justify-center">
                    <Gamepad2 size={22} className="text-emerald-400" />
                  </div>

                  <div className="space-y-1.5">
                    <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                      Playground Mode
                      <ArrowRight
                        size={16}
                        className="text-emerald-400 opacity-0 group-hover:opacity-100 transition-opacity"
                      />
                    </h3>
                    <p className="text-sm text-neutral-400 leading-relaxed">
                      Explore freely with custom inputs. Interact with the full
                      UI without structured evaluation.
                    </p>
                  </div>

                  <div className="flex flex-wrap gap-2 pt-1">
                    {["Free Explore", "Custom Inputs", "No Scoring"].map(
                      (tag) => (
                        <span
                          key={tag}
                          className="rounded-full border border-neutral-600/40 bg-neutral-700/30 px-2.5 py-0.5 text-[10px] text-neutral-400 font-medium"
                        >
                          {tag}
                        </span>
                      ),
                    )}
                  </div>
                </div>
              </motion.button>
            </div>

            {/* Feature highlights */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.35 }}
              className="flex items-center justify-center gap-6 pt-4 text-xs text-neutral-600"
            >
              <span className="flex items-center gap-1.5">
                <BarChart3 size={12} className="text-blue-500/60" />
                Real-time trust tracking
              </span>
              <span className="flex items-center gap-1.5">
                <Shield size={12} className="text-emerald-500/60" />
                Adaptive UI responses
              </span>
            </motion.div>

            {/* Back to landing */}
            <div className="flex justify-center pt-2">
              <button
                onClick={() => router.push("/landing")}
                className="group flex items-center gap-1.5 text-xs text-neutral-600 hover:text-neutral-400 transition-colors"
              >
                <ArrowLeft size={12} className="transition-transform group-hover:-translate-x-0.5" />
                Back to Home
              </button>
            </div>
          </motion.div>
        )}

        {/* ── Experiment Mode ────────────────────────────────────── */}
        {mode === "experiment" && !isComplete && (
          <motion.div
            key="experiment"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
            className="w-full max-w-2xl space-y-8"
          >
            <ProgressBar />
            <CounterfactualEngine
              scenario={currentScenario}
              mode="experiment"
              onRoundComplete={handleRoundComplete}
            />
          </motion.div>
        )}

        {/* ── Playground Mode ────────────────────────────────────── */}
        {mode === "playground" && (
          <motion.div
            key="playground"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
            className="w-full max-w-2xl space-y-6"
          >
            {/* Playground Header */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20">
                <Gamepad2 size={14} className="text-emerald-400" />
                <span className="text-xs font-semibold text-emerald-300 uppercase tracking-wider">Playground</span>
              </div>
              <button
                onClick={() => setMode(null)}
                className="group flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-neutral-800 bg-neutral-900/50 hover:bg-neutral-800 hover:border-neutral-700 text-xs font-medium text-neutral-400 transition-all hover:text-neutral-200"
              >
                <ArrowLeft size={14} className="transition-transform group-hover:-translate-x-0.5" />
                Main Menu
              </button>
            </div>

            <CounterfactualEngine mode="playground" />
          </motion.div>
        )}
      </AnimatePresence>
    </main>
  );
}
