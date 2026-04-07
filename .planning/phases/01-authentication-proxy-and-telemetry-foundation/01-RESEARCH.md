# Phase 1: Authentication, Proxy, and Telemetry Foundation - Research

## Objective
Establish the foundational infrastructure mapping to Phase 1's goal: Next.js scaffolding for UI, anonymous URL/UUID session management, a flexible telemetry pipeline, and a strict Python FastAPI backend proxy for model-agnostic completions.

## Findings & Implementation Strategy

### 1. Next.js App Router & Session Handling
- **Strategy**: Utilize Next.js 14+ App Router.
- **Implementation**: The top-level layout or context provider checks for a `participant` query parameter (e.g. `?participant=uid123`). If present, it sets it in a React Context. If absent, it injects a randomly generated UUID string (e.g. `crypto.randomUUID()`) to uniquely identify the anonymous user session for telemetry.
- **Persistence**: Store the active UUID in `sessionStorage` or `localStorage` to allow resilient page reloads without losing the session block.

### 2. Telemetry Ingestion API (Next.js vs FastAPI)
- **Strategy**: Send events directly to the Python FastAPI backend, not Next.js, as the Python backend will eventually own all SQLite/PostgreSQL connections and ML completions. This keeps database interactions isolated in Python.
- **Model**: A `TelemetryEvent` model:
  ```python
  class TrustEvent(BaseModel):
      participant_id: str
      event_type: str
      timestamp: float # Epoch
      metadata: dict # Arbitrary JSON payload
  ```

### 3. Pydantic Enforcement Proxy
- **Strategy**: The FastAPI server exposes an `/api/v1/predict` endpoint.
- **Validation**:
  ```python
  class EpistemicState(BaseModel):
      confidence: float
      ambiguity_flag: bool
      reasoning: List[str]

  class AIProxyResponse(BaseModel):
      scenario_id: str
      prediction: str
      epistemic_state: EpistemicState
  ```
- Any mock strategy or live inference must be validated against `AIProxyResponse`. If it fails, FastAPI returns a 500 or standard fallback string rather than breaking the React application.

## Validation Architecture

### 1. Unit/Integration Validation
- FastAPI proxy returns 422 if an invalid schema is simulated.
- Telemetry endpoint accepts arbitrary nested JSON inside the `metadata` field without throwing errors.
- Next.js root layout successfully sets participant UUID.

### 2. Manual Verification
- Navigating to localhost:3000 shows a generated UUID in the dev pane.
- Navigating to localhost:3000?participant=foo sets the UUID to "foo".
