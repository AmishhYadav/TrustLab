---
phase: 04
plan_name: human-ai-disagreement-interface
wave: 1
depends_on: []
files_modified:
  - frontend/src/components/TrustEngineProvider.tsx
  - frontend/src/components/CounterfactualEngine.tsx
autonomous: true
---

# Phase 4 Plan: Human-AI Disagreement Interface

## Must Haves
- The interface must replace the "Submit Decision" button with user-specific outcome choices ("Approve Loan" / "Reject Loan").
- Disagreement with the AI must implicitly trigger the "Street Fight" disagreement interface.
- Progressive friction must increase counter-argument severity on repeated overrides.
- Challenge events must log via existing telemetry.

<task_list>
<task>
  <read_first>
    - frontend/src/components/TrustEngineProvider.tsx
  </read_first>
  <action>
    Modify `TrustEngineProvider.tsx` to export and track `overrideAttempts`:
    1. Add `overrideAttempts` to state, initializing at `0`.
    2. Add `overrideAttempts` to the `TrustRound` interface.
    3. Expose `overrideAttempts` and an `incrementOverride()` function in the `TrustEngineContextValue` interface and context provider value.
    4. Ensure `overrideAttempts` persists in `sessionStorage` alongside `trustHistory` so state isn't lost on refresh.
  </action>
  <acceptance_criteria>
    - `frontend/src/components/TrustEngineProvider.tsx` exports `overrideAttempts: number` and `incrementOverride: () => void`.
    - `TrustRound` interface contains `overrideAttempts: number`.
    - `overrideAttempts` is explicitly added to the serialized JSON in `sessionStorage.setItem` and hydrated on mount.
  </acceptance_criteria>
</task>

<task>
  <read_first>
    - frontend/src/components/CounterfactualEngine.tsx
  </read_first>
  <action>
    Modify `CounterfactualEngine.tsx` to detect conflicts implicitly:
    1. Replace the generic "Submit Decision" button with two distinct action buttons: "Approve Loan" and "Reject Loan". Use green/blue styling for approve, and red/slate styling for reject.
    2. Create state `const [isChallenging, setIsChallenging] = useState(false)` and `const [userDecision, setUserDecision] = useState("")`.
    3. Create an `handleOutcomeSelection` function that takes the user's choice:
       - Match AI's `prediction` text (e.g. "Approve with conditions" maps to "Approve", "Reject" maps to "Reject").
       - If the user's choice matches the AI's general direction, call `submitDecision()`.
       - If there is a contradiction, set `userDecision` and set `isChallenging(true)` to enter "Street Fight Mode".
  </action>
  <acceptance_criteria>
    - `frontend/src/components/CounterfactualEngine.tsx` contains `<button>Approve Loan</button>` and `<button>Reject Loan</button>` equivalents.
    - `isChallenging` boolean state exists and conditionally flips `true` when a manual choice contradicts the AI prediction.
  </acceptance_criteria>
</task>

<task>
  <read_first>
    - frontend/src/components/CounterfactualEngine.tsx
  </read_first>
  <action>
    Build the "Street Fight" disagreement interface in `CounterfactualEngine.tsx`:
    1. When `isChallenging === true`, render an animated visual panel (replacing the action buttons).
    2. Add a progressive friction header based on `overrideAttempts` (from `useTrustEngine()`):
       - `0`: "You are contradicting the AI's recommendation. Please justify your override."
       - `1`: "Are you sure? Overrides at this confidence level have an 82% failure rate."
       - `>1`: "Extreme caution. This goes against all pattern matches. Document extensive reasoning."
    3. Render a free-text reasoning text area: `const [reasoningText, setReasoningText] = useState("")`.
    4. Render quick tag buttons: `['Missed context', 'Biased training data', 'Edge case']`. Clicking toggles them in a `selectedTags` array state.
    5. Render a "Force Override" submission button. Disable it if `reasoningText` is empty AND `selectedTags` is empty.
  </action>
  <acceptance_criteria>
    - The code includes a text area for reasoning.
    - The code contains the three specific string tags (`Missed context`, `Biased training data`, `Edge case`).
    - Progressive friction text strings are present in the component matching the `overrideAttempts`.
    - "Force Override" button exists and is disabled when inputs are entirely blank.
  </acceptance_criteria>
</task>

<task>
  <read_first>
    - frontend/src/components/CounterfactualEngine.tsx
    - frontend/src/lib/telemetry.ts
  </read_first>
  <action>
    Wire up the "Force Override" telemetry dispatch in `CounterfactualEngine.tsx`:
    1. Create `handleForceOverride` function.
    2. Call `incrementOverride()` on the trust engine.
    3. Call `trackTrustEvent(participantId, "challenge_submitted", { ... })`. Include `user_decision`, `ai_prediction`, `reasoning_text`, `selected_tags`, and `override_attempts` in the payload metadata.
    4. Wait for the event dispatch, then call `submitDecision()` to finalize the round.
    5. Clean up local challenge states for the next round.
  </action>
  <acceptance_criteria>
    - `CounterfactualEngine.tsx` contains `trackTrustEvent` with event type literal `"challenge_submitted"`.
    - The telemetry call includes `reasoning_text` and `selected_tags`.
    - `submitDecision()` is called upon completing the force override.
  </acceptance_criteria>
</task>
</task_list>

## Verification
1. Run `npx next build` to ensure the new state bindings and properties in `CounterfactualEngine.tsx` and `TrustEngineProvider.tsx` type-check perfectly against TS strict rules.
2. Manually test the interaction flow:
   - Make a decision that agrees with AI -> ensure it skips to new round.
   - Make a conflicting decision -> ensure Street Fight UI renders.
   - Ensure the correct progressive warning text renders based on the number of attempts.
   - Verify telemetry payload in console logs contains reasoning text and chosen tags.
