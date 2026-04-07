---
wave: 1
depends_on: []
files_modified: ["frontend/src/components/TrustEngineProvider.tsx", "frontend/src/app/layout.tsx", "frontend/src/components/CounterfactualEngine.tsx"]
autonomous: true
requirements: ["UI-03", "UI-04"]
---

# Phase 3: Adaptive Logic & Trust Tracking

## 1. Scaffold the Trust Engine Provider
<read_first>
- .planning/phases/03-adaptive-logic-and-trust-tracking/03-CONTEXT.md
- frontend/src/app/layout.tsx
</read_first>
<action>
Create `frontend/src/components/TrustEngineProvider.tsx`.
Implement a React Context that tracks:
- `roundStartTime`: timestamp when the scenario loaded.
- `interactionCount`: how many times the slider was adjusted.
- `trustState`: `UNKNOWN` | `CALIBRATED` | `OVER_RELIANT` | `UNDER_RELIANT`.
- Expose methods: `recordInteraction()` and `submitDecision()`.
Wrap `layout.tsx` (inside `SessionProvider`) with `<TrustEngineProvider>`.
</action>
<acceptance_criteria>
- Trust Context is available globally.
- State initializes safely on client mount.
</acceptance_criteria>

## 2. Implement the Implicit Trust Calculation Logic
<read_first>
- frontend/src/components/TrustEngineProvider.tsx
</read_first>
<action>
Within `submitDecision()`, calculate implicit metrics:
- Time spent = `Date.now() - roundStartTime`
- Determine state: 
  - If `time < 3000ms` & `interactionCount == 0` -> `OVER_RELIANT`
  - If `time > 15000ms` & `interactionCount > 5` -> `UNDER_RELIANT`
  - Else -> `CALIBRATED`
Update `trustState` and log to `sessionStorage`. 
Compare current round state against previous round state for major shifts.
</action>
<acceptance_criteria>
- Logic securely calculates fast/blind acceptance.
- `sessionStorage` tracks array of states continuously.
</acceptance_criteria>

## 3. Implement Explicit Rating Modal
<read_first>
- frontend/src/components/TrustEngineProvider.tsx
- frontend/src/lib/telemetry.ts
</read_first>
<action>
In `TrustEngineProvider.tsx`, create an absolute/fixed overlay modal that reads "Quick check: How much do you trust the system's prediction right now? (1 = Not at all, 5 = Completely)".
Trigger this modal *if* a sudden shift happens (e.g., from `UNDER_RELIANT` in round 1 to `OVER_RELIANT` in round 2).
Upon user click (1-5), fire `trackTrustEvent('explicit_rating', { rating })` and clear the modal.
</action>
<acceptance_criteria>
- Rating modal appears only conditionally.
- Telemetry captures the explicit integer.
</acceptance_criteria>

## 4. Integrate Adaptive UX in Counterfactual Engine
<read_first>
- frontend/src/components/CounterfactualEngine.tsx
- .planning/phases/03-adaptive-logic-and-trust-tracking/03-RESEARCH.md
</read_first>
<action>
Modify `CounterfactualEngine.tsx` to consume `useTrustEngine`.
1. Call `recordInteraction()` inside the slider `handleSliderChange`.
2. Add a "Submit Decision" button at the bottom of the tool that fires `submitDecision()`.
3. Read `trustState`. If `trustState === 'OVER_RELIANT'`, force `ambiguity=true` into the Epistemic Orb visually and render a `<div className="border border-red-500 ...">Wait: The model's training data here is very sparse. Are you sure?</div>`.
</action>
<acceptance_criteria>
- Counterfactual Engine drives, and adapts to, the Trust Provider.
- Over-reliant state injects the jarring UI effectively.
</acceptance_criteria>
