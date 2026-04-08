"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

/**
 * Root page — redirects to /login (the entry point).
 */
export default function Home() {
  const router = useRouter();

  useEffect(() => {
    const stored = localStorage.getItem("trustlab_auth_user");
    if (stored) {
      router.replace("/landing");
    } else {
      router.replace("/login");
    }
  }, [router]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-neutral-950">
      <div className="h-6 w-6 animate-spin rounded-full border-2 border-neutral-700 border-t-blue-400" />
    </div>
  );
}
