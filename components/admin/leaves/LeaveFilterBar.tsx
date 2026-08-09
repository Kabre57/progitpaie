"use client";

import React from "react";
import { ChevronLeft, ChevronRight, Search } from "lucide-react";
import { NeuCard, NeuCardContent } from "@/components/ui/neu-card";
import { NeuButton } from "@/components/ui/neu-button";
import { NeuSelect } from "@/components/ui/neu-select";
import { NeuInput } from "@/components/ui/neu-input";

interface LeaveFilterBarProps {
  currentMonth: string;
  getMonthName: (monthStr: string) => string;
  getPreviousMonth: (monthStr: string) => string;
  getNextMonth: (monthStr: string) => string;
  onMonthChange: (month: string) => void;
  statusFilter: string;
  onStatusFilterChange: (value: string) => void;
  typeFilter: string;
  onTypeFilterChange: (value: string) => void;
  searchQuery: string;
  onSearchChange: (value: string) => void;
}

export function LeaveFilterBar({
  currentMonth,
  getMonthName,
  getPreviousMonth,
  getNextMonth,
  onMonthChange,
  statusFilter,
  onStatusFilterChange,
  typeFilter,
  onTypeFilterChange,
  searchQuery,
  onSearchChange,
}: LeaveFilterBarProps) {
  const statusOptions = [
    { value: "all", label: "Tous les statuts" },
    { value: "pending", label: "En attente" },
    { value: "approved", label: "Approuvés / Validés" },
    { value: "rejected", label: "Rejetés" },
  ];

  const typeOptions = [
    { value: "all", label: "Tous les types" },
    { value: "annual", label: "Congé Payé / Annuel" },
    { value: "sick", label: "Congé Maladie" },
    { value: "casual", label: "Permission Exceptionnelle" },
    { value: "unpaid", label: "Congé Sans Solde" },
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
            value={typeFilter}
            onChange={(e) => onTypeFilterChange(e.target.value)}
            options={typeOptions}
            className="text-xs"
          />

          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[var(--neu-text-secondary)] pointer-events-none" />
            <NeuInput
              type="text"
              placeholder="Rechercher par nom, motif..."
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
