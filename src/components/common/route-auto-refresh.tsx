"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

interface RouteAutoRefreshProps {
  intervalMs?: number;
  enabled?: boolean;
}

export function RouteAutoRefresh({
  intervalMs = 15_000,
  enabled = true,
}: RouteAutoRefreshProps) {
  const router = useRouter();

  useEffect(() => {
    if (!enabled || intervalMs <= 0) {
      return;
    }

    const refresh = () => {
      if (document.visibilityState !== "visible") {
        return;
      }

      if (!navigator.onLine) {
        return;
      }

      router.refresh();
    };

    const intervalId = window.setInterval(refresh, intervalMs);

    window.addEventListener("focus", refresh);
    document.addEventListener("visibilitychange", refresh);

    return () => {
      window.clearInterval(intervalId);
      window.removeEventListener("focus", refresh);
      document.removeEventListener("visibilitychange", refresh);
    };
  }, [enabled, intervalMs, router]);

  return null;
}
