"use client";

import { getErrorMessage } from "@/lib/error-message";
import React, { useState, useEffect } from "react";
import {
  Archive,
  Download,
  PlusCircle,
  RefreshCw,
  FileSpreadsheet,
  CheckCircle2,
  HardDrive,
  Database,
  Calendar,
  Building2,
  ShieldCheck,
} from "lucide-react";
import { NeuCard } from "@/components/ui/neu-card";
import { NeuButton } from "@/components/ui/neu-button";
import type { SystemBackupDTO } from "@/lib/application/admin/dto/BackupExportDTO";

export default function SuperAdminBackupsPage() {
  const [backups, setBackups] = useState<SystemBackupDTO[]>([]);
  const [companies, setCompanies] = useState<Array<{ id: string; name: string }>>([]);
  const [loadingBackups, setLoadingBackups] = useState(true);
  const [creatingBackup, setCreatingBackup] = useState(false);
  const [exportingMulti, setExportingMulti] = useState(false);
  const [selectedCompanyIds, setSelectedCompanyIds] = useState<string[]>([]);
  const [exportYear, setExportYear] = useState<string>("");
  const [toast, setToast] = useState<{ type: "success" | "error"; message: string } | null>(null);

  const showToast = (type: "success" | "error", message: string) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 4000);
  };

  const fetchBackups = async () => {
    setLoadingBackups(true);
    try {
      const res = await fetch("/api/v2/admin/backups");
      const json = await res.json();
      if (json.success) {
        setBackups(json.data.backups || []);
        setCompanies(json.data.companies || []);
      }
    } catch {
      showToast("error", "Échec du chargement des sauvegardes");
    } finally {
      setLoadingBackups(false);
    }
  };

  useEffect(() => {
    fetchBackups();
  }, []);

  const handleCreateBackup = async () => {
    setCreatingBackup(true);
    try {
      const res = await fetch("/api/v2/admin/backups", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ label: "Backup manuel Super Admin" }),
      });
      const json = await res.json();
      if (json.success) {
        showToast("success", "Sauvegarde système générée avec succès ✓");
        fetchBackups();
      } else {
        showToast("error", json.error || "Erreur de création du backup");
      }
    } catch {
      showToast("error", "Erreur lors de la sauvegarde");
    } finally {
      setCreatingBackup(false);
    }
  };

  const handleMultiExport = async () => {
    setExportingMulti(true);
    try {
      const params = new URLSearchParams();
      if (selectedCompanyIds.length > 0) {
        params.set("companyIds", selectedCompanyIds.join(","));
      }
      if (exportYear) {
        params.set("year", exportYear);
      }

      const res = await fetch(`/api/v2/admin/export/multi-company?${params.toString()}`);
      if (!res.ok) {
        const errJson = await res.json();
        throw new Error(errJson.error || "Erreur d'exportation");
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
    } catch (err: unknown) {
      showToast("error", getErrorMessage(err) || "Erreur lors de l'export");
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
          <h1 className="text-xl font-semibold text-[var(--neu-text)] flex items-center gap-3">
            <Archive size={24} className="text-[#666cff]" />
            Sauvegardes & Exports Multi-Entreprises
          </h1>
          <p className="text-xs text-[var(--neu-text-secondary)] mt-0.5">
            Centre de restauration de données, backups système et rapports consolidés multi-tenants
          </p>
        </div>

        <div className="flex items-center gap-3">
          <NeuButton
            variant="ghost"
            size="sm"
            onClick={fetchBackups}
            loading={loadingBackups}
          >
            <RefreshCw size={14} />
            Actualiser
          </NeuButton>
          <NeuButton
            variant="default"
            size="sm"
            onClick={handleCreateBackup}
            loading={creatingBackup}
          >
            <PlusCircle size={15} />
            {creatingBackup ? "Sauvegarde…" : "Créer une Sauvegarde"}
          </NeuButton>
        </div>
      </div>

      {toast && (
        <div className={`p-3 text-xs rounded-xl border ${toast.type === "success" ? "bg-[#72e128]/10 text-[#72e128] border-[#72e128]/20" : "bg-[#ff4d49]/10 text-[#ff4d49] border-[#ff4d49]/20"}`}>
          {toast.message}
        </div>
      )}

      {/* ── STATS RAPIDES ──────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <NeuCard className="p-4 flex items-center gap-4">
          <div className="p-3 bg-[#666cff]/15 text-[#666cff] rounded-xl">
            <Database size={22} />
          </div>
          <div>
            <div className="text-xs text-[var(--neu-text-secondary)]">Sauvegardes Réalisées</div>
            <div className="text-xl font-bold text-[var(--neu-text)]">{backups.length}</div>
          </div>
        </NeuCard>

        <NeuCard className="p-4 flex items-center gap-4">
          <div className="p-3 bg-[#72e128]/15 text-[#72e128] rounded-xl">
            <CheckCircle2 size={22} />
          </div>
          <div>
            <div className="text-xs text-[var(--neu-text-secondary)]">Dernier Backup</div>
            <div className="text-sm font-bold text-[#72e128]">
              {backups[0] ? new Date(backups[0].createdAt).toLocaleTimeString("fr-FR") : "Aucun"}
            </div>
          </div>
        </NeuCard>

        <NeuCard className="p-4 flex items-center gap-4">
          <div className="p-3 bg-[#26c6f9]/15 text-[#26c6f9] rounded-xl">
            <Building2 size={22} />
          </div>
          <div>
            <div className="text-xs text-[var(--neu-text-secondary)]">Entreprises Incluses</div>
            <div className="text-xl font-bold text-[var(--neu-text)]">{companies.length}</div>
          </div>
        </NeuCard>

        <NeuCard className="p-4 flex items-center gap-4">
          <div className="p-3 bg-[#fdb528]/15 text-[#fdb528] rounded-xl">
            <HardDrive size={22} />
          </div>
          <div>
            <div className="text-xs text-[var(--neu-text-secondary)]">Statut Système</div>
            <div className="text-sm font-bold text-[#72e128]">Opérationnel</div>
          </div>
        </NeuCard>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

        {/* ── SECTION 1 : HISTORIQUE DES SAUVEGARDES ─────────────────── */}
        <NeuCard className="p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-[var(--neu-border)] pb-3">
            <h2 className="text-sm font-bold text-[var(--neu-text)] flex items-center gap-2">
              <Database size={18} className="text-[#666cff]" />
              Historique des Snapshots de Sauvegarde
            </h2>
          </div>

          <div className="space-y-2.5 max-h-96 overflow-y-auto pr-1">
            {backups.length === 0 ? (
              <div className="text-xs text-[var(--neu-text-secondary)] text-center py-8">
                Aucune sauvegarde disponible. Cliquez sur "Créer une Sauvegarde".
              </div>
            ) : (
              backups.map((bk) => (
                <div
                  key={bk.id}
                  className="flex items-center justify-between p-3 rounded-xl border border-[var(--neu-border)] bg-[var(--neu-surface-light)] text-xs"
                >
                  <div>
                    <div className="font-semibold text-[var(--neu-text)]">{bk.filename}</div>
                    <div className="text-[10px] text-[var(--neu-text-secondary)] mt-0.5">
                      Taille: {bk.sizeFormatted} · {bk.recordCount} enregistrements ({bk.companyCount} entreprises)
                    </div>
                  </div>
                  <NeuButton
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      const link = document.createElement("a");
                      link.href = `/api/v2/admin/backups/download?file=${bk.filename}`;
                      link.setAttribute("download", bk.filename);
                      document.body.appendChild(link);
                      link.click();
                      document.body.removeChild(link);
                    }}
                  >
                    <Download size={13} />
                  </NeuButton>
                </div>
              ))
            )}
          </div>
        </NeuCard>

        {/* ── SECTION 2 : EXPORT MULTI-ENTREPRISES ──────────────────── */}
        <NeuCard className="p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-[var(--neu-border)] pb-3">
            <h2 className="text-sm font-bold text-[var(--neu-text)] flex items-center gap-2">
              <FileSpreadsheet size={18} className="text-[#26c6f9]" />
              Export Multi-Entreprises Consolidé
            </h2>
          </div>

          <p className="text-xs text-[var(--neu-text-secondary)]">
            Téléchargez un rapport CSV agrégé combinant les effectifs, bulletins et masses salariales de plusieurs entreprises.
          </p>

          <div className="space-y-4 text-xs">
            <div>
              <label className="font-semibold text-[var(--neu-text)] block mb-1">
                Entreprises à inclure ({selectedCompanyIds.length === 0 ? "Toutes" : `${selectedCompanyIds.length} sélectionnée(s)`})
              </label>
              <div className="border border-[var(--neu-border)] rounded-xl p-3 max-h-40 overflow-y-auto space-y-1.5 bg-[var(--neu-surface-light)]">
                <button
                  type="button"
                  onClick={() => setSelectedCompanyIds([])}
                  className={`w-full text-left text-xs font-semibold px-2 py-1 rounded-lg transition ${
                    selectedCompanyIds.length === 0 ? "bg-[#666cff] text-white" : "hover:bg-[var(--neu-surface)] text-[var(--neu-text-secondary)]"
                  }`}
                >
                  ✓ Toutes les entreprises ({companies.length})
                </button>
                {companies.map((c) => (
                  <label
                    key={c.id}
                    className="flex items-center gap-2 text-xs font-medium text-[var(--neu-text)] cursor-pointer hover:bg-[var(--neu-surface)] p-1 rounded-lg transition"
                  >
                    <input
                      type="checkbox"
                      checked={selectedCompanyIds.includes(c.id)}
                      onChange={() => toggleCompanySelection(c.id)}
                      className="rounded accent-[#666cff]"
                    />
                    <span className="truncate">{c.name}</span>
                  </label>
                ))}
              </div>
            </div>

            <div>
              <label className="font-semibold text-[var(--neu-text)] block mb-1">
                Année de référence (optionnel)
              </label>
              <select
                value={exportYear}
                onChange={(e) => setExportYear(e.target.value)}
                className="w-full bg-[var(--neu-surface)] border border-[var(--neu-border)] rounded-xl px-3 py-2 text-xs text-[var(--neu-text)]"
              >
                <option value="">Toutes les années</option>
                <option value="2026">2026</option>
                <option value="2025">2025</option>
                <option value="2024">2024</option>
              </select>
            </div>

            <NeuButton
              variant="default"
              size="full"
              onClick={handleMultiExport}
              loading={exportingMulti}
            >
              <Download size={14} />
              Générer et Télécharger l'Export Multi-Entreprises
            </NeuButton>
          </div>
        </NeuCard>

      </div>
    </div>
  );
}
