"use client";

import React from "react";
import { Wifi, WifiOff, Bell, MapPin, Calendar, CheckCircle2 } from "lucide-react";
import { RealtimeNotification } from "@/hooks/use-socket";

export interface RealtimeToastProps {
  isConnected: boolean;
  notifications: RealtimeNotification[];
}

export function RealtimeNotificationToast({ isConnected, notifications }: RealtimeToastProps) {
  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 max-w-sm w-full pointer-events-none">
      {/* Badge de Statut WebSocket Connexion */}
      <div className="self-end pointer-events-auto">
        <div className={`px-3 py-1.5 rounded-full text-xs font-bold flex items-center gap-2 border shadow-lg backdrop-blur-md transition-all ${
          isConnected
            ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400"
            : "bg-amber-500/10 border-amber-500/30 text-amber-400"
        }`}>
          {isConnected ? <Wifi size={14} className="animate-pulse text-emerald-400" /> : <WifiOff size={14} />}
          <span>{isConnected ? "Temps-Réel Actif" : "Connexion WebSocket..."}</span>
        </div>
      </div>

      {/* Liste des Toasts Temps-Réel */}
      {notifications.slice(0, 3).map((notif) => (
        <div
          key={notif.id}
          className="pointer-events-auto p-4 rounded-2xl bg-slate-900/90 border border-slate-800 text-white shadow-2xl backdrop-blur-xl animate-in slide-in-from-bottom-5 duration-300 flex items-start gap-3"
        >
          <div className="p-2 rounded-xl bg-emerald-500/20 text-emerald-400 shrink-0">
            {notif.type === "CHECK_IN" ? <MapPin size={18} /> : <Calendar size={18} />}
          </div>
          <div className="flex-1 space-y-0.5">
            <h4 className="text-xs font-bold text-white flex items-center justify-between">
              <span>{notif.title}</span>
              <span className="text-[10px] text-slate-400 font-mono">
                {new Date(notif.timestamp).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}
              </span>
            </h4>
            <p className="text-xs text-slate-300 leading-snug">{notif.message}</p>
          </div>
        </div>
      ))}
    </div>
  );
}
