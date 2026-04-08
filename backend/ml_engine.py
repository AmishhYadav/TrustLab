"""
TrustLab — ML Inference Engine

Loads the trained LogisticRegression model and scaler at startup,
then provides a `predict()` function that returns structured output
conforming to the AIProxyResponse epistemic state.

Also generates template-based reasoning from feature values and
model coefficients — no LLM needed for the "ml" strategy.
"""

from __future__ import annotations

import logging
import os
from typing import Any

import joblib
import numpy as np
import pandas as pd

logger = logging.getLogger("trustlab.ml")

BASE_DIR = os.path.dirname(__file__)
MODEL_PATH = os.path.join(BASE_DIR, "model.joblib")
SCALER_PATH = os.path.join(BASE_DIR, "scaler.joblib")

FEATURE_NAMES = [
    "income",
    "credit_score",
    "employment_length",
    "debt_to_income",
    "loan_amount",
]

# ── Module-level state (loaded once at startup) ─────────────────────────

_model = None
_scaler = None


def load_model() -> None:
    """Load the trained model and scaler from disk. Call once at startup."""
    global _model, _scaler

    if not os.path.exists(MODEL_PATH):
        raise FileNotFoundError(
            f"Model file not found at {MODEL_PATH}. "
            "Run `python generate_dataset.py && python train_model.py` first."
        )

    _model = joblib.load(MODEL_PATH)
    _scaler = joblib.load(SCALER_PATH)
    logger.info("ML model loaded from %s", MODEL_PATH)


def is_loaded() -> bool:
    """Check if the model is loaded and ready."""
    return _model is not None and _scaler is not None


def predict(features: dict[str, Any]) -> dict[str, Any]:
    """
    Run inference on a single input.

    Parameters
    ----------
    features : dict with keys matching FEATURE_NAMES

    Returns
    -------
    dict with:
        prediction : str ("approve" | "reject")
        confidence : float (0-1)
        ambiguity_flag : bool
        reasoning : list[str]
        feature_contributions : dict[str, float]
    """
    if not is_loaded():
        raise RuntimeError("Model not loaded. Call load_model() first.")

    # Build feature vector in the correct order (as DataFrame for sklearn compat)
    X_raw = pd.DataFrame([{
        "income": features.get("income", 55),
        "credit_score": features.get("credit_score", 680),
        "employment_length": features.get("employment_length", 3),
        "debt_to_income": features.get("debt_to_income", 0.30),
        "loan_amount": features.get("loan_amount", 50),
    }], columns=FEATURE_NAMES)

    X_scaled = _scaler.transform(X_raw)

    # Predict
    prob = _model.predict_proba(X_scaled)[0]  # [p_reject, p_approve]
    p_approve = float(prob[1])
    is_approve = p_approve >= 0.50

    prediction = "approve" if is_approve else "reject"
    confidence = p_approve if is_approve else (1.0 - p_approve)
    ambiguity_flag = confidence < 0.70

    # Feature contributions (scaled coefficient * scaled feature value)
    contributions = {}
    for i, name in enumerate(FEATURE_NAMES):
        coef = float(_model.coef_[0][i])
        scaled_val = float(X_scaled[0][i])
        contributions[name] = round(coef * scaled_val, 4)

    # Generate template reasoning
    reasoning = _generate_reasoning(features, prediction, confidence, contributions)

    return {
        "prediction": prediction,
        "confidence": round(confidence, 4),
        "ambiguity_flag": ambiguity_flag,
        "reasoning": reasoning,
        "feature_contributions": contributions,
    }


def get_model_info() -> dict[str, Any]:
    """Return metadata about the loaded model."""
    if not is_loaded():
        return {"status": "not_loaded"}

    return {
        "status": "loaded",
        "model_type": type(_model).__name__,
        "feature_names": FEATURE_NAMES,
        "n_features": len(FEATURE_NAMES),
        "coefficients": {
            name: round(float(coef), 4)
            for name, coef in zip(FEATURE_NAMES, _model.coef_[0])
        },
        "intercept": round(float(_model.intercept_[0]), 4),
    }


# ── Template Reasoning Generator ────────────────────────────────────────


def _generate_reasoning(
    features: dict[str, Any],
    prediction: str,
    confidence: float,
    contributions: dict[str, float],
) -> list[str]:
    """
    Generate human-readable reasoning bullets from feature values
    and their model contributions. No LLM needed.
    """
    reasons: list[str] = []

    income = features.get("income", 55)
    credit_score = features.get("credit_score", 680)
    employment_length = features.get("employment_length", 3)
    debt_to_income = features.get("debt_to_income", 0.30)
    loan_amount = features.get("loan_amount", 50)

    # Sort features by absolute contribution (most influential first)
    sorted_features = sorted(
        contributions.items(), key=lambda x: abs(x[1]), reverse=True
    )

    for name, contrib in sorted_features:
        if name == "income":
            if contrib > 0:
                reasons.append(
                    f"Income of ${income}k provides {'strong' if income > 80 else 'adequate'} repayment capacity."
                )
            else:
                reasons.append(
                    f"Income of ${income}k may be insufficient for the requested loan."
                )

        elif name == "credit_score":
            if credit_score >= 720:
                reasons.append(
                    f"Credit score of {credit_score} is well above the 680 approval threshold."
                )
            elif credit_score >= 680:
                reasons.append(
                    f"Credit score of {credit_score} meets the minimum threshold but offers limited buffer."
                )
            else:
                reasons.append(
                    f"Credit score of {credit_score} is below the recommended threshold of 680."
                )

        elif name == "employment_length":
            if employment_length >= 5:
                reasons.append(
                    f"{employment_length} years of employment demonstrates strong stability."
                )
            elif employment_length >= 2:
                reasons.append(
                    f"Employment tenure of {employment_length} years is moderate — limited track record."
                )
            else:
                reasons.append(
                    f"Very short employment history ({employment_length} years) adds significant risk."
                )

        elif name == "debt_to_income":
            dti_pct = round(debt_to_income * 100)
            if debt_to_income <= 0.28:
                reasons.append(
                    f"Debt-to-income ratio of {dti_pct}% is within healthy limits."
                )
            elif debt_to_income <= 0.36:
                reasons.append(
                    f"Debt-to-income ratio of {dti_pct}% is elevated — manageable but monitored."
                )
            else:
                reasons.append(
                    f"Debt-to-income ratio of {dti_pct}% exceeds the safe threshold of 36%."
                )

        elif name == "loan_amount":
            lti = loan_amount / max(income, 1)
            if lti <= 2.0:
                reasons.append(
                    f"Loan amount of ${loan_amount}k is reasonable relative to income."
                )
            elif lti <= 3.5:
                reasons.append(
                    f"Loan amount of ${loan_amount}k is high relative to income — moderate risk."
                )
            else:
                reasons.append(
                    f"Loan amount of ${loan_amount}k is very high relative to ${income}k income — significant risk factor."
                )

    # Keep top 4 most relevant reasons
    return reasons[:4]
