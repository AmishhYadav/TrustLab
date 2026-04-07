# ARCHITECTURE

## System Architecture

The architecture relies on a strict decoupling between the user interface and the cognitive backend, enforcing the model-agnostic requirement.

### 1. Abstracted Frontend (Next.js)
- **Study Runner Client**: Displays the scenario, captures telemetry, and renders visualizations.
- **Adaptive Rules Engine**: Client-side (or lightweight edge) logic that analyzes local telemetry (e.g., rapid click-throughs) to toggle UI strictness modes.

### 2. Standardization Layer (API Gateway)
- **FastAPI Proxy**: Defines the strict schema for `PredictionRequest` and `PredictionResponse` (which includes explicit fields for `confidence_score`, `uncertainty_distribution`, and `reasoning_nodes`).

### 3. Backend Strategy implementations
- **Strategy A: Wizard of Oz Engine**: Returns deterministic, hardcoded datasets based on the scenario ID.
- **Strategy B: Live Model Bridge**: Routes the proxy request to OpenAI or a local Python HuggingFace inference endpoint.

### 4. Telemetry Pipeline
- **Event Bus**: All implicit actions (hover, sliders) and explicit actions (Street fight form submit) are shipped as JSON blobs to the PostgreSQL/Telemetry store.

## Data Flow
User views scenario -> Adjusts slider -> Next.js calls Proxy `/predict` -> Proxy calls Strategy Engine -> Strategy returns standardized schema with uncertainty -> Next.js runs D3.js transition to morph the probability curve -> User clicks "Disagree" -> Action logs to DB.
