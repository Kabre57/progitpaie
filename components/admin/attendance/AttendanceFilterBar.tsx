"use client";

import React from "react";
import { ChevronLeft, ChevronRight, Download, FileSpreadsheet } from "lucide-react";
import { NeuCard, NeuCardContent } from "@/components/ui/neu-card";
import { NeuButton } from "@/components/ui/neu-button";
import { NeuSelect } from "@/components/ui/neu-select";

interface AttendanceFilterBarProps {
  currentMonth: string;
  getMonthName: (monthStr: string) => string;
  getPreviousMonth: (monthStr: string) => string;
  getNextMonth: (monthStr: string) => string;
  onMonthChange: (month: string) => void;
  statusFilter: string;
  onStatusFilterChange: (value: string) => void;
  statusOptions: { value: string; label: string }[];
  searchQuery: string;
  onSearchChange: (value: string) => void;
  onOpenImportDialog: () => void;
  onDownloadTemplate: () => void;
  recordsCount: number;
}

export function AttendanceFilterBar({
  currentMonth,
  getMonthName,
  getPreviousMonth,
  getNextMonth,
  onMonthChange,
  statusFilter,
  onStatusFilterChange,
  statusOptions,
  searchQuery,
  onSearchChange,
  onOpenImportDialog,
  onDownloadTemplate,
}: AttendanceFilterBarProps) {
  return (
    <NeuCard>
      <NeuCardContent className="p-4 space-y-4 sm:space-y-0 sm:flex sm:items-center sm:justify-between sm:gap-4">
        {/* Navigation Mois */}
        <div className="flex items-center gap-2">
          <NeuButton
            size="sm"
            variant="ghost"
            onClick={() => onMonthChange(getPreviousMonth(currentMonth))}
          >
            <ChevronLeft className="w-4 h-4" />
          </NeuButton>
          <span className="font-semibold text-sm min-w-[140px] text-center text-[var(--neu-text)]">
            {currentMonth ? getMonthName(currentMonth) : "Chargement..."}
          </span>
          <NeuButton
            size="sm"
            variant="ghost"
            onClick={() => onMonthChange(getNextMonth(currentMonth))}
          >
            <ChevronRight className="w-4 h-4" />
          </NeuButton>
        </div>

        {/* Filtres Statut & Recherche */}
        <div className="flex flex-1 items-center gap-3 max-w-lg">
          <div className="w-44">
            <NeuSelect
              value={statusFilter}
              onChange={(e) => onStatusFilterChange(e.target.value)}
              options={statusOptions}
            />
          </div>
          <input
            type="text"
            placeholder="Rechercher salarié..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="flex-1 px-3 py-2 rounded-lg bg-[var(--neu-surface-light)] border border-[var(--neu-border)] text-sm text-[var(--neu-text)] outline-none focus:border-[var(--neu-accent)]"
          />
        </div>

        {/* Actions Import / Export Excel */}
        <div className="flex items-center gap-2">
          <NeuButton size="sm" variant="ghost" onClick={onDownloadTemplate} title="Télécharger le fichier exemple Excel pré-rempli">
            <Download className="w-4 h-4 mr-1.5 text-emerald-500" /> Modèle Excel
          </NeuButton>
          <NeuButton size="sm" variant="accent" onClick={onOpenImportDialog}>
            <FileSpreadsheet className="w-4 h-4 mr-1.5" /> Importer Excel (.xlsx)
          </NeuButton>
        </div>
      </NeuCardContent>
    </NeuCard>
  );
}
