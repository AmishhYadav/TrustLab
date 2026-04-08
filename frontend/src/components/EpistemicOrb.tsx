"use client";

import { motion, AnimatePresence } from "framer-motion";
import { AlertTriangle } from "lucide-react";

interface EpistemicOrbProps {
  /** AI confidence score 0-1. */
  confidence: number;
  /** Whether the model flags high ambiguity. */
  ambiguity: boolean;
  /** Optional reasoning chain from the epistemic state. */
  reasoning?: string[];
}

/**
 * The Epistemic Orb — an abstract ambient indicator of the AI's certainty.
 *
 * High confidence  → large, bright, solid glow.
 * Low confidence   → dim, small, flickering.
 * Ambiguity=true   → blur distortion + rapid jitter + warning badge.
 */
export default function EpistemicOrb({
  confidence,
  ambiguity,
  reasoning,
}: EpistemicOrbProps) {
  // Map confidence (0-1) to visual properties
  const size = 140 + confidence * 80; // 140px → 220px
  const glowIntensity = confidence * 0.9;
  const pulseScale = 1 + (1 - confidence) * 0.08; // low confidence → bigger pulse
  const pulseDuration = 1.5 + (1 - confidence) * 2; // low confidence → slower, more dramatic

  // Color shifts: high confidence → blue-cyan, low → amber
  const hue = 200 + confidence * 20; // 200–220 (blue range)
  const saturation = 60 + confidence * 30;
  const lightness = 45 + confidence * 15;
  const coreColor = `hsl(${hue}, ${saturation}%, ${lightness}%)`;

  // Warning state: amber for ambiguity
  const ambiguityColor = "#f59e0b"; // Valid hex so we can concatenate alpha like + '50' or +'10'
  
  const getColor = (alphaHex?: string) => {
    if (ambiguity) {
      return alphaHex ? `${ambiguityColor}${alphaHex}` : ambiguityColor;
    }
    if (!alphaHex) return coreColor;
    const alphaDec = parseInt(alphaHex, 16) / 255;
    return `hsla(${hue}, ${saturation}%, ${lightness}%, ${alphaDec.toFixed(3)})`;
  };

  return (
    <div className="flex flex-col items-center gap-8 select-none">
      {/* Orb container */}
      <div className="relative flex items-center justify-center">
        {/* Outer glow ring */}
        <motion.div
          className="absolute rounded-full"
          style={{
            width: size + 60,
            height: size + 60,
            background: `radial-gradient(circle, ${getColor("15")}, transparent 70%)`,
          }}
          animate={{
            scale: [1, pulseScale, 1],
            opacity: [glowIntensity * 0.3, glowIntensity * 0.5, glowIntensity * 0.3],
          }}
          transition={{
            duration: pulseDuration,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />

        {/* Mid glow ring */}
        <motion.div
          className="absolute rounded-full"
          style={{
            width: size + 30,
            height: size + 30,
            background: `radial-gradient(circle, ${getColor("25")}, transparent 60%)`,
          }}
          animate={{
            scale: [1, pulseScale * 0.95, 1],
            opacity: [glowIntensity * 0.5, glowIntensity * 0.7, glowIntensity * 0.5],
          }}
          transition={{
            duration: pulseDuration * 0.8,
            repeat: Infinity,
            ease: "easeInOut",
            delay: 0.2,
          }}
        />

        {/* Core orb */}
        <motion.div
          className="relative rounded-full"
          style={{
            width: size,
            height: size,
            background: `radial-gradient(circle at 35% 35%, ${getColor("40")}, ${getColor("15")} 60%, transparent)`,
            boxShadow: `
              0 0 ${20 + confidence * 40}px ${getColor("30")},
              0 0 ${40 + confidence * 60}px ${getColor("15")},
              inset 0 0 ${30 + confidence * 30}px ${getColor("20")}
            `,
            border: `1px solid ${getColor("30")}`,
          }}
          animate={
            ambiguity
              ? {
                  x: [0, -3, 3, -2, 2, 0],
                  y: [0, 2, -2, 1, -1, 0],
                  filter: ["blur(0px)", "blur(2px)", "blur(0px)", "blur(3px)", "blur(0px)"],
                }
              : {
                  scale: [1, 1.02, 1],
                }
          }
          transition={
            ambiguity
              ? {
                  duration: 0.4,
                  repeat: Infinity,
                  repeatType: "mirror" as const,
                  ease: "easeInOut",
                }
              : {
                  duration: pulseDuration,
                  repeat: Infinity,
                  ease: "easeInOut",
                }
          }
        >
          {/* Inner highlight */}
          <div
            className="absolute top-[20%] left-[25%] rounded-full"
            style={{
              width: size * 0.25,
              height: size * 0.2,
              background: `radial-gradient(ellipse, ${getColor("50")}, transparent)`,
              filter: "blur(8px)",
            }}
          />
        </motion.div>

        {/* Confidence label inside orb */}
        <motion.div
          className="absolute flex flex-col items-center"
          animate={ambiguity ? { opacity: [0.7, 1, 0.7] } : { opacity: 1 }}
          transition={ambiguity ? { duration: 0.8, repeat: Infinity } : {}}
        >
          <span
            className="text-3xl font-bold tabular-nums tracking-tight"
            style={{ color: getColor() }}
          >
            {Math.round(confidence * 100)}%
          </span>
          <span className="text-xs text-neutral-500 uppercase tracking-widest mt-1">
            confidence
          </span>
        </motion.div>
      </div>

      {/* Ambiguity warning badge */}
      <AnimatePresence>
        {ambiguity && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.9 }}
            animate={{
              opacity: 1,
              y: 0,
              scale: 1,
              x: [0, -1, 1, 0],
            }}
            exit={{ opacity: 0, y: -10, scale: 0.9 }}
            transition={{
              x: { duration: 0.3, repeat: Infinity, repeatType: "mirror" },
            }}
            className="flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-medium backdrop-blur-sm"
            style={{
              borderColor: `${ambiguityColor}50`,
              backgroundColor: `${ambiguityColor}10`,
              color: ambiguityColor,
            }}
          >
            <AlertTriangle size={16} />
            <span>Model is highly uncertain</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Reasoning chain */}
      {reasoning && reasoning.length > 0 && (
        <div className="max-w-sm space-y-2 mt-2">
          {reasoning.map((reason, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.15 }}
              className="flex items-start gap-2 text-sm text-neutral-400"
            >
              <span
                className="mt-1 h-1.5 w-1.5 rounded-full shrink-0"
                style={{ backgroundColor: getColor() }}
              />
              <span>{reason}</span>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
