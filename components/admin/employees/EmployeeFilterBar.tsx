"use client";

import React from "react";
import { Search } from "lucide-react";
import { NeuCard, NeuCardContent } from "@/components/ui/neu-card";
import { NeuBadge } from "@/components/ui/neu-badge";

interface EmployeeFilterBarProps {
  searchQuery: string;
  onSearchChange: (value: string) => void;
  filteredCount: number;
}

export function EmployeeFilterBar({
  searchQuery,
  onSearchChange,
  filteredCount,
}: EmployeeFilterBarProps) {
  return (
    <NeuCard>
      <NeuCardContent className="p-4 flex flex-col sm:flex-row items-center gap-4">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3 top-2.5 w-4 h-4 text-[var(--neu-text-secondary)]" />
          <input
            type="text"
            placeholder="Rechercher par nom, matricule, fonction, direction..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full pl-9 pr-4 py-2 rounded-lg bg-[var(--neu-surface-light)] border border-[var(--neu-border)] text-sm text-[var(--neu-text)] outline-none focus:border-[var(--neu-accent)]"
          />
        </div>
        <NeuBadge variant="accent">{filteredCount} salariés inscrits</NeuBadge>
      </NeuCardContent>
    </NeuCard>
  );
}
