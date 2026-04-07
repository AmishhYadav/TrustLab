/**
 * TrustLab — Telemetry Dispatcher
 *
 * Sends structured TrustEvent payloads to the FastAPI backend.
 * Core trust moments use strict event types; arbitrary metadata is
 * attached via the `metadata` parameter.
 */

const TELEMETRY_ENDPOINT = "http://localhost:8000/api/telemetry";

/**
 * Fire-and-forget telemetry dispatch.
 * Errors are caught and logged — telemetry must never crash the UI.
 */
export async function trackTrustEvent(
  participantId: string,
  eventType: string,
  metadata: Record<string, unknown> = {},
): Promise<void> {
  try {
    await fetch(TELEMETRY_ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        participant_id: participantId,
        event_type: eventType,
        timestamp: Date.now(),
        metadata_payload: metadata,
      }),
    });
  } catch (err) {
    // Telemetry failures are non-fatal — log and continue.
    console.warn("[TrustLab telemetry] dispatch failed:", err);
  }
}
