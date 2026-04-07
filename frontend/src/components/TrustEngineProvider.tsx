"use client";

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { motion, AnimatePresence } from "framer-motion";
import { trackTrustEvent } from "@/lib/telemetry";
import { useSession } from "./SessionProvider";

// ---------------------------------------------------------------------------
// Trust State Types
// ---------------------------------------------------------------------------

export type TrustState =
  | "UNKNOWN"
  | "CALIBRATED"
  | "OVER_RELIANT"
  | "UNDER_RELIANT";

interface TrustRound {
  roundIndex: number;
  trustState: TrustState;
  timeSpentMs: number;
  interactionCount: number;
  timestamp: number;
}

interface TrustEngineContextValue {
  /** Current trust calibration state for this round. */
  trustState: TrustState;
  /** Number of slider/counterfactual interactions this round. */
  interactionCount: number;
  /** Full history of trust states across rounds. */
  trustHistory: TrustRound[];
  /** Whether the explicit rating modal is currently shown. */
  showRatingModal: boolean;
  /** Record a user interaction (slider adjustment, etc). */
  recordInteraction: () => void;
  /** Submit the user's decision for this round — triggers trust calculation. */
  submitDecision: () => void;
  /** Dismiss the explicit rating modal after user rates. */
  submitExplicitRating: (rating: number) => void;
}

// ---------------------------------------------------------------------------
// Context
// ---------------------------------------------------------------------------

const TrustEngineContext = createContext<TrustEngineContextValue | null>(null);

/**
 * Hook to access the Trust Engine.
 * Must be called inside <TrustEngineProvider>.
 */
