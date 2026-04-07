"use client";

import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { useSearchParams } from "next/navigation";

// ---------------------------------------------------------------------------
// Context
// ---------------------------------------------------------------------------

interface SessionContextValue {
  /** The unique participant identifier for this study session. */
  participantId: string;
}

const SessionContext = createContext<SessionContextValue | null>(null);

/**
 * Hook to access the current participant session.
 * Must be called inside <SessionProvider>.
 */
export function useSession(): SessionContextValue {
  const ctx = useContext(SessionContext);
  if (!ctx) {
    throw new Error("useSession must be used within a <SessionProvider>");
  }
  return ctx;
}

// ---------------------------------------------------------------------------
// Provider
// ---------------------------------------------------------------------------

const STORAGE_KEY = "trustlab_participant_id";

export default function SessionProvider({ children }: { children: ReactNode }) {
  const searchParams = useSearchParams();
  const [participantId, setParticipantId] = useState<string>("");

  useEffect(() => {
    // Priority: URL param > sessionStorage > generate new
    const fromUrl = searchParams.get("participant");

    if (fromUrl) {
      setParticipantId(fromUrl);
      sessionStorage.setItem(STORAGE_KEY, fromUrl);
      return;
    }

    const stored = sessionStorage.getItem(STORAGE_KEY);
    if (stored) {
      setParticipantId(stored);
      return;
    }

    const generated = crypto.randomUUID();
    setParticipantId(generated);
    sessionStorage.setItem(STORAGE_KEY, generated);
  }, [searchParams]);

  const value = useMemo<SessionContextValue>(
    () => ({ participantId }),
    [participantId],
  );

  // Don't render children until we have an ID (avoids hydration flash)
  if (!participantId) return null;

  return (
    <SessionContext.Provider value={value}>{children}</SessionContext.Provider>
  );
}
