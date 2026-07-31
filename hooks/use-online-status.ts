"use client";

import { useState, useEffect } from "react";
import { syncOfflineQueue } from "@/lib/offline-queue";

export function useOnlineStatus() {
  const [isOnline, setIsOnline] = useState<boolean>(true);

  useEffect(() => {
    if (typeof window === "undefined") return;

    setIsOnline(navigator.onLine);

    const handleOnline = () => {
      console.log("🌐 [RÉSEAU] Connexion rétablie !");
      setIsOnline(true);
      syncOfflineQueue();
    };

    const handleOffline = () => {
      console.log("📡 [RÉSEAU] Perte de connexion, bascule en mode Hors-Ligne.");
      setIsOnline(false);
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    // Enregistrement du Service Worker
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").then((reg) => {
        console.log("⚡ [PWA] Service Worker actif:", reg.scope);
      }).catch((err) => {
        console.error("❌ [PWA] Échec enregistrement Service Worker:", err);
      });
    }

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  return { isOnline };
}
