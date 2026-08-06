"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  ScrollText,
  Search,
  Filter,
  RefreshCw,
  Download,
  Calendar,
  Building2,
  User,
  ChevronLeft,
  ChevronRight,
  X,
  FileCode,
} from "lucide-react";
import { NeuCard } from "@/components/ui/neu-card";
import { NeuButton } from "@/components/ui/neu-button";
import { NeuBadge } from "@/components/ui/neu-badge";
import { NeuInput } from "@/components/ui/neu-input";
import type {
  AuditLogEntryDTO,
  AuditLogListResultDTO,
  AuditLogFiltersMetaDTO,
} from "@/lib/application/admin/dto/AuditLogDTO";

function formatActionBadge(action: string) {
  if (action.includes("CREATE") || action.includes("ADD")) {
    return <NeuBadge variant="success">{action}</NeuBadge>;
  }
  if (action.includes("DELETE") || action.includes("SUSPEND") || action.includes("REJECT")) {
    return <NeuBadge variant="danger">{action}</NeuBadge>;
  }
  if (action.includes("UPDATE") || action.includes("VERIFY") || action.includes("EDIT")) {
    return <NeuBadge variant="warning">{action}</NeuBadge>;
  }
  return <NeuBadge variant="accent">{action}</NeuBadge>;
}

