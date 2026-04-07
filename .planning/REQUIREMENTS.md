# REQUIREMENTS

## v1 Requirements

### Infrastructure (INFRA)
- [ ] **INFRA-01**: User can securely authenticate and resume specific study sessions.
- [ ] **INFRA-02**: Telemetry engine comprehensively logs user interactions, behaviors, and parameter adjustments.
- [ ] **INFRA-03**: Proxy API layer normalizes scenario outputs to a standardized schema regardless of whether it's mock or live inference.

### Core Interface (UI)
- [ ] **UI-01**: Epistemic State Visualization accurately renders uncertainty parameters via dynamic visual components (e.g., probability cones/bars).
- [ ] **UI-02**: Counterfactual tuning sliders immediately trigger sub-100ms updates to the predicted outcome data via preloaded states.
- [ ] **UI-03**: Temporal Trust Tracker provides an interactive dashboard mapping user trust states over time.
- [ ] **UI-04**: Adaptive threshold rules dynamically shift UI presentation logic based on captured telemetry.

### Human-AI Disagreement (DISAGREE)
- [ ] **DISAGREE-01**: "Street Fight Mode" provides a dedicated interaction flow for users to challenge the AI, select reasonings, and view counter-proposals.

## v2 Requirements (Deferred)
- [ ] **V2-01**: Real-time integration with live third-party ML endpoints (e.g. OpenAI) instead of initial 'Wizard of Oz' mock proxy modes.

## Out of Scope
- [Hardcoding specific ML model weights into the client] — Breaks the requirement for a model-agnostic schema testing framework.

## Traceability
- **INFRA-01**: Phase 1
- **INFRA-02**: Phase 1
- **INFRA-03**: Phase 1
- **UI-01**: Phase 2
- **UI-02**: Phase 2
- **UI-03**: Phase 3
- **UI-04**: Phase 3
- **DISAGREE-01**: Phase 4
