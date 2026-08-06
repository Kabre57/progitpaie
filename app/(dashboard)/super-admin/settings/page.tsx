"use client";

import React, { useState, useEffect } from "react";
import {
  Settings,
  Shield,
  FileCheck,
  Save,
  RotateCcw,
  RefreshCw,
  Percent,
  Calendar,
  Lock,
  DollarSign,
} from "lucide-react";
import { NeuCard } from "@/components/ui/neu-card";
import { NeuButton } from "@/components/ui/neu-button";
import { NeuInput } from "@/components/ui/neu-input";
import type { GlobalSettingsDTO } from "@/lib/application/admin/dto/GlobalSettingsDTO";

type SectionKey = "cnpsRates" | "leavePolicy" | "securityPolicy";

export default function SuperAdminSettingsPage() {
  const [settings, setSettings] = useState<GlobalSettingsDTO | null>(null);
  const [draft, setDraft] = useState<GlobalSettingsDTO | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [resetting, setResetting] = useState<string | null>(null);
  const [toast, setToast] = useState<{ type: "success" | "error"; message: string } | null>(null);

  const showToast = (type: "success" | "error", message: string) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 4000);
  };

  const fetchSettings = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/v2/admin/settings/global");
      const json = await res.json();
      if (json.success) {
        setSettings(json.data);
        setDraft(JSON.parse(JSON.stringify(json.data)));
      }
    } catch {
      showToast("error", "Erreur de chargement des paramètres");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const handleSave = async () => {
    if (!draft) return;
    setSaving(true);
    try {
      const res = await fetch("/api/v2/admin/settings/global", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          cnpsRates: draft.cnpsRates,
          leavePolicy: draft.leavePolicy,
          securityPolicy: draft.securityPolicy,
        }),
      });

      const json = await res.json();
      if (json.success) {
        setSettings(json.data);
        setDraft(JSON.parse(JSON.stringify(json.data)));
        showToast("success", "Paramètres enregistrés avec succès ✓");
      } else {
        showToast("error", json.error || "Erreur lors de la sauvegarde");
      }
    } catch {
      showToast("error", "Erreur de connexion");
    } finally {
      setSaving(false);
    }
  };

  const handleReset = async (section: SectionKey) => {
    if (!confirm(`Réinitialiser les valeurs par défaut légaux pour cette section ?`)) return;
    setResetting(section);
    try {
      const res = await fetch("/api/v2/admin/settings/global/reset", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ section }),
      });
      const json = await res.json();
      if (json.success) {
        setSettings(json.data);
        setDraft(JSON.parse(JSON.stringify(json.data)));
        showToast("success", "Valeurs légales par défaut restaurées ✓");
      } else {
        showToast("error", json.error || "Erreur lors de la réinitialisation");
      }
    } catch {
      showToast("error", "Erreur de connexion");
    } finally {
      setResetting(null);
    }
  };

  const updateDraft = (section: SectionKey, field: string, value: number | boolean) => {
    if (!draft) return;
    setDraft({
      ...draft,
      [section]: { ...(draft as any)[section], [field]: value },
    });
  };

  const hasChanges = JSON.stringify(settings) !== JSON.stringify(draft);

  if (loading) {
    return (
      <div className="p-6 space-y-6 max-w-4xl mx-auto animate-pulse">
        <div className="h-8 w-72 bg-[var(--neu-surface-light)] rounded-lg" />
        <div className="grid grid-cols-3 gap-3">
          {[...Array(3)].map((_, i) => <div key={i} className="h-20 bg-[var(--neu-surface-light)] rounded-2xl" />)}
        </div>
        <div className="h-96 bg-[var(--neu-surface-light)] rounded-2xl" />
      </div>
    );
  }

  if (!draft) return null;

  return (
    <div className="p-6 space-y-6 max-w-4xl mx-auto">

      {/* ── HEADER ─────────────────────────────────────────────────────── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold text-[var(--neu-text)] flex items-center gap-3">
            <Settings size={24} className="text-[#666cff]" />
            Paramètres Globaux du Système
          </h1>
          <p className="text-xs text-[var(--neu-text-secondary)] mt-0.5">
            Configuration nationale · Côte d'Ivoire · Mise à jour par le Super Administrateur uniquement
            {settings?.lastUpdatedAt && (
              <span className="ml-2 text-[#666cff]">
                · Dernière modification : {new Date(settings.lastUpdatedAt).toLocaleString("fr-FR")}
              </span>
            )}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <NeuButton
            variant="ghost"
            size="sm"
            onClick={fetchSettings}
            loading={loading}
            title="Actualiser"
          >
            <RefreshCw size={14} />
          </NeuButton>
          <NeuButton
            variant="default"
            size="sm"
            onClick={handleSave}
            loading={saving}
            disabled={!hasChanges}
          >
            <Save size={14} />
            {saving ? "Enregistrement…" : "Enregistrer tout"}
          </NeuButton>
        </div>
      </div>

      {toast && (
        <div className={`p-3 text-xs rounded-xl border ${toast.type === "success" ? "bg-[#72e128]/10 text-[#72e128] border-[#72e128]/20" : "bg-[#ff4d49]/10 text-[#ff4d49] border-[#ff4d49]/20"}`}>
          {toast.message}
        </div>
      )}

      {/* ── SECTION 1 : TAUX CNPS & ACCIDENT DU TRAVAIL ─────────────────── */}
      <NeuCard className="p-6 space-y-4">
        <div className="flex items-center justify-between border-b border-[var(--neu-border)] pb-3">
          <h2 className="text-sm font-bold text-[var(--neu-text)] flex items-center gap-2">
            <Percent size={18} className="text-[#666cff]" />
            Cotisations Sociales CNPS & Impôts (ITS, FDFP)
          </h2>
          <button
            onClick={() => handleReset("cnpsRates")}
            disabled={resetting === "cnpsRates"}
            className="text-xs text-[var(--neu-text-secondary)] hover:text-[#666cff] flex items-center gap-1 font-semibold"
          >
            <RotateCcw size={12} /> Restaurer Défauts Légaux
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          <NeuInput
            label="Plafond Mensuel CNPS Retraite (FCFA)"
            type="number"
            value={String(draft.cnpsRates.cnpsCeilingRetraite)}
            onChange={(e) => updateDraft("cnpsRates", "cnpsCeilingRetraite", parseFloat(e.target.value) || 0)}
          />
          <NeuInput
            label="Plafond Mensuel CNPS PF/AT (FCFA)"
            type="number"
            value={String(draft.cnpsRates.cnpsCeilingPF_AT)}
            onChange={(e) => updateDraft("cnpsRates", "cnpsCeilingPF_AT", parseFloat(e.target.value) || 0)}
          />
          <NeuInput
            label="Retraite Salarié (%)"
            type="number"
            step="0.01"
            value={String(draft.cnpsRates.cnpsEmployeeRetraite)}
            onChange={(e) => updateDraft("cnpsRates", "cnpsEmployeeRetraite", parseFloat(e.target.value) || 0)}
          />
          <NeuInput
            label="Retraite Employeur (%)"
            type="number"
            step="0.01"
            value={String(draft.cnpsRates.cnpsEmployerRetraite)}
            onChange={(e) => updateDraft("cnpsRates", "cnpsEmployerRetraite", parseFloat(e.target.value) || 0)}
          />
          <NeuInput
            label="Prestations Familiales Employeur (%)"
            type="number"
            step="0.01"
            value={String(draft.cnpsRates.cnpsEmployerPF)}
            onChange={(e) => updateDraft("cnpsRates", "cnpsEmployerPF", parseFloat(e.target.value) || 0)}
          />
          <NeuInput
            label="Accident du Travail Employeur (%)"
            type="number"
            step="0.01"
            value={String(draft.cnpsRates.cnpsEmployerAT)}
            onChange={(e) => updateDraft("cnpsRates", "cnpsEmployerAT", parseFloat(e.target.value) || 0)}
          />
          <NeuInput
            label="Taux ITS Saisie (%)"
            type="number"
            step="0.01"
            value={String(draft.cnpsRates.itsRate)}
            onChange={(e) => updateDraft("cnpsRates", "itsRate", parseFloat(e.target.value) || 0)}
          />
          <NeuInput
            label="FDFP Taxe Apprentissage (%)"
            type="number"
            step="0.01"
            value={String(draft.cnpsRates.fdfpTA)}
            onChange={(e) => updateDraft("cnpsRates", "fdfpTA", parseFloat(e.target.value) || 0)}
          />
        </div>
      </NeuCard>

      {/* ── SECTION 2 : CONGÉS PAYÉS & DROITS DU TRAVAIL ─────────────────── */}
      <NeuCard className="p-6 space-y-4">
        <div className="flex items-center justify-between border-b border-[var(--neu-border)] pb-3">
          <h2 className="text-sm font-bold text-[var(--neu-text)] flex items-center gap-2">
            <Calendar size={18} className="text-[#fdb528]" />
            Politique Légale des Congés & Jours Fériés
          </h2>
          <button
            onClick={() => handleReset("leavePolicy")}
            disabled={resetting === "leavePolicy"}
            className="text-xs text-[var(--neu-text-secondary)] hover:text-[#fdb528] flex items-center gap-1 font-semibold"
          >
            <RotateCcw size={12} /> Restaurer Code du Travail
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          <NeuInput
            label="Congés Annuels Légaux (Jours)"
            type="number"
            value={String(draft.leavePolicy.annualLeaveDays)}
            onChange={(e) => updateDraft("leavePolicy", "annualLeaveDays", parseFloat(e.target.value) || 0)}
          />
          <NeuInput
            label="Congés Maladie (Jours)"
            type="number"
            value={String(draft.leavePolicy.sickLeaveDays)}
            onChange={(e) => updateDraft("leavePolicy", "sickLeaveDays", parseInt(e.target.value, 10) || 0)}
          />
          <NeuInput
            label="Congé Maternité (Jours)"
            type="number"
            value={String(draft.leavePolicy.maternityLeaveDays)}
            onChange={(e) => updateDraft("leavePolicy", "maternityLeaveDays", parseInt(e.target.value, 10) || 0)}
          />
          <NeuInput
            label="Congé Paternité (Jours)"
            type="number"
            value={String(draft.leavePolicy.paternityLeaveDays)}
            onChange={(e) => updateDraft("leavePolicy", "paternityLeaveDays", parseInt(e.target.value, 10) || 0)}
          />
        </div>
      </NeuCard>

      {/* ── SECTION 3 : POLITIQUES DE SÉCURITÉ & TOKENS JWT ──────────────── */}
      <NeuCard className="p-6 space-y-4">
        <div className="flex items-center justify-between border-b border-[var(--neu-border)] pb-3">
          <h2 className="text-sm font-bold text-[var(--neu-text)] flex items-center gap-2">
            <Lock size={18} className="text-[#ff4d49]" />
            Sécurité JWT, MFA & Sessions Utilisateurs
          </h2>
          <button
            onClick={() => handleReset("securityPolicy")}
            disabled={resetting === "securityPolicy"}
            className="text-xs text-[var(--neu-text-secondary)] hover:text-[#ff4d49] flex items-center gap-1 font-semibold"
          >
            <RotateCcw size={12} /> Restaurer Défauts Sécurité
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          <NeuInput
            label="Durée Expiration Token JWT (Minutes)"
            type="number"
            value={String(draft.securityPolicy.jwtExpiresInMinutes)}
            onChange={(e) => updateDraft("securityPolicy", "jwtExpiresInMinutes", parseInt(e.target.value, 10) || 0)}
          />
          <NeuInput
            label="Tentatives Max de Connexion (Lockout)"
            type="number"
            value={String(draft.securityPolicy.maxLoginAttempts)}
            onChange={(e) => updateDraft("securityPolicy", "maxLoginAttempts", parseInt(e.target.value, 10) || 0)}
          />
          <div className="flex items-center gap-3 pt-2">
            <input
              type="checkbox"
              id="mfaRequired"
              checked={draft.securityPolicy.requireMFA}
              onChange={(e) => updateDraft("securityPolicy", "requireMFA", e.target.checked)}
              className="rounded accent-[#666cff] w-4 h-4"
            />
            <label htmlFor="mfaRequired" className="font-semibold text-[var(--neu-text)] cursor-pointer">
              Exiger l'Authentification 2FA (MFA) pour tous les Admins
            </label>
          </div>
        </div>
      </NeuCard>

    </div>
  );
}
