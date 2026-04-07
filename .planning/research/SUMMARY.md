# SUMMARY

## Domain Ecosystem Findings

Research across Human-AI Interaction (HCI) systems highlights the need for strict separation of concerns, ensuring trust experiments are valid, fast, and repeatable.

- **Stack**: React/Next.js combined with D3.js and Framer Motion handles the complex visual state, while a Python/FastAPI backend handles schema normalization and model proxying. PostHog/Clickhouse are ideal for behavior logging.
- **Table Stakes**: Secure, isolated participant sessions, scenario state routing, and robust telemetry capture are bare-minimums before any actual trust research can happen.
- **Watch Out For**: High inference latency breaks the illusion of counterfactual sliders. You must use pre-computed datasets for the counterfactual modes (Wizard of Oz) or ensure strict latency requirements. Avoid collecting messy unstructured behavioral data—design telemetry from the goal "how do we detect trust" backwards.

This foundation ensures TrustLab can scale from a mock-study to a production interface cleanly.
