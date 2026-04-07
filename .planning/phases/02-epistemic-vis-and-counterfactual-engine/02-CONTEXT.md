# Phase 2: Epistemic Vis & Counterfactual Engine

## Decisions

- **Epistemic Visualization Style**: Abstract UI Indicators. Rather than literal/scientific graphs (like D3 bell curves), the interface will convey confidence and uncertainty through organic, ambient visual cues (glows, pulses, and opacity shifts).
- **Counterfactual Tuning Interaction**: Continuous Sliders. Users will manipulate inputs via sliders to ensure fluid, instant (<100ms) visual feedback, maintaining the organic feel.
- **Ambiguity Representation**: Dual approach (Visual Distortion + Explicit Badges). When the model flags high ambiguity, the UI will exhibit literal visual distortion (e.g., blurred edges, noise, or jitter) *combined* with explicit text warnings ("Model is highly uncertain") to ensure the UX is both instinctively unsettling and cognitively clear.

## Specifics

- Use Framer Motion and TailwindCSS for the abstract pulses and blur/distortion effects.
- Counterfactual slider inputs must directly drive state that updates the abstract UI synchronously to meet the sub-100ms latency requirement.

## Deferred
*(None)*

## Canonical Refs

- `.planning/PROJECT.md`
- `.planning/REQUIREMENTS.md`
- `.planning/ROADMAP.md`
