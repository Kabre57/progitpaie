"use client";

import React from "react";
import { X, Clock } from "lucide-react";

export function ComingSoonModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="relative z-10 w-full max-w-sm">
        <div className="relative p-6 rounded-2xl bg-[var(--neu-surface)] shadow-[8px_8px_16px_var(--neu-shadow-dark),-8px_-8px_16px_var(--neu-shadow-light)]">
          <button
            onClick={onClose}
            className="absolute top-3 right-3 p-1 rounded-lg text-[var(--neu-text-secondary)] hover:text-[var(--neu-text)] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex justify-center mb-4">
            <div className="w-16 h-16 rounded-xl bg-[var(--neu-bg)] shadow-[inset_2px_2px_4px_var(--neu-shadow-dark),inset_-2px_-2px-4px_var(--neu-shadow-light)] flex items-center justify-center">
              <Clock className="w-8 h-8 text-[var(--neu-accent)]" />
            </div>
          </div>

          <div className="text-center">
            <h3 className="text-xl font-bold text-[var(--neu-text)] mb-2">
              Bientôt disponible
            </h3>
            <p className="text-sm text-[var(--neu-text-secondary)] mb-4">
              La connexion via Google est en cours de développement. Veuillez utiliser votre adresse email et mot de passe.
            </p>
            <button
              onClick={onClose}
              className="px-6 py-2 rounded-xl bg-[var(--neu-accent)] text-white font-medium shadow-[4px_4px_8px_var(--neu-shadow-dark),-4px_-4px-8px_var(--neu-shadow-light)] hover:shadow-[6px_6px_12px_var(--neu-shadow-dark),-6px_-6px-12px_var(--neu-shadow-light)] transition-all"
            >
              D'accord
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
