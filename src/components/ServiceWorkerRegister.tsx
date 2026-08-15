"use client";

import { useEffect, useState } from "react";

const BROKEN_CACHE_FIX = "welding-calc-sw-fix-v3";

/**
 * Registers SW only in production.
 * Clears old/broken workers so React hydrates and buttons stay clickable.
 * Shows a reload banner when a new SW is waiting.
 */
export function ServiceWorkerRegister() {
  const [updateReady, setUpdateReady] = useState(false);
  const [lang] = useState(() =>
    typeof document !== "undefined"
      ? document.documentElement.lang || "pl"
      : "pl",
  );

  useEffect(() => {
    if (typeof window === "undefined" || !("serviceWorker" in navigator)) {
      return;
    }

    const isProd = process.env.NODE_ENV === "production";

    async function clearWorkersAndCaches() {
      const regs = await navigator.serviceWorker.getRegistrations();
      await Promise.all(regs.map((r) => r.unregister()));
      if ("caches" in window) {
        const keys = await caches.keys();
        await Promise.all(keys.map((k) => caches.delete(k)));
      }
    }

    function watchForUpdate(reg: ServiceWorkerRegistration) {
      if (reg.waiting) setUpdateReady(true);
      reg.addEventListener("updatefound", () => {
        const worker = reg.installing;
        if (!worker) return;
        worker.addEventListener("statechange", () => {
          if (worker.state === "installed" && navigator.serviceWorker.controller) {
            setUpdateReady(true);
          }
        });
      });
    }

    async function run() {
      const alreadyFixed = localStorage.getItem(BROKEN_CACHE_FIX) === "1";
      if (!alreadyFixed) {
        await clearWorkersAndCaches();
        localStorage.setItem(BROKEN_CACHE_FIX, "1");
        if (navigator.serviceWorker.controller) {
          window.location.reload();
          return;
        }
      }

      if (!isProd) {
        await clearWorkersAndCaches();
        return;
      }

      try {
        const reg = await navigator.serviceWorker.register("/sw.js");
        watchForUpdate(reg);
        await reg.update();
        if (reg.waiting) setUpdateReady(true);
      } catch {
        /* ignore */
      }
    }

    void run();
  }, []);

  if (!updateReady) return null;

  const label =
    lang === "en" ? "Update available" : "Dostępna aktualizacja";
  const action = lang === "en" ? "Reload" : "Odśwież";

  return (
    <div className="fixed inset-x-0 top-0 z-50 flex justify-center px-3 pt-[max(0.5rem,env(safe-area-inset-top))] no-print">
      <div className="flex max-w-lg items-center gap-3 rounded-2xl border border-amber-500/50 bg-slate-950/95 px-3 py-2 text-sm text-amber-100 shadow-lg backdrop-blur">
        <span className="font-medium">{label}</span>
        <button
          type="button"
          className="rounded-xl bg-amber-500 px-3 py-1.5 text-xs font-bold text-slate-950"
          onClick={() => {
            const reload = () => window.location.reload();
            navigator.serviceWorker.getRegistration().then((reg) => {
              if (reg?.waiting) {
                reg.waiting.postMessage({ type: "SKIP_WAITING" });
                // Even without message handler, reload picks up new SW after skipWaiting in install
                setTimeout(reload, 200);
              } else {
                reload();
              }
            });
          }}
        >
          {action}
        </button>
      </div>
    </div>
  );
}
