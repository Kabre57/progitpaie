"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  ScrollText,
  Search,
  Filter,
  Download,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  Building2,
  User,
  Calendar,
  Layers,
  Zap,
  Eye,
  X,
  ExternalLink,
} from "lucide-react";
import { NeuCard } from "@/components/ui/neu-card";
import { NeuInput } from "@/components/ui/neu-input";
import type {
  AuditLogEntryDTO,
  AuditLogListResultDTO,
  AuditLogFiltersMetaDTO,
} from "@/lib/application/admin/dto/AuditLogDTO";

// ─── Colour mapping for actions ──────────────────────────────────────────────

function actionColor(action: string): string {
  const a = action.toUpperCase();
  if (a.startsWith("CREATE")) return "text-emerald-500 bg-emerald-500/10 border-emerald-500/20";
  if (a.startsWith("UPDATE") || a.startsWith("EDIT")) return "text-blue-400 bg-blue-400/10 border-blue-400/20";
  if (a.startsWith("DELETE")) return "text-rose-500 bg-rose-500/10 border-rose-500/20";
  if (a.startsWith("LOGIN") || a.startsWith("LOGOUT") || a.startsWith("AUTH")) return "text-violet-400 bg-violet-400/10 border-violet-400/20";
  if (a.startsWith("OVERRIDE") || a.startsWith("FORCE")) return "text-amber-400 bg-amber-400/10 border-amber-400/20";
  return "text-[var(--neu-text-subtle)] bg-[var(--neu-bg-subtle)] border-[var(--neu-border)]";
}

// ─── Detail Drawer ───────────────────────────────────────────────────────────

