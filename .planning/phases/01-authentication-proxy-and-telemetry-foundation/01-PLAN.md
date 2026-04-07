---
wave: 1
depends_on: []
files_modified: ["backend/requirements.txt", "backend/main.py", "frontend/package.json", "frontend/src/app/layout.tsx", "frontend/src/components/SessionProvider.tsx"]
autonomous: true
requirements: ["INFRA-01", "INFRA-02", "INFRA-03"]
---

# Phase 1: Authentication, Proxy, and Telemetry Foundation

## 1. Scaffold FastAPI Backend
<read_first>
- .planning/phases/01-authentication-proxy-and-telemetry-foundation/01-CONTEXT.md
- .planning/phases/01-authentication-proxy-and-telemetry-foundation/01-RESEARCH.md
</read_first>
<action>
Create directory `backend/`.
Create `backend/requirements.txt` with the following content:
```
fastapi
uvicorn
pydantic
```
Create `backend/main.py`. Initialize an `app = FastAPI()`.
Add `CORSMiddleware` to allow `*` origins for local development.

Define the Pydantic schemas:
- `EpistemicState`: `confidence` (float), `ambiguity_flag` (bool), `reasoning` (list of str)
- `AIProxyResponse`: `scenario_id` (str), `prediction` (str), `epistemic_state` (EpistemicState)
- `TrustEvent`: `participant_id` (str), `event_type` (str), `timestamp` (float), `metadata_payload` (dict)

Create endpoint `@app.post("/api/telemetry")` that accepts `TrustEvent` and simply prints it to the console.
Create endpoint `@app.post("/api/proxy/predict")` that accepts any JSON request but strictly returns a mocked `AIProxyResponse`.
</action>
<acceptance_criteria>
- `backend/main.py` contains `class TrustEvent(BaseModel):`
- `backend/main.py` contains `def post_telemetry` and `def proxy_predict`
- `backend/requirements.txt` lists API dependencies.
</acceptance_criteria>

## 2. Scaffold Next.js Frontend
<read_first>
- .planning/phases/01-authentication-proxy-and-telemetry-foundation/01-CONTEXT.md
</read_first>
<action>
In the TrustLab project root, run the Next.js initializer:
`npx create-next-app@latest frontend --typescript --tailwind --eslint --app --src-dir --import-alias "@/*" --use-npm --yes`

Create `frontend/src/components/SessionProvider.tsx`. This MUST be a `"use client"` component.
Use `useSearchParams()` from `next/navigation` to detect a `participant` query key.
If it exists, store it in React State context. If it doesn't, generate a random string using `crypto.randomUUID()` and store it.
Wrap the children inside `frontend/src/app/layout.tsx` with `<SessionProvider>`.
</action>
<acceptance_criteria>
- `frontend/package.json` exists.
- `frontend/src/components/SessionProvider.tsx` contains `useSearchParams` and `crypto.randomUUID`.
- `frontend/src/app/layout.tsx` wraps `children` in `<SessionProvider>`.
</acceptance_criteria>

## 3. Implement Telemetry Dispatcher Utility
<read_first>
- frontend/src/components/SessionProvider.tsx
</read_first>
<action>
Create `frontend/src/lib/telemetry.ts`.
Export an async function `trackTrustEvent(participantId: str, eventType: str, payload: any)`.
This function should perform a `fetch` POST to `http://localhost:8000/api/telemetry` with the payload conforming to the backend's `TrustEvent` definition, populating `timestamp` locally in epoch format.
</action>
<acceptance_criteria>
- `frontend/src/lib/telemetry.ts` fetches to `/api/telemetry`.
</acceptance_criteria>
