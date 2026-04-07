# Phase 3: Adaptive Logic & Trust Tracking - Research

## Context Constraints
- **Trust Tracking**: Hybrid calculation. Mostly implicit tracking (dwell time + interaction count). Trigger explicit checks only when major shifts happen.
- **Reporting**: Hidden from the user to prevent the observer effect, but logged.
- **Adaptive Action**: "Over-reliance" detection causes the UI to increase visual ambiguity in the Epistemic Orb and inject counter-arguments logically.

## Implementation Mechanics

### 1. The Implicit Trust State Machine
**Goal:** Mathematically measure "trust calibration" across multiple independent decision stages without breaking flow.
**Pattern:**
- Moving through states: `[Scenario Loaded] -> [Counterfactual Interactions] -> [Decision Submitted]`
- We can track a rolling `trustScore` (0.0 to 1.0).
- **Over-reliance (Blind Trust)** implies high speed, zero verification. Formula trait: `submission_time < 3000ms AND slider_interactions == 0`.
- **Under-reliance (Skepticism)** implies extreme verification, repeated adjustments. Formula trait: `submission_time > 15000ms AND slider_interactions > 10`.

### 2. Explicit Rating Trigger
**Goal:** Prompt a 1-5 scale modal ("How much do you trust the system right now?") only when necessary.
**Pattern:**
- Track `previousRoundTrustState` vs `currentRoundTrustState`.
- If a user was flagged as "Under-reliant" in Scenario 1, but is suddenly "Over-reliant" in Scenario 2, trigger the Explicit Modal overlay.
- Store the explicit `1-5` score into the metadata of the `TrustEvent`.

### 3. Adaptive UX Hooks
**Goal:** Force cognitive load when user trust exceeds the healthy calibration threshold (reaching Over-Reliance).
**Pattern (UI Injection):**
- Wrap `CounterfactualEngine` in a `useTrustEngine` context hook.
- If `engineState == OVER_RELIANT`:
  1. The proxy prediction explicitly returns `ambiguity_flag = true` with a randomly boosted `confidence` penalty.
  2. The Epistemic Orb visually jitters severely.
  3. The `CounterfactualEngine` renders a `<CounterArgument />` alert block beneath the prediction ("Wait, what about the short employment history?").
  
## State Persistence
- Because Next.js `useState` is wiped on full refresh, we should store the running `trust_history` array in `sessionStorage` or robustly maintain it in a top-level `TrustProvider`. Given Phase 1 established `SessionProvider` using `sessionStorage`, we will use the same persistence pattern for the implicit trust array tracking.
