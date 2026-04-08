"""
TrustLab — Model Training Script

Trains a Logistic Regression on the synthetic loan dataset and
exports the fitted model + scaler to disk via joblib.

Usage:
    python train_model.py
"""

import os
import joblib
import pandas as pd
from sklearn.linear_model import LogisticRegression
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler
from sklearn.metrics import classification_report, accuracy_score

BASE_DIR = os.path.dirname(__file__)
DATASET_PATH = os.path.join(BASE_DIR, "loan_decisions.csv")
MODEL_PATH = os.path.join(BASE_DIR, "model.joblib")
SCALER_PATH = os.path.join(BASE_DIR, "scaler.joblib")

FEATURE_COLS = [
    "income",
    "credit_score",
    "employment_length",
    "debt_to_income",
    "loan_amount",
]


def main():
    # ── Load data ────────────────────────────────────────────────────────
    df = pd.read_csv(DATASET_PATH)
    print(f"Loaded {len(df)} rows from {DATASET_PATH}")
    print(f"Class distribution:\n{df['approved'].value_counts().to_string()}\n")

    X = df[FEATURE_COLS]
    y = df["approved"]

    # ── Split ────────────────────────────────────────────────────────────
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=42, stratify=y
    )

    # ── Scale features ───────────────────────────────────────────────────
    scaler = StandardScaler()
    X_train_scaled = scaler.fit_transform(X_train)
    X_test_scaled = scaler.transform(X_test)

    # ── Train ────────────────────────────────────────────────────────────
    model = LogisticRegression(
        max_iter=1000,
        random_state=42,
        class_weight="balanced",
    )
    model.fit(X_train_scaled, y_train)

    # ── Evaluate ─────────────────────────────────────────────────────────
    y_pred = model.predict(X_test_scaled)
    accuracy = accuracy_score(y_test, y_pred)

    print(f"Accuracy: {accuracy:.4f}\n")
    print("Classification Report:")
    print(classification_report(y_test, y_pred, target_names=["Rejected", "Approved"]))

    # Print feature importances (coefficients)
    print("Feature Coefficients:")
    for name, coef in zip(FEATURE_COLS, model.coef_[0]):
        direction = "+" if coef > 0 else "-"
        print(f"  {name:>20s}: {direction}{abs(coef):.4f}")

    # ── Export ────────────────────────────────────────────────────────────
    joblib.dump(model, MODEL_PATH)
    joblib.dump(scaler, SCALER_PATH)
    print(f"\nModel saved to {MODEL_PATH}")
    print(f"Scaler saved to {SCALER_PATH}")


if __name__ == "__main__":
    main()
