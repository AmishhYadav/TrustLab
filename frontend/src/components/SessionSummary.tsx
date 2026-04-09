"use client";

import { useCallback, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import {
  BarChart3,
  CheckCircle,
  XCircle,
  Users,
  AlertTriangle,
  ShieldCheck,
  ShieldAlert,
  Clock,
  Download,
  RotateCcw,
  ChevronDown,
  ChevronUp,
  MessageSquare,
  Eye,
  TrendingUp,
  Target,
  Zap,
} from "lucide-react";
import {
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  Area,
  AreaChart,
  BarChart,
  Bar,
  Cell,
} from "recharts";
import { useScenario, type RoundResult } from "./ScenarioProvider";
import { useTrustEngine, type TrustState } from "./TrustEngineProvider";
import { EXPERIMENT_SCENARIOS } from "@/lib/scenarios";
import { useSession } from "./SessionProvider";
import { trackTrustEvent } from "@/lib/telemetry";

// ---------------------------------------------------------------------------
// Trust State mappings
// ---------------------------------------------------------------------------

const TRUST_STATE_MAP: Record<TrustState, number> = {
  UNKNOWN: 0,
  UNDER_RELIANT: 1,
  CALIBRATED: 2,
  OVER_RELIANT: 3,
};

const TRUST_STATE_LABELS: Record<number, string> = {
  0: "Unknown",
  1: "Under-reliant",
  2: "Calibrated",
  3: "Over-reliant",
};

const TRUST_STATE_COLORS: Record<TrustState, string> = {
  UNKNOWN: "#6b7280",
  UNDER_RELIANT: "#f59e0b",
  CALIBRATED: "#10b981",
  OVER_RELIANT: "#ef4444",
};

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function SessionSummary() {
  const router = useRouter();
  const { roundResults, resetExperiment } = useScenario();
  const { trustHistory } = useTrustEngine();
  const { participantId } = useSession();
  const [reflection, setReflection] = useState("");
  const [reflectionSubmitted, setReflectionSubmitted] = useState(false);
  const [showTimeline, setShowTimeline] = useState(false);
  const [showOverReliantDetails, setShowOverReliantDetails] = useState(false);
  const [showUnderReliantDetails, setShowUnderReliantDetails] = useState(false);
  const [showCalibratedDetails, setShowCalibratedDetails] = useState(false);

  // == Computed Metrics ====================================================
  const metrics = useMemo(() => {
    const total = roundResults.length;
    if (total === 0)
      return {
        userAccuracy: 0, aiAccuracy: 0, followRate: 0,
        overRelianceScore: 0, underRelianceScore: 0, avgResponseTime: 0,
        total: 0, userCorrect: 0, aiCorrect: 0,
      };

    const userCorrect = roundResults.filter((r) => r.user_correct).length;
    const aiCorrect = roundResults.filter((r) => r.ai_correct).length;
    const followedAi = roundResults.filter((r) => r.followed_ai).length;

    const aiWrongRounds = roundResults.filter((r) => !r.ai_correct);
    const blindFollows = aiWrongRounds.filter((r) => r.followed_ai).length;
    const overRelianceScore = aiWrongRounds.length > 0
      ? (blindFollows / aiWrongRounds.length) * 100 : 0;

    const aiRightRounds = roundResults.filter((r) => r.ai_correct);
    const wrongOverrides = aiRightRounds.filter((r) => !r.followed_ai).length;
    const underRelianceScore = aiRightRounds.length > 0
      ? (wrongOverrides / aiRightRounds.length) * 100 : 0;

    const avgResponseTime =
      roundResults.reduce((sum, r) => sum + r.response_time_ms, 0) / total;

    return {
      userAccuracy: Math.round((userCorrect / total) * 100),
      aiAccuracy: Math.round((aiCorrect / total) * 100),
      followRate: Math.round((followedAi / total) * 100),
      overRelianceScore: Math.round(overRelianceScore),
      underRelianceScore: Math.round(underRelianceScore),
      avgResponseTime: Math.round(avgResponseTime / 1000),
      total, userCorrect, aiCorrect,
    };
  }, [roundResults]);

  // == Trust category breakdowns ===========================================
  const categoryBreakdowns = useMemo(() => {
    const overReliantRounds: { result: RoundResult; index: number }[] = [];
    const underReliantRounds: { result: RoundResult; index: number }[] = [];
    const calibratedRounds: { result: RoundResult; index: number }[] = [];

    trustHistory.forEach((entry, i) => {
      const result = roundResults[i];
      if (!result) return;
      const item = { result, index: i };
      if (entry.trustState === "OVER_RELIANT") overReliantRounds.push(item);
      else if (entry.trustState === "UNDER_RELIANT") underReliantRounds.push(item);
      else if (entry.trustState === "CALIBRATED") calibratedRounds.push(item);
    });

    const computeStats = (items: { result: RoundResult; index: number }[]) => {
      if (items.length === 0) return null;
      const correct = items.filter((i) => i.result.user_correct).length;
      const followedAi = items.filter((i) => i.result.followed_ai).length;
      const avgTime =
        items.reduce((sum, i) => sum + i.result.response_time_ms, 0) / items.length;
      return {
        count: items.length,
        accuracy: Math.round((correct / items.length) * 100),
        followRate: Math.round((followedAi / items.length) * 100),
        avgResponseTime: Math.round(avgTime / 1000),
        correct, items,
      };
    };

    return {
      overReliant: computeStats(overReliantRounds),
      underReliant: computeStats(underReliantRounds),
      calibrated: computeStats(calibratedRounds),
    };
  }, [trustHistory, roundResults]);

  // == Cue behavioral metrics ==============================================
  const cueMetrics = useMemo(() => {
    const cuedRounds = roundResults.filter((r) => r.was_over_reliant_cued);
    const totalCued = cuedRounds.length;
    if (totalCued === 0) return null;

    const changedDecision = cuedRounds.filter((r) => r.changed_after_cue).length;
    const keptDecision = totalCued - changedDecision;
    const changedAndCorrect = cuedRounds.filter(
      (r) => r.changed_after_cue && r.user_correct,
    ).length;
    const keptAndCorrect = cuedRounds.filter(
      (r) => !r.changed_after_cue && r.user_correct,
    ).length;

    return {
      totalCued, changedDecision, keptDecision,
      changedAndCorrect, keptAndCorrect,
      changeSuccessRate: changedDecision > 0
        ? Math.round((changedAndCorrect / changedDecision) * 100) : 0,
      keepSuccessRate: keptDecision > 0
        ? Math.round((keptAndCorrect / keptDecision) * 100) : 0,
    };
  }, [roundResults]);

  // == Cue state transition data =============================================
  // Tracks what trust state the user moved to on the NEXT round after a cue
  const cueTransitionData = useMemo(() => {
    let shiftedToCalibrated = 0;
    let shiftedToUnderReliant = 0;
    let stayedOverReliant = 0;
    let totalTrackable = 0;

    roundResults.forEach((result, i) => {
      if (!result.was_over_reliant_cued) return;
      // Check the next round's trust state
      const nextEntry = trustHistory[i + 1];
      if (!nextEntry) return; // last round, no next state
      totalTrackable++;
      if (nextEntry.trustState === "CALIBRATED") shiftedToCalibrated++;
      else if (nextEntry.trustState === "UNDER_RELIANT") shiftedToUnderReliant++;
      else if (nextEntry.trustState === "OVER_RELIANT") stayedOverReliant++;
    });

    if (totalTrackable === 0) return null;

    const shiftedTotal = shiftedToCalibrated + shiftedToUnderReliant;
    return {
      totalTrackable,
      shiftedToCalibrated,
      shiftedToUnderReliant,
      stayedOverReliant,
      shiftedTotal,
      shiftRate: Math.round((shiftedTotal / totalTrackable) * 100),
      chartData: [
        { name: "\u2192 Calibrated", count: shiftedToCalibrated, fill: "#10b981" },
        { name: "\u2192 Under-reliant", count: shiftedToUnderReliant, fill: "#f59e0b" },
        { name: "\u2192 Still Over-reliant", count: stayedOverReliant, fill: "#ef4444" },
      ].filter((d) => d.count > 0),
    };
  }, [roundResults, trustHistory]);

  // == Trust trend chart data ==============================================
  const chartData = useMemo(() => {
    return trustHistory.map((entry, i) => ({
      scenario: `S${i + 1}`,
      trustLevel: TRUST_STATE_MAP[entry.trustState],
      trustState: entry.trustState,
      timeSpent: Math.round(entry.timeSpentMs / 1000),
    }));
  }, [trustHistory]);

  // == Export data ==========================================================
  const handleExport = useCallback(() => {
    const exportData = {
      participant_id: participantId,
      exported_at: new Date().toISOString(),
      metrics, cue_metrics: cueMetrics,
      category_breakdowns: categoryBreakdowns,
      round_results: roundResults, trust_history: trustHistory,
      scenarios: EXPERIMENT_SCENARIOS.map((s) => ({
        scenario_id: s.scenario_id, profile: s.profile,
        ai_prediction: s.ai_prediction, ground_truth: s.ground_truth,
      })),
    };
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `trustlab-session-${participantId.slice(0, 8)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }, [participantId, metrics, cueMetrics, categoryBreakdowns, roundResults, trustHistory]);

  // == Submit reflection ====================================================
  const handleReflectionSubmit = useCallback(() => {
    if (!reflection.trim()) return;
    trackTrustEvent(participantId, "session_reflection", { reflection_text: reflection, metrics });
    setReflectionSubmitted(true);
  }, [reflection, participantId, metrics]);

  // == Tooltips =============================================================
  const CustomTooltip = ({ active, payload, label }: {
    active?: boolean;
    payload?: Array<{ payload: { trustState: TrustState; timeSpent: number } }>;
    label?: string;
  }) => {
    if (!active || !payload || !payload.length) return null;
    const data = payload[0].payload;
    return (
      <div className="rounded-lg border border-neutral-700 bg-neutral-900/95 backdrop-blur-sm px-4 py-3 shadow-xl">
        <p className="text-xs text-neutral-400 mb-1">{label}</p>
        <p className="text-sm font-semibold" style={{ color: TRUST_STATE_COLORS[data.trustState] }}>
          {data.trustState.replace("_", " ")}
        </p>
        <p className="text-xs text-neutral-500 mt-1">Time spent: {data.timeSpent}s</p>
      </div>
    );
  };

  const TransitionChartTooltip = ({ active, payload, label }: {
    active?: boolean;
    payload?: Array<{ value: number }>;
    label?: string;
  }) => {
    if (!active || !payload || !payload.length) return null;
    return (
      <div className="rounded-lg border border-neutral-700 bg-neutral-900/95 backdrop-blur-sm px-4 py-3 shadow-xl">
        <p className="text-xs text-neutral-400 mb-1">{label}</p>
        <p className="text-sm font-semibold text-white">{payload[0].value} round(s)</p>
      </div>
    );
  };

  // ========================================================================
  // RENDER
  // ========================================================================

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
      className="w-full max-w-4xl mx-auto space-y-8 pb-16"
    >
      {/* Header */}
      <div className="text-center space-y-3">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.2, type: "spring", damping: 15 }}
          className="inline-flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-5 py-2 text-sm text-emerald-300"
        >
          <BarChart3 size={16} />
          Experiment Complete
        </motion.div>
        <h2 className="text-3xl font-bold text-white tracking-tight">Session Summary</h2>
        <p className="text-neutral-500 text-sm max-w-md mx-auto">
          Your decision patterns across {metrics.total} scenarios have been analyzed. Ground truth is now revealed.
        </p>
      </div>

      {/* Key Metrics Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <MetricCard icon={<CheckCircle size={18} />} label="Your Accuracy" value={`${metrics.userCorrect}/${metrics.total}`} subtext={`${metrics.userAccuracy}%`} color="emerald" delay={0.1} />
        <MetricCard icon={<BarChart3 size={18} />} label="AI Accuracy" value={`${metrics.aiCorrect}/${metrics.total}`} subtext={`${metrics.aiAccuracy}%`} color="blue" delay={0.15} />
        <MetricCard icon={<Users size={18} />} label="Followed AI" value={`${metrics.followRate}%`} subtext="of decisions" color="purple" delay={0.2} />
        <MetricCard icon={<ShieldAlert size={18} />} label="Over-reliance" value={`${metrics.overRelianceScore}%`} subtext="blind follows on wrong AI" color={metrics.overRelianceScore > 50 ? "red" : "amber"} delay={0.25} />
        <MetricCard icon={<ShieldCheck size={18} />} label="Under-reliance" value={`${metrics.underRelianceScore}%`} subtext="overrides on correct AI" color={metrics.underRelianceScore > 50 ? "red" : "amber"} delay={0.3} />
        <MetricCard icon={<Clock size={18} />} label="Avg Response" value={`${metrics.avgResponseTime}s`} subtext="per decision" color="cyan" delay={0.35} />
      </div>

      {/* Cue State Transition */}
      {cueTransitionData && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.38 }}
          className="rounded-2xl border border-neutral-800 bg-neutral-900/60 backdrop-blur-sm p-6 space-y-5"
        >
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-neutral-300 uppercase tracking-wider flex items-center gap-2">
              <TrendingUp size={14} className="text-purple-400" />
              Cue State Transition
            </h3>
            <span className="text-xs text-neutral-500">
              What happened after {cueTransitionData.totalTrackable} cue(s)
            </span>
          </div>

          {/* Big headline stat */}
          <div className="flex items-center gap-6">
            <div className="flex-1 text-center">
              <div className={`text-5xl font-black ${
                cueTransitionData.shiftRate >= 50 ? "text-emerald-400" : cueTransitionData.shiftRate > 0 ? "text-amber-400" : "text-red-400"
              }`}>
                {cueTransitionData.shiftRate}%
              </div>
              <div className="text-xs text-neutral-500 mt-1 uppercase tracking-wider">Shift Rate</div>
              <div className="text-xs text-neutral-600 mt-0.5">
                {cueTransitionData.shiftedTotal} of {cueTransitionData.totalTrackable} cued rounds led to improved trust calibration
              </div>
            </div>
          </div>

          {/* Transition breakdown stats */}
          <div className="grid grid-cols-3 gap-3">
            <div className="rounded-xl border border-emerald-500/20 bg-emerald-950/10 p-4 text-center">
              <div className="text-2xl font-bold text-emerald-300">{cueTransitionData.shiftedToCalibrated}</div>
              <div className="text-xs text-neutral-500 mt-1">&rarr; Calibrated</div>
            </div>
            <div className="rounded-xl border border-amber-500/20 bg-amber-950/10 p-4 text-center">
              <div className="text-2xl font-bold text-amber-300">{cueTransitionData.shiftedToUnderReliant}</div>
              <div className="text-xs text-neutral-500 mt-1">&rarr; Under-reliant</div>
            </div>
            <div className="rounded-xl border border-red-500/20 bg-red-950/10 p-4 text-center">
              <div className="text-2xl font-bold text-red-300">{cueTransitionData.stayedOverReliant}</div>
              <div className="text-xs text-neutral-500 mt-1">&rarr; Still Over-reliant</div>
            </div>
          </div>

          {/* Transition bar chart */}
          {cueTransitionData.chartData.length > 0 && (
            <div className="h-44">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={cueTransitionData.chartData} margin={{ top: 10, right: 30, left: -10, bottom: 0 }} barCategoryGap="25%">
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                  <XAxis dataKey="name" stroke="#525252" tick={{ fill: "#a3a3a3", fontSize: 11 }} />
                  <YAxis allowDecimals={false} stroke="#525252" tick={{ fill: "#737373", fontSize: 11 }} />
                  <Tooltip content={<TransitionChartTooltip />} />
                  <Bar dataKey="count" radius={[8, 8, 0, 0]} maxBarSize={80}>
                    {cueTransitionData.chartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} fillOpacity={0.85} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* Interpretation */}
          <div className={`rounded-lg border px-4 py-3 text-sm leading-relaxed ${
            cueTransitionData.shiftRate >= 50
              ? "border-emerald-500/30 bg-emerald-950/20 text-emerald-300"
              : cueTransitionData.shiftRate > 0
                ? "border-amber-500/30 bg-amber-950/20 text-amber-300"
                : "border-red-500/30 bg-red-950/20 text-red-300"
          }`}>
            <TrendingUp size={14} className="inline mr-2" />
            {cueTransitionData.shiftRate >= 50 ? (
              <>The intervention cues were <strong>effective</strong> &mdash; {cueTransitionData.shiftRate}% of the time, you shifted from over-reliant to a healthier trust state on the next scenario.
              {cueTransitionData.shiftedToCalibrated > 0 && <> You reached <strong>calibrated</strong> trust {cueTransitionData.shiftedToCalibrated} time(s).</>}
              </>
            ) : cueTransitionData.shiftRate > 0 ? (
              <>The cues had a <strong>partial effect</strong> &mdash; you shifted to better trust calibration {cueTransitionData.shiftedTotal} out of {cueTransitionData.totalTrackable} time(s). The remaining {cueTransitionData.stayedOverReliant} time(s) you continued with over-reliant behavior.
              </>
            ) : (
              <>The cues did not shift your trust state &mdash; you remained over-reliant on all subsequent rounds. Consider spending more time with the counterfactual controls when prompted.
              </>
            )}
          </div>
        </motion.div>
      )}

      {/* Cue Behavioral Impact */}
      {cueMetrics && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.42 }}
          className="rounded-2xl border border-neutral-800 bg-neutral-900/60 backdrop-blur-sm p-6 space-y-5"
        >
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-neutral-300 uppercase tracking-wider flex items-center gap-2">
              <Eye size={14} className="text-amber-400" />
              Cue Behavioral Impact
            </h3>
            <span className="text-xs text-neutral-500">{cueMetrics.totalCued} interventions triggered</span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="rounded-xl border border-neutral-800 bg-neutral-800/30 p-4 text-center">
              <div className="text-2xl font-bold text-white">{cueMetrics.totalCued}</div>
              <div className="text-xs text-neutral-500 mt-1">Cues Shown</div>
            </div>
            <div className="rounded-xl border border-neutral-800 bg-neutral-800/30 p-4 text-center">
              <div className="text-2xl font-bold text-amber-300">{cueMetrics.changedDecision}</div>
              <div className="text-xs text-neutral-500 mt-1">Changed Mind</div>
            </div>
            <div className="rounded-xl border border-neutral-800 bg-neutral-800/30 p-4 text-center">
              <div className="text-2xl font-bold text-neutral-300">{cueMetrics.keptDecision}</div>
              <div className="text-xs text-neutral-500 mt-1">Kept Decision</div>
            </div>
            <div className="rounded-xl border border-neutral-800 bg-neutral-800/30 p-4 text-center">
              <div className={`text-2xl font-bold ${
                cueMetrics.changedDecision > 0 && cueMetrics.changeSuccessRate > 50
                  ? "text-emerald-300" : cueMetrics.changedDecision > 0 ? "text-red-300" : "text-neutral-500"
              }`}>
                {cueMetrics.changedDecision > 0 ? `${cueMetrics.changeSuccessRate}%` : "\u2014"}
              </div>
              <div className="text-xs text-neutral-500 mt-1">Change Accuracy</div>
            </div>
          </div>

          {cueMetrics.changedDecision > 0 && (
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-lg border border-amber-500/20 bg-amber-950/10 px-4 py-3">
                <div className="text-xs text-amber-400/70 uppercase tracking-wider mb-1">When You Changed</div>
                <div className="text-sm text-neutral-300">
                  <span className="font-semibold text-white">{cueMetrics.changedAndCorrect}/{cueMetrics.changedDecision}</span>{" "}
                  correct ({cueMetrics.changeSuccessRate}%)
                </div>
              </div>
              <div className="rounded-lg border border-neutral-700 bg-neutral-800/20 px-4 py-3">
                <div className="text-xs text-neutral-500 uppercase tracking-wider mb-1">When You Kept</div>
                <div className="text-sm text-neutral-300">
                  <span className="font-semibold text-white">{cueMetrics.keptAndCorrect}/{cueMetrics.keptDecision}</span>{" "}
                  correct ({cueMetrics.keepSuccessRate}%)
                </div>
              </div>
            </div>
          )}

          <div className="rounded-lg border border-neutral-700 bg-neutral-800/30 px-4 py-3 text-sm leading-relaxed text-neutral-400">
            <Eye size={14} className="inline mr-2 text-amber-400" />
            {cueMetrics.changedDecision === 0 ? (
              <>You saw {cueMetrics.totalCued} intervention cue(s) but kept your original decision each time. The cues still served their purpose &mdash; they slowed you down and prompted deliberation, even if your conclusion didn&apos;t change.</>
            ) : cueMetrics.changeSuccessRate > cueMetrics.keepSuccessRate ? (
              <>When you listened to the cue and changed your mind, you were correct <strong>{cueMetrics.changeSuccessRate}%</strong> of the time vs <strong>{cueMetrics.keepSuccessRate}%</strong> when you kept your decision. The cues helped you catch AI mistakes.</>
            ) : (
              <>Changing your decision after a cue led to correct outcomes <strong>{cueMetrics.changeSuccessRate}%</strong> of the time. The cues prompted reconsideration, though the original instinct was sometimes right.</>
            )}
          </div>
        </motion.div>
      )}

      {/* Trust Trend Graph */}
      {chartData.length > 0 && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
          className="rounded-2xl border border-neutral-800 bg-neutral-900/60 backdrop-blur-sm p-6 space-y-4"
        >
          <h3 className="text-sm font-semibold text-neutral-300 uppercase tracking-wider flex items-center gap-2">
            <BarChart3 size={14} className="text-blue-400" />
            Trust State Over Time
          </h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="trustGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="hsl(217, 91%, 60%)" stopOpacity={0.3} />
                    <stop offset="100%" stopColor="hsl(217, 91%, 60%)" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                <XAxis dataKey="scenario" stroke="#525252" tick={{ fill: "#737373", fontSize: 12 }} />
                <YAxis domain={[0, 3]} ticks={[0, 1, 2, 3]}
                  tickFormatter={(v: number) => TRUST_STATE_LABELS[v]?.slice(0, 5) ?? ""}
                  stroke="#525252" tick={{ fill: "#737373", fontSize: 11 }}
                />
                <Tooltip content={<CustomTooltip />} />
                <ReferenceLine y={2} stroke="rgba(16, 185, 129, 0.3)" strokeDasharray="6 3"
                  label={{ value: "Calibrated", position: "right", fill: "#6b7280", fontSize: 10 }}
                />
                <Area type="monotone" dataKey="trustLevel" stroke="hsl(217, 91%, 60%)" strokeWidth={2.5} fill="url(#trustGradient)"
                  dot={(props) => {
                    const { cx, cy, index, payload } = props as {
                      cx?: number; cy?: number; index?: number;
                      payload?: { trustState: TrustState };
                    };
                    if (cx == null || cy == null) return <></>;
                    return (
                      <circle key={`dot-${index}`} cx={cx} cy={cy} r={5}
                        fill={payload ? TRUST_STATE_COLORS[payload.trustState] : "#6b7280"}
                        stroke="rgba(0,0,0,0.5)" strokeWidth={2}
                      />
                    );
                  }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </motion.div>
      )}

      {/* Detailed Trust Category Breakdowns */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.45 }} className="space-y-4">
        <h3 className="text-sm font-semibold text-neutral-300 uppercase tracking-wider flex items-center gap-2 px-1">
          <Target size={14} className="text-purple-400" />
          Trust Category Breakdown
        </h3>
        <CategorySection title="Over-reliant Rounds" icon={<ShieldAlert size={16} />} stats={categoryBreakdowns.overReliant}
          borderColor="border-red-500/30" bgColor="bg-red-950/10" accentColor="text-red-400"
          tagColor="bg-red-500/15 text-red-300 border-red-500/30" isOpen={showOverReliantDetails}
          toggle={() => setShowOverReliantDetails(!showOverReliantDetails)}
          description="Rounds where you decided too quickly without engaging with the AI's reasoning or counterfactual controls."
        />
        <CategorySection title="Under-reliant Rounds" icon={<ShieldCheck size={16} />} stats={categoryBreakdowns.underReliant}
          borderColor="border-amber-500/30" bgColor="bg-amber-950/10" accentColor="text-amber-400"
          tagColor="bg-amber-500/15 text-amber-300 border-amber-500/30" isOpen={showUnderReliantDetails}
          toggle={() => setShowUnderReliantDetails(!showUnderReliantDetails)}
          description="Rounds where you spent excessive time and over-analyzed, potentially second-guessing the AI's correct recommendations."
        />
        <CategorySection title="Calibrated Rounds" icon={<Zap size={16} />} stats={categoryBreakdowns.calibrated}
          borderColor="border-emerald-500/30" bgColor="bg-emerald-950/10" accentColor="text-emerald-400"
          tagColor="bg-emerald-500/15 text-emerald-300 border-emerald-500/30" isOpen={showCalibratedDetails}
          toggle={() => setShowCalibratedDetails(!showCalibratedDetails)}
          description="Rounds where you appropriately balanced engagement with the AI's prediction \u2014 the ideal trust calibration state."
        />
      </motion.div>

      {/* Decision Timeline */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}
        className="rounded-2xl border border-neutral-800 bg-neutral-900/60 backdrop-blur-sm overflow-hidden"
      >
        <button onClick={() => setShowTimeline(!showTimeline)}
          className="w-full flex items-center justify-between px-6 py-4 text-sm font-semibold text-neutral-300 uppercase tracking-wider hover:bg-neutral-800/30 transition-colors"
        >
          <span className="flex items-center gap-2">
            <BarChart3 size={14} className="text-blue-400" />
            Decision Timeline
          </span>
          {showTimeline ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </button>
        <AnimatePresence>
          {showTimeline && (
            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.3, ease: "easeInOut" }} className="overflow-hidden"
            >
              <div className="px-6 pb-6 space-y-3">
                {roundResults.map((result, i) => {
                  const scenario = EXPERIMENT_SCENARIOS[i];
                  return (
                    <motion.div key={result.scenario_id} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.05 }}
                      className="flex items-start gap-4 rounded-xl border border-neutral-800 bg-neutral-800/30 px-5 py-4"
                    >
                      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-neutral-700/50 flex items-center justify-center text-xs font-bold text-neutral-400">{i + 1}</div>
                      <div className="flex-1 min-w-0 space-y-1.5">
                        <div className="text-sm font-medium text-neutral-200 truncate">{scenario?.title ?? result.scenario_id}</div>
                        <div className="flex flex-wrap items-center gap-2.5 text-xs">
                          <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 font-medium ${
                            result.user_correct
                              ? "bg-emerald-500/15 text-emerald-300 border border-emerald-500/30"
                              : "bg-red-500/15 text-red-300 border border-red-500/30"
                          }`}>
                            {result.user_correct ? <CheckCircle size={11} /> : <XCircle size={11} />}
                            You: {result.user_decision}
                          </span>
                          <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 font-medium ${
                            result.ai_correct
                              ? "bg-blue-500/15 text-blue-300 border border-blue-500/30"
                              : "bg-amber-500/15 text-amber-300 border border-amber-500/30"
                          }`}>
                            AI: {result.ai_prediction}
                            {!result.ai_correct && <AlertTriangle size={11} />}
                          </span>
                          {result.followed_ai && <span className="text-neutral-500">Followed AI</span>}
                          {result.was_over_reliant_cued && (
                            <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 font-medium ${
                              result.changed_after_cue
                                ? "bg-amber-500/15 text-amber-300 border border-amber-500/30"
                                : "bg-neutral-500/15 text-neutral-400 border border-neutral-500/30"
                            }`}>
                              <Eye size={11} />
                              {result.changed_after_cue ? `Changed (was: ${result.original_decision})` : "Cue shown, kept decision"}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="flex-shrink-0 text-xs text-neutral-500 font-mono">{(result.response_time_ms / 1000).toFixed(1)}s</div>
                    </motion.div>
                  );
                })}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* Reflection Prompt */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }}
        className="rounded-2xl border border-neutral-800 bg-neutral-900/60 backdrop-blur-sm p-6 space-y-4"
      >
        <h3 className="text-sm font-semibold text-neutral-300 uppercase tracking-wider flex items-center gap-2">
          <MessageSquare size={14} className="text-purple-400" />
          Reflection
        </h3>
        {!reflectionSubmitted ? (
          <>
            <p className="text-sm text-neutral-500 leading-relaxed">
              What did you notice about your decision patterns? Were there moments where you trusted the AI too quickly or dismissed it too easily?
            </p>
            <textarea value={reflection} onChange={(e) => setReflection(e.target.value)}
              placeholder="Share your observations\u2026" rows={4}
              className="w-full rounded-xl border border-neutral-700 bg-neutral-800/60 px-4 py-3 text-sm text-white placeholder-neutral-600 backdrop-blur-sm transition-colors duration-150 focus:border-purple-500/50 focus:outline-none focus:ring-2 focus:ring-purple-400/20 resize-none"
            />
            <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={handleReflectionSubmit}
              disabled={!reflection.trim()}
              className={`rounded-xl border px-6 py-3 text-sm font-semibold transition-all duration-200 ${
                reflection.trim()
                  ? "border-purple-500/40 bg-purple-500/15 text-purple-300 hover:bg-purple-500/25"
                  : "border-neutral-700 bg-neutral-800/40 text-neutral-600 cursor-not-allowed"
              }`}
            >
              Submit Reflection
            </motion.button>
          </>
        ) : (
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
            className="flex items-center gap-3 text-sm text-emerald-300"
          >
            <CheckCircle size={18} />
            Thank you for your reflection. This has been recorded.
          </motion.div>
        )}
      </motion.div>

      {/* Actions */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.7 }}
        className="flex items-center justify-center gap-4"
      >
        <motion.button whileHover={{ scale: 1.03, y: -1 }} whileTap={{ scale: 0.97 }}
          onClick={() => { resetExperiment(); router.push("/landing"); }}
          className="flex items-center gap-2 rounded-xl border border-blue-500/30 bg-blue-500/10 px-6 py-3.5 text-sm font-semibold text-blue-300 transition-all duration-200 hover:bg-blue-500/20 hover:border-blue-400/50"
        >
          <RotateCcw size={16} /> New Experiment
        </motion.button>
        <motion.button whileHover={{ scale: 1.03, y: -1 }} whileTap={{ scale: 0.97 }} onClick={handleExport}
          className="flex items-center gap-2 rounded-xl border border-neutral-700 bg-neutral-800/60 px-6 py-3.5 text-sm font-semibold text-neutral-300 transition-all duration-200 hover:bg-neutral-700/60 hover:border-neutral-600"
        >
          <Download size={16} /> Export Data
        </motion.button>
      </motion.div>
    </motion.div>
  );
}

