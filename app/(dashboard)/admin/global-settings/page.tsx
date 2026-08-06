"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  Settings,
  Shield,
  Calendar,
  RefreshCw,
  Save,
  RotateCcw,
  CheckCircle2,
  AlertCircle,
  ChevronRight,
  Percent,
  Lock,
  DollarSign,
} from "lucide-react";
import { NeuCard } from "@/components/ui/neu-card";
import { NeuInput } from "@/components/ui/neu-input";
import type { GlobalSettingsDTO } from "@/lib/application/admin/dto/GlobalSettingsDTO";

// ─── Types ───────────────────────────────────────────────────────────────────
type SectionKey = "cnpsRates" | "leavePolicy" | "securityPolicy";

// ─── Section Tab ─────────────────────────────────────────────────────────────
const SECTIONS = [
  {
    key: "cnpsRates" as SectionKey,
    label: "Taux CNPS & Fiscaux",
    icon: <Percent size={18} />,
    desc: "Barèmes légaux ivoiriens — CNPS, ITS, FDFP, CMU",
    color: "text-emerald-500",
    bg: "bg-emerald-500/10",
  },
  {
    key: "leavePolicy" as SectionKey,
    label: "Politique de Congés",
    icon: <Calendar size={18} />,
    desc: "Jours de congés légaux annuels, maladie, maternité, paternité",
    color: "text-blue-400",
    bg: "bg-blue-400/10",
  },
  {
    key: "securityPolicy" as SectionKey,
    label: "Sécurité & Sessions",
    icon: <Shield size={18} />,
    desc: "Durée JWT, tentatives de connexion, MFA, longueur de mot de passe",
    color: "text-violet-400",
    bg: "bg-violet-400/10",
  },
];

// ─── Field Row ────────────────────────────────────────────────────────────────
interface FieldRowProps {
  label: string;
  description?: string;
  unit?: string;
  type?: "number" | "toggle";
  value: number | boolean;
  onChange: (v: number | boolean) => void;
  min?: number;
  max?: number;
  step?: number;
}