function AuditLogDrawer({
  log,
  onClose,
}: {
  log: AuditLogEntryDTO;
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex">
      {/* Backdrop */}
      <div className="flex-1 bg-black/40 backdrop-blur-sm" onClick={onClose} />

      {/* Drawer panel */}
      <div className="w-full max-w-lg bg-[var(--neu-bg)] border-l border-[var(--neu-border)] shadow-2xl flex flex-col overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-[var(--neu-border)]">
          <h2 className="font-bold text-[var(--neu-text)] flex items-center gap-2">
            <ScrollText size={18} className="text-emerald-500" />
            Détail de l'Événement
          </h2>
          <button onClick={onClose} className="p-1.5 hover:bg-[var(--neu-bg-subtle)] rounded-lg transition">
            <X size={18} className="text-[var(--neu-text-subtle)]" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-4 text-sm">
          {/* Action badge */}
          <div>
            <div className="text-xs text-[var(--neu-text-subtle)] mb-2 uppercase tracking-wider font-semibold">Action</div>
            <span className={`inline-flex items-center px-3 py-1.5 rounded-lg border text-xs font-bold ${actionColor(log.action)}`}>
              {log.action}
            </span>
          </div>

          {/* Grid fields */}
          <div className="grid grid-cols-2 gap-3">
            {[
              { label: "Entreprise", value: log.companyName, icon: <Building2 size={13} /> },
              { label: "Modèle Ciblé", value: log.targetModel, icon: <Layers size={13} /> },
              { label: "ID Ressource", value: log.targetId ?? "—", icon: <ExternalLink size={13} /> },
              { label: "Effectué par", value: log.performedByName, icon: <User size={13} /> },
              { label: "Email", value: log.performedByEmail, icon: <User size={13} /> },
              { label: "Adresse IP", value: log.ipAddress ?? "—", icon: <Zap size={13} /> },
              {
                label: "Date & Heure",
                value: new Date(log.timestamp).toLocaleString("fr-FR"),
                icon: <Calendar size={13} />,
              },
            ].map(({ label, value, icon }) => (
              <div key={label} className="p-3 rounded-xl border border-[var(--neu-border)] bg-[var(--neu-bg-subtle)]">
                <div className="flex items-center gap-1.5 text-xs text-[var(--neu-text-subtle)] mb-1">
                  {icon} {label}
                </div>
                <div className="font-semibold text-[var(--neu-text)] text-xs break-all">{value}</div>
              </div>
            ))}
          </div>

          {/* Old values */}
          {log.oldValues && Object.keys(log.oldValues).length > 0 && (
            <div>
              <div className="text-xs text-[var(--neu-text-subtle)] uppercase tracking-wider font-semibold mb-2">
                Valeurs Avant
              </div>
              <pre className="text-xs bg-rose-500/5 border border-rose-500/20 rounded-xl p-3 overflow-auto text-rose-400 max-h-48">
                {JSON.stringify(log.oldValues, null, 2)}
              </pre>
            </div>
          )}

          {/* New values */}
          {log.newValues && Object.keys(log.newValues).length > 0 && (
            <div>
              <div className="text-xs text-[var(--neu-text-subtle)] uppercase tracking-wider font-semibold mb-2">
                Valeurs Après
              </div>
              <pre className="text-xs bg-emerald-500/5 border border-emerald-500/20 rounded-xl p-3 overflow-auto text-emerald-400 max-h-48">
                {JSON.stringify(log.newValues, null, 2)}
              </pre>
            </div>
          )}

          {/* User agent */}
          {log.userAgent && (
            <div>
              <div className="text-xs text-[var(--neu-text-subtle)] uppercase tracking-wider font-semibold mb-1">
                Navigateur / Appareil
              </div>
              <div className="text-xs text-[var(--neu-text-subtle)] break-all">{log.userAgent}</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function AuditLogsGlobalPage() {
  const [result, setResult] = useState<AuditLogListResultDTO | null>(null);
  const [meta, setMeta] = useState<AuditLogFiltersMetaDTO | null>(null);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [selectedLog, setSelectedLog] = useState<AuditLogEntryDTO | null>(null);

  // ─── Filters state ─────────────────────────────────────────────────────
  const [search, setSearch] = useState("");
  const [actionFilter, setActionFilter] = useState("");
  const [targetModelFilter, setTargetModelFilter] = useState("");
  const [companyFilter, setCompanyFilter] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [page, setPage] = useState(1);
  const LIMIT = 50;

  const searchTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ─── Fetch meta once ───────────────────────────────────────────────────
  useEffect(() => {
    fetch("/api/v2/admin/audit-logs?meta=1")
      .then((r) => r.json())
      .then((j) => { if (j.success) setMeta(j.data); })
      .catch(console.error);
  }, []);

  // ─── Fetch logs ────────────────────────────────────────────────────────
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

  // Re-fetch when filters change (debounced for search)
  useEffect(() => {
    if (searchTimeout.current) clearTimeout(searchTimeout.current);
    searchTimeout.current = setTimeout(() => fetchLogs(1), search ? 400 : 0);
    return () => { if (searchTimeout.current) clearTimeout(searchTimeout.current); };
  }, [fetchLogs]);

  // ─── CSV Export ────────────────────────────────────────────────────────
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
          <h1 className="text-2xl font-bold text-[var(--neu-text)] flex items-center gap-3">
            <ScrollText size={28} className="text-emerald-500" />
            Journal d'Audit Global
          </h1>
          <p className="text-xs text-[var(--neu-text-subtle)] mt-1">
            Traçabilité de toutes les actions sur l'ensemble des entreprises du groupe
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={handleExport}
            disabled={exporting}
            className="flex items-center gap-2 px-4 py-2 bg-[var(--neu-bg-subtle)] border border-[var(--neu-border)] hover:border-emerald-500/40 hover:text-emerald-500 text-sm font-semibold rounded-xl transition disabled:opacity-50"
          >
            <Download size={15} className={exporting ? "animate-bounce" : ""} />
            {exporting ? "Export en cours…" : "Exporter CSV"}
          </button>
          <button
            onClick={() => fetchLogs(page)}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold rounded-xl transition disabled:opacity-50"
          >
            <RefreshCw size={15} className={loading ? "animate-spin" : ""} />
            Actualiser
          </button>
        </div>
      </div>

      {/* ── STATS RAPIDES ──────────────────────────────────────────────── */}
      {result && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { label: "Total événements", value: result.total.toLocaleString(), color: "text-emerald-500" },
            { label: "Page actuelle", value: `${result.page} / ${result.totalPages || 1}`, color: "text-blue-400" },
            { label: "Résultats / page", value: result.logs.length, color: "text-violet-400" },
            { label: "Filtre actif", value: hasFilters ? "OUI" : "Aucun", color: hasFilters ? "text-amber-400" : "text-[var(--neu-text-subtle)]" },
          ].map(({ label, value, color }) => (
            <NeuCard key={label} className="p-4 text-center">
              <div className={`text-xl font-bold ${color}`}>{value}</div>
              <div className="text-xs text-[var(--neu-text-subtle)] mt-1">{label}</div>
            </NeuCard>
          ))}
        </div>
      )}

      {/* ── FILTRES ────────────────────────────────────────────────────── */}
      <NeuCard className="p-5">
        <div className="flex items-center gap-2 mb-4">
          <Filter size={16} className="text-emerald-500" />
          <span className="text-sm font-bold text-[var(--neu-text)]">Filtres Avancés</span>
          {hasFilters && (
            <button
              onClick={resetFilters}
              className="ml-auto text-xs text-rose-500 hover:underline flex items-center gap-1"
            >
              <X size={12} /> Réinitialiser
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {/* Free search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--neu-text-subtle)]" size={15} />
            <NeuInput
              type="text"
              placeholder="Rechercher action, utilisateur, entreprise…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 w-full text-sm"
            />
          </div>

          {/* Action filter */}
          <select
            value={actionFilter}
            onChange={(e) => setActionFilter(e.target.value)}
            className="bg-[var(--neu-bg)] border border-[var(--neu-border)] text-sm rounded-xl px-3 py-2.5 text-[var(--neu-text)] focus:outline-none focus:border-emerald-500/50"
          >
            <option value="">Toutes les actions</option>
            {meta?.actions.map((a) => (
              <option key={a} value={a}>{a}</option>
            ))}
          </select>

          {/* Target model filter */}
          <select
            value={targetModelFilter}
            onChange={(e) => setTargetModelFilter(e.target.value)}
            className="bg-[var(--neu-bg)] border border-[var(--neu-border)] text-sm rounded-xl px-3 py-2.5 text-[var(--neu-text)] focus:outline-none focus:border-emerald-500/50"
          >
            <option value="">Tous les modèles</option>
            {meta?.targetModels.map((m) => (
              <option key={m} value={m}>{m}</option>
            ))}
          </select>

          {/* Company filter */}
          <select
            value={companyFilter}
            onChange={(e) => setCompanyFilter(e.target.value)}
            className="bg-[var(--neu-bg)] border border-[var(--neu-border)] text-sm rounded-xl px-3 py-2.5 text-[var(--neu-text)] focus:outline-none focus:border-emerald-500/50"
          >
            <option value="">Toutes les entreprises</option>
            {meta?.companies.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>

          {/* Date range */}
          <div className="flex items-center gap-2">
            <NeuInput
              type="date"
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
              className="flex-1 text-sm"
              title="Date de début"
            />
            <span className="text-[var(--neu-text-subtle)] text-xs">→</span>
            <NeuInput
              type="date"
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
              className="flex-1 text-sm"
              title="Date de fin"
            />
          </div>
        </div>
      </NeuCard>

      {/* ── TABLE ──────────────────────────────────────────────────────── */}
      <NeuCard className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-[var(--neu-bg-subtle)] border-b border-[var(--neu-border)]">
              <tr>
                <th className="p-3 text-left text-xs font-semibold text-[var(--neu-text-subtle)] uppercase tracking-wider">
                  <span className="flex items-center gap-1.5"><Calendar size={12} /> Date & Heure</span>
                </th>
                <th className="p-3 text-left text-xs font-semibold text-[var(--neu-text-subtle)] uppercase tracking-wider">
                  <span className="flex items-center gap-1.5"><Zap size={12} /> Action</span>
                </th>
                <th className="p-3 text-left text-xs font-semibold text-[var(--neu-text-subtle)] uppercase tracking-wider">
                  <span className="flex items-center gap-1.5"><Layers size={12} /> Modèle</span>
                </th>
                <th className="p-3 text-left text-xs font-semibold text-[var(--neu-text-subtle)] uppercase tracking-wider">
                  <span className="flex items-center gap-1.5"><Building2 size={12} /> Entreprise</span>
                </th>
                <th className="p-3 text-left text-xs font-semibold text-[var(--neu-text-subtle)] uppercase tracking-wider">
                  <span className="flex items-center gap-1.5"><User size={12} /> Utilisateur</span>
                </th>
                <th className="p-3 text-right text-xs font-semibold text-[var(--neu-text-subtle)] uppercase tracking-wider">
                  Détail
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--neu-border)]">
              {loading ? (
                [...Array(10)].map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    {[...Array(6)].map((__, j) => (
                      <td key={j} className="p-3">
                        <div className="h-4 bg-[var(--neu-bg-subtle)] rounded-lg" />
                      </td>
                    ))}
                  </tr>
                ))
              ) : !result?.logs.length ? (
                <tr>
                  <td colSpan={6} className="p-12 text-center text-[var(--neu-text-subtle)]">
                    <ScrollText size={36} className="mx-auto mb-3 opacity-30" />
                    Aucun événement trouvé pour les filtres sélectionnés
                  </td>
                </tr>
              ) : (
                result.logs.map((log) => (
                  <tr
                    key={log.id}
                    className="hover:bg-[var(--neu-bg-subtle)]/60 transition group cursor-pointer"
                    onClick={() => setSelectedLog(log)}
                  >
                    <td className="p-3 text-xs text-[var(--neu-text-subtle)] whitespace-nowrap">
                      {new Date(log.timestamp).toLocaleString("fr-FR", {
                        day: "2-digit", month: "short", year: "numeric",
                        hour: "2-digit", minute: "2-digit",
                      })}
                    </td>
                    <td className="p-3">
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-lg border text-xs font-bold ${actionColor(log.action)}`}>
                        {log.action}
                      </span>
                    </td>
                    <td className="p-3 text-xs font-medium text-[var(--neu-text)]">
                      {log.targetModel}
                      {log.targetId && (
                        <div className="text-[10px] text-[var(--neu-text-subtle)] font-mono truncate max-w-[100px]">
                          {log.targetId}
                        </div>
                      )}
                    </td>
                    <td className="p-3">
                      <div className="flex items-center gap-1.5">
                        <Building2 size={12} className="text-emerald-500 shrink-0" />
                        <span className="text-xs font-medium text-[var(--neu-text)] truncate max-w-[140px]">
                          {log.companyName}
                        </span>
                      </div>
                    </td>
                    <td className="p-3">
                      <div className="text-xs font-medium text-[var(--neu-text)]">{log.performedByName}</div>
                      <div className="text-[10px] text-[var(--neu-text-subtle)]">{log.performedByEmail}</div>
                    </td>
                    <td className="p-3 text-right">
                      <button className="p-1.5 text-[var(--neu-text-subtle)] hover:text-emerald-500 hover:bg-emerald-500/10 rounded-lg transition opacity-0 group-hover:opacity-100">
                        <Eye size={14} />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* ── PAGINATION ───────────────────────────────────────────────── */}
        {result && result.totalPages > 1 && (
          <div className="flex items-center justify-between p-4 border-t border-[var(--neu-border)]">
            <span className="text-xs text-[var(--neu-text-subtle)]">
              {result.total.toLocaleString()} événements — Page {result.page} / {result.totalPages}
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => fetchLogs(page - 1)}
                disabled={page <= 1 || loading}
                className="p-2 border border-[var(--neu-border)] rounded-xl hover:border-emerald-500/50 hover:text-emerald-500 disabled:opacity-30 transition"
              >
                <ChevronLeft size={16} />
              </button>

              {/* Page numbers (show up to 5 around current) */}
              {Array.from({ length: Math.min(5, result.totalPages) }, (_, i) => {
                const start = Math.max(1, Math.min(page - 2, result.totalPages - 4));
                const pg = start + i;
                return pg <= result.totalPages ? (
                  <button
                    key={pg}
                    onClick={() => fetchLogs(pg)}
                    className={`min-w-[36px] h-9 rounded-xl border text-xs font-semibold transition ${
                      pg === page
                        ? "bg-emerald-600 text-white border-emerald-600"
                        : "border-[var(--neu-border)] hover:border-emerald-500/50 hover:text-emerald-500 text-[var(--neu-text-subtle)]"
                    }`}
                  >
                    {pg}
                  </button>
                ) : null;
              })}

              <button
                onClick={() => fetchLogs(page + 1)}
                disabled={page >= result.totalPages || loading}
                className="p-2 border border-[var(--neu-border)] rounded-xl hover:border-emerald-500/50 hover:text-emerald-500 disabled:opacity-30 transition"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}
      </NeuCard>

      {/* ── DETAIL DRAWER ──────────────────────────────────────────────── */}
      {selectedLog && (
        <AuditLogDrawer log={selectedLog} onClose={() => setSelectedLog(null)} />
      )}
    </div>
  );
}