// ---------------------------------------------------------------------------
// Category Section
// ---------------------------------------------------------------------------

function CategorySection({ title, icon, stats, borderColor, bgColor, accentColor, tagColor, isOpen, toggle, description }: {
  title: string; icon: React.ReactNode;
  stats: { count: number; accuracy: number; followRate: number; avgResponseTime: number; correct: number; items: { result: RoundResult; index: number }[] } | null;
  borderColor: string; bgColor: string; accentColor: string; tagColor: string;
  isOpen: boolean; toggle: () => void; description: string;
}) {
  if (!stats || stats.count === 0) {
    return (
      <div className={`rounded-2xl border ${borderColor} ${bgColor} backdrop-blur-sm p-5 flex items-center gap-3`}>
        <span className={accentColor}>{icon}</span>
        <span className="text-sm text-neutral-400">{title}: <span className="text-neutral-500">0 rounds &mdash; not detected</span></span>
      </div>
    );
  }

  return (
    <div className={`rounded-2xl border ${borderColor} ${bgColor} backdrop-blur-sm overflow-hidden`}>
      <button onClick={toggle} className="w-full flex items-center justify-between px-5 py-4 hover:bg-neutral-800/20 transition-colors">
        <div className="flex items-center gap-3">
          <span className={accentColor}>{icon}</span>
          <div className="text-left">
            <div className="text-sm font-semibold text-neutral-200 flex items-center gap-2">
              {title}
              <span className={`rounded-full border px-2 py-0.5 text-[10px] font-medium ${tagColor}`}>{stats.count} rounds</span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="hidden sm:flex items-center gap-3 text-xs text-neutral-500">
            <span>Accuracy: <span className="text-white font-medium">{stats.accuracy}%</span></span>
            <span>Followed AI: <span className="text-white font-medium">{stats.followRate}%</span></span>
            <span>Avg: <span className="text-white font-medium">{stats.avgResponseTime}s</span></span>
          </div>
          {isOpen ? <ChevronUp size={16} className="text-neutral-500" /> : <ChevronDown size={16} className="text-neutral-500" />}
        </div>
      </button>
      <AnimatePresence>
        {isOpen && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.3, ease: "easeInOut" }} className="overflow-hidden"
          >
            <div className="px-5 pb-5 space-y-4">
              <p className="text-xs text-neutral-500 leading-relaxed">{description}</p>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <MiniStat label="Rounds" value={stats.count.toString()} />
                <MiniStat label="Accuracy" value={`${stats.correct}/${stats.count}`} subtext={`${stats.accuracy}%`} />
                <MiniStat label="AI Follow Rate" value={`${stats.followRate}%`} />
                <MiniStat label="Avg Time" value={`${stats.avgResponseTime}s`} />
              </div>
              <div className="space-y-2">
                {stats.items.map(({ result, index }) => {
                  const scenario = EXPERIMENT_SCENARIOS[index];
                  return (
                    <div key={result.scenario_id} className="flex items-center gap-3 rounded-lg border border-neutral-800 bg-neutral-800/20 px-4 py-3">
                      <div className="flex-shrink-0 w-6 h-6 rounded-full bg-neutral-700/50 flex items-center justify-center text-[10px] font-bold text-neutral-400">{index + 1}</div>
                      <div className="flex-1 min-w-0">
                        <div className="text-xs font-medium text-neutral-300 truncate">{scenario?.title ?? result.scenario_id}</div>
                        <div className="flex items-center gap-2 text-[10px] mt-0.5">
                          <span className={result.user_correct ? "text-emerald-400" : "text-red-400"}>
                            {result.user_correct ? "\u2713 Correct" : "\u2717 Wrong"}
                          </span>
                          <span className="text-neutral-600">&bull;</span>
                          <span className="text-neutral-500">You: {result.user_decision} | AI: {result.ai_prediction}</span>
                          {result.was_over_reliant_cued && (
                            <>
                              <span className="text-neutral-600">&bull;</span>
                              <span className="text-amber-400">{result.changed_after_cue ? "Cue \u2192 Changed" : "Cue \u2192 Kept"}</span>
                            </>
                          )}
                        </div>
                      </div>
                      <div className="text-[10px] text-neutral-500 font-mono">{(result.response_time_ms / 1000).toFixed(1)}s</div>
                    </div>
                  );
                })}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Mini Stat
// ---------------------------------------------------------------------------

function MiniStat({ label, value, subtext }: { label: string; value: string; subtext?: string }) {
  return (
    <div className="rounded-lg border border-neutral-800 bg-neutral-800/30 p-3 text-center">
      <div className="text-lg font-bold text-white">{value}</div>
      {subtext && <div className="text-xs text-neutral-400 font-mono">{subtext}</div>}
      <div className="text-[10px] text-neutral-600 mt-0.5">{label}</div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Metric Card
// ---------------------------------------------------------------------------

function MetricCard({ icon, label, value, subtext, color, delay = 0 }: {
  icon: React.ReactNode; label: string; value: string; subtext: string; color: string; delay?: number;
}) {
  const colorMap: Record<string, string> = {
    emerald: "border-emerald-500/30 text-emerald-400", blue: "border-blue-500/30 text-blue-400",
    purple: "border-purple-500/30 text-purple-400", red: "border-red-500/30 text-red-400",
    amber: "border-amber-500/30 text-amber-400", cyan: "border-cyan-500/30 text-cyan-400",
  };
  const iconColorMap: Record<string, string> = {
    emerald: "text-emerald-400", blue: "text-blue-400", purple: "text-purple-400",
    red: "text-red-400", amber: "text-amber-400", cyan: "text-cyan-400",
  };

  return (
    <motion.div initial={{ opacity: 0, y: 20, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ delay, type: "spring", damping: 20 }}
      className={`rounded-2xl border bg-neutral-900/60 backdrop-blur-sm p-5 space-y-2 ${colorMap[color] ?? colorMap.blue}`}
    >
      <div className="flex items-center gap-2 text-xs uppercase tracking-wider text-neutral-500">
        <span className={iconColorMap[color] ?? ""}>{icon}</span>
        {label}
      </div>
      <div className="text-2xl font-bold text-white">{value}</div>
      <div className="text-xs text-neutral-500">{subtext}</div>
    </motion.div>
  );
}
