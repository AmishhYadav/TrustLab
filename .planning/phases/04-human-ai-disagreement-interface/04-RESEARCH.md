# Phase 4: Human-AI Disagreement Interface (Research)

## Domain Context
The objective of Phase 4 is to build the "Street Fight Mode" where users challenge the AI's recommendation. Based on the decisions in `04-CONTEXT.md`, this is triggered *implicitly* when the user submits a decision that conflicts with the AI, prompts them with a hybrid text/tag input, enforces progressive friction on repeated challenges, and logs the payload via the existing telemetry pipeline.

## Architectural Findings
1. **User Decision Capture Needed**: Currently, `CounterfactualEngine.tsx` has a generic "Submit Decision" button but no way for the user to explicitly declare their *own* verdict (Approve vs Reject) compared to the AI. To allow an implicit trigger on conflict, we must replace the single "Submit Decision" button with outcome-specific actions (e.g., "I Approve" vs "I Reject").
2. **Implicit Trigger Logic**: By comparing the user's selected outcome against the `prediction` state (e.g., "Approve with conditions"), we can intercept the `submitDecision` call. If they conflict, we swap the UI into "Street Fight Mode" instead of ending the round immediately.
3. **Progressive Friction State**: The escalation logic should live in `TrustEngineProvider.tsx`. We will need to track `overrideAttempts` across rounds. Higher `overrideAttempts` = stronger counter-arguments from the AI when the user enters Street Fight Mode.
4. **Telemetry**: The existing `trackTrustEvent` API is perfectly suited to handle `challenge_submitted` events without backend schema modifications, as the `metadata` payload is flexible (per Phase 1).

## Implementation Strategy

### 1. Update `TrustEngineProvider.tsx`
- Add `overrideAttempts` state (persisted in `sessionStorage` alongside `trustHistory`).
- Expose `overrideAttempts` and `incrementOverride()` via `useTrustEngine`.

### 2. Update `CounterfactualEngine.tsx`
- **Actions replacement**: Replace the generic "Submit Decision" button with a choice: "Approve Loan" vs "Reject Loan".
- **Conflict detection**: When the user clicks an action, compare it to the current AI `prediction`. If they match, proceed with normal `submitDecision`. If they conflict, set `isChallenging = true`.
- **Street Fight Component**: When `isChallenging` is true, animate in the Disagreement Interface.
  - Show the progressive counter-argument based on `overrideAttempts`. (e.g. `overrideAttempts === 0`: "Please justify your override." `overrideAttempts === 1`: "Are you sure? Similar overrides have an 85% failure rate. Justify your reasoning.")
  - Render predefined category tags (e.g., `["AI missed context", "Biased data", "Edge case"]`) using selectable pill buttons.
  - Render a `textarea` for free-text reasoning.
  - "Force Override" button that calls `trackTrustEvent("challenge_submitted", ...)` along with `incrementOverride()`, then calls `submitDecision()`.

## Validation Architecture
- **Verification points**:
  - The "Street Fight Mode" UI only conditionally renders on conflict.
  - Free-text string and selected tags are properly bound to state.
  - Submitting the challenge fires `trackTrustEvent` with event type `challenge_submitted`.
  - `overrideAttempts` persists in `sessionStorage`.
