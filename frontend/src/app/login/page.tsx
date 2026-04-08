"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { motion, animate, useMotionValue, useTransform } from "framer-motion";
import { useRouter } from "next/navigation";

/* ═══════════════════════════════════════════════════════════════════════════
   Centered Cute Lamp Login — Stitch Design
   Pull the lamp cord bead to toggle the lamp and reveal the login form.
   ═══════════════════════════════════════════════════════════════════════════ */

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000";
const STORAGE_KEY = "trustlab_auth_user";

export default function LoginPage() {
  const router = useRouter();
  const [isOn, setIsOn] = useState(false);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const dragY = useMotionValue(0);

  // Check if already logged in
  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        JSON.parse(stored);
        router.replace("/landing");
      } catch {
        localStorage.removeItem(STORAGE_KEY);
      }
    }
  }, [router]);

  const handleDragEnd = (event: any, info: any) => {
    if (info.offset.y > 20) {
      setIsOn((prev) => !prev);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim()) return;

    setIsLoading(true);
    setError(null);

    try {
      const resp = await fetch(`${BACKEND_URL}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: username.trim() }),
      });

      if (!resp.ok) throw new Error("Authentication failed");

      const userData = await resp.json();
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({ id: userData.id, username: userData.username })
      );
      router.push("/landing");
    } catch {
      setError("Could not connect to backend. Using local session.");
      const localUser = {
        id: `local_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
        username: username.trim(),
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(localUser));
      setTimeout(() => router.push("/landing"), 800);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main
      className="relative flex h-screen w-screen items-center justify-center overflow-hidden transition-colors duration-500"
      style={{
        backgroundColor: isOn ? "#1c1f24" : "#121417",
        fontFamily: "'Inter', system-ui, -apple-system, sans-serif",
      }}
    >
      {/* Ambient glow */}
      <motion.div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(circle at 50% 50%, rgba(255, 214, 110, 0.3), transparent 70%)",
        }}
        animate={{ opacity: isOn ? 1 : 0 }}
        transition={{ duration: 0.5 }}
      />

      <div className="z-10 flex flex-wrap items-center justify-center gap-[8vmin]">
        <div className="relative flex h-[300px] w-[280px] items-center justify-center">
          <svg
            viewBox="0 0 200 300"
            className="h-full w-full overflow-visible"
            xmlns="http://www.w3.org/2000/svg"
          >
            {/* Inner glow */}
            <ellipse
              cx={100}
              cy={110}
              rx={60}
              ry={30}
              fill="#ffdb8a"
              style={{
                filter: "blur(15px)",
                opacity: isOn ? 0.6 : 0,
                transition: "opacity 0.5s ease",
              }}
            />
            {/* Stem */}
            <rect x={92} y={100} width={16} height={160} rx={8} fill="#d1ccc2" />
            {/* Base */}
            <rect x={60} y={250} width={80} height={12} rx={6} fill="#d1ccc2" />
            
            {/* Pull cord line */}
            <motion.line
              x1={130} y1={110} x2={130}
              y2={useTransform(dragY, y => 180 + y)}
              stroke="#555" strokeWidth={2}
            />
            
            {/* Cord bead — visual (follows the draggable invisible element) */}
            <motion.circle
              cx={130}
              cy={190}
              r={6}
              fill="#d4a373"
              style={{ y: dragY, pointerEvents: "none" }}
            />

            {/* Invisible draggable hit-area */}
            <motion.circle
              cx={130}
              cy={190}
              r={25}
              fill="transparent"
              style={{ y: dragY, cursor: "grab" }}
              drag="y"
              dragConstraints={{ top: 0, bottom: 40 }}
              dragElastic={0.2}
              onDragEnd={handleDragEnd}
              whileDrag={{ cursor: "grabbing" }}
            />

            {/* Mushroom shade */}
            <path
              d="M30 110 C 30 50, 170 50, 170 110 C 170 125, 30 125, 30 110 Z"
              fill={isOn ? "#ffffff" : "#f5f0e6"}
              style={{
                filter: isOn
                  ? "drop-shadow(0 0 30px rgba(255, 255, 200, 0.4))"
                  : "none",
                transition: "fill 0.5s ease, filter 0.5s ease",
              }}
            />
          </svg>
        </div>

        {/* ── Login Form ────────────────────────────────────────── */}
        <motion.div
          className="w-[340px] rounded-[30px] border border-white/10 p-10"
          style={{
            background: "rgba(255, 255, 255, 0.05)",
            backdropFilter: "blur(20px)",
            WebkitBackdropFilter: "blur(20px)",
            boxShadow: "0 20px 40px rgba(0,0,0,0.3)",
          }}
          animate={{
            opacity: isOn ? 1 : 0,
            y: isOn ? 0 : 30,
          }}
          transition={{
            duration: 0.7,
            ease: [0.175, 0.885, 0.32, 1.275],
          }}
        >
          <h2 className="mb-6 text-center text-2xl font-medium text-white">
            Welcome
          </h2>
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="mb-2 ml-1 block text-[0.85rem] text-[#999]">
                Username
              </label>
              <input
                type="text"
                placeholder="Your name"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full rounded-[15px] border border-transparent bg-white/[0.07] px-[18px] py-[14px] text-base text-white outline-none transition-all duration-300 placeholder:text-white/30 focus:border-[#d4a373] focus:bg-white/[0.12]"
              />
            </div>
            <div>
              <label className="mb-2 ml-1 block text-[0.85rem] text-[#999]">
                Password
              </label>
              <input
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-[15px] border border-transparent bg-white/[0.07] px-[18px] py-[14px] text-base text-white outline-none transition-all duration-300 placeholder:text-white/30 focus:border-[#d4a373] focus:bg-white/[0.12]"
              />
            </div>

            {error && (
              <motion.div
                initial={{ opacity: 0, y: -5 }}
                animate={{ opacity: 1, y: 0 }}
                className="rounded-xl bg-amber-500/10 border border-amber-500/20 px-4 py-2.5 text-xs text-amber-300"
              >
                {error}
              </motion.div>
            )}

            <button
              type="submit"
              disabled={isLoading || !username.trim()}
              className="mt-2.5 w-full rounded-[15px] border-none py-[15px] text-base font-semibold text-[#121417] transition-all duration-300 hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed"
              style={{
                background:
                  "linear-gradient(135deg, #bf953f, #fcf6ba, #b38728, #fcf6ba, #aa771c)",
              }}
            >
              {isLoading ? (
                <span className="inline-block animate-spin">⟳</span>
              ) : (
                "Sign In"
              )}
            </button>
          </form>
        </motion.div>
      </div>

      {/* Hint text */}
      <motion.p
        className="absolute bottom-8 text-xs text-white/20 tracking-widest uppercase"
        animate={{ opacity: isOn ? 0 : 1 }}
        transition={{ duration: 0.3 }}
      >
        Click the cord to begin
      </motion.p>
    </main>
  );
}
