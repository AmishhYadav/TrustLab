"""
TrustLab — Synthetic Loan Dataset Generator

Generates ~2,000 labeled loan application records with realistic
feature correlations. The label `approved` is derived from a
hand-tuned scoring function so the trained model learns
interpretable patterns aligned with the experiment scenarios.

Usage:
    python generate_dataset.py
"""

import csv
import random
import os

SEED = 42
NUM_ROWS = 2000
OUTPUT_FILE = os.path.join(os.path.dirname(__file__), "loan_decisions.csv")

FEATURES = [
    "income",              # $k annual (20-200)
    "credit_score",        # 300-850
    "employment_length",   # years (0-30)
    "debt_to_income",      # ratio 0-0.6
    "loan_amount",         # $k (5-300)
]


def generate_row(rng: random.Random) -> dict:
    """Generate a single synthetic loan application with a label."""

    income = round(rng.gauss(75, 30), 1)
    income = max(20, min(200, income))

    credit_score = int(rng.gauss(680, 80))
    credit_score = max(300, min(850, credit_score))

    employment_length = max(0, round(rng.gauss(5, 4), 1))
    employment_length = min(30, employment_length)

    debt_to_income = round(rng.gauss(0.30, 0.12), 3)
    debt_to_income = max(0.02, min(0.60, debt_to_income))

    loan_amount = round(rng.gauss(80, 60), 1)
    loan_amount = max(5, min(300, loan_amount))

    # ── Scoring function (hand-tuned to produce ~55/45 approve/reject) ──
    score = 0.0

    # Income contribution (higher = better)
    score += (income - 60) * 0.02

    # Credit score contribution (major factor)
    score += (credit_score - 650) * 0.015

    # Employment stability bonus
    score += employment_length * 0.1

    # DTI penalty (higher ratio = worse)
    score -= (debt_to_income - 0.25) * 8.0

    # Loan-to-income ratio penalty
    lti_ratio = loan_amount / max(income, 1)
    score -= max(0, lti_ratio - 2.0) * 2.0

    # Add noise so the boundary isn't perfectly clean
    score += rng.gauss(0, 1.2)

    approved = 1 if score > 1.5 else 0

    return {
        "income": income,
        "credit_score": credit_score,
        "employment_length": employment_length,
        "debt_to_income": debt_to_income,
        "loan_amount": loan_amount,
        "approved": approved,
    }


def main():
    rng = random.Random(SEED)

    rows = [generate_row(rng) for _ in range(NUM_ROWS)]

    # Print class distribution
    approvals = sum(r["approved"] for r in rows)
    print(f"Generated {NUM_ROWS} rows → {approvals} approved ({approvals/NUM_ROWS*100:.1f}%), "
          f"{NUM_ROWS - approvals} rejected ({(NUM_ROWS - approvals)/NUM_ROWS*100:.1f}%)")

    with open(OUTPUT_FILE, "w", newline="") as f:
        writer = csv.DictWriter(f, fieldnames=FEATURES + ["approved"])
        writer.writeheader()
        writer.writerows(rows)

    print(f"Saved to {OUTPUT_FILE}")


if __name__ == "__main__":
    main()
