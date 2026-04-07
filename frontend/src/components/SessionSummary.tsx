"use client";

import { useCallback, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
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
} from "lucide-react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  Area,
  AreaChart,
} from "recharts";
import { useScenario, type RoundResult } from "./ScenarioProvider";
import { useTrustEngine, type TrustState } from "./TrustEngineProvider";
import { EXPERIMENT_SCENARIOS } from "@/lib/scenarios";
import { useSession } from "./SessionProvider";
import { trackTrustEvent } from "@/lib/telemetry";

// ---------------------------------------------------------------------------
// Trust State → numeric for graphing
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
  const { roundResults, resetExperiment } = useScenario();
  const { trustHistory } = useTrustEngine();
  const { participantId } = useSession();
  const [reflection, setReflection] = useState("");
  const [reflectionSubmitted, setReflectionSubmitted] = useState(false);
  const [showTimeline, setShowTimeline] = useState(false);

  // ── Computed Metrics ─────────────────────────────────────────────────
  const metrics = useMemo(() => {
    const total = roundResults.length;
    if (total === 0)
      return {
        userAccuracy: 0,
        aiAccuracy: 0,
        followRate: 0,
        overRelianceScore: 0,
        underRelianceScore: 0,
        avgResponseTime: 0,
        total: 0,
      };

    const userCorrect = roundResults.filter((r) => r.user_correct).length;
    const aiCorrect = roundResults.filter((r) => r.ai_correct).length;
    const followedAi = roundResults.filter((r) => r.followed_ai).length;

    // Over-reliance: % followed AI when AI was WRONG
    const aiWrongRounds = roundResults.filter((r) => !r.ai_correct);
    const blindFollows = aiWrongRounds.filter((r) => r.followed_ai).length;
    const overRelianceScore =
      aiWrongRounds.length > 0
        ? (blindFollows / aiWrongRounds.length) * 100
        : 0;

    // Under-reliance: % overrode AI when AI was CORRECT
    const aiRightRounds = roundResults.filter((r) => r.ai_correct);
    const wrongOverrides = aiRightRounds.filter((r) => !r.followed_ai).length;
    const underRelianceScore =
      aiRightRounds.length > 0
        ? (wrongOverrides / aiRightRounds.length) * 100
        : 0;

    const avgResponseTime =
      roundResults.reduce((sum, r) => sum + r.response_time_ms, 0) / total;

    return {
      userAccuracy: Math.round((userCorrect / total) * 100),
      aiAccuracy: Math.round((aiCorrect / total) * 100),
      followRate: Math.round((followedAi / total) * 100),
      overRelianceScore: Math.round(overRelianceScore),
      underRelianceScore: Math.round(underRelianceScore),
      avgResponseTime: Math.round(avgResponseTime / 1000),
      total,
      userCorrect,
      aiCorrect,
    };
  }, [roundResults]);

  // ── Trust trend chart data ──────────────────────────────────────────
  const chartData = useMemo(() => {
    return trustHistory.map((entry, i) => ({
      scenario: `S${i + 1}`,
      trustLevel: TRUST_STATE_MAP[entry.trustState],
      trustState: entry.trustState,
      timeSpent: Math.round(entry.timeSpentMs / 1000),
    }));
  }, [trustHistory]);

  // ── Export data ─────────────────────────────────────────────────────
  const handleExport = useCallback(() => {
    const exportData = {
      participant_id: participantId,
      exported_at: new Date().toISOString(),
      metrics,
      round_results: roundResults,
      trust_history: trustHistory,
      scenarios: EXPERIMENT_SCENARIOS.map((s) => ({
        scenario_id: s.scenario_id,
        profile: s.profile,
        ai_prediction: s.ai_prediction,
        confidence: s.confidence,
        ground_truth: s.ground_truth,
      })),
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `trustlab-session-${participantId.slice(0, 8)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }, [participantId, metrics, roundResults, trustHistory]);

  // ── Submit reflection ──────────────────────────────────────────────
  const handleReflectionSubmit = useCallback(() => {
    if (!reflection.trim()) return;
    trackTrustEvent(participantId, "session_reflection", {
      reflection_text: reflection,
      metrics,
    });
    setReflectionSubmitted(true);
  }, [reflection, participantId, metrics]);

  // ── Custom tooltip for trust chart ─────────────────────────────────
  const CustomTooltip = ({
    active,
    payload,
    label,
  }: {
    active?: boolean;
    payload?: Array<{ payload: { trustState: TrustState; timeSpent: number } }>;
    label?: string;
  }) => {
    if (!active || !payload || !payload.length) return null;
    const data = payload[0].payload;
    return (
      <div className="rounded-lg border border-neutral-700 bg-neutral-900/95 backdrop-blur-sm px-4 py-3 shadow-xl">
        <p className="text-xs text-neutral-400 mb-1">{label}</p>
        <p
          className="text-sm font-semibold"
          style={{ color: TRUST_STATE_COLORS[data.trustState] }}
        >
          {data.trustState.replace("_", " ")}
        </p>
        <p className="text-xs text-neutral-500 mt-1">
          Time spent: {data.timeSpent}s
        </p>
      </div>
    );
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
      className="w-full max-w-4xl mx-auto space-y-8 pb-16"
    >
      {/* ── Header ─────────────────────────────────────────────────── */}
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
        <h2 className="text-3xl font-bold text-white tracking-tight">
          Session Summary
        </h2>
        <p className="text-neutral-500 text-sm max-w-md mx-auto">
          Your decision patterns across {metrics.total} scenarios have been
          analyzed. Ground truth is now revealed.
        </p>
      </div>

      {/* ── Key Metrics Grid ───────────────────────────────────────── */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <MetricCard
          icon={<CheckCircle size={18} />}
          label="Your Accuracy"
          value={`${metrics.userCorrect}/${metrics.total}`}
          subtext={`${metrics.userAccuracy}%`}
          color="emerald"
          delay={0.1}
        />
        <MetricCard
          icon={<BarChart3 size={18} />}
          label="AI Accuracy"
          value={`${metrics.aiCorrect}/${metrics.total}`}
          subtext={`${metrics.aiAccuracy}%`}
          color="blue"
          delay={0.15}
        />
        <MetricCard
          icon={<Users size={18} />}
          label="Followed AI"
          value={`${metrics.followRate}%`}
          subtext="of decisions"
          color="purple"
          delay={0.2}
        />
        <MetricCard
          icon={<ShieldAlert size={18} />}
          label="Over-reliance"
          value={`${metrics.overRelianceScore}%`}
          subtext="blind follows on wrong AI"
          color={metrics.overRelianceScore > 50 ? "red" : "amber"}
          delay={0.25}
        />
        <MetricCard
          icon={<ShieldCheck size={18} />}
          label="Under-reliance"
          value={`${metrics.underRelianceScore}%`}
          subtext="overrides on correct AI"
          color={metrics.underRelianceScore > 50 ? "red" : "amber"}
          delay={0.3}
        />
        <MetricCard
          icon={<Clock size={18} />}
          label="Avg Response"
          value={`${metrics.avgResponseTime}s`}
          subtext="per decision"
          color="cyan"
          delay={0.35}
        />
      </div>

      {/* ── Trust Trend Graph ──────────────────────────────────────── */}
      {chartData.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="rounded-2xl border border-neutral-800 bg-neutral-900/60 backdrop-blur-sm p-6 space-y-4"
        >
          <h3 className="text-sm font-semibold text-neutral-300 uppercase tracking-wider flex items-center gap-2">
            <BarChart3 size={14} className="text-blue-400" />
            Trust State Over Time
          </h3>

          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={chartData}
                margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
              >
                <defs>
                  <linearGradient
                    id="trustGradient"
                    x1="0"
                    y1="0"
                    x2="0"
                    y2="1"
                  >
                    <stop
                      offset="0%"
                      stopColor="hsl(217, 91%, 60%)"
                      stopOpacity={0.3}
                    />
                    <stop
                      offset="100%"
                      stopColor="hsl(217, 91%, 60%)"
                      stopOpacity={0.0}
                    />
                  </linearGradient>
                </defs>
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="rgba(255,255,255,0.06)"
                />
                <XAxis
                  dataKey="scenario"
                  stroke="#525252"
                  tick={{ fill: "#737373", fontSize: 12 }}
                />
                <YAxis
                  domain={[0, 3]}
                  ticks={[0, 1, 2, 3]}
                  tickFormatter={(v: number) =>
                    TRUST_STATE_LABELS[v]?.slice(0, 5) ?? ""
                  }
                  stroke="#525252"
                  tick={{ fill: "#737373", fontSize: 11 }}
                />
                <Tooltip content={<CustomTooltip />} />
                <ReferenceLine
                  y={2}
                  stroke="rgba(16, 185, 129, 0.3)"
                  strokeDasharray="6 3"
                  label={{
                    value: "Calibrated",
                    position: "right",
                    fill: "#6b7280",
                    fontSize: 10,
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="trustLevel"
                  stroke="hsl(217, 91%, 60%)"
                  strokeWidth={2.5}
                  fill="url(#trustGradient)"
                  dot={(props) => {
                    const { cx, cy, index, payload } = props as {
                      cx?: number;
                      cy?: number;
                      index?: number;
                      payload?: { trustState: TrustState };
                    };
                    if (cx == null || cy == null) return <></>;
                    return (
                      <circle
                        key={`dot-${index}`}
                        cx={cx}
                        cy={cy}
                        r={5}
                        fill={
                          payload
                            ? TRUST_STATE_COLORS[payload.trustState]
                            : "#6b7280"
                        }
                        stroke="rgba(0,0,0,0.5)"
                        strokeWidth={2}
                      />
                    );
                  }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </motion.div>
      )}

      {/* ── Decision Timeline ──────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="rounded-2xl border border-neutral-800 bg-neutral-900/60 backdrop-blur-sm overflow-hidden"
      >
        <button
          onClick={() => setShowTimeline(!showTimeline)}
          className="w-full flex items-center justify-between px-6 py-4 text-sm font-semibold text-neutral-300 uppercase tracking-wider hover:bg-neutral-800/30 transition-colors"
        >
          <span className="flex items-center gap-2">
            <BarChart3 size={14} className="text-blue-400" />
            Decision Timeline
          </span>
          {showTimeline ? (
            <ChevronUp size={16} />
          ) : (
            <ChevronDown size={16} />
          )}
        </button>

        <AnimatePresence>
          {showTimeline && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3, ease: "easeInOut" }}
              className="overflow-hidden"
            >
              <div className="px-6 pb-6 space-y-3">
                {roundResults.map((result, i) => {
                  const scenario = EXPERIMENT_SCENARIOS[i];
                  return (
                    <motion.div
                      key={result.scenario_id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.05 }}
                      className="flex items-start gap-4 rounded-xl border border-neutral-800 bg-neutral-800/30 px-5 py-4"
                    >
                      {/* Round number */}
                      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-neutral-700/50 flex items-center justify-center text-xs font-bold text-neutral-400">
                        {i + 1}
                      </div>

                      {/* Details */}
                      <div className="flex-1 min-w-0 space-y-1.5">
                        <div className="text-sm font-medium text-neutral-200 truncate">
                          {scenario?.title ?? result.scenario_id}
                        </div>
                        <div className="flex flex-wrap items-center gap-2.5 text-xs">
                          {/* Your decision */}
                          <span
                            className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 font-medium ${
                              result.user_correct
                                ? "bg-emerald-500/15 text-emerald-300 border border-emerald-500/30"
                                : "bg-red-500/15 text-red-300 border border-red-500/30"
                            }`}
                          >
                            {result.user_correct ? (
                              <CheckCircle size={11} />
                            ) : (
                              <XCircle size={11} />
                            )}
                            You: {result.user_decision}
                          </span>

                          {/* AI decision */}
                          <span
                            className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 font-medium ${
                              result.ai_correct
                                ? "bg-blue-500/15 text-blue-300 border border-blue-500/30"
                                : "bg-amber-500/15 text-amber-300 border border-amber-500/30"
                            }`}
                          >
                            AI: {result.ai_prediction}
                            {!result.ai_correct && (
                              <AlertTriangle size={11} />
                            )}
                          </span>

                          {/* Followed AI? */}
                          {result.followed_ai && (
                            <span className="text-neutral-500">
                              Followed AI
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Response time */}
                      <div className="flex-shrink-0 text-xs text-neutral-500 font-mono">
                        {(result.response_time_ms / 1000).toFixed(1)}s
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* ── Reflection Prompt ──────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
        className="rounded-2xl border border-neutral-800 bg-neutral-900/60 backdrop-blur-sm p-6 space-y-4"
      >
        <h3 className="text-sm font-semibold text-neutral-300 uppercase tracking-wider flex items-center gap-2">
          <MessageSquare size={14} className="text-purple-400" />
          Reflection
        </h3>
        {!reflectionSubmitted ? (
          <>
            <p className="text-sm text-neutral-500 leading-relaxed">
              What did you notice about your decision patterns? Were there
              moments where you trusted the AI too quickly or dismissed it too
              easily?
            </p>
            <textarea
              value={reflection}
              onChange={(e) => setReflection(e.target.value)}
              placeholder="Share your observations…"
              rows={4}
              className="w-full rounded-xl border border-neutral-700 bg-neutral-800/60 px-4 py-3 text-sm text-white placeholder-neutral-600 backdrop-blur-sm transition-colors duration-150 focus:border-purple-500/50 focus:outline-none focus:ring-2 focus:ring-purple-400/20 resize-none"
            />
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleReflectionSubmit}
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
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex items-center gap-3 text-sm text-emerald-300"
          >
            <CheckCircle size={18} />
            Thank you for your reflection. This has been recorded.
          </motion.div>
        )}
      </motion.div>

      {/* ── Actions ────────────────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.7 }}
        className="flex items-center justify-center gap-4"
      >
        <motion.button
          whileHover={{ scale: 1.03, y: -1 }}
          whileTap={{ scale: 0.97 }}
          onClick={resetExperiment}
          className="flex items-center gap-2 rounded-xl border border-blue-500/30 bg-blue-500/10 px-6 py-3.5 text-sm font-semibold text-blue-300 transition-all duration-200 hover:bg-blue-500/20 hover:border-blue-400/50"
        >
          <RotateCcw size={16} />
          New Experiment
        </motion.button>

        <motion.button
          whileHover={{ scale: 1.03, y: -1 }}
          whileTap={{ scale: 0.97 }}
          onClick={handleExport}
          className="flex items-center gap-2 rounded-xl border border-neutral-700 bg-neutral-800/60 px-6 py-3.5 text-sm font-semibold text-neutral-300 transition-all duration-200 hover:bg-neutral-700/60 hover:border-neutral-600"
        >
          <Download size={16} />
          Export Data
        </motion.button>
      </motion.div>
    </motion.div>
  );
}

// ---------------------------------------------------------------------------
// Metric Card
// ---------------------------------------------------------------------------

function MetricCard({
  icon,
  label,
  value,
  subtext,
  color,
  delay = 0,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  subtext: string;
  color: string;
  delay?: number;
}) {
  const colorMap: Record<string, string> = {
    emerald: "border-emerald-500/30 text-emerald-400",
    blue: "border-blue-500/30 text-blue-400",
    purple: "border-purple-500/30 text-purple-400",
    red: "border-red-500/30 text-red-400",
    amber: "border-amber-500/30 text-amber-400",
    cyan: "border-cyan-500/30 text-cyan-400",
  };

  const iconColorMap: Record<string, string> = {
    emerald: "text-emerald-400",
    blue: "text-blue-400",
    purple: "text-purple-400",
    red: "text-red-400",
    amber: "text-amber-400",
    cyan: "text-cyan-400",
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ delay, type: "spring", damping: 20 }}
      className={`rounded-2xl border bg-neutral-900/60 backdrop-blur-sm p-5 space-y-2 ${colorMap[color] ?? colorMap.blue}`}
    >
      <div
        className={`flex items-center gap-2 text-xs uppercase tracking-wider text-neutral-500`}
      >
        <span className={iconColorMap[color] ?? ""}>{icon}</span>
        {label}
      </div>
      <div className="text-2xl font-bold text-white">{value}</div>
      <div className="text-xs text-neutral-500">{subtext}</div>
    </motion.div>
  );
}
