# FEATURES

## Table Stakes (Must-Have)
- **User Authentication & Study Sessions**: Participants must be able to log in securely, and researchers must be able to group sessions.
- **Scenario State Management**: The system must reliably load decision-making presets (e.g. loan applicant contexts).
- **Telemetry Logging**: Capturing explicit clicks, ratings, and form submissions.
- **AI Prediction Display**: Clean rendering of the AI's core suggestion and reasoning text.

## Differentiators (Core Value)
- **Counterfactual Explanations Interface**: Interactive sliders or toggles to modify inputs and query the "AI backend" in real-time.
- **Epistemic Vis**: Specialized UI components to represent ambiguity (e.g., probability cones, confidence bars).
- **"Street Fight Mode"**: A structured human-AI disagreement workflow where the user can log a counter-reasoning argument.
- **Adaptive UI Logic**: Frontend rules engine that changes prompt severity based on moving average of trust compliance.
- **Temporal Trust Dashboard**: Researcher-facing or User-facing charts summarizing trust shifts.

## Anti-Features (Do Not Build)
- **Hardcoded ML Models**: Do not bake specific ML weights into the system. Keep it abstracted.
- **Complex Enterprise RBAC**: Over-engineering roles beyond "Participant" and "Researcher" is unnecessary early on.
