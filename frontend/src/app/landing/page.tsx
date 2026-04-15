"use client";

import { useEffect, useRef, useCallback } from "react";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";

/* ═══════════════════════════════════════════════════════════════════════════
   Aletheia: Full Cinematic Experience — Landing Page
   Scroll-triggered expansion storytelling with narrative overlays.
   Based on Stitch screen: "Aletheia: Full Cinematic Experience"
   ═══════════════════════════════════════════════════════════════════════════ */

export default function LandingPage() {
  const router = useRouter();
  const sectionsRef = useRef<NodeListOf<Element> | null>(null);

  // ── Check auth ────────────────────────────────────────────────────────
  useEffect(() => {
    const stored = localStorage.getItem("trustlab_auth_user");
    if (!stored) {
      router.replace("/login");
    }
  }, [router]);

  // ── Cinematic Scroll Engine ───────────────────────────────────────────
  const initScrollEngine = useCallback(() => {
    const sections = document.querySelectorAll(".scroll-section");
    sectionsRef.current = sections;

    const handleScroll = () => {
      sections.forEach((section) => {
        const rect = section.getBoundingClientRect();
        const sticky = section.querySelector(".sticky-container");
        if (!sticky || rect.top > window.innerHeight || rect.bottom < 0) return;

        const progress = Math.max(
          0,
          Math.min(1, -rect.top / (rect.height - window.innerHeight))
        );

        if (progress > 0.15 && progress < 0.95) {
          sticky.setAttribute("data-scroll-active", "true");
        } else {
          sticky.removeAttribute("data-scroll-active");
        }
      });
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll(); // initial check
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    const cleanup = initScrollEngine();
    return cleanup;
  }, [initScrollEngine]);

  // ── Glass panel intersection fade-in ──────────────────────────────────
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("opacity-100", "translate-y-0");
            entry.target.classList.remove("opacity-0", "translate-y-10");
          }
        });
      },
      { threshold: 0.1 }
    );

    document
      .querySelectorAll(".glass-fade")
      .forEach((el) => observer.observe(el));

    return () => observer.disconnect();
  }, []);

  const navigateToExperiment = () => router.push("/experiment");

  return (
    <div className="min-h-screen bg-[#0e0e13] text-[#e4e1e9]" style={{ fontFamily: "'Inter', system-ui, sans-serif" }}>
      {/* ═══ Navigation ═══════════════════════════════════════════════════ */}
      <nav className="fixed top-0 z-[100] flex w-full items-center justify-between px-8 py-6 mix-blend-difference">
        <div className="text-2xl font-black tracking-tighter text-white">
          Aletheia
        </div>
        <div className="hidden gap-10 text-sm font-medium uppercase tracking-wide text-white/50 md:flex">
          <a href="#section-hero" className="transition-colors hover:text-white">
            Platform
          </a>
          <a
            href="#section-methodology"
            className="transition-colors hover:text-white"
          >
            Methodology
          </a>
          <a
            href="#section-adaptive"
            className="transition-colors hover:text-white"
          >
            Research
          </a>
          <a href="#footer" className="transition-colors hover:text-white">
            Ethics
          </a>
        </div>
        <div className="flex gap-4">
          <button
            onClick={() => {
              localStorage.removeItem("trustlab_auth_user");
              router.push("/login");
            }}
            className="rounded-full border border-white/20 bg-transparent px-6 py-2 text-xs font-bold uppercase tracking-widest text-white transition-all hover:bg-white/10"
          >
            Sign Out
          </button>
          <button
            onClick={navigateToExperiment}
            className="rounded-full bg-white px-6 py-2 text-xs font-bold uppercase tracking-widest text-black transition-transform hover:scale-105"
          >
            Get Started
          </button>
        </div>
      </nav>

      {/* ═══ Section 1: Hero ══════════════════════════════════════════════ */}
      <section className="scroll-section" id="section-hero">
        <div className="sticky-container" id="hero-sticky">
          {/* Parallax background */}
          <div className="parallax-bg" />

          {/* Split titles */}
          <div className="split-title title-left" style={{ left: "10%" }}>
            CALIBRATE
          </div>
          <div
            className="split-title title-right"
            style={{ right: "10%", color: "#c0c1ff" }}
          >
            TRUST
          </div>

          {/* Expansion card */}
          <div className="expansion-target relative overflow-hidden rounded-[2rem] border border-white/10 bg-[#3e3c8f]/20 shadow-2xl">
            <div
              className="absolute inset-0 bg-cover bg-center opacity-40"
              style={{
                backgroundImage:
                  "url('https://images.unsplash.com/photo-1620641788421-7a1c342ea42e?q=80&w=2874&auto=format&fit=crop')",
              }}
            />
            <div className="relative z-10 flex h-full flex-col items-center justify-center">
              <div className="mb-4 flex h-20 w-20 items-center justify-center rounded-full border border-white/20 backdrop-blur-md">
                <motion.svg
                  className="h-10 w-10 text-white"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={1.5}
                  animate={{ scale: [1, 1.1, 1] }}
                  transition={{ duration: 2, repeat: Infinity }}
                >
                  <path d="M9.75 3.104v5.714a2.25 2.25 0 0 1-.659 1.591L5 14.5M9.75 3.104c-.251.023-.501.05-.75.082m.75-.082a24.301 24.301 0 0 1 4.5 0m0 0v5.714c0 .597.237 1.17.659 1.591L19.8 15.3M14.25 3.104c.251.023.501.05.75.082M19.8 15.3l-1.57.393A9.065 9.065 0 0 1 12 15a9.065 9.065 0 0 0-6.23.693L5 14.5m14.8.8 1.402 1.402c1.232 1.232.65 3.318-1.067 3.611A48.309 48.309 0 0 1 12 21c-2.773 0-5.491-.235-8.135-.687-1.718-.293-2.3-2.379-1.067-3.61L5 14.5" />
                </motion.svg>
              </div>
            </div>
          </div>

          {/* Narrative overlay */}
          <div className="narrative-overlay absolute inset-0 mx-auto flex max-w-4xl flex-col items-center justify-center px-6 text-center">
            <h2 className="mb-8 text-2xl font-light leading-tight text-white md:text-5xl">
              Explore how you interact with{" "}
              <span className="font-medium italic text-[#8083ff]">
                AI decisions
              </span>
            </h2>
            <p className="glass-panel mx-auto max-w-2xl rounded-3xl p-8 text-lg font-light leading-relaxed text-[#c7c4d7]/80 md:text-xl">
              A research platform that studies human-AI trust calibration
              through interactive decision-making scenarios. Join our global
              study to map the future of collaboration.
            </p>
            <div className="mt-12 flex flex-col gap-6 md:flex-row">
              <button
                onClick={navigateToExperiment}
                className="flex h-16 items-center gap-3 rounded-full bg-[#c0c1ff] px-12 text-lg font-bold text-[#1000a9] shadow-[0_20px_50px_rgba(99,102,241,0.3)] transition-all hover:-translate-y-[2px]"
              >
                Start Experiment
                <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                  <path d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* ═══ Section 2: Methodology ═══════════════════════════════════════ */}
      <section className="scroll-section" id="section-methodology">
        <div className="sticky-container overflow-hidden" style={{ backgroundColor: "#0e0e13" }}>
          <div className="glow-orb -left-48 -top-48" />
          <div className="glow-orb bottom-0 right-0 opacity-50" />

          <div className="expansion-target relative flex items-center justify-center overflow-hidden rounded-[3rem] border border-[#464554]/10 bg-[#2a292f] shadow-2xl">
            <div
              className="absolute inset-0 bg-cover opacity-20"
              style={{
                backgroundImage:
                  "url('https://images.unsplash.com/photo-1614850523459-c2f4c699c52e?q=80&w=2940&auto=format&fit=crop')",
              }}
            />
            <div className="relative z-10 grid w-full max-w-7xl grid-cols-1 items-center gap-24 px-12 md:grid-cols-2">
              <div className="methodology-text-left space-y-12">
                <div className="inline-block rounded-full border border-[#c0c1ff]/30 px-4 py-1 text-[10px] uppercase tracking-widest text-[#c0c1ff]">
                  Stage 02: Methodology
                </div>
                <h3 className="text-6xl font-black text-[#e4e1e9]">
                  The Calibration <br />
                  <span className="text-[#89ceff]">Process.</span>
                </h3>
                <div className="space-y-8">
                  {[
                    {
                      icon: "M6.429 9.75 2.25 12l4.179 2.25m0-4.5 5.571 3 5.571-3m-11.142 0L2.25 7.5 12 2.25l9.75 5.25-4.179 2.25m0 0L21.75 12l-4.179 2.25m0 0L21.75 16.5 12 21.75 2.25 16.5l4.179-2.25m0 0 5.571 3 5.571-3",
                      title: "10 Dynamic Scenarios",
                      desc: "Diverse domains testing your intuition against machine logic.",
                    },
                    {
                      icon: "M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 0 1 3 19.875v-6.75ZM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V8.625ZM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V4.125Z",
                      title: "Real-Time Tracking",
                      desc: "Every decision is logged with sub-millisecond telemetry precision.",
                    },
                    {
                      icon: "M9 12.75 11.25 15 15 9.75m-3-7.036A11.959 11.959 0 0 1 3.598 6 11.99 11.99 0 0 0 3 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285Z",
                      title: "Adaptive Friction",
                      desc: "Interface complexity scales with your trust calibration state.",
                    },
                  ].map((item, i) => (
                    <div key={i} className="flex gap-6">
                      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-[#464554]/10 bg-[#2a292f] text-[#89ceff]">
                        <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
                          <path d={item.icon} />
                        </svg>
                      </div>
                      <div>
                        <h4 className="mb-2 text-xl font-bold">{item.title}</h4>
                        <p className="font-light text-[#c7c4d7]">
                          {item.desc}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Neural Grid Visualization */}
              <div className="glass-panel glass-fade opacity-0 translate-y-10 transition-all duration-1000 flex aspect-square items-center justify-center rounded-[3.5rem] p-12">
                <div className="grid w-full grid-cols-3 gap-4">
                  <div className="h-32 rounded-2xl border border-[#c0c1ff]/20 bg-[#c0c1ff]/10" />
                  <motion.div
                    className="h-32 rounded-2xl border border-[#c0c1ff]/40 bg-[#c0c1ff]/30"
                    animate={{ opacity: [0.5, 1, 0.5] }}
                    transition={{ duration: 2, repeat: Infinity }}
                  />
                  <div className="h-32 rounded-2xl border border-[#c0c1ff]/20 bg-[#c0c1ff]/10" />
                  <div className="col-span-2 h-32 rounded-2xl border border-[#89ceff]/30 bg-[#89ceff]/20" />
                  <div className="h-32 rounded-2xl bg-[#35343a]" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══ Section 3: Neural Tailoring ═══════════════════════════════════ */}
      <section className="scroll-section" id="section-adaptive">
        <div className="sticky-container" style={{ backgroundColor: "#1f1f25" }}>
          <div className="expansion-target relative flex flex-col items-center justify-center overflow-hidden rounded-full border border-white/5 bg-[#35343a]">
            <div className="absolute inset-0 bg-gradient-to-b from-indigo-500/20 to-transparent opacity-10" />
            <div className="narrative-overlay w-full max-w-7xl px-12">
              <div className="mb-16 text-center">
                <span className="text-sm font-bold uppercase tracking-widest text-indigo-400">
                  System Intelligence
                </span>
                <h2 className="mt-4 text-6xl font-black text-white md:text-7xl">
                  Neural Tailoring
                </h2>
              </div>
              <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
                {[
                  {
                    icon: "M10.5 6h9.75M10.5 6a1.5 1.5 0 1 1-3 0m3 0a1.5 1.5 0 1 0-3 0M3.75 6H7.5m3 12h9.75m-9.75 0a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m-3.75 0H7.5m9-6h3.75m-3.75 0a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m-9.75 0h9.75",
                    title: "Adaptive UI",
                    desc: "Interface evolves based on response latency and accuracy.",
                    color: "#c0c1ff",
                    hoverBorder: "hover:border-[#c0c1ff]/40",
                  },
                  {
                    icon: "M12 18v-5.25m0 0a6.01 6.01 0 0 0 1.5-.189m-1.5.189a6.01 6.01 0 0 1-1.5-.189m3.75 7.478a12.06 12.06 0 0 1-4.5 0m3.75 2.383a14.406 14.406 0 0 1-3 0M14.25 18v-.192c0-.983.658-1.823 1.508-2.316a7.5 7.5 0 1 0-7.517 0c.85.493 1.509 1.333 1.509 2.316V18",
                    title: "Cognitive Mapping",
                    desc: "Every interaction maps human-AI collaboration patterns.",
                    color: "#89ceff",
                    hoverBorder: "hover:border-[#89ceff]/40",
                  },
                  {
                    icon: "M9 12.75 11.25 15 15 9.75m-3-7.036A11.959 11.959 0 0 1 3.598 6 11.99 11.99 0 0 0 3 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285Z",
                    title: "Ethics First",
                    desc: "Full transparency in how AI models weigh variables.",
                    color: "#ffffff",
                    hoverBorder: "hover:border-white/40",
                  },
                ].map((card, i) => (
                  <div
                    key={i}
                    className={`glass-panel glass-fade opacity-0 translate-y-10 transition-all duration-1000 rounded-[3rem] p-10 ${card.hoverBorder}`}
                    style={{ transitionDelay: `${i * 100}ms` }}
                  >
                    <svg
                      className="mb-6 block h-9 w-9"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke={card.color}
                      strokeWidth={1.5}
                    >
                      <path d={card.icon} />
                    </svg>
                    <h3 className="mb-4 text-2xl font-bold">{card.title}</h3>
                    <p className="text-sm font-light text-[#c7c4d7]">
                      {card.desc}
                    </p>
                  </div>
                ))}
              </div>
              <div className="mt-16 flex justify-center">
                <button
                  onClick={navigateToExperiment}
                  className="rounded-full bg-[#c0c1ff] px-12 py-5 text-sm font-black uppercase tracking-widest text-[#0d0096] shadow-xl transition-all hover:scale-105"
                >
                  Join Experiment
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══ Footer ═══════════════════════════════════════════════════════ */}
      <footer
        id="footer"
        className="w-full border-t border-white/5 bg-[#131318] px-12 py-20"
      >
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-10 md:flex-row">
          <div className="space-y-4">
            <div className="text-2xl font-black text-white">Aletheia</div>
            <p className="text-xs font-medium uppercase tracking-widest text-[#c7c4d7]/50">
              © 2024 Aletheia Intelligence. Calibration through transparency.
            </p>
          </div>
          <div className="flex gap-12 text-[10px] font-bold uppercase tracking-[0.2em] text-white/40">
            <a href="#" className="transition-colors hover:text-white">
              Privacy Protocol
            </a>
            <a href="#" className="transition-colors hover:text-white">
              System Status
            </a>
            <a href="#" className="transition-colors hover:text-white">
              Terms of Access
            </a>
          </div>
        </div>
      </footer>

      {/* ═══ Inline Styles for Scroll Engine ═══════════════════════════════ */}
      <style jsx>{`
        .scroll-section {
          height: 250vh;
          position: relative;
        }
        .sticky-container {
          position: sticky;
          top: 0;
          height: 100vh;
          width: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
          overflow: hidden;
        }
        .expansion-target {
          width: 400px;
          height: 500px;
          transition: all 1s cubic-bezier(0.85, 0, 0.15, 1);
          z-index: 20;
          transform: translateZ(0);
          will-change: width, height, border-radius, transform;
        }
        [data-scroll-active="true"] .expansion-target {
          width: 100%;
          height: 100%;
          border-radius: 0 !important;
        }
        .narrative-overlay {
          opacity: 0;
          transform: translateY(40px);
          transition: all 1.2s cubic-bezier(0.85, 0, 0.15, 1) 0.3s;
          z-index: 40;
          pointer-events: none;
        }
        [data-scroll-active="true"] .narrative-overlay {
          opacity: 1;
          transform: translateY(0);
          pointer-events: auto;
        }
        .split-title {
          position: absolute;
          font-weight: 900;
          font-size: 8vw;
          letter-spacing: -0.05em;
          color: #e4e1e9;
          z-index: 30;
          transition: transform 1.2s cubic-bezier(0.85, 0, 0.15, 1);
          pointer-events: none;
          white-space: nowrap;
        }
        [data-scroll-active="true"] .title-left {
          transform: translateX(-65vw);
        }
        [data-scroll-active="true"] .title-right {
          transform: translateX(65vw);
        }
        .methodology-text-left {
          transition: all 1s cubic-bezier(0.85, 0, 0.15, 1);
          transform: translateX(-50px);
          opacity: 0;
        }
        [data-scroll-active="true"] .methodology-text-left {
          transform: translateX(0);
          opacity: 1;
        }
        .parallax-bg {
          position: absolute;
          inset: 0;
          background-image: radial-gradient(
              circle at 50% 50%,
              rgba(128, 131, 255, 0.05) 0%,
              transparent 70%
            ),
            url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)' opacity='0.05'/%3E%3C/svg%3E");
          z-index: 0;
        }
      `}</style>
    </div>
  );
}
