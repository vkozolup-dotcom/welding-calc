"use client";

import { useEffect } from "react";

const BROKEN_CACHE_FIX = "welding-calc-sw-fix-v3";

/**
 * Registers SW only in production.
 * Clears old/broken workers so React hydrates and buttons stay clickable.
 */
export function ServiceWorkerRegister() {
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

    async function run() {
      // One-time purge of cache-first SW that served HTML instead of JS
      const alreadyFixed = localStorage.getItem(BROKEN_CACHE_FIX) === "1";
      if (!alreadyFixed) {
        await clearWorkersAndCaches();
        localStorage.setItem(BROKEN_CACHE_FIX, "1");
        // Reload once so the page loads without the broken SW controlling it
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
        await reg.update();
      } catch {
        /* ignore */
      }
    }

    void run();
  }, []);

  return null;
}
