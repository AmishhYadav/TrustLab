"use client";

import { Suspense, type ReactNode } from "react";
import SessionProvider from "@/components/SessionProvider";
import TrustEngineProvider from "@/components/TrustEngineProvider";

/**
 * Client boundary that wraps SessionProvider + TrustEngineProvider
 * in a Suspense boundary (required because useSearchParams needs
 * Suspense in Next.js App Router).
 *
 * Nesting order: Suspense → SessionProvider → TrustEngineProvider → children
 * TrustEngineProvider depends on useSession(), so it must sit inside SessionProvider.
 */
export default function SessionWrapper({ children }: { children: ReactNode }) {
  return (
    <Suspense fallback={null}>
      <SessionProvider>
        <TrustEngineProvider>{children}</TrustEngineProvider>
      </SessionProvider>
    </Suspense>
  );
}