export function useTrustEngine(): TrustEngineContextValue {
  const ctx = useContext(TrustEngineContext);
  if (!ctx) {
    throw new Error(
      "useTrustEngine must be used within a <TrustEngineProvider>"
    );
  }
  return ctx;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const STORAGE_KEY = "trustlab_trust_history";

/** Thresholds from RESEARCH.md */
const OVER_RELIANT_TIME_MS = 3000;
const UNDER_RELIANT_TIME_MS = 15000;
const UNDER_RELIANT_MIN_INTERACTIONS = 5;

// ---------------------------------------------------------------------------
// Provider
// ---------------------------------------------------------------------------

export default function TrustEngineProvider({
  children,
}: {
  children: ReactNode;
}) {
  const { participantId } = useSession();

  // Round timing
  const roundStartRef = useRef<number>(Date.now());
  const [interactionCount, setInteractionCount] = useState(0);
  const [trustState, setTrustState] = useState<TrustState>("UNKNOWN");
  const [trustHistory, setTrustHistory] = useState<TrustRound[]>([]);
  const [showRatingModal, setShowRatingModal] = useState(false);
  const roundIndexRef = useRef(0);

  // Hydrate trust history from sessionStorage on mount
  useEffect(() => {
    try {
      const stored = sessionStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed: TrustRound[] = JSON.parse(stored);
        setTrustHistory(parsed);
        roundIndexRef.current = parsed.length;

        // Restore trust state from last round
        if (parsed.length > 0) {
          setTrustState(parsed[parsed.length - 1].trustState);
        }
      }
    } catch {
      // Corrupted storage — start fresh
      console.warn("[TrustEngine] Failed to parse stored trust history");
    }
  }, []);

  // Reset round timer whenever a new "round" starts (after decision submission)
  const resetRound = useCallback(() => {
    roundStartRef.current = Date.now();
    setInteractionCount(0);
  }, []);

  // ------------------------------------------------------------------
  // recordInteraction — called on every slider/counterfactual tweak
  // ------------------------------------------------------------------
  const recordInteraction = useCallback(() => {
    setInteractionCount((prev) => prev + 1);
  }, []);

  // ------------------------------------------------------------------
  // submitDecision — calculates implicit trust state for the round
  // ------------------------------------------------------------------
  const submitDecision = useCallback(() => {
    const timeSpent = Date.now() - roundStartRef.current;
    const currentInteractions = interactionCount;

    // Calculate trust state using the research-derived heuristics
    let newState: TrustState;
    if (
      timeSpent < OVER_RELIANT_TIME_MS &&
      currentInteractions === 0
    ) {
      newState = "OVER_RELIANT";
    } else if (
      timeSpent > UNDER_RELIANT_TIME_MS &&
      currentInteractions > UNDER_RELIANT_MIN_INTERACTIONS
    ) {
      newState = "UNDER_RELIANT";
    } else {
      newState = "CALIBRATED";
    }

    const round: TrustRound = {
      roundIndex: roundIndexRef.current,
      trustState: newState,
      timeSpentMs: timeSpent,
      interactionCount: currentInteractions,
      timestamp: Date.now(),
    };

    // Check for major shift → trigger explicit rating modal
    const previousState = trustState;
    const isMajorShift =
      previousState !== "UNKNOWN" && previousState !== newState;

    // Update state
    setTrustState(newState);
    const updatedHistory = [...trustHistory, round];
    setTrustHistory(updatedHistory);
    roundIndexRef.current += 1;

    // Persist to sessionStorage
    try {
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(updatedHistory));
    } catch {
      console.warn("[TrustEngine] Failed to persist trust history");
    }

    // Fire telemetry
    trackTrustEvent(participantId, "trust_state_calculated", {
      round_index: round.roundIndex,
      trust_state: newState,
      previous_state: previousState,
      time_spent_ms: timeSpent,
      interaction_count: currentInteractions,
      major_shift: isMajorShift,
    });

    // Trigger explicit rating modal on major shifts
    if (isMajorShift) {
      setShowRatingModal(true);
    }

    // Reset for next round
    resetRound();
  }, [interactionCount, trustState, trustHistory, participantId, resetRound]);

  // ------------------------------------------------------------------
  // submitExplicitRating — user responds to the 1-5 trust rating modal
  // ------------------------------------------------------------------
  const submitExplicitRating = useCallback(
    (rating: number) => {
      trackTrustEvent(participantId, "explicit_rating", {
        rating,
        current_trust_state: trustState,
        round_index: roundIndexRef.current - 1,
      });
      setShowRatingModal(false);
    },
    [participantId, trustState]
  );

  // ------------------------------------------------------------------
  // Context value
  // ------------------------------------------------------------------
  const value = useMemo<TrustEngineContextValue>(
    () => ({
      trustState,
      interactionCount,
      trustHistory,
      showRatingModal,
      recordInteraction,
      submitDecision,
      submitExplicitRating,
    }),
    [
      trustState,
      interactionCount,
      trustHistory,
      showRatingModal,
      recordInteraction,
      submitDecision,
      submitExplicitRating,
    ]
  );

  return (
    <TrustEngineContext.Provider value={value}>
      {children}

      {/* Explicit trust rating modal — fixed overlay */}
      <AnimatePresence>
        {showRatingModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="fixed inset-0 z-50 flex items-center justify-center"
            style={{ backgroundColor: "rgba(0, 0, 0, 0.6)", backdropFilter: "blur(4px)" }}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="rounded-2xl border border-neutral-700 bg-neutral-900/95 backdrop-blur-xl p-8 max-w-md w-full mx-4 shadow-2xl"
            >
              <div className="text-center space-y-6">
                {/* Pulse indicator */}
                <motion.div
                  className="mx-auto h-3 w-3 rounded-full bg-amber-400"
                  animate={{ scale: [1, 1.4, 1], opacity: [0.7, 1, 0.7] }}
                  transition={{ duration: 1.5, repeat: Infinity }}
                />

                <div className="space-y-2">
                  <h3 className="text-lg font-semibold text-white">
                    Quick check
                  </h3>
                  <p className="text-sm text-neutral-400 leading-relaxed">
                    How much do you trust the system&apos;s prediction right now?
                  </p>
                </div>

                {/* 1-5 scale buttons */}
                <div className="flex items-center justify-center gap-3">
                  {[1, 2, 3, 4, 5].map((rating) => (
                    <motion.button
                      key={rating}
                      whileHover={{ scale: 1.15, y: -2 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => submitExplicitRating(rating)}
                      className="w-12 h-12 rounded-xl border border-neutral-700 bg-neutral-800/80 text-white font-semibold text-lg transition-colors duration-150 hover:border-blue-400 hover:bg-blue-400/10 hover:text-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-400/40"
                    >
                      {rating}
                    </motion.button>
                  ))}
                </div>

                {/* Scale labels */}
                <div className="flex justify-between text-xs text-neutral-600 px-2">
                  <span>Not at all</span>
                  <span>Completely</span>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </TrustEngineContext.Provider>
  );
}