function FieldRow({ label, description, unit, type = "number", value, onChange, min, max, step = 0.01 }: FieldRowProps) {
  return (
    <div className="flex items-start justify-between py-3 border-b border-[var(--neu-border)] last:border-0 gap-4">
      <div className="min-w-0">
        <div className="text-sm font-medium text-[var(--neu-text)]">{label}</div>
        {description && (
          <div className="text-xs text-[var(--neu-text-subtle)] mt-0.5">{description}</div>
        )}
      </div>

      <div className="flex items-center gap-2 shrink-0">
        {type === "toggle" ? (
          <button
            type="button"
            onClick={() => onChange(!(value as boolean))}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
              value ? "bg-emerald-600" : "bg-[var(--neu-border)]"
            }`}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                value ? "translate-x-6" : "translate-x-1"
              }`}
            />
          </button>
        ) : (
          <div className="flex items-center gap-1.5">
            <NeuInput
              type="number"
              value={String(value)}
              onChange={(e) => onChange(parseFloat(e.target.value) || 0)}
              min={min}
              max={max}
              step={step}
              className="w-28 text-sm text-right pr-2"
            />
            {unit && (
              <span className="text-xs text-[var(--neu-text-subtle)] w-10">{unit}</span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Toast ───────────────────────────────────────────────────────────────────
function Toast({ type, message }: { type: "success" | "error"; message: string }) {
  return (
    <div
      className={`fixed bottom-6 right-6 z-50 flex items-center gap-3 px-5 py-3.5 rounded-2xl shadow-2xl border text-sm font-medium animate-in slide-in-from-bottom-4 ${
        type === "success"
          ? "bg-emerald-600/95 border-emerald-500/50 text-white"
          : "bg-rose-600/95 border-rose-500/50 text-white"
      }`}
    >
      {type === "success" ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
      {message}
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function GlobalSettingsPage() {
  const [settings, setSettings] = useState<GlobalSettingsDTO | null>(null);
  const [draft, setDraft] = useState<GlobalSettingsDTO | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [resetting, setResetting] = useState<SectionKey | null>(null);
  const [activeSection, setActiveSection] = useState<SectionKey>("cnpsRates");
  const [toast, setToast] = useState<{ type: "success" | "error"; message: string } | null>(null);

  const showToast = (type: "success" | "error", message: string) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 3500);
  };

  // ─── Load settings ─────────────────────────────────────────────────────
  const fetchSettings = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/v2/admin/settings/global");
      const json = await res.json();
      if (json.success) {
        setSettings(json.data);
        setDraft(JSON.parse(JSON.stringify(json.data)));
      }
    } catch {
      showToast("error", "Impossible de charger les paramètres");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchSettings(); }, [fetchSettings]);

  // ─── Save ──────────────────────────────────────────────────────────────
  const handleSave = async () => {
    if (!draft) return;
    setSaving(true);
    try {
      const res = await fetch("/api/v2/admin/settings/global", {
        method: "PUT",
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

  // ─── Reset section ─────────────────────────────────────────────────────
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

  // ─── Draft helpers ─────────────────────────────────────────────────────
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
        <div className="h-8 w-72 bg-[var(--neu-bg-subtle)] rounded-lg" />
        <div className="grid grid-cols-3 gap-3">
          {[...Array(3)].map((_, i) => <div key={i} className="h-20 bg-[var(--neu-bg-subtle)] rounded-2xl" />)}
        </div>
        <div className="h-96 bg-[var(--neu-bg-subtle)] rounded-2xl" />
      </div>
    );
  }

  if (!draft) return null;

  return (
    <div className="p-6 space-y-6 max-w-4xl mx-auto">

      {/* ── HEADER ─────────────────────────────────────────────────────── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[var(--neu-text)] flex items-center gap-3">
            <Settings size={28} className="text-emerald-500" />
            Paramètres Globaux du Système
          </h1>
          <p className="text-xs text-[var(--neu-text-subtle)] mt-1">
            Configuration nationale · Côte d'Ivoire · Mise à jour par le Super Administrateur uniquement
            {settings?.lastUpdatedAt && (
              <span className="ml-2 text-emerald-500">
                · Dernière modification : {new Date(settings.lastUpdatedAt).toLocaleString("fr-FR")}
              </span>
            )}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={fetchSettings}
            disabled={loading}
            className="p-2 border border-[var(--neu-border)] hover:border-emerald-500/40 hover:text-emerald-500 rounded-xl transition"
            title="Actualiser"
          >
            <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
          </button>
          <button
            onClick={handleSave}
            disabled={saving || !hasChanges}
            className="flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold rounded-xl transition disabled:opacity-40"
          >
            <Save size={16} />
            {saving ? "Enregistrement…" : "Enregistrer tout"}
          </button>
        </div>
      </div>

      {/* Unsaved changes banner */}
      {hasChanges && (
        <div className="flex items-center gap-3 p-3.5 rounded-xl bg-amber-400/10 border border-amber-400/30 text-amber-400 text-sm">
          <AlertCircle size={16} />
          Modifications non enregistrées — Cliquez sur <strong>"Enregistrer tout"</strong> pour sauvegarder
        </div>
      )}

      {/* ── SECTION TABS ───────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {SECTIONS.map((s) => (
          <button
            key={s.key}
            onClick={() => setActiveSection(s.key)}
            className={`p-4 rounded-2xl border text-left transition-all ${
              activeSection === s.key
                ? `border-emerald-500/50 ${s.bg} shadow-lg`
                : "border-[var(--neu-border)] hover:border-emerald-500/30"
            }`}
          >
            <div className={`flex items-center gap-2 font-bold text-sm mb-1 ${s.color}`}>
              {s.icon} {s.label}
              {activeSection === s.key && <ChevronRight size={14} className="ml-auto" />}
            </div>
            <div className="text-xs text-[var(--neu-text-subtle)] leading-relaxed">{s.desc}</div>
          </button>
        ))}
      </div>

      {/* ── SECTION PANEL ──────────────────────────────────────────────── */}
      <NeuCard className="p-6">
        {/* Section header */}
        <div className="flex items-center justify-between mb-5 pb-4 border-b border-[var(--neu-border)]">
          {(() => {
            const s = SECTIONS.find((s) => s.key === activeSection)!;
            return (
              <div className="flex items-center gap-3">
                <div className={`p-2.5 rounded-xl ${s.bg} ${s.color}`}>{s.icon}</div>
                <div>
                  <div className="font-bold text-[var(--neu-text)]">{s.label}</div>
                  <div className="text-xs text-[var(--neu-text-subtle)]">{s.desc}</div>
                </div>
              </div>
            );
          })()}

          <button
            onClick={() => handleReset(activeSection)}
            disabled={resetting === activeSection}
            className="flex items-center gap-1.5 text-xs text-[var(--neu-text-subtle)] hover:text-amber-400 border border-[var(--neu-border)] hover:border-amber-400/30 px-3 py-2 rounded-xl transition"
            title="Réinitialiser aux valeurs légales par défaut"
          >
            <RotateCcw size={13} className={resetting === activeSection ? "animate-spin" : ""} />
            Réinitialiser
          </button>
        </div>

        {/* ── CNPS RATES ─────────────────────────────────────────────── */}
        {activeSection === "cnpsRates" && (
          <div>
            <div className="text-xs font-bold text-emerald-500 uppercase tracking-wider mb-3 flex items-center gap-1.5">
              <DollarSign size={13} /> CNPS — Cotisations Sociales
            </div>
            <FieldRow label="Cotisation salarié Retraite" description="Part salarié — Cotisation CNPS Vieillesse" unit="%" value={draft.cnpsRates.cnpsEmployeeRetraite} onChange={(v) => updateDraft("cnpsRates", "cnpsEmployeeRetraite", v)} min={0} max={20} />
            <FieldRow label="Cotisation patronale Retraite" description="Part employeur — CNPS Vieillesse" unit="%" value={draft.cnpsRates.cnpsEmployerRetraite} onChange={(v) => updateDraft("cnpsRates", "cnpsEmployerRetraite", v)} min={0} max={20} />
            <FieldRow label="Accidents du Travail (AT)" description="Part patronale CNPS — Risques Professionnels" unit="%" value={draft.cnpsRates.cnpsEmployerAT} onChange={(v) => updateDraft("cnpsRates", "cnpsEmployerAT", v)} min={0} max={10} />
            <FieldRow label="Prestations Familiales (PF)" description="Part patronale CNPS — Allocations Familiales" unit="%" value={draft.cnpsRates.cnpsEmployerPF} onChange={(v) => updateDraft("cnpsRates", "cnpsEmployerPF", v)} min={0} max={15} />
            <FieldRow label="Plafond mensuel CNPS Retraite" description="Assiette maximale pour la cotisation retraite" unit="FCFA" value={draft.cnpsRates.cnpsCeilingRetraite} onChange={(v) => updateDraft("cnpsRates", "cnpsCeilingRetraite", v)} min={0} step={1000} />
            <FieldRow label="Plafond mensuel PF / AT" description="Assiette maximale pour Prestations Familiales & AT" unit="FCFA" value={draft.cnpsRates.cnpsCeilingPF_AT} onChange={(v) => updateDraft("cnpsRates", "cnpsCeilingPF_AT", v)} min={0} step={1000} />

            <div className="text-xs font-bold text-blue-400 uppercase tracking-wider mt-5 mb-3 flex items-center gap-1.5">
              <Percent size={13} /> FDFP & ITS
            </div>
            <FieldRow label="FDFP — Taxe d'Apprentissage" unit="%" value={draft.cnpsRates.fdfpTA} onChange={(v) => updateDraft("cnpsRates", "fdfpTA", v)} min={0} max={5} />
            <FieldRow label="FDFP — Formation Professionnelle Continue" unit="%" value={draft.cnpsRates.fdfpFPC} onChange={(v) => updateDraft("cnpsRates", "fdfpFPC", v)} min={0} max={5} />
            <FieldRow label="ITS — Impôt sur Traitement et Salaire" unit="%" value={draft.cnpsRates.itsRate} onChange={(v) => updateDraft("cnpsRates", "itsRate", v)} min={0} max={50} />

            <div className="text-xs font-bold text-violet-400 uppercase tracking-wider mt-5 mb-3 flex items-center gap-1.5">
              <Shield size={13} /> CMU & Paramètres généraux
            </div>
            <FieldRow label="CMU — Base mensuelle" unit="FCFA" value={draft.cnpsRates.cmuBase} onChange={(v) => updateDraft("cnpsRates", "cmuBase", v)} min={0} step={100} />
            <FieldRow label="CMU — Part salarié" unit="%" value={draft.cnpsRates.cmuEmployeeRate} onChange={(v) => updateDraft("cnpsRates", "cmuEmployeeRate", v)} min={0} max={100} />
            <FieldRow label="CMU — Part patronale" unit="%" value={draft.cnpsRates.cmuEmployerRate} onChange={(v) => updateDraft("cnpsRates", "cmuEmployerRate", v)} min={0} max={100} />
            <FieldRow label="Transport exonéré" description="Montant mensuel de transport non soumis aux charges" unit="FCFA" value={draft.cnpsRates.transportExemptAmount} onChange={(v) => updateDraft("cnpsRates", "transportExemptAmount", v)} min={0} step={1000} />
            <FieldRow label="Heures mensuelles de base" unit="h" value={draft.cnpsRates.defaultHourlyBase} onChange={(v) => updateDraft("cnpsRates", "defaultHourlyBase", v)} min={140} max={220} step={0.01} />
          </div>
        )}

        {/* ── LEAVE POLICY ───────────────────────────────────────────── */}
        {activeSection === "leavePolicy" && (
          <div>
            <div className="text-xs font-bold text-blue-400 uppercase tracking-wider mb-3">
              Jours de congés légaux annuels
            </div>
            <FieldRow label="Congés annuels payés" description="Code du Travail Ivoirien — Article 25" unit="jours" value={draft.leavePolicy.annualLeaveDays} onChange={(v) => updateDraft("leavePolicy", "annualLeaveDays", v)} min={0} max={365} step={1} />
            <FieldRow label="Congés maladie" description="Absences maladie prise en charge annuelle" unit="jours" value={draft.leavePolicy.sickLeaveDays} onChange={(v) => updateDraft("leavePolicy", "sickLeaveDays", v)} min={0} max={365} step={1} />
            <FieldRow label="Congé maternité" description="Durée légale congé maternité (Ivoirien : 14 semaines)" unit="jours" value={draft.leavePolicy.maternityLeaveDays} onChange={(v) => updateDraft("leavePolicy", "maternityLeaveDays", v)} min={0} max={365} step={1} />
            <FieldRow label="Congé paternité" description="Durée légale congé paternité" unit="jours" value={draft.leavePolicy.paternityLeaveDays} onChange={(v) => updateDraft("leavePolicy", "paternityLeaveDays", v)} min={0} max={90} step={1} />
          </div>
        )}

        {/* ── SECURITY ───────────────────────────────────────────────── */}
        {activeSection === "securityPolicy" && (
          <div>
            <div className="text-xs font-bold text-violet-400 uppercase tracking-wider mb-3 flex items-center gap-1.5">
              <Lock size={13} /> Politique d'Authentification & Sessions
            </div>
            <FieldRow
              label="Durée session JWT"
              description="Durée de validité des jetons d'accès avant déconnexion automatique"
              unit="min"
              value={draft.securityPolicy.jwtExpiresInMinutes}
              onChange={(v) => updateDraft("securityPolicy", "jwtExpiresInMinutes", v)}
              min={15} max={10080} step={15}
            />
            <FieldRow
              label="Tentatives de connexion max"
              description="Nombre maximal d'essais avant blocage temporaire du compte"
              unit="essais"
              value={draft.securityPolicy.maxLoginAttempts}
              onChange={(v) => updateDraft("securityPolicy", "maxLoginAttempts", v)}
              min={1} max={20} step={1}
            />
            <FieldRow
              label="Durée de blocage"
              description="Durée pendant laquelle le compte est bloqué après trop de tentatives"
              unit="min"
              value={draft.securityPolicy.lockoutDurationMinutes}
              onChange={(v) => updateDraft("securityPolicy", "lockoutDurationMinutes", v)}
              min={1} max={1440} step={1}
            />
            <FieldRow
              label="Longueur minimale du mot de passe"
              description="Nombre minimum de caractères requis pour les mots de passe"
              unit="chars"
              value={draft.securityPolicy.minPasswordLength}
              onChange={(v) => updateDraft("securityPolicy", "minPasswordLength", v)}
              min={6} max={64} step={1}
            />
            <FieldRow
              label="MFA — Authentification à 2 facteurs obligatoire"
              description="Exiger la double authentification pour tous les administrateurs"
              type="toggle"
              value={draft.securityPolicy.requireMFA}
              onChange={(v) => updateDraft("securityPolicy", "requireMFA", v)}
            />

            {/* Security summary */}
            <div className="mt-5 p-4 rounded-xl bg-violet-500/5 border border-violet-500/20 text-xs text-[var(--neu-text-subtle)] space-y-1">
              <div className="font-bold text-violet-400 mb-2">Résumé de la configuration actuelle</div>
              <div>🔒 Session : <strong className="text-[var(--neu-text)]">{draft.securityPolicy.jwtExpiresInMinutes} min</strong> ({(draft.securityPolicy.jwtExpiresInMinutes / 60).toFixed(1)}h)</div>
              <div>🚫 Blocage après : <strong className="text-[var(--neu-text)]">{draft.securityPolicy.maxLoginAttempts} tentatives</strong> → {draft.securityPolicy.lockoutDurationMinutes} min de pause</div>
              <div>🔑 Mot de passe : minimum <strong className="text-[var(--neu-text)]">{draft.securityPolicy.minPasswordLength} caractères</strong></div>
              <div>📱 MFA : <strong className={draft.securityPolicy.requireMFA ? "text-emerald-400" : "text-[var(--neu-text-subtle)]"}>{draft.securityPolicy.requireMFA ? "✓ Activé" : "✗ Désactivé"}</strong></div>
            </div>
          </div>
        )}
      </NeuCard>

      {/* ── TOAST ──────────────────────────────────────────────────────── */}
      {toast && <Toast type={toast.type} message={toast.message} />}
    </div>
  );
}
