"""
TrustLab — LLM Reasoning Engine (Google Gemini)

Generates natural-language reasoning chains for loan predictions
using the Gemini API. Falls back to template reasoning on failure.

Requires:
    GEMINI_API_KEY environment variable

Usage:
    This module is called by main.py when TRUSTLAB_STRATEGY="llm".
"""

from __future__ import annotations

import hashlib
import json
import logging
import os
from typing import Any

logger = logging.getLogger("trustlab.llm")

# ── Module-level state ──────────────────────────────────────────────────

_client = None
_model_name: str = "gemini-2.0-flash"
_cache: dict[str, list[str]] = {}  # input_hash → reasoning bullets


def init_client() -> bool:
    """
    Initialize the Gemini client. Returns True if successful.
    """
    global _client

    api_key = os.environ.get("GEMINI_API_KEY", "")
    if not api_key:
        logger.warning(
            "GEMINI_API_KEY not set — LLM reasoning will fall back to templates."
        )
        return False

    try:
        from google import genai

        _client = genai.Client(api_key=api_key)
        logger.info("Gemini client initialized (model=%s)", _model_name)
        return True
    except Exception as exc:
        logger.error("Failed to initialize Gemini client: %s", exc)
        return False


def is_available() -> bool:
    """Check if the LLM client is ready."""
    return _client is not None


async def generate_reasoning(
    features: dict[str, Any],
    prediction: str,
    confidence: float,
    feature_contributions: dict[str, float] | None = None,
) -> list[str]:
    """
    Generate a reasoning chain from the Gemini LLM.

    Parameters
    ----------
    features : applicant feature values
    prediction : "approve" or "reject"
    confidence : model confidence (0-1)
    feature_contributions : optional per-feature contribution scores

    Returns
    -------
    List of 3-4 reasoning bullet strings.
    Returns empty list on failure (caller should fall back to templates).
    """
    if not is_available():
        return []

    # ── Cache check ──────────────────────────────────────────────────
    cache_key = _make_cache_key(features, prediction)
    if cache_key in _cache:
        logger.debug("LLM reasoning cache hit for %s", cache_key[:12])
        return _cache[cache_key]

    # ── Build prompt ─────────────────────────────────────────────────
    prompt = _build_prompt(features, prediction, confidence, feature_contributions)

    try:
        response = _client.models.generate_content(
            model=_model_name,
            contents=prompt,
        )

        # Parse the response
        text = response.text.strip()
        bullets = _parse_bullets(text)

        if bullets:
            _cache[cache_key] = bullets
            logger.info("LLM generated %d reasoning bullets", len(bullets))
            return bullets
        else:
            logger.warning("LLM returned unparseable response")
            return []

    except Exception as exc:
        logger.error("Gemini API call failed: %s", exc)
        return []


def _build_prompt(
    features: dict[str, Any],
    prediction: str,
    confidence: float,
    contributions: dict[str, float] | None,
) -> str:
    """Build the reasoning prompt for Gemini."""

    contrib_section = ""
    if contributions:
        sorted_contribs = sorted(
            contributions.items(), key=lambda x: abs(x[1]), reverse=True
        )
        contrib_lines = [f"  - {name}: {val:+.4f}" for name, val in sorted_contribs]
        contrib_section = (
            "\n\nModel feature contributions (positive = favors approval):\n"
            + "\n".join(contrib_lines)
        )

    return f"""You are a loan risk analysis AI. Given the following loan application data and the ML model's prediction, generate exactly 4 concise reasoning bullets explaining why the model made this prediction.

Applicant Data:
  - Annual Income: ${features.get('income', 55)}k
  - Credit Score: {features.get('credit_score', 680)}
  - Employment Length: {features.get('employment_length', 3)} years
  - Debt-to-Income Ratio: {features.get('debt_to_income', 0.30):.0%}
  - Loan Amount: ${features.get('loan_amount', 50)}k

Model Prediction: {prediction.upper()}
Model Confidence: {confidence:.0%}{contrib_section}

Rules:
1. Output exactly 4 bullet points, one per line.
2. Start each bullet with "- " (dash space).
3. Each bullet should be one sentence, under 120 characters.
4. Be specific — reference actual numbers from the application.
5. Sound like a professional credit analyst, not a chatbot.
6. Do NOT add any preamble or conclusion — just the 4 bullets."""


def _parse_bullets(text: str) -> list[str]:
    """Extract bullet points from the LLM response."""
    lines = text.strip().split("\n")
    bullets = []

    for line in lines:
        line = line.strip()
        # Accept lines starting with "- " or "• " or numbered "1. "
        if line.startswith("- "):
            bullets.append(line[2:].strip())
        elif line.startswith("• "):
            bullets.append(line[2:].strip())
        elif len(line) > 2 and line[0].isdigit() and line[1] in ".)" and line[2] == " ":
            bullets.append(line[3:].strip())
        elif len(line) > 3 and line[:2].isdigit() and line[2] in ".)" and line[3] == " ":
            bullets.append(line[4:].strip())

    # Return first 4 valid bullets
    return bullets[:4]


def _make_cache_key(features: dict[str, Any], prediction: str) -> str:
    """Create a deterministic hash for cache lookup."""
    # Round features to avoid floating point noise breaking cache
    rounded = {
        k: round(v, 2) if isinstance(v, float) else v
        for k, v in sorted(features.items())
    }
    raw = json.dumps({"features": rounded, "prediction": prediction}, sort_keys=True)
    return hashlib.sha256(raw.encode()).hexdigest()
