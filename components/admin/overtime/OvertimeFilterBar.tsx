"use client";

import React from "react";
import { ChevronLeft, ChevronRight, Search, Filter } from "lucide-react";
import { NeuCard, NeuCardContent } from "@/components/ui/neu-card";
import { NeuButton } from "@/components/ui/neu-button";
import { NeuSelect } from "@/components/ui/neu-select";
import { NeuInput } from "@/components/ui/neu-input";

interface OvertimeFilterBarProps {
  currentMonth: string;
  getMonthName: (monthStr: string) => string;
  getPreviousMonth: (monthStr: string) => string;
  getNextMonth: (monthStr: string) => string;
  onMonthChange: (month: string) => void;
  statusFilter: string;
  onStatusFilterChange: (value: string) => void;
  rateFilter: string;
  onRateFilterChange: (value: string) => void;
  searchQuery: string;
  onSearchChange: (value: string) => void;
}

export function OvertimeFilterBar({
  currentMonth,
  getMonthName,
  getPreviousMonth,
  getNextMonth,
  onMonthChange,
  statusFilter,
  onStatusFilterChange,
  rateFilter,
  onRateFilterChange,
  searchQuery,
  onSearchChange,
}: OvertimeFilterBarProps) {
  const statusOptions = [
    { value: "all", label: "Tous les statuts" },
    { value: "pending", label: "En attente" },
    { value: "approved", label: "Validé" },
    { value: "rejected", label: "Rejeté" },
  ];

  const rateOptions = [
    { value: "all", label: "Toutes les majorations" },
    { value: "1.15", label: "+15% (Heures supp normales)" },
    { value: "1.50", label: "+50% (Au-delà de 46h)" },
    { value: "1.75", label: "+75% (Nuit / Dimanche)" },
    { value: "2.00", label: "+100% (Nuit Férié)" },
  ];

  return (
    <NeuCard>
      <NeuCardContent className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Navigation Mois */}
        <div className="flex items-center gap-2">
          <NeuButton
            size="sm"
            variant="ghost"
            onClick={() => onMonthChange(getPreviousMonth(currentMonth))}
            title="Mois précédent"
          >
            <ChevronLeft className="w-4 h-4" />
          </NeuButton>
          <span className="font-semibold text-sm min-w-[150px] text-center text-[var(--neu-text)] capitalize">
            {currentMonth ? getMonthName(currentMonth) : "Tous les mois"}
          </span>
          <NeuButton
            size="sm"
            variant="ghost"
            onClick={() => onMonthChange(getNextMonth(currentMonth))}
            title="Mois suivant"
          >
            <ChevronRight className="w-4 h-4" />
          </NeuButton>
        </div>

        {/* Filtres & Recherche */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 flex-1 md:max-w-2xl">
          <NeuSelect
            value={statusFilter}
            onChange={(e) => onStatusFilterChange(e.target.value)}
            options={statusOptions}
            className="text-xs"
          />

          <NeuSelect
            value={rateFilter}
            onChange={(e) => onRateFilterChange(e.target.value)}
            options={rateOptions}
            className="text-xs"
          />

          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[var(--neu-text-secondary)] pointer-events-none" />
            <NeuInput
              type="text"
              placeholder="Rechercher salarié..."
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              className="pl-9 text-xs"
            />
          </div>
        </div>
      </NeuCardContent>
    </NeuCard>
  );
}
