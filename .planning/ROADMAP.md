# ROADMAP

## Overview
**Goal**: Build TrustLab, the adaptive Human-AI trust calibration tool and proxy interface.
**Total Phases**: 4

## Phases

### Phase 1: Authentication, Proxy, and Telemetry Foundation
**Goal**: Set up the full-stack infrastructure, ensuring we can capture user behaviors robustly and normalize mock AI predictions.
**Requirements**: 
- INFRA-01: Session Auth
- INFRA-02: Telemetry Logger
- INFRA-03: Proxy Schema normalization
**Success Criteria**:
- Proxy API mock endpoints predictably serve standard JSON schema over network.
- Telemetry endpoint intercepts and stores arbitrary interaction logs.
- User can resume a specific mocked scenario session correctly.
**UI hint**: false

### Phase 2: Epistemic Vis & Counterfactual Engine
**Goal**: Build the core visual interface where users interact with and probe the AI's confidence levels.
**Requirements**:
- UI-01: Epistemic State Visualization
- UI-02: Sub-100ms Counterfactual tuning updates 
**Success Criteria**:
- React slider component modifies input state without notable UI blocking (< 100ms).
- Ambiguity distributions visually morph dynamically corresponding to state shifts.
**UI hint**: yes

### Phase 3: Adaptive Logic & Trust Tracking
**Goal**: Implement the dynamic feedback loop system that responds to detected user trust levels.
**Requirements**:
- UI-03: Temporal Trust Tracker Dashboard
- UI-04: Adaptive threshold UI rules
**Success Criteria**:
- Trust dashboard plots over >3 decision stages correctly.
- UI modifies "confidence warning" severity state dynamically based on user interaction timing.
**UI hint**: yes

### Phase 4: Human-AI Disagreement Interface
**Goal**: Deploy "Street Fight Mode" to capture the friction logic when users assert superiority over the model's recommendation.
**Requirements**:
- DISAGREE-01: Street Fight Mode forms and logic
**Success Criteria**:
- User successfully challenges an AI decision and logs an alternate argument to SQLite/Postgres.
**UI hint**: yes
