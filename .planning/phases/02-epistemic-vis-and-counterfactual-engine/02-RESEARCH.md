# Phase 2: Epistemic Vis & Counterfactual Engine - Research

## Context Constraints
- **Framer Motion + Tailwind CSS**: Using Framer Motion to visualize epistemic state via abstract UI (glows, blur, opacity) rather than D3 bar charts.
- **Latency Constraint**: Slider manipulates inputs -> screen responds in <100ms.
- **Dual Representation**: High ambiguity = Visual distortion (blur) AND Text badges ("Model is highly uncertain").

## UI Exploration & Performance Analysis

### 1. Framer Motion Blur & Jitter Effects
**Performance Goal:** Animating `filter: blur(Xpx)` can cause CPU/GPU spikes if applied over massive layout boundaries.
**Pattern:**
- Instead of blurring the entire wrapper `div`, apply `backdrop-filter: blur` via absolute overlay layers, or apply `filter` strictly to text/badges wrapped in `motion.div`.
- Using `animate={{ filter: ambiguity ? "blur(3px)" : "blur(0px)", opacity: ... }}` inside `framer-motion` works efficiently if combined with `layoutId` or hardware-accelerated props.
- For "jitter/distortion", animating `x` and `y` offsets with `repeat: Infinity, repeatType: "mirror", duration: 0.1` simulates a shaky interface if `ambiguity_flag == true`.

### 2. Sub-100ms Counterfactual Updates (Optimistic UI)
**Challenge:** Hitting the proxy API over the network for every pixel the slider moves will violate the 100ms latency requirement.
**Strategy:**
- We implement "Optimistic Extrapolation" on the frontend.
- When the slider is dragged, local React State updates immediately.
- The UI extrapolates the epistemic confidence downwards/upwards (e.g. `mockConfidence = baseConfidence + (currentSlider - baseSlider) * factor`) *synchronously*.
- Debounce the actual network `fetch()` to `/api/proxy/predict` at 300ms. When the true answer resolves, snap/interpolate the UI to the real backend prediction.
- This creates the *illusion* of a 10ms real-time neural network evaluation without melting the browser.

### 3. Component Architecture
1. **Scenario Panel**: Displays the mock scenario (e.g. "Loan Application: $40,000 for 5 years").
2. **Epistemic Sphere / Glow Indicator**: A central visual element whose glow intensity maps directly to `epistemic_state.confidence`. High confidence = bright, solid glow. Low confidence = dim, fluctuating glow.
3. **Ambiguity Overlay**: A layered badge that renders jittering effects and warning text when `ambiguity_flag == true`.
4. **Counterfactual Controls**: `input type="range"` mapped to React state triggering local optimistic mutations.

## Telemetry Requirements
- Track `slider_update` whenever the slider finishes moving (onMouseUp / throttle).
- Record the difference between real vs extrapolated confidence to ensure we track if users rely too much on the initial mock values.
