"use client";

import { Suspense, type ReactNode } from "react";
import SessionProvider from "@/components/SessionProvider";
import TrustEngineProvider from "@/components/TrustEngineProvider";
import ScenarioProvider from "@/components/ScenarioProvider";

/**
 * Client boundary that wraps the full provider stack
 * in a Suspense boundary (required because useSearchParams needs
 * Suspense in Next.js App Router).
 *
 * Nesting order: Suspense → SessionProvider → TrustEngineProvider → ScenarioProvider → children
 * - TrustEngineProvider depends on useSession(), so it must sit inside SessionProvider.
 * - ScenarioProvider depends on useSession(), so it must sit inside SessionProvider.
 */
export default function SessionWrapper({ children }: { children: ReactNode }) {
  return (
    <Suspense fallback={null}>
      <SessionProvider>
        <TrustEngineProvider>
          <ScenarioProvider>{children}</ScenarioProvider>
        </TrustEngineProvider>
      </SessionProvider>
    </Suspense>
  );
}
