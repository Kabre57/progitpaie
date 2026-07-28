"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { NeuButton } from "./neu-button";

interface NeuPaginationProps {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  itemsPerPage: number;
  onPageChange: (page: number) => void;
}

export function NeuPagination({
  currentPage,
  totalPages,
  totalItems,
  itemsPerPage,
  onPageChange,
}: NeuPaginationProps) {
  if (totalPages <= 1) return null;

  const startItem = (currentPage - 1) * itemsPerPage + 1;
  const endItem = Math.min(currentPage * itemsPerPage, totalItems);

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 py-4 px-2 border-t border-[var(--neu-border)] text-xs text-[var(--neu-text-secondary)]">
      <div>
        Affichage de <span className="font-bold text-[var(--neu-text)]">{startItem}</span> à{" "}
        <span className="font-bold text-[var(--neu-text)]">{endItem}</span> sur{" "}
        <span className="font-bold text-[var(--neu-text)]">{totalItems}</span> résultats
      </div>

      <div className="flex items-center gap-2">
        <NeuButton
          size="sm"
          variant="ghost"
          disabled={currentPage === 1}
          onClick={() => onPageChange(currentPage - 1)}
        >
          <ChevronLeft className="w-4 h-4 mr-1" /> Précédent
        </NeuButton>

        <div className="px-3 py-1 font-semibold rounded-lg bg-[var(--neu-surface-light)] border border-[var(--neu-border)] text-[var(--neu-text)]">
          Page {currentPage} / {totalPages}
        </div>

        <NeuButton
          size="sm"
          variant="ghost"
          disabled={currentPage === totalPages}
          onClick={() => onPageChange(currentPage + 1)}
        >
          Suivant <ChevronRight className="w-4 h-4 ml-1" />
        </NeuButton>
      </div>
    </div>
  );
}
