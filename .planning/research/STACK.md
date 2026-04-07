# STACK

## Recommended Technologies

### Frontend UI
- **React + Next.js**: Standard 2025 stack for complex web applications. Ensures solid routing for multi-step studies and easy distribution to research participants.
- **TailwindCSS + Framer Motion**: Essential for adaptive interfaces and smooth epistemic state visualizations (e.g. morphing probability distributions).
- **D3.js / Recharts**: Required for the Temporal Trust Tracking complex dashboard.

### Backend & API
- **Python + FastAPI**: Given the machine learning intersection, Python is mandatory. FastAPI allows for rapid, typed schema generation which aligns perfectly with your Model-Agnostic Schema requirement.
- **LiteLLM / standard OpenAI Schema**: If integrating models later, using a standardized completion schema with `logprobs` support is crucial for uncertainty visualization.

### Data & Telemetry
- **PostgreSQL**: For relational storage of users, scenarios, and structured telemetry.
- **ClickHouse / PostHog**: For high-volume implicit telemetry logging (mouse movements, time-spent, hover durations) to feed the adaptive mechanism.

## Rationale
This stack separates the model execution from the visualization correctly. By keeping the backend Python-based, researchers can easily swap in mock Wizard-of-Oz scripts or heavy PyTorch models without refactoring the Next.js frontend rendering the UI.
