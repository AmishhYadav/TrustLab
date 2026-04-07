"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sliders, Zap, ArrowRight, ShieldAlert, AlertOctagon } from "lucide-react";
import EpistemicOrb from "./EpistemicOrb";
import { useSession } from "./SessionProvider";
import { useTrustEngine } from "./TrustEngineProvider";
import { trackTrustEvent } from "@/lib/telemetry";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface EpistemicState {
  confidence: number;
  ambiguity_flag: boolean;
  reasoning: string[];
}

interface ProxyResponse {
  scenario_id: string;
  prediction: string;
  epistemic_state: EpistemicState;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const PROXY_URL = "http://localhost:8000/api/proxy/predict";
const DEBOUNCE_MS = 300;

// Local extrapolation factor — maps slider delta to confidence shift.
// In production this would be tuned per scenario.
const EXTRAPOLATION_FACTOR = 0.005;

// Scenario defaults
const SCENARIO = {
  id: "loan-demo-001",
  title: "Loan Application Review",
  description: "Applicant requests $40,000 over 5 years for property renovations.",
  baseIncome: 55, // $55k (slider value)
};

const BASE_CONFIDENCE = 0.73;
const BASE_AMBIGUITY_THRESHOLD = 0.55;

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function CounterfactualEngine() {
  const { participantId } = useSession();
  const { trustState, recordInteraction, submitDecision } = useTrustEngine();

  // Force ambiguity when user is over-reliant (adaptive UX)
  const isOverReliant = trustState === "OVER_RELIANT";

  // Slider state
  const [income, setIncome] = useState(SCENARIO.baseIncome);

  // Epistemic state — local optimistic + remote truth
  const [confidence, setConfidence] = useState(BASE_CONFIDENCE);
  const [ambiguity, setAmbiguity] = useState(true);
  const [prediction, setPrediction] = useState("Approve with conditions");
  const [reasoning, setReasoning] = useState<string[]>([
    "Applicant income-to-debt ratio is within acceptable range.",
    "Credit history shows two late payments in the last 24 months.",
    "Employment tenure is short (< 1 year) — moderate risk factor.",
  ]);

  // Track whether we're waiting for backend
  const [isSyncing, setIsSyncing] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastSliderRef = useRef(SCENARIO.baseIncome);

  // ------------------------------------------------------------------
  // Optimistic confidence calculation (synchronous, <1ms)
  // ------------------------------------------------------------------
  const computeOptimisticConfidence = useCallback((currentIncome: number) => {
    const delta = currentIncome - SCENARIO.baseIncome;
    const raw = BASE_CONFIDENCE + delta * EXTRAPOLATION_FACTOR;
    return Math.max(0.05, Math.min(0.99, raw));
  }, []);

  // ------------------------------------------------------------------
  // Slider change handler — instant local update + debounced fetch
  // ------------------------------------------------------------------
  const handleSliderChange = useCallback(
    (value: number) => {
      setIncome(value);

      // Record interaction for trust tracking
      recordInteraction();

      // INSTANT: optimistic confidence update (sub-1ms)
      const optimistic = computeOptimisticConfidence(value);
      setConfidence(optimistic);
      setAmbiguity(optimistic < BASE_AMBIGUITY_THRESHOLD);

      // DEBOUNCED: real backend fetch + telemetry
      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(async () => {
        setIsSyncing(true);

        // Fire telemetry
        trackTrustEvent(participantId, "slider_adjust", {
          parameter: "income",
          value,
          optimistic_confidence: optimistic,
          delta_from_base: value - SCENARIO.baseIncome,
        });

        // Fetch real prediction
        try {
          const res = await fetch(PROXY_URL, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              scenario_id: SCENARIO.id,
              income: value,
            }),
          });

          if (res.ok) {
            const data: ProxyResponse = await res.json();
            setConfidence(data.epistemic_state.confidence);
            setAmbiguity(data.epistemic_state.ambiguity_flag);
            setPrediction(data.prediction);
            setReasoning(data.epistemic_state.reasoning);
          }
        } catch {
          // Network failure — keep optimistic values, log
          console.warn("[CounterfactualEngine] proxy fetch failed, keeping optimistic state");
        } finally {
          setIsSyncing(false);
        }
      }, DEBOUNCE_MS);
    },
    [computeOptimisticConfidence, participantId, recordInteraction],
  );

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, []);

  return (
    <div className="flex flex-col items-center gap-10 w-full max-w-2xl mx-auto">
      {/* Scenario Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center space-y-2"
      >
        <div className="inline-flex items-center gap-2 rounded-full border border-neutral-800 bg-neutral-900/50 px-4 py-1.5 text-xs text-neutral-400 uppercase tracking-wider">
          <Zap size={12} className="text-blue-400" />
          Live Scenario
        </div>
        <h2 className="text-xl font-semibold text-white">{SCENARIO.title}</h2>
        <p className="text-sm text-neutral-500 max-w-md">
          {SCENARIO.description}
        </p>
      </motion.div>

      {/* Epistemic Orb — the visual center */}
      <EpistemicOrb
        confidence={isOverReliant ? Math.max(0.3, confidence * 0.7) : confidence}
        ambiguity={isOverReliant ? true : ambiguity}
        reasoning={reasoning}
      />

      {/* Over-reliance counter-argument injection */}
      <AnimatePresence>
        {isOverReliant && (
          <motion.div
            initial={{ opacity: 0, y: -10, height: 0 }}
            animate={{ opacity: 1, y: 0, height: "auto" }}
            exit={{ opacity: 0, y: -10, height: 0 }}
            className="w-full max-w-2xl"
          >
            <motion.div
              animate={{ x: [0, -1, 1, -1, 0] }}
              transition={{ duration: 0.3, repeat: Infinity, repeatType: "mirror", repeatDelay: 2 }}
              className="flex items-start gap-3 rounded-xl border border-red-500/50 bg-red-950/30 backdrop-blur-sm px-5 py-4"
            >
              <ShieldAlert size={20} className="text-red-400 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <div className="text-sm font-medium text-red-300">
                  Wait — are you sure?
                </div>
                <p className="text-xs text-red-400/80 leading-relaxed">
                  The model&apos;s training data here is very sparse. The applicant&apos;s
                  short employment history (&lt;1 year) is a significant risk factor
                  that the confidence score may not fully capture. Consider exploring
                  the counterfactual controls before deciding.
                </p>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Prediction display */}
      <motion.div
        layout
        className="flex items-center gap-3 rounded-xl border border-neutral-800 bg-neutral-900/60 backdrop-blur-sm px-6 py-3"
      >
        <ArrowRight size={16} className="text-neutral-600" />
        <div>
          <div className="text-xs text-neutral-500 uppercase tracking-wider mb-0.5">
            AI Recommendation
          </div>
          <div className="text-white font-medium">{prediction}</div>
        </div>
        {isSyncing && (
          <motion.div
            animate={{ opacity: [0.3, 1, 0.3] }}
            transition={{ duration: 0.8, repeat: Infinity }}
            className="ml-2 h-2 w-2 rounded-full bg-blue-400"
          />
        )}
      </motion.div>

      {/* Counterfactual Controls */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="w-full rounded-2xl border border-neutral-800 bg-neutral-900/40 backdrop-blur-sm p-6 space-y-5"
      >
        <div className="flex items-center gap-2 text-sm text-neutral-400">
          <Sliders size={14} />
          <span className="uppercase tracking-wider text-xs">
            Counterfactual Controls
          </span>
        </div>

        {/* Income slider */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <label
              htmlFor="income-slider"
              className="text-sm text-neutral-300"
            >
              Annual Income
            </label>
            <span className="text-sm font-mono text-emerald-400">
              ${income}k
            </span>
          </div>

          <input
            id="income-slider"
            type="range"
            min={20}
            max={120}
            step={1}
            value={income}
            onChange={(e) => handleSliderChange(Number(e.target.value))}
            className="w-full h-2 rounded-full appearance-none cursor-pointer
              bg-neutral-800
              [&::-webkit-slider-thumb]:appearance-none
              [&::-webkit-slider-thumb]:w-5
              [&::-webkit-slider-thumb]:h-5
              [&::-webkit-slider-thumb]:rounded-full
              [&::-webkit-slider-thumb]:bg-blue-400
              [&::-webkit-slider-thumb]:shadow-[0_0_12px_rgba(96,165,250,0.5)]
              [&::-webkit-slider-thumb]:border-2
              [&::-webkit-slider-thumb]:border-blue-300
              [&::-webkit-slider-thumb]:transition-shadow
              [&::-webkit-slider-thumb]:duration-200
              [&::-webkit-slider-thumb]:hover:shadow-[0_0_20px_rgba(96,165,250,0.7)]
              [&::-moz-range-thumb]:w-5
              [&::-moz-range-thumb]:h-5
              [&::-moz-range-thumb]:rounded-full
              [&::-moz-range-thumb]:bg-blue-400
              [&::-moz-range-thumb]:border-2
              [&::-moz-range-thumb]:border-blue-300"
          />

          <div className="flex justify-between text-xs text-neutral-600">
            <span>$20k</span>
            <span>$120k</span>
          </div>
        </div>

        {/* Info text */}
        <p className="text-xs text-neutral-600 text-center pt-2">
          Drag the slider to explore how changing the applicant&apos;s income
          affects the AI&apos;s confidence and recommendation.
        </p>
      </motion.div>

      {/* Submit Decision button */}
      <motion.button
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        whileHover={{ scale: 1.02, y: -1 }}
        whileTap={{ scale: 0.98 }}
        onClick={submitDecision}
        className="w-full max-w-xs rounded-xl border border-blue-500/30 bg-gradient-to-r from-blue-600/20 to-blue-500/10 backdrop-blur-sm px-6 py-3.5 text-sm font-semibold text-blue-300 transition-all duration-200 hover:border-blue-400/50 hover:from-blue-600/30 hover:to-blue-500/20 hover:text-blue-200 hover:shadow-[0_0_20px_rgba(59,130,246,0.15)] focus:outline-none focus:ring-2 focus:ring-blue-400/30"
      >
        <span className="flex items-center justify-center gap-2">
          <AlertOctagon size={16} />
          Submit Decision
        </span>
      </motion.button>
    </div>
  );
}
