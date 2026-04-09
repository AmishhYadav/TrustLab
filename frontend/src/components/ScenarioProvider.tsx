"use client";

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  EXPERIMENT_SCENARIOS,
  TOTAL_SCENARIOS,
  type Scenario,
} from "@/lib/scenarios";
import { trackTrustEvent } from "@/lib/telemetry";
import { useSession } from "./SessionProvider";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type AppMode = "experiment" | "playground" | null;

export interface RoundResult {
  scenario_id: string;
  ai_prediction: "approve" | "reject";
  user_decision: "approve" | "reject";
  ai_correct: boolean;
  user_correct: boolean;
  followed_ai: boolean;
  response_time_ms: number;
  round_index: number;
  timestamp: number;
  /** Whether this round triggered an over-reliance intervention cue. */
  was_over_reliant_cued: boolean;
  /** The user's original decision BEFORE seeing the cue (null if no cue shown). */
  original_decision: "approve" | "reject" | null;
  /** Whether the user changed their decision after seeing the cue. */
  changed_after_cue: boolean;
}

interface ScenarioContextValue {
  /** Current mode — null means mode selection screen. */
  mode: AppMode;
  /** Set the application mode. */
  setMode: (mode: AppMode) => void;

  /** Current scenario (experiment mode only). */
  currentScenario: Scenario | null;
  /** Zero-based index of the current scenario. */
  currentScenarioIndex: number;
  /** Total number of scenarios. */
  totalScenarios: number;
  /** Progress label like "3 of 10". */
  progressLabel: string;
  /** Whether this is the last scenario. */
  isLastScenario: boolean;
  /** Whether the experiment is complete. */
  isComplete: boolean;

  /** All round results collected so far. */
  roundResults: RoundResult[];

  /** Complete the current round and advance to the next scenario. */
  completeRound: (
    userDecision: "approve" | "reject",
    responseTimeMs: number,
    cueData?: {
      wasOverReliantCued: boolean;
      originalDecision: "approve" | "reject" | null;
      changedAfterCue: boolean;
    },
  ) => void;

  /** Reset everything for a fresh experiment run. */
  resetExperiment: () => void;
}

// ---------------------------------------------------------------------------
// Context
// ---------------------------------------------------------------------------

const ScenarioContext = createContext<ScenarioContextValue | null>(null);

export function useScenario(): ScenarioContextValue {
  const ctx = useContext(ScenarioContext);
  if (!ctx) {
    throw new Error("useScenario must be used within a <ScenarioProvider>");
  }
  return ctx;
}

// ---------------------------------------------------------------------------
// Storage Keys
// ---------------------------------------------------------------------------

const MODE_KEY = "trustlab_mode";
const INDEX_KEY = "trustlab_scenario_index";
const RESULTS_KEY = "trustlab_round_results";

// ---------------------------------------------------------------------------
// Provider
// ---------------------------------------------------------------------------

