---
wave: 1
depends_on: []
files_modified: ["frontend/package.json", "frontend/src/app/page.tsx", "frontend/src/components/EpistemicOrb.tsx", "frontend/src/components/CounterfactualEngine.tsx"]
autonomous: true
requirements: ["UI-01", "UI-02"]
---

# Phase 2: Epistemic Vis & Counterfactual Engine

## 1. Install Dependencies & Scaffolding
<read_first>
- .planning/phases/02-epistemic-vis-and-counterfactual-engine/02-CONTEXT.md
- .planning/phases/02-epistemic-vis-and-counterfactual-engine/02-RESEARCH.md
</read_first>
<action>
In `frontend/`, install `framer-motion` and `lucide-react` via npm.
Create `frontend/src/components/EpistemicOrb.tsx` to serve as the visual center of confidence.
Create `frontend/src/components/CounterfactualEngine.tsx` to handle the slider and the optimistic proxy logic.
</action>
<acceptance_criteria>
- `framer-motion` is in `package.json`.
- Skeleton component files exist in `src/components/`.
</acceptance_criteria>

## 2. Build the Epistemic Orb (UI-01)
<read_first>
- frontend/src/components/EpistemicOrb.tsx
- .planning/phases/02-epistemic-vis-and-counterfactual-engine/02-CONTEXT.md
</read_first>
<action>
Implement the `<EpistemicOrb confidence={number} ambiguity={boolean} />` component.
Using Framer Motion:
- Make an abstract circular element (an 'Orb').
- Scale the `opacity`, `scale`, and a custom CSS `box-shadow` glow based on the `confidence` score (0-1).
- If `ambiguity` is true, add a `filter: blur(x)` to the glow and add a rapid `animate={{ x: [0, -2, 2, 0] }}` loop to create jitter.
- Render a literal textual badge below it reading "Model is highly uncertain" if `ambiguity` is true.
</action>
<acceptance_criteria>
- Visual pulse maps dynamically to `confidence` using Framer Motion.
- Distortion logic executes correctly on `ambiguity == true`.
</acceptance_criteria>

## 3. Build Optimistic Counterfactual Engine (UI-02)
<read_first>
- frontend/src/components/CounterfactualEngine.tsx
- frontend/src/lib/telemetry.ts
- .planning/phases/02-epistemic-vis-and-counterfactual-engine/02-RESEARCH.md
</read_first>
<action>
Implement `CounterfactualEngine.tsx` taking over the main screen functionality in `page.tsx`.
- Include a slider (range input) for adjusting "Income".
- Use `useState` to track the "optimistic confidence". When the slider moves, immediately calculate a fake confidence shift locally to hit the sub-100ms threshold (e.g. increase income -> increase confidence).
- Use `useEffect` with a setTimeout debounce (300ms) to trigger `trackTrustEvent('slider_adjust', { value })` AND fetch the *real* `/api/proxy/predict` API.
- Upon successful API hit, snap the state to the true `prediction` and `epistemic_state`.
- Embed `<EpistemicOrb>` within this engine and feed the state downwards.
</action>
<acceptance_criteria>
- Engine tracks optimistic local state.
- Debounced fetch updates the true state and fires telemetry.
</acceptance_criteria>

## 4. Integrate into Routing & Finalize
<read_first>
- frontend/src/app/page.tsx
</read_first>
<action>
Modify `frontend/src/app/page.tsx` to render the `CounterfactualEngine`. Ensure the layout is clean, modern, and dark-themed using TailwindCSS, giving extreme focus to the Epistemic Orb.
</action>
<acceptance_criteria>
- Landing page hosts the primary interactive visualization.
- No React hydration errors exist.
</acceptance_criteria>
