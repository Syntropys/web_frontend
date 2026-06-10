import { useEffect } from "react";

export function usePrefetchDashboard() {
  useEffect(() => {
    const prefetch = () => {
      import("../pages/dashboard/ringkasan");
    };

    const ric =
      typeof window !== "undefined" &&
      "requestIdleCallback" in window
        ? (window as Window & {
            requestIdleCallback: (cb: () => void, opts?: { timeout: number }) => number;
          }).requestIdleCallback
        : null;

    let timeoutId: number | null = null;
    let idleId: number | null = null;

    if (ric) {
      idleId = ric(prefetch, { timeout: 2000 });
    } else {
      timeoutId = window.setTimeout(prefetch, 1500);
    }

    return () => {
      if (timeoutId !== null) window.clearTimeout(timeoutId);
      if (idleId !== null && "cancelIdleCallback" in window) {
        (window as Window & { cancelIdleCallback: (id: number) => void }).cancelIdleCallback(idleId);
      }
    };
  }, []);
}
