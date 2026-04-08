"""
TrustLab — FastAPI Backend
Model-agnostic proxy + telemetry ingestion for Human–AI trust calibration studies.
"""

from __future__ import annotations

import logging
from typing import Any

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

# ---------------------------------------------------------------------------
# App
# ---------------------------------------------------------------------------

app = FastAPI(
    title="TrustLab API",
    description="Model-agnostic proxy and telemetry service for trust calibration research.",
    version="0.1.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

logger = logging.getLogger("trustlab")

# ---------------------------------------------------------------------------
# Schemas — Epistemic State & Proxy Response
# ---------------------------------------------------------------------------


class EpistemicState(BaseModel):
    """Represents the AI's epistemic uncertainty for a given prediction."""

    confidence: float = Field(
        ..., ge=0.0, le=1.0, description="Overall confidence score (0-1)."
    )
    ambiguity_flag: bool = Field(
        ..., description="True when the model signals high ambiguity."
    )
    reasoning: list[str] = Field(
        ..., description="Ordered reasoning chain supporting the prediction."
    )


class AIProxyResponse(BaseModel):
    """
    Strict contract returned by the proxy to the frontend.
    Any backend (mock or live) MUST conform to this schema.
    """

    scenario_id: str = Field(..., description="Unique identifier for the scenario.")
    prediction: str = Field(..., description="The AI's recommended decision.")
    epistemic_state: EpistemicState


# ---------------------------------------------------------------------------
# Schemas — Telemetry
# ---------------------------------------------------------------------------


class TrustEvent(BaseModel):
    """
    Hybrid telemetry event.
    Core fields are strictly typed; the metadata_payload dict captures
    arbitrary interaction data for downstream analysis.
    """

    participant_id: str = Field(..., description="UUID of the study participant.")
    event_type: str = Field(
        ...,
        description="Predefined event category (e.g. 'slider_adjust', 'challenge_ai').",
    )
    timestamp: float = Field(
        ..., description="Client-side epoch timestamp (ms)."
    )
    metadata_payload: dict[str, Any] = Field(
        default_factory=dict,
        description="Arbitrary key-value pairs for extended telemetry.",
    )


# ---------------------------------------------------------------------------
# Endpoints
# ---------------------------------------------------------------------------


@app.post("/api/telemetry", status_code=201)
async def post_telemetry(event: TrustEvent) -> dict[str, str]:
    """Ingest a telemetry event from the frontend."""
    logger.info("TELEMETRY | %s | %s | %s", event.participant_id, event.event_type, event.timestamp)
    # In later phases this will write to PostgreSQL / ClickHouse.
    # For now, console logging satisfies INFRA-02.
    return {"status": "recorded"}


@app.post("/api/proxy/predict")
async def proxy_predict(request_body: dict[str, Any]) -> AIProxyResponse:
    """
    Model-agnostic prediction proxy.
    Accepts any JSON payload, runs it through the active strategy (mock or live),
    and returns a strictly-validated AIProxyResponse.
    """
    # --- Mock strategy (Wizard-of-Oz) for Phase 1 ---
    try:
        # Calculate a dynamic probability of approval based on the incoming income
        income = request_body.get("income", 55)
        p_approve = 0.73 + ((income - 55) * 0.005)
        p_approve = max(0.01, min(0.99, p_approve))
        
        is_approve = p_approve >= 0.50
        final_prediction = "Approve with conditions" if is_approve else "Reject application"
        final_confidence = p_approve if is_approve else (1.0 - p_approve)
        ambiguity_flag = final_confidence < 0.60

        mock_response = AIProxyResponse(
            scenario_id=request_body.get("scenario_id", "demo-scenario-001"),
            prediction=final_prediction,
            epistemic_state=EpistemicState(
                confidence=final_confidence,
                ambiguity_flag=ambiguity_flag,
                reasoning=[
                    f"Applicant income adjusted to ${income}k.",
                    "Credit history shows two late payments in the last 24 months.",
                    "Employment tenure is short (< 1 year) — moderate risk factor.",
                ],
            ),
        )
    except Exception as exc:
        # Strict enforcement: if mock data itself fails validation, surface it.
        raise HTTPException(status_code=500, detail=f"Proxy schema violation: {exc}") from exc

    return mock_response


# ---------------------------------------------------------------------------
# Health
# ---------------------------------------------------------------------------


@app.get("/health")
async def health() -> dict[str, str]:
    return {"status": "ok"}
