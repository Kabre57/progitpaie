"use client";

import React from "react";
import { Pencil, Trash2, Loader2 } from "lucide-react";
import { NeuCard, NeuCardContent } from "@/components/ui/neu-card";
import { NeuButton } from "@/components/ui/neu-button";
import { NeuBadge } from "@/components/ui/neu-badge";
import { NeuPagination } from "@/components/ui/neu-pagination";
import { EmployeeDTO } from "@/shared/types/contracts/employees.contract";

interface EmployeeTableProps {
  employees: EmployeeDTO[];
  isLoading: boolean;
  onEditClick: (emp: EmployeeDTO) => void;
  onDeleteClick?: (emp: EmployeeDTO) => void;
  currentPage: number;
  totalPages: number;
  totalItems: number;
  itemsPerPage: number;
  onPageChange: (page: number) => void;
}

export function EmployeeTable({
  employees,
  isLoading,
  onEditClick,
  onDeleteClick,
  currentPage,
  totalPages,
  totalItems,
  itemsPerPage,
  onPageChange,
}: EmployeeTableProps) {
  return (
    <NeuCard>
      <NeuCardContent className="p-0 overflow-x-auto">
        {isLoading ? (
          <div className="flex items-center justify-center h-48">
            <Loader2 className="w-8 h-8 animate-spin text-[var(--neu-accent)]" />
          </div>
        ) : (
          <table className="w-full text-left border-collapse text-sm min-w-[1200px]">
            <thead>
              <tr className="border-b border-[var(--neu-border)] bg-[var(--neu-surface-light)] text-[var(--neu-text-secondary)] uppercase text-[11px] font-semibold tracking-wider">
                <th className="px-3 py-3">Matricule</th>
                <th className="px-3 py-3">Civilité & Noms & Prénoms</th>
                <th className="px-3 py-3">Contrat</th>
                <th className="px-3 py-3">Date d&apos;Entrée</th>
                <th className="px-3 py-3">Direction & Service</th>
                <th className="px-3 py-3">Emploi (Code)</th>
                <th className="px-3 py-3">Régime / Cat.</th>
                <th className="px-3 py-3">N° CNPS</th>
                <th className="px-3 py-3">Mode & Banque</th>
                <th className="px-3 py-3 text-right">Salaire Base</th>
                <th className="px-3 py-3 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--neu-border)] text-xs">
              {employees.length === 0 ? (
                <tr>
                  <td colSpan={11} className="px-4 py-8 text-center text-[var(--neu-text-secondary)] font-medium">
                    Aucun employé ne correspond aux critères de recherche.
                  </td>
                </tr>
              ) : (
                employees.map((emp) => (
                  <tr key={emp.id || emp._id} className="hover:bg-[var(--neu-surface-light)] transition-colors">
                    <td className="px-3 py-3 font-mono font-bold text-[var(--neu-accent)]">
                      {emp.employeeId || "-"}
                    </td>
                    <td className="px-3 py-3">
                      <div className="font-semibold text-[var(--neu-text)]">
                        {emp.civility || "M."} {emp.name}
                      </div>
                      <div className="text-[10px] text-[var(--neu-text-secondary)] font-mono">{emp.email}</div>
                    </td>
                    <td className="px-3 py-3">
                      <NeuBadge variant={emp.contractType === "CDI" ? "success" : "warning"}>
                        {emp.contractType || "CDI"}
                      </NeuBadge>
                      {emp.cddDurationMonths && (
                        <span className="text-[10px] text-[var(--neu-text-secondary)] block mt-0.5">
                          ({emp.cddDurationMonths} mois)
                        </span>
                      )}
                    </td>
                    <td className="px-3 py-3 text-[var(--neu-text-secondary)]">
                      {emp.joiningDate ? new Date(emp.joiningDate).toLocaleDateString("fr-FR") : "-"}
                    </td>
                    <td className="px-3 py-3">
                      <div className="font-semibold text-[var(--neu-text)]">{emp.direction || "ADMINISTRATION"}</div>
                      <div className="text-[10px] text-[var(--neu-text-secondary)]">{emp.service || "GÉNÉRAL"}</div>
                    </td>
                    <td className="px-3 py-3">
                      <div className="font-semibold text-[var(--neu-text)]">{emp.jobTitle || "Collaborateur"}</div>
                      <div className="text-[10px] text-[var(--neu-text-secondary)] font-mono">Code: {emp.jobCode || "CM"}</div>
                    </td>
                    <td className="px-3 py-3">
                      <span className="font-medium text-[var(--neu-text)]">{emp.regime || "Général"}</span>
                      <span className="text-[10px] bg-[#666cff]/10 text-[#666cff] px-1.5 py-0.5 rounded font-bold ml-1">
                        Cat {emp.category || "1A"}
                      </span>
                    </td>
                    <td className="px-3 py-3 font-mono">
                      {emp.cnpsExempt ? (
                        <span className="text-amber-500 text-[10px] font-bold">Non soumis</span>
                      ) : (
                        emp.cnpsNumber || "Exonéré"
                      )}
                    </td>
                    <td className="px-3 py-3">
                      <div className="font-medium text-[var(--neu-text)]">{emp.paymentMethod || "Virement"}</div>
                      <div className="text-[10px] text-[var(--neu-text-secondary)] font-mono truncate max-w-[120px]" title={emp.bankAccount || ""}>
                        {emp.bankName} ({emp.bankAccount || "Sans RIB"})
                      </div>
                    </td>
                    <td className="px-3 py-3 text-right font-mono font-bold text-[var(--neu-text)]">
                      {(Number(emp.salary) || 0).toLocaleString()} F
                    </td>
                    <td className="px-3 py-3 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <NeuButton size="icon" variant="ghost" onClick={() => onEditClick(emp)} className="h-7 w-7" title="Éditer la fiche">
                          <Pencil className="w-3.5 h-3.5 text-[var(--neu-accent)]" />
                        </NeuButton>

                        {onDeleteClick && (
                          <NeuButton
                            size="icon"
                            variant="ghost"
                            onClick={() => onDeleteClick(emp)}
                            className="h-7 w-7 text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 hover:text-red-600"
                            title="Supprimer / Désactiver ce salarié"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </NeuButton>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        )}
      </NeuCardContent>
      <NeuPagination
        currentPage={currentPage}
        totalPages={totalPages}
        totalItems={totalItems}
        itemsPerPage={itemsPerPage}
        onPageChange={onPageChange}
      />
    </NeuCard>
  );
}
