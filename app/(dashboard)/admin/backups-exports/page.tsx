"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  Database,
  Download,
  HardDrive,
  RefreshCw,
  PlusCircle,
  FileSpreadsheet,
  CheckCircle2,
  Clock,
  Building2,
  Users,
  DollarSign,
  AlertCircle,
  Layers,
  Archive,
} from "lucide-react";
import { NeuCard } from "@/components/ui/neu-card";
import type { SystemBackupDTO } from "@/lib/application/admin/dto/BackupExportDTO";

export default function BackupsExportsPage() {
  const [backups, setBackups] = useState<SystemBackupDTO[]>([]);
  const [loadingBackups, setLoadingBackups] = useState(true);
  const [creatingBackup, setCreatingBackup] = useState(false);
  const [exportingMulti, setExportingMulti] = useState(false);
  const [companies, setCompanies] = useState<Array<{ id: string; name: string }>>([]);
  const [selectedCompanyIds, setSelectedCompanyIds] = useState<string[]>([]);
  const [exportYear, setExportYear] = useState<string>(String(new Date().getFullYear()));
  const [toast, setToast] = useState<{ type: "success" | "error"; message: string } | null>(null);

  const showToast = (type: "success" | "error", message: string) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 3500);
  };

  // ─── Load backups & companies ──────────────────────────────────────────
  const fetchBackups = useCallback(async () => {
    setLoadingBackups(true);
    try {
      const res = await fetch("/api/v2/admin/backups");
      const json = await res.json();
      if (json.success) setBackups(json.data);
    } catch {
      showToast("error", "Impossible de charger les sauvegardes");
    } finally {
      setLoadingBackups(false);
    }
  }, []);

  useEffect(() => {
    fetchBackups();
    // Load companies for export selector
    fetch("/api/v2/admin/tenants?limit=100")
      .then((r) => r.json())
      .then((j) => {
        if (j.success && j.data?.tenants) {
          setCompanies(j.data.tenants.map((t: any) => ({ id: t.id, name: t.name })));
        }
      })
      .catch(console.error);
  }, [fetchBackups]);

  // ─── Create Backup ─────────────────────────────────────────────────────
  const handleCreateBackup = async () => {
    setCreatingBackup(true);
    try {
      const res = await fetch("/api/v2/admin/backups", { method: "POST" });
      const json = await res.json();
      if (json.success) {
        setBackups((prev) => [json.data, ...prev]);
        showToast("success", "Nouvelle sauvegarde créée avec succès ✓");
      } else {
        showToast("error", json.error || "Échec de la sauvegarde");
      }
    } catch {
      showToast("error", "Erreur réseau lors de la sauvegarde");
    } finally {
      setCreatingBackup(false);
    }
  };

  // ─── Export Multi-Company ──────────────────────────────────────────────
  const handleExportMultiCompany = async () => {
    setExportingMulti(true);
    try {
      const res = await fetch("/api/v2/admin/export/multi-company", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          companyIds: selectedCompanyIds.length > 0 ? selectedCompanyIds : undefined,
          year: exportYear ? parseInt(exportYear, 10) : undefined,
        }),
      });

      if (!res.ok) {
        const json = await res.json();
        throw new Error(json.error || "Échec de l'export");
      }

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `export_multi_entreprises_${new Date().toISOString().slice(0, 10)}.csv`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      showToast("success", "Export multi-entreprises téléchargé ✓");
    } catch (err: any) {
      showToast("error", err.message || "Erreur lors de l'export");
    } finally {
      setExportingMulti(false);
    }
  };

  const toggleCompanySelection = (id: string) => {
    setSelectedCompanyIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">

      {/* ── HEADER ─────────────────────────────────────────────────────── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[var(--neu-text)] flex items-center gap-3">
            <Archive size={28} className="text-emerald-500" />
            Sauvegardes & Exports Multi-Entreprises
          </h1>
          <p className="text-xs text-[var(--neu-text-subtle)] mt-1">
            Centre de restauration de données, backups système et rapports consolidés multi-tenants
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={fetchBackups}
            disabled={loadingBackups}
            className="flex items-center gap-2 px-4 py-2 bg-[var(--neu-bg-subtle)] border border-[var(--neu-border)] hover:border-emerald-500/40 hover:text-emerald-500 text-sm font-semibold rounded-xl transition disabled:opacity-50"
          >
            <RefreshCw size={15} className={loadingBackups ? "animate-spin" : ""} />
            Actualiser
          </button>
          <button
            onClick={handleCreateBackup}
            disabled={creatingBackup}
            className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold rounded-xl transition disabled:opacity-50"
          >
            <PlusCircle size={16} />
            {creatingBackup ? "Sauvegarde en cours…" : "Créer une Sauvegarde"}
          </button>
        </div>
      </div>

      {/* ── STATS RAPIDES ──────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <NeuCard className="p-4 flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-500">
            <Database size={22} />
          </div>
          <div>
            <div className="text-lg font-bold text-[var(--neu-text)]">{backups.length}</div>
            <div className="text-xs text-[var(--neu-text-subtle)]">Sauvegardes système</div>
          </div>
        </NeuCard>

        <NeuCard className="p-4 flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-blue-400/10 text-blue-400">
            <Building2 size={22} />
          </div>
          <div>
            <div className="text-lg font-bold text-[var(--neu-text)]">{companies.length}</div>
            <div className="text-xs text-[var(--neu-text-subtle)]">Entreprises configurées</div>
          </div>
        </NeuCard>

        <NeuCard className="p-4 flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-violet-400/10 text-violet-400">
            <HardDrive size={22} />
          </div>
          <div>
            <div className="text-lg font-bold text-[var(--neu-text)]">
              {backups[0]?.sizeFormatted ?? "0 MB"}
            </div>
            <div className="text-xs text-[var(--neu-text-subtle)]">Dernier snapshot</div>
          </div>
        </NeuCard>

        <NeuCard className="p-4 flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-amber-400/10 text-amber-400">
            <CheckCircle2 size={22} />
          </div>
          <div>
            <div className="text-lg font-bold text-emerald-400">Opérationnel</div>
            <div className="text-xs text-[var(--neu-text-subtle)]">Statut du stockage</div>
          </div>
        </NeuCard>
      </div>

      {/* ── TWO-COLUMN LAYOUT ──────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* ── SECTION 1 : SAUVEGARDES SYSTEME ───────────────────────── */}
        <NeuCard className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-bold text-[var(--neu-text)] flex items-center gap-2">
              <Database size={18} className="text-emerald-500" />
              Historique des Sauvegardes Système
            </h2>
            <span className="text-xs text-[var(--neu-text-subtle)] font-medium">
              {backups.length} fichier{backups.length > 1 ? "s" : ""}
            </span>
          </div>

          <div className="space-y-2.5 max-h-[420px] overflow-y-auto pr-1">
            {loadingBackups ? (
              [...Array(4)].map((_, i) => (
                <div key={i} className="h-16 bg-[var(--neu-bg-subtle)] rounded-xl animate-pulse" />
              ))
            ) : backups.length === 0 ? (
              <div className="text-center py-10 text-[var(--neu-text-subtle)] text-sm">
                Aucune sauvegarde disponible. Cliquez sur "Créer une Sauvegarde".
              </div>
            ) : (
              backups.map((b) => (
                <div
                  key={b.id}
                  className="p-3.5 rounded-xl border border-[var(--neu-border)] hover:bg-[var(--neu-bg-subtle)] transition flex items-center justify-between gap-3 text-sm"
                >
                  <div className="min-w-0">
                    <div className="font-semibold text-[var(--neu-text)] truncate text-xs font-mono">
                      {b.filename}
                    </div>
                    <div className="text-xs text-[var(--neu-text-subtle)] mt-1 flex items-center gap-3">
                      <span>{b.sizeFormatted}</span>
                      <span>•</span>
                      <span>{b.companyCount} entreprises</span>
                      <span>•</span>
                      <span>{b.recordCount} enregistrements</span>
                    </div>
                    <div className="text-[10px] text-[var(--neu-text-subtle)] mt-0.5">
                      {new Date(b.createdAt).toLocaleString("fr-FR")}
                    </div>
                  </div>

                  <div className="shrink-0 flex items-center gap-2">
                    <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
                      {b.status}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </NeuCard>

        {/* ── SECTION 2 : EXPORT MULTI-ENTREPRISES ──────────────────── */}
        <NeuCard className="p-6">
          <h2 className="text-base font-bold text-[var(--neu-text)] flex items-center gap-2 mb-2">
            <FileSpreadsheet size={18} className="text-blue-400" />
            Export Multi-Entreprises Consolidé
          </h2>
          <p className="text-xs text-[var(--neu-text-subtle)] mb-5">
            Téléchargez un rapport CSV agrégé combinant les effectifs, bulletins et masses salariales de plusieurs entreprises.
          </p>

          {/* Option 1: Sélection des entreprises */}
          <div className="space-y-4 text-sm">
            <div>
              <label className="text-xs font-bold text-[var(--neu-text-subtle)] uppercase tracking-wider block mb-2">
                Entreprises à inclure ({selectedCompanyIds.length === 0 ? "Toutes" : `${selectedCompanyIds.length} sélectionnée(s)`})
              </label>
              <div className="border border-[var(--neu-border)] rounded-xl p-3 max-h-48 overflow-y-auto space-y-1.5 bg-[var(--neu-bg-subtle)]/40">
                <button
                  type="button"
                  onClick={() => setSelectedCompanyIds([])}
                  className={`w-full text-left text-xs font-semibold px-2 py-1 rounded-lg transition ${
                    selectedCompanyIds.length === 0 ? "bg-emerald-600 text-white" : "hover:bg-[var(--neu-bg-subtle)] text-[var(--neu-text-subtle)]"
                  }`}
                >
                  ✓ Toutes les entreprises ({companies.length})
                </button>
                {companies.map((c) => (
                  <label
                    key={c.id}
                    className="flex items-center gap-2 text-xs font-medium text-[var(--neu-text)] cursor-pointer hover:bg-[var(--neu-bg-subtle)] p-1 rounded-lg transition"
                  >
                    <input
                      type="checkbox"
                      checked={selectedCompanyIds.includes(c.id)}
                      onChange={() => toggleCompanySelection(c.id)}
                      className="rounded accent-emerald-600"
                    />
                    <span className="truncate">{c.name}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Option 2: Année de référence */}
            <div>
              <label className="text-xs font-bold text-[var(--neu-text-subtle)] uppercase tracking-wider block mb-1">
                Année de référence (optionnel)
              </label>
              <select
                value={exportYear}
                onChange={(e) => setExportYear(e.target.value)}
                className="w-full bg-[var(--neu-bg)] border border-[var(--neu-border)] text-sm rounded-xl px-3 py-2 text-[var(--neu-text)] focus:outline-none focus:border-emerald-500/50"
              >
                <option value="">Toutes les années</option>
                <option value="2026">2026</option>
                <option value="2025">2025</option>
                <option value="2024">2024</option>
              </select>
            </div>

            {/* Trigger export */}
            <div className="pt-2">
              <button
                onClick={handleExportMultiCompany}
                disabled={exportingMulti}
                className="w-full flex items-center justify-center gap-2 px-5 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl text-sm transition disabled:opacity-50 shadow-lg shadow-blue-600/20"
              >
                <Download size={16} className={exportingMulti ? "animate-bounce" : ""} />
                {exportingMulti ? "Génération de l'export CSV…" : "Télécharger le Rapport Consolidé CSV"}
              </button>
            </div>
          </div>
        </NeuCard>

      </div>

      {/* ── TOAST ──────────────────────────────────────────────────────── */}
      {toast && (
        <div
          className={`fixed bottom-6 right-6 z-50 flex items-center gap-3 px-5 py-3.5 rounded-2xl shadow-2xl border text-sm font-medium animate-in slide-in-from-bottom-4 ${
            toast.type === "success"
              ? "bg-emerald-600/95 border-emerald-500/50 text-white"
              : "bg-rose-600/95 border-rose-500/50 text-white"
          }`}
        >
          {toast.type === "success" ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
          {toast.message}
        </div>
      )}
    </div>
  );
}
