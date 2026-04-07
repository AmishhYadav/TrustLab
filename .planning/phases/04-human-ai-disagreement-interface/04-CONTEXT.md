# Phase 4: Human-AI Disagreement Interface

## Decisions

- **Trigger Mechanism**: Implicit Trigger. The "Street Fight Mode" activates automatically intercepting the submission if the user's decision contradicts the AI's predicted recommendation.
- **Input Format**: Hybrid Input. To log their alternate argument, the user is presented with a free-text reasoning text area alongside quick, selectable category tags (e.g., "AI missed context", "Biased data").
- **Friction Intensity**: Progressive Friction. The AI pushes back harder and escalates its counter-arguments the more frequently the user attempts to override it.
- **Storage Mechanism**: Unified Telemetry. Challenge data, reasoning, and tags are persisted by attaching them to standard `trackTrustEvent` payloads (e.g., `challenge_submitted`) rather than building a dedicated API endpoint.

## Specifics

- The progressive friction state should be tied into the existing `TrustEngineProvider` metrics.
- The UI must fluidly transition from the normal `CounterfactualEngine` submission into the challenge view to maintain the seamless feel.

## Deferred
*(None)*

## Canonical Refs

- `.planning/PROJECT.md`
- `.planning/REQUIREMENTS.md`
- `.planning/ROADMAP.md`
