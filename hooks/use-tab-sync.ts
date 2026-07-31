"use client";

import { useEffect, useState } from "react";
import { tabSyncManager, TabSyncEventType, TabSyncMessage } from "@/lib/tab-sync-manager";

export function useTabSync() {
  const [lastSyncEvent, setLastSyncEvent] = useState<TabSyncMessage | null>(null);

  useEffect(() => {
    // Écoute de la déconnexion multi-onglets
    const unsubscribeLogout = tabSyncManager.subscribe("AUTH_LOGOUT", () => {
      console.log("🔒 [MULTI-ONGLETS] Déconnexion requise par un autre onglet.");
      window.location.href = "/login";
    });

    // Écoute des modifications de profil
    const unsubscribeProfile = tabSyncManager.subscribe("PROFILE_UPDATED", (msg) => {
      setLastSyncEvent(msg);
    });

    // Écoute des pointages GPS
    const unsubscribeAttendance = tabSyncManager.subscribe("ATTENDANCE_UPDATED", (msg) => {
      setLastSyncEvent(msg);
    });

    return () => {
      unsubscribeLogout();
      unsubscribeProfile();
      unsubscribeAttendance();
    };
  }, []);

  const notifyLogout = () => {
    tabSyncManager.publish("AUTH_LOGOUT", { reason: "User triggered logout" });
  };

  const notifyAttendanceUpdate = (data: any) => {
    tabSyncManager.publish("ATTENDANCE_UPDATED", data);
  };

  const notifyProfileUpdate = (data: any) => {
    tabSyncManager.publish("PROFILE_UPDATED", data);
  };

  return {
    lastSyncEvent,
    notifyLogout,
    notifyAttendanceUpdate,
    notifyProfileUpdate,
  };
}
