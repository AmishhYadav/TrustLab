# Phase 3: Adaptive Logic & Trust Tracking

## Decisions

- **Temporal Trust Tracker Visualization**: Hidden / Post-Session Only. To avoid the observer effect during clinical/research trials, the user's calibration score will not be visible to them in real-time. It will be logged continuously into the database for a post-session research dashboard.
- **Trust Signal Calculation**: Hybrid Model. The system will primarily calculate trust implicitly (time to submit, number of counterfactual slider adjustments, acceptance vs rejection rate). Explicit trust prompts (e.g., a quick 1-5 rating) will only trigger occasionally when a major shift in behavior is detected by the implicit engine. 
- **Adaptive Threshold UX**: Increased Ambiguity Signals + Counter-Argument Injection. When the system detects the user is "over-reliant" (blindly trusting the AI), it will trigger a UI state change: the Epistemic Orb will artificially pulse with higher warning signals, AND the proxy will inject explicit "counter-arguments" to force the user to consider why the AI might be wrong.

## Specifics

- Post-session dashboard relies on the accumulated telemetry data tracking the temporal trust scores.
- The state logic distinguishing "over-reliant" vs "under-reliant" needs to map directly into the `CounterfactualEngine` UI behaviors (changing epistemic orb states and adding counter-arguments).

## Deferred
*(None)*

## Canonical Refs

- `.planning/PROJECT.md`
- `.planning/REQUIREMENTS.md`
- `.planning/ROADMAP.md`
