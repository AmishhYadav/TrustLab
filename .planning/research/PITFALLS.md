# PITFALLS

## Common Mistakes in HCI/AI Trust Projects

### 1. Latency Breaking Immersion
- **Warning Sign**: It takes >1.5 seconds for the counterfactual UI to update when the user moves a slider, making it feel like a clunky web app rather than an interactive tool.
- **Prevention**: Use optimistic UI updates. For simulated studies, preload the counterfactual boundaries on the client side at the start of the scenario so slider changes are 0ms latency.

### 2. Telemetry Noise
- **Warning Sign**: Collecting millions of generic mouse movements but lacking the ability to stitch them into a "trust calibration" metric.
- **Prevention**: Define explicit "Trust Events" early. Only log what is directly used by the Adaptive Interface System or the Temporal Trust Tracking chart. Map raw telemetry to these events.

### 3. Coupling to Specific ML Quirks
- **Warning Sign**: Building UI components that only work with OpenAI `logprobs` formatting.
- **Prevention**: The API Gateway must rigorously normalize any AI model output into the standardized `.planning/` schema before passing it to the frontend.

## Phase Mapping
- Latency prevention must be addressed during the **Counterfactual UI Phase**.
- Telemetry Noise prevention must be addressed during the **Data Schema Phase**.
