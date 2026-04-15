"""
TrustLab — FastAPI Backend
Model-agnostic proxy + telemetry ingestion for Human–AI trust calibration studies.
"""

from __future__ import annotations

import logging
import os
from typing import Any

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

# ---------------------------------------------------------------------------
# App
# ---------------------------------------------------------------------------

from contextlib import asynccontextmanager

from database import init_db, authenticate_user, signup_user, insert_event
import ml_engine
import llm_engine

# Active prediction strategy: "mock" | "ml" | "llm"
STRATEGY = os.environ.get("TRUSTLAB_STRATEGY", "ml")

@asynccontextmanager
async def lifespan(app: FastAPI):
    init_db()

    # Load ML model for "ml" and "llm" strategies
    if STRATEGY in ("ml", "llm"):
        try:
            ml_engine.load_model()
            logger.info("ML model loaded successfully (strategy=%s)", STRATEGY)
        except FileNotFoundError as e:
            logger.error("ML model not found: %s", e)
            logger.error("Run: python generate_dataset.py && python train_model.py")

    # Initialize LLM client for "llm" strategy
    if STRATEGY == "llm":
        llm_available = llm_engine.init_client()
        if not llm_available:
            logger.warning(
                "LLM client unavailable — will fall back to template reasoning"
            )

    logger.info("TrustLab API started (strategy=%s)", STRATEGY)
    yield

app = FastAPI(
    title="TrustLab API",
    description="Model-agnostic proxy and telemetry service for trust calibration research.",
    version="0.2.0",
    lifespan=lifespan,
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


class AuthRequest(BaseModel):
    username: str = Field(..., description="The requested username to login with.")
    password: str = Field(..., description="The user's password.")

class AuthResponse(BaseModel):
    id: str
    username: str

# ---------------------------------------------------------------------------
# Endpoints
# ---------------------------------------------------------------------------


@app.post("/api/auth/login", response_model=AuthResponse)
async def login(req: AuthRequest) -> dict[str, Any]:
    """Login a user."""
    user = authenticate_user(req.username, req.password)
    if not user:
        raise HTTPException(status_code=401, detail="Invalid username or password.")
    return user

@app.post("/api/auth/signup", response_model=AuthResponse)
async def signup(req: AuthRequest) -> dict[str, Any]:
    """Create a new user account."""
    user = signup_user(req.username, req.password)
    if not user:
        raise HTTPException(status_code=400, detail="Username already exists.")
    return user


@app.post("/api/telemetry", status_code=201)
async def post_telemetry(event: TrustEvent) -> dict[str, str]:
    """Ingest a telemetry event from the frontend."""
    logger.info("TELEMETRY | %s | %s | %s", event.participant_id, event.event_type, event.timestamp)
    # Insert telemetry into SQLite DB
    try:
        insert_event(
            user_id=event.participant_id,
            event_type=event.event_type,
            timestamp=event.timestamp,
            metadata=event.metadata_payload
        )
    except Exception as e:
        logger.error(f"Failed to insert event into DB: {e}")
        # Even if DB insert fails, we don't want to crash the frontend, just log it.
        
    return {"status": "recorded"}


@app.post("/api/proxy/predict")
async def proxy_predict(request_body: dict[str, Any]) -> AIProxyResponse:
    """
    Model-agnostic prediction proxy.
    Routes to the active strategy (mock, ml, or llm) and returns
    a strictly-validated AIProxyResponse.
    """
    scenario_id = request_body.get("scenario_id", "demo-scenario-001")

    try:
        if STRATEGY == "mock":
            return _predict_mock(request_body, scenario_id)
        elif STRATEGY == "ml":
            return _predict_ml(request_body, scenario_id)
        elif STRATEGY == "llm":
            return await _predict_llm(request_body, scenario_id)
        else:
            raise HTTPException(
                status_code=500,
                detail=f"Unknown strategy: {STRATEGY}",
            )
    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(
            status_code=500,
            detail=f"Prediction failed ({STRATEGY}): {exc}",
        ) from exc


def _predict_mock(
    request_body: dict[str, Any], scenario_id: str
) -> AIProxyResponse:
    """Original Wizard-of-Oz mock strategy — preserved for backward compat."""
    income = request_body.get("income", 55)
    p_approve = 0.73 + ((income - 55) * 0.005)
    p_approve = max(0.01, min(0.99, p_approve))

    is_approve = p_approve >= 0.50
    final_prediction = "Approve with conditions" if is_approve else "Reject application"
    final_confidence = p_approve if is_approve else (1.0 - p_approve)
    ambiguity_flag = final_confidence < 0.70

    return AIProxyResponse(
        scenario_id=scenario_id,
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


def _predict_ml(
    request_body: dict[str, Any], scenario_id: str
) -> AIProxyResponse:
    """ML strategy — uses trained LogisticRegression model."""
    if not ml_engine.is_loaded():
        raise HTTPException(
            status_code=503,
            detail="ML model not loaded. Run train_model.py first.",
        )

    result = ml_engine.predict(request_body)

    pred_label = result["prediction"]
    prediction_text = (
        "Approve with conditions" if pred_label == "approve" else "Reject application"
    )

    return AIProxyResponse(
        scenario_id=scenario_id,
        prediction=prediction_text,
        epistemic_state=EpistemicState(
            confidence=result["confidence"],
            ambiguity_flag=result["ambiguity_flag"],
            reasoning=result["reasoning"],
        ),
    )


async def _predict_llm(
    request_body: dict[str, Any], scenario_id: str
) -> AIProxyResponse:
    """LLM strategy — ML model for confidence + Gemini for reasoning."""
    if not ml_engine.is_loaded():
        raise HTTPException(
            status_code=503,
            detail="ML model not loaded. Run train_model.py first.",
        )

    result = ml_engine.predict(request_body)

    pred_label = result["prediction"]
    prediction_text = (
        "Approve with conditions" if pred_label == "approve" else "Reject application"
    )

    # Try LLM reasoning, fall back to template
    reasoning = result["reasoning"]  # template fallback
    if llm_engine.is_available():
        llm_reasoning = await llm_engine.generate_reasoning(
            features=request_body,
            prediction=pred_label,
            confidence=result["confidence"],
            feature_contributions=result.get("feature_contributions"),
        )
        if llm_reasoning:
            reasoning = llm_reasoning

    return AIProxyResponse(
        scenario_id=scenario_id,
        prediction=prediction_text,
        epistemic_state=EpistemicState(
            confidence=result["confidence"],
            ambiguity_flag=result["ambiguity_flag"],
            reasoning=reasoning,
        ),
    )


# ---------------------------------------------------------------------------
# Model Info Endpoint
# ---------------------------------------------------------------------------


@app.get("/api/model/info")
async def model_info() -> dict[str, Any]:
    """Return metadata about the current prediction strategy and model."""
    info: dict[str, Any] = {
        "strategy": STRATEGY,
        "llm_available": llm_engine.is_available() if STRATEGY == "llm" else False,
    }

    if STRATEGY in ("ml", "llm"):
        info["ml_model"] = ml_engine.get_model_info()

    return info


# ---------------------------------------------------------------------------
# Health
# ---------------------------------------------------------------------------


@app.get("/health")
async def health() -> dict[str, str]:
    return {"status": "ok"}
