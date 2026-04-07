# Phase 1: Authentication, Proxy, and Telemetry Foundation

## Decisions

- **Authentication Strategy**: Anonymous URL/UUIDs. We will use URL parameters (e.g. `?participant=x`) or auto-generated UUIDs on load to completely minimize friction for study onboarding.
- **Telemetry Schema**: Hybrid Approach. Core trust moments (like hovering a prediction, adjusting a slider, or challenging the AI) will have strict, predefined schemas for reliable research analysis. Broad metadata and arbitrary interactions will concurrently be captured in a generic catch-all JSON blob.
- **Proxy Schema Validation**: Strict Pydantic/Zod Enforcement. The proxy will aggressively reject any output from the mocked/live AI backend that lacks required epistemic UI fields (confidence, ambiguity, reasoning) to ensure the frontend never breaks.

## Specifics

- The frontend should immediately parse URL search params on initialization to set the participant's UUID in state (or generate one if missing).
- Telemetry endpoint should accept a defined `TrustEvent` base model, with flexible `metadata` overrides for the arbitrary blobs.
- Python proxy backend must enforce output schemas with Pydantic; if an AI response (or mock DB response) fails validation, it drops/re-rolls the response securely before the UI ever sees bad data.

## Deferred
*(None)*

## Canonical Refs

- `.planning/PROJECT.md`
- `.planning/REQUIREMENTS.md`
- `.planning/ROADMAP.md`
