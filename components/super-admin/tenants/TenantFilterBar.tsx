"use client";

import React from "react";
import { Search, Filter, RefreshCw } from "lucide-react";
import { NeuCard } from "@/components/ui/neu-card";
import { NeuButton } from "@/components/ui/neu-button";

interface TenantFilterBarProps {
  search: string;
  onSearchChange: (value: string) => void;
  statusFilter: string;
  onStatusFilterChange: (value: string) => void;
  onRefresh: () => void;
  loading: boolean;
}

export function TenantFilterBar({
  search,
  onSearchChange,
  statusFilter,
  onStatusFilterChange,
  onRefresh,
  loading,
}: TenantFilterBarProps) {
  return (
    <NeuCard className="p-4 flex flex-col md:flex-row gap-4 items-center justify-between">
      <div className="flex flex-1 items-center gap-3 w-full">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-2.5 text-[var(--neu-text-secondary)]" size={16} />
          <input
            type="text"
            placeholder="Rechercher une entreprise (nom, N° CC, CNPS, ville...)"
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-xs rounded-xl bg-[var(--neu-surface-light)] border border-[var(--neu-border)] text-[var(--neu-text)] outline-none focus:border-[#666cff]"
          />
        </div>

        <div className="flex items-center gap-2">
          <Filter size={16} className="text-[var(--neu-text-secondary)]" />
          <select
            value={statusFilter}
            onChange={(e) => onStatusFilterChange(e.target.value)}
            className="px-3 py-2 text-xs rounded-xl bg-[var(--neu-surface-light)] border border-[var(--neu-border)] text-[var(--neu-text)] outline-none focus:border-[#666cff]"
          >
            <option value="ALL">Tous les statuts</option>
            <option value="ACTIVE">Actives uniquement</option>
            <option value="SUSPENDED">Suspendues</option>
            <option value="INACTIVE">Inactives</option>
          </select>
        </div>
      </div>

      <NeuButton onClick={onRefresh} variant="ghost" size="sm" disabled={loading}>
        <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
        Actualiser
      </NeuButton>
    </NeuCard>
  );
}
