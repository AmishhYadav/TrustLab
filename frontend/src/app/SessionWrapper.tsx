"use client";

import { Suspense, type ReactNode } from "react";
import SessionProvider from "@/components/SessionProvider";

/**
 * Client boundary that wraps SessionProvider in a Suspense boundary
 * (required because useSearchParams needs Suspense in Next.js App Router).
 */
export default function SessionWrapper({ children }: { children: ReactNode }) {
  return (
    <Suspense fallback={null}>
      <SessionProvider>{children}</SessionProvider>
    </Suspense>
  );
}
