"use client";

import { motion } from "framer-motion";
import { useScenario } from "./ScenarioProvider";

/**
 * Experiment progress bar — shows current scenario position
 * with animated fill and step dots.
 */
export default function ProgressBar() {
  const { currentScenarioIndex, totalScenarios, isComplete } = useScenario();

  const progress = isComplete
    ? 100
    : ((currentScenarioIndex) / totalScenarios) * 100;

  return (
    <div className="w-full max-w-2xl mx-auto space-y-3">
      {/* Label */}
      <div className="flex items-center justify-between text-xs">
        <span className="text-neutral-500 uppercase tracking-wider">
          Experiment Progress
        </span>
        <span className="font-mono text-neutral-400">
          {isComplete
            ? "Complete"
            : `Scenario ${currentScenarioIndex + 1} of ${totalScenarios}`}
        </span>
      </div>

      {/* Track */}
      <div className="relative h-1.5 rounded-full bg-neutral-800 overflow-hidden">
        <motion.div
          className="absolute inset-y-0 left-0 rounded-full"
          style={{
            background:
              "linear-gradient(90deg, hsl(217, 91%, 60%), hsl(199, 89%, 48%))",
          }}
          initial={{ width: "0%" }}
          animate={{ width: `${progress}%` }}
          transition={{ type: "spring", damping: 25, stiffness: 200 }}
        />
      </div>

      {/* Step dots */}
      <div className="flex items-center justify-between px-0.5">
        {Array.from({ length: totalScenarios }).map((_, i) => {
          const isCompleted = i < currentScenarioIndex || isComplete;
          const isCurrent = i === currentScenarioIndex && !isComplete;

          return (
            <motion.div
              key={i}
              className="relative flex items-center justify-center"
              initial={false}
              animate={{
                scale: isCurrent ? 1.4 : 1,
              }}
              transition={{ type: "spring", damping: 20, stiffness: 300 }}
            >
              <div
                className={`h-2 w-2 rounded-full transition-colors duration-300 ${
                  isCompleted
                    ? "bg-blue-400"
                    : isCurrent
                      ? "bg-blue-400"
                      : "bg-neutral-700"
                }`}
              />
              {isCurrent && (
                <motion.div
                  className="absolute h-2 w-2 rounded-full bg-blue-400"
                  animate={{
                    scale: [1, 2, 1],
                    opacity: [0.6, 0, 0.6],
                  }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    ease: "easeInOut",
                  }}
                />
              )}
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