export default function SuperAdminAuditLogsPage() {
  const [result, setResult] = useState<AuditLogListResultDTO | null>(null);
  const [meta, setMeta] = useState<AuditLogFiltersMetaDTO | null>(null);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [selectedLog, setSelectedLog] = useState<AuditLogEntryDTO | null>(null);

  // Filters state
  const [search, setSearch] = useState("");
  const [actionFilter, setActionFilter] = useState("");
  const [targetModelFilter, setTargetModelFilter] = useState("");
  const [companyFilter, setCompanyFilter] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [page, setPage] = useState(1);
  const LIMIT = 50;

  const searchTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    fetch("/api/v2/admin/audit-logs?meta=1")
      .then((r) => r.json())
      .then((j) => { if (j.success) setMeta(j.data); })
      .catch(console.error);
  }, []);

  const fetchLogs = useCallback(async (pg = 1) => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.set("search", search);
      if (actionFilter) params.set("action", actionFilter);
      if (targetModelFilter) params.set("targetModel", targetModelFilter);
      if (companyFilter) params.set("companyId", companyFilter);
      if (fromDate) params.set("fromDate", fromDate);
      if (toDate) params.set("toDate", toDate);
      params.set("page", String(pg));
      params.set("limit", String(LIMIT));

      const res = await fetch(`/api/v2/admin/audit-logs?${params.toString()}`);
      const json = await res.json();
      if (json.success) {
        setResult(json.data);
        setPage(pg);
      }
    } catch (err) {
      console.error("Erreur chargement audit logs:", err);
    } finally {
      setLoading(false);
    }
  }, [search, actionFilter, targetModelFilter, companyFilter, fromDate, toDate]);

  useEffect(() => {
    if (searchTimeout.current) clearTimeout(searchTimeout.current);
    searchTimeout.current = setTimeout(() => fetchLogs(1), search ? 400 : 0);
    return () => { if (searchTimeout.current) clearTimeout(searchTimeout.current); };
  }, [fetchLogs]);

  const handleExport = async () => {
    setExporting(true);
    try {
      const params = new URLSearchParams();
      if (search) params.set("search", search);
      if (actionFilter) params.set("action", actionFilter);
      if (targetModelFilter) params.set("targetModel", targetModelFilter);
      if (companyFilter) params.set("companyId", companyFilter);
      if (fromDate) params.set("fromDate", fromDate);
      if (toDate) params.set("toDate", toDate);

      const url = `/api/v2/admin/audit-logs/export?${params.toString()}`;
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", "");
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } finally {
      setTimeout(() => setExporting(false), 1500);
    }
  };

  const resetFilters = () => {
    setSearch("");
    setActionFilter("");
    setTargetModelFilter("");
    setCompanyFilter("");
    setFromDate("");
    setToDate("");
  };

  const hasFilters =
    search || actionFilter || targetModelFilter || companyFilter || fromDate || toDate;

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">

      {/* ── HEADER ─────────────────────────────────────────────────────── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold text-[var(--neu-text)] flex items-center gap-3">
            <ScrollText size={24} className="text-[#666cff]" />
            Journal d'Audit Global
          </h1>
          <p className="text-xs text-[var(--neu-text-secondary)] mt-0.5">
            Traçabilité de toutes les actions sur l'ensemble des entreprises du groupe
          </p>
        </div>
        <div className="flex items-center gap-3">
          <NeuButton
            variant="outline"
            size="sm"
            onClick={handleExport}
            loading={exporting}
          >
            <Download size={14} />
            {exporting ? "Export…" : "Exporter CSV"}
          </NeuButton>
          <NeuButton
            variant="default"
            size="sm"
            onClick={() => fetchLogs(page)}
            loading={loading}
          >
            <RefreshCw size={14} />
            Actualiser
          </NeuButton>
        </div>
      </div>

      {/* ── STATS RAPIDES ──────────────────────────────────────────────── */}
      {result && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { label: "Total événements", value: result.total.toLocaleString(), color: "text-[#666cff]" },
            { label: "Page actuelle", value: `${result.page} / ${result.totalPages || 1}`, color: "text-[#26c6f9]" },
            { label: "Résultats / page", value: result.logs.length, color: "text-[#72e128]" },
            { label: "Filtre actif", value: hasFilters ? "OUI" : "Aucun", color: hasFilters ? "text-[#fdb528]" : "text-[var(--neu-text-secondary)]" },
          ].map(({ label, value, color }) => (
            <NeuCard key={label} className="p-4 text-center">
              <div className={`text-xl font-bold ${color}`}>{value}</div>
              <div className="text-xs text-[var(--neu-text-secondary)] mt-1">{label}</div>
            </NeuCard>
          ))}
        </div>
      )}

      {/* ── FILTRES ────────────────────────────────────────────────────── */}
      <NeuCard className="p-5 space-y-4">
        <div className="flex items-center justify-between">
          <div className="text-xs font-bold text-[var(--neu-text)] uppercase tracking-wider flex items-center gap-2">
            <Filter size={14} className="text-[#666cff]" />
            Filtres de recherche multi-critères
          </div>
          {hasFilters && (
            <button
              onClick={resetFilters}
              className="text-xs text-[#ff4d49] hover:underline flex items-center gap-1 font-semibold"
            >
              <X size={13} /> Réinitialiser
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          <div className="lg:col-span-2">
            <NeuInput
              type="text"
              placeholder="Rechercher action, email, entité..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="text-xs"
            />
          </div>

          <div>
            <select
              value={actionFilter}
              onChange={(e) => setActionFilter(e.target.value)}
              className="w-full bg-[var(--neu-surface)] border border-[var(--neu-border)] rounded-xl px-2.5 py-2 text-xs text-[var(--neu-text)]"
            >
              <option value="">Toutes les actions</option>
              {meta?.actions.map((a) => (
                <option key={a} value={a}>{a}</option>
              ))}
            </select>
          </div>

          <div>
            <select
              value={targetModelFilter}
              onChange={(e) => setTargetModelFilter(e.target.value)}
              className="w-full bg-[var(--neu-surface)] border border-[var(--neu-border)] rounded-xl px-2.5 py-2 text-xs text-[var(--neu-text)]"
            >
              <option value="">Tous les modèles</option>
              {meta?.targetModels.map((m) => (
                <option key={m} value={m}>{m}</option>
              ))}
            </select>
          </div>

          <div>
            <select
              value={companyFilter}
              onChange={(e) => setCompanyFilter(e.target.value)}
              className="w-full bg-[var(--neu-surface)] border border-[var(--neu-border)] rounded-xl px-2.5 py-2 text-xs text-[var(--neu-text)]"
            >
              <option value="">Toutes les entreprises</option>
              {meta?.companies.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>

          <div className="flex gap-1.5">
            <input
              type="date"
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
              className="w-1/2 bg-[var(--neu-surface)] border border-[var(--neu-border)] rounded-xl px-2 py-2 text-[10px] text-[var(--neu-text)]"
              title="Date de début"
            />
            <input
              type="date"
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
              className="w-1/2 bg-[var(--neu-surface)] border border-[var(--neu-border)] rounded-xl px-2 py-2 text-[10px] text-[var(--neu-text)]"
              title="Date de fin"
            />
          </div>
        </div>
      </NeuCard>

      {/* ── TABLEAU DES LOGS ───────────────────────────────────────────── */}
      <NeuCard className="p-6">
        {loading ? (
          <div className="text-center py-12 text-[var(--neu-text-secondary)]">Chargement des événements...</div>
        ) : !result || result.logs.length === 0 ? (
          <div className="text-center py-12 text-[var(--neu-text-secondary)]">Aucun événement ne correspond aux critères.</div>
        ) : (
          <div className="space-y-4">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-[var(--neu-surface-light)] text-[var(--neu-text-secondary)] border-b border-[var(--neu-border)]">
                  <tr>
                    <th className="p-3 font-semibold">Date & Heure</th>
                    <th className="p-3 font-semibold">Action</th>
                    <th className="p-3 font-semibold">Utilisateur</th>
                    <th className="p-3 font-semibold">Entreprise</th>
                    <th className="p-3 font-semibold">Modèle Cible</th>
                    <th className="p-3 font-semibold text-right">Détails</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--neu-border)]">
                  {result.logs.map((log) => (
                    <tr
                      key={log.id}
                      onClick={() => setSelectedLog(log)}
                      className="hover:bg-[var(--neu-surface-light)] transition cursor-pointer"
                    >
                      <td className="p-3 text-[var(--neu-text-secondary)] font-mono whitespace-nowrap">
                        {new Date(log.timestamp).toLocaleString("fr-FR")}
                      </td>
                      <td className="p-3">{formatActionBadge(log.action)}</td>
                      <td className="p-3">
                        <div className="font-semibold text-[var(--neu-text)]">{log.performedByName}</div>
                        <div className="text-[10px] text-[var(--neu-text-secondary)] font-mono">{log.performedByEmail}</div>
                      </td>
                      <td className="p-3 text-[var(--neu-text-secondary)]">
                        {log.companyName || "Groupe (Global)"}
                      </td>
                      <td className="p-3 font-mono text-[var(--neu-text-secondary)]">
                        {log.targetModel} {log.targetId ? `#${log.targetId.slice(-6)}` : ""}
                      </td>
                      <td className="p-3 text-right">
                        <button className="p-1.5 text-[#666cff] hover:bg-[#666cff]/10 rounded-lg transition">
                          <FileCode size={15} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <div className="flex items-center justify-between pt-3 border-t border-[var(--neu-border)] text-xs text-[var(--neu-text-secondary)]">
              <div>
                Affichage de {(result.page - 1) * result.limit + 1} à{" "}
                {Math.min(result.page * result.limit, result.total)} sur {result.total} entrées
              </div>
              <div className="flex items-center gap-2">
                <NeuButton
                  variant="ghost"
                  size="sm"
                  disabled={page <= 1}
                  onClick={() => fetchLogs(page - 1)}
                >
                  <ChevronLeft size={14} /> Précédent
                </NeuButton>
                <span className="font-bold text-[var(--neu-text)]">
                  {page} / {result.totalPages || 1}
                </span>
                <NeuButton
                  variant="ghost"
                  size="sm"
                  disabled={page >= result.totalPages}
                  onClick={() => fetchLogs(page + 1)}
                >
                  Suivant <ChevronRight size={14} />
                </NeuButton>
              </div>
            </div>
          </div>
        )}
      </NeuCard>

      {/* ── DRAWER DETAIL LOG (JSON DIFF) ──────────────────────────────── */}
      {selectedLog && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex justify-end">
          <div className="w-full max-w-lg bg-[var(--neu-surface)] border-l border-[var(--neu-border)] p-6 space-y-4 overflow-y-auto h-full">
            <div className="flex items-center justify-between border-b border-[var(--neu-border)] pb-3">
              <h2 className="text-sm font-bold text-[var(--neu-text)] flex items-center gap-2">
                <ScrollText size={18} className="text-[#666cff]" />
                Détail de l'Événement Audit
              </h2>
              <button
                onClick={() => setSelectedLog(null)}
                className="p-1 text-[var(--neu-text-secondary)] hover:text-[var(--neu-text)]"
              >
                <X size={18} />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-3 bg-[var(--neu-surface-light)] rounded-xl space-y-1.5 border border-[var(--neu-border)]">
                <div className="flex justify-between">
                  <span className="text-[var(--neu-text-secondary)]">Action</span>
                  <span>{formatActionBadge(selectedLog.action)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[var(--neu-text-secondary)]">Exécuté par</span>
                  <span className="font-semibold text-[var(--neu-text)]">{selectedLog.performedByName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[var(--neu-text-secondary)]">Email</span>
                  <span className="font-mono text-[var(--neu-text-secondary)]">{selectedLog.performedByEmail}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[var(--neu-text-secondary)]">Entreprise</span>
                  <span className="font-semibold text-[var(--neu-text)]">{selectedLog.companyName || "Global"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[var(--neu-text-secondary)]">Date</span>
                  <span className="font-mono text-[var(--neu-text)]">{new Date(selectedLog.timestamp).toLocaleString("fr-FR")}</span>
                </div>
              </div>

              {selectedLog.oldValues && (
                <div>
                  <div className="font-bold text-[#ff4d49] mb-1 uppercase tracking-wider">Valeurs Précédentes</div>
                  <pre className="p-3 bg-[#ff4d49]/5 border border-[#ff4d49]/20 text-[#ff4d49] rounded-xl overflow-x-auto font-mono text-[10px]">
                    {JSON.stringify(selectedLog.oldValues, null, 2)}
                  </pre>
                </div>
              )}

              {selectedLog.newValues && (
                <div>
                  <div className="font-bold text-[#72e128] mb-1 uppercase tracking-wider">Nouvelles Valeurs</div>
                  <pre className="p-3 bg-[#72e128]/5 border border-[#72e128]/20 text-[#72e128] rounded-xl overflow-x-auto font-mono text-[10px]">
                    {JSON.stringify(selectedLog.newValues, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
