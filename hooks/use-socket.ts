"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { io, Socket } from "socket.io-client";

export interface RealtimeNotification {
  id: string;
  type: "CHECK_IN" | "CHECK_OUT" | "LEAVE_STATUS" | "DOCUMENT_READY";
  title: string;
  message: string;
  timestamp: string;
}

export function useSocket(token?: string) {
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [notifications, setNotifications] = useState<RealtimeNotification[]>([]);
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    if (!token) return;

    // Initialisation client Socket.io avec reconnexion automatique
    const socket = io({
      path: "/api/socket/io",
      auth: { token },
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      timeout: 10000,
    });

    socketRef.current = socket;

    socket.on("connect", () => {
      console.log("⚡ [WEBSOCKET] Connecté au serveur temps-réel !");
      setIsConnected(true);
    });

    socket.on("disconnect", () => {
      console.log("🔌 [WEBSOCKET] Déconnecté du serveur temps-réel.");
      setIsConnected(false);
    });

    // Écoute de l'événement de mise à jour des présences/pointages
    socket.on("attendance:updated", (data: any) => {
      const newNotif: RealtimeNotification = {
        id: Math.random().toString(36).substring(7),
        type: data.type,
        title: "📍 Pointage Géolocalisé GPS",
        message: `${data.user?.name || "Un employé"} vient d'effectuer son pointage.`,
        timestamp: data.timestamp || new Date().toISOString(),
      };
      setNotifications((prev) => [newNotif, ...prev]);
    });

    // Écoute de l'événement de mise à jour des congés
    socket.on("leave:updated", (data: any) => {
      const newNotif: RealtimeNotification = {
        id: Math.random().toString(36).substring(7),
        type: "LEAVE_STATUS",
        title: "🌴 Mise à Jour Demande de Congé",
        message: `Nouvelle notification de congé pour ${data.employeeName || "l'employé"}.`,
        timestamp: data.timestamp || new Date().toISOString(),
      };
      setNotifications((prev) => [newNotif, ...prev]);
    });

    return () => {
      socket.disconnect();
    };
  }, [token]);

  const emitCheckIn = useCallback((location: { lat: number; lng: number }) => {
    if (socketRef.current && isConnected) {
      socketRef.current.emit("attendance:checkin", { location });
    }
  }, [isConnected]);

  return {
    isConnected,
    notifications,
    emitCheckIn,
  };
}