export default function ScenarioProvider({
  children,
}: {
  children: ReactNode;
}) {
  const { participantId } = useSession();

  const [mode, setModeState] = useState<AppMode>(null);
  const [currentScenarioIndex, setCurrentScenarioIndex] = useState(0);
  const [roundResults, setRoundResults] = useState<RoundResult[]>([]);
  const [isComplete, setIsComplete] = useState(false);

  // ── Hydrate from sessionStorage ──────────────────────────────────────
  useEffect(() => {
    try {
      const storedMode = sessionStorage.getItem(MODE_KEY) as AppMode;
      if (storedMode) setModeState(storedMode);

      const storedIndex = sessionStorage.getItem(INDEX_KEY);
      if (storedIndex) {
        const idx = parseInt(storedIndex, 10);
        if (idx >= TOTAL_SCENARIOS) {
          setIsComplete(true);
          setCurrentScenarioIndex(TOTAL_SCENARIOS - 1);
        } else {
          setCurrentScenarioIndex(idx);
        }
      }

      const storedResults = sessionStorage.getItem(RESULTS_KEY);
      if (storedResults) {
        const parsed: RoundResult[] = JSON.parse(storedResults);
        setRoundResults(parsed);

        // If we have all results, mark complete
        if (parsed.length >= TOTAL_SCENARIOS) {
          setIsComplete(true);
        }
      }
    } catch {
      console.warn("[ScenarioProvider] Failed to hydrate from sessionStorage");
    }
  }, []);

  // ── Mode setter with persistence ────────────────────────────────────
  const setMode = useCallback((newMode: AppMode) => {
    setModeState(newMode);
    if (newMode) {
      sessionStorage.setItem(MODE_KEY, newMode);
    } else {
      sessionStorage.removeItem(MODE_KEY);
    }
  }, []);

  // ── Current scenario ────────────────────────────────────────────────
  const currentScenario = useMemo(
    () =>
      mode === "experiment"
        ? EXPERIMENT_SCENARIOS[currentScenarioIndex] ?? null
        : null,
    [mode, currentScenarioIndex],
  );

  const isLastScenario = currentScenarioIndex === TOTAL_SCENARIOS - 1;

  const progressLabel = `${currentScenarioIndex + 1} of ${TOTAL_SCENARIOS}`;

  // ── Complete round ──────────────────────────────────────────────────
  const completeRound = useCallback(
    (userDecision: "approve" | "reject", responseTimeMs: number, cueData?: {
      wasOverReliantCued: boolean;
      originalDecision: "approve" | "reject" | null;
      changedAfterCue: boolean;
    }) => {
      if (!currentScenario) return;

      const aiCorrect =
        currentScenario.ai_prediction === currentScenario.ground_truth;
      const userCorrect = userDecision === currentScenario.ground_truth;
      const followedAi = userDecision === currentScenario.ai_prediction;

      const result: RoundResult = {
        scenario_id: currentScenario.scenario_id,
        ai_prediction: currentScenario.ai_prediction,
        user_decision: userDecision,
        ai_correct: aiCorrect,
        user_correct: userCorrect,
        followed_ai: followedAi,
        response_time_ms: responseTimeMs,
        round_index: currentScenarioIndex,
        timestamp: Date.now(),
        was_over_reliant_cued: cueData?.wasOverReliantCued ?? false,
        original_decision: cueData?.originalDecision ?? null,
        changed_after_cue: cueData?.changedAfterCue ?? false,
      };

      // Fire telemetry
      trackTrustEvent(participantId, "round_complete", {
        scenario_id: result.scenario_id,
        ai_prediction: result.ai_prediction,
        user_decision: result.user_decision,
        ai_correct: result.ai_correct,
        user_correct: result.user_correct,
        followed_ai: result.followed_ai,
        response_time_ms: result.response_time_ms,
      });

      // Update results
      const updatedResults = [...roundResults, result];
      setRoundResults(updatedResults);

      try {
        sessionStorage.setItem(RESULTS_KEY, JSON.stringify(updatedResults));
      } catch {
        console.warn("[ScenarioProvider] Failed to persist round results");
      }

      // Advance or complete
      if (isLastScenario) {
        setIsComplete(true);
        try {
          sessionStorage.setItem(INDEX_KEY, String(TOTAL_SCENARIOS));
        } catch {
          // noop
        }
      } else {
        const nextIndex = currentScenarioIndex + 1;
        setCurrentScenarioIndex(nextIndex);
        try {
          sessionStorage.setItem(INDEX_KEY, String(nextIndex));
        } catch {
          // noop
        }
      }
    },
    [
      currentScenario,
      currentScenarioIndex,
      isLastScenario,
      participantId,
      roundResults,
    ],
  );

  // ── Reset experiment ────────────────────────────────────────────────
  const resetExperiment = useCallback(() => {
    setCurrentScenarioIndex(0);
    setRoundResults([]);
    setIsComplete(false);
    setModeState(null);

    try {
      sessionStorage.removeItem(MODE_KEY);
      sessionStorage.removeItem(INDEX_KEY);
      sessionStorage.removeItem(RESULTS_KEY);
    } catch {
      // noop
    }
  }, []);

  // ── Context value ───────────────────────────────────────────────────
  const value = useMemo<ScenarioContextValue>(
    () => ({
      mode,
      setMode,
      currentScenario,
      currentScenarioIndex,
      totalScenarios: TOTAL_SCENARIOS,
      progressLabel,
      isLastScenario,
      isComplete,
      roundResults,
      completeRound,
      resetExperiment,
    }),
    [
      mode,
      setMode,
      currentScenario,
      currentScenarioIndex,
      progressLabel,
      isLastScenario,
      isComplete,
      roundResults,
      completeRound,
      resetExperiment,
    ],
  );

  return (
    <ScenarioContext.Provider value={value}>
      {children}
    </ScenarioContext.Provider>
  );
}
