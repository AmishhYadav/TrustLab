"use client";

import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

// ---------------------------------------------------------------------------
// Context & Types
// ---------------------------------------------------------------------------

export interface User {
  id: string;
  username: string;
}

interface SessionContextValue {
  /** The authenticated user for this session. */
  user: User | null;
  /** Fallback for telemetry backwards-compatibility */
  participantId: string;
  /** Log out the current user */
  logout: () => void;
}

const SessionContext = createContext<SessionContextValue | null>(null);

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

const STORAGE_KEY = "trustlab_auth_user";

export default function SessionProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isInitializing, setIsInitializing] = useState(true);

  // -- Hydrate from Local Storage
  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        setUser(parsed);
      } catch {
        localStorage.removeItem(STORAGE_KEY);
      }
    }
    setIsInitializing(false);
  }, []);

  const logout = () => {
    localStorage.removeItem(STORAGE_KEY);
    setUser(null);
    // Navigate to login — we use window.location for a clean state reset
    window.location.href = "/login";
  };

  const value = useMemo<SessionContextValue>(
    () => ({
      user,
      participantId: user?.id || "anonymous",
      logout,
    }),
    [user]
  );

  if (isInitializing) {
    return (
      <div className="min-h-screen bg-neutral-950 flex items-center justify-center">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-neutral-700 border-t-blue-400" />
      </div>
    );
  }

  return (
    <SessionContext.Provider value={value}>
      {children}
    </SessionContext.Provider>
  );
}
