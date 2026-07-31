"use client";

import React from "react";
import { WifiOff, RefreshCw, ArrowLeft } from "lucide-react";
import Link from "next/link";

export default function OfflinePage() {
  const handleReload = () => {
    if (typeof window !== "undefined") {
      window.location.reload();
    }
  };

  return (
    <div className="min-h-screen w-full bg-[#080d19] text-white flex items-center justify-center p-4 font-sans select-none">
      <div className="w-full max-w-md bg-[#0f172a]/90 backdrop-blur-xl border border-slate-800 rounded-3xl p-8 shadow-2xl text-center space-y-6">
        
        <div className="flex justify-center">
          <div className="w-20 h-20 rounded-3xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center shadow-lg animate-bounce">
            <WifiOff size={40} />
          </div>
        </div>

        <div className="space-y-2">
          <h1 className="text-2xl font-bold tracking-tight">Mode Hors-Ligne</h1>
          <p className="text-sm text-slate-400 leading-relaxed">
            Vous n'avez actuellement pas de connexion internet. Vos pointages et actions sont automatiquement enregistrés et seront synchronisés dès le retour du réseau.
          </p>
        </div>

        <div className="pt-2 space-y-3">
          <button
            onClick={handleReload}
            className="w-full py-3.5 px-4 bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 text-white font-bold rounded-2xl shadow-lg flex items-center justify-center gap-2 transition"
          >
            <RefreshCw size={16} />
            <span>Recharger la page</span>
          </button>

          <Link
            href="/login"
            className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-white transition pt-2"
          >
            <ArrowLeft size={14} />
            <span>Retour à l'accueil</span>
          </Link>
        </div>

        <div className="pt-4 border-t border-slate-800/80 text-[11px] text-slate-500">
          PROGITPAIE PWA v2.5 — Mode Déconnecté Sécurisé IndexedDB
        </div>
      </div>
    </div>
  );
}
