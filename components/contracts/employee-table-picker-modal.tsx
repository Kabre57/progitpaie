"use client";

import { useState, useMemo } from "react";
import { Search, UserCheck, X, ArrowUpDown, Building, Check, User } from "lucide-react";
import { NeuCard } from "@/components/ui/neu-card";
import { NeuButton } from "@/components/ui/neu-button";
import { NeuInput } from "@/components/ui/neu-input";
import { NeuBadge } from "@/components/ui/neu-badge";
import { EmployeeOptionDTO } from "@/shared/types/contracts/contracts.contract";

interface EmployeeTablePickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  employees: EmployeeOptionDTO[];
  selectedUserId: string;
  onSelectEmployee: (employee: EmployeeOptionDTO) => void;
}

export function EmployeeTablePickerModal({
  isOpen,
  onClose,
  employees,
  selectedUserId,
  onSelectEmployee,
}: EmployeeTablePickerModalProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState<"name" | "jobTitle" | "salary">("name");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");

  const filteredAndSortedEmployees = useMemo(() => {
    return employees
      .filter((emp) => {
        const query = searchTerm.toLowerCase().trim();
        if (!query) return true;
        return (
          emp.name.toLowerCase().includes(query) ||
          (emp.email && emp.email.toLowerCase().includes(query)) ||
          (emp.jobTitle && emp.jobTitle.toLowerCase().includes(query)) ||
          (emp.category && emp.category.toLowerCase().includes(query))
        );
      })
      .sort((a, b) => {
        let valA = "";
        let valB = "";

        if (sortBy === "name") {
          valA = a.name || "";
          valB = b.name || "";
        } else if (sortBy === "jobTitle") {
          valA = a.jobTitle || "";
          valB = b.jobTitle || "";
        } else if (sortBy === "salary") {
          const numA = a.salary || 0;
          const numB = b.salary || 0;
          return sortOrder === "asc" ? numA - numB : numB - numA;
        }

        const comparison = valA.localeCompare(valB, "fr", { sensitivity: "base" });
        return sortOrder === "asc" ? comparison : -comparison;
      });
  }, [employees, searchTerm, sortBy, sortOrder]);

  if (!isOpen) return null;

  const handleToggleSort = (field: "name" | "jobTitle" | "salary") => {
    if (sortBy === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortBy(field);
      setSortOrder("asc");
    }
  };

  return (
    <div className="fixed inset-0 bg-black/75 backdrop-blur-md flex items-center justify-center p-4 z-[60] overflow-y-auto">
      <NeuCard className="w-full max-w-4xl p-6 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 shadow-2xl max-h-[85vh] flex flex-col rounded-2xl">
        {/* En-tête */}
        <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-4 mb-4">
          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <UserCheck className="text-blue-600 w-5 h-5" /> Sélection du salarié
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Recherchez et triez les employés de l'entreprise pour lui attribuer un contrat.
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Barre de recherche et filtres de tri */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 mb-4">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <NeuInput
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Rechercher par nom, email ou poste…"
              className="pl-9 text-xs"
            />
            {searchTerm && (
              <button
                type="button"
                onClick={() => setSearchTerm("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-slate-600"
              >
                Effacer
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 whitespace-nowrap">
              Trier par:
            </span>
            <button
              type="button"
              onClick={() => handleToggleSort("name")}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1 border ${
                sortBy === "name"
                  ? "bg-blue-600 text-white border-blue-600 shadow-sm"
                  : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:border-slate-300"
              }`}
            >
              Nom {sortBy === "name" && (sortOrder === "asc" ? "↑" : "↓")}
            </button>
            <button
              type="button"
              onClick={() => handleToggleSort("jobTitle")}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1 border ${
                sortBy === "jobTitle"
                  ? "bg-blue-600 text-white border-blue-600 shadow-sm"
                  : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:border-slate-300"
              }`}
            >
              Poste {sortBy === "jobTitle" && (sortOrder === "asc" ? "↑" : "↓")}
            </button>
          </div>
        </div>

        {/* Compteur de résultats */}
        <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 mb-2 px-1">
          <span>
            {filteredAndSortedEmployees.length} salarié(s) trouvé(s)
          </span>
          {selectedUserId && (
            <span className="text-blue-600 font-bold">
              1 salarié actuellement sélectionné
            </span>
          )}
        </div>

        {/* Tableau des employés */}
        <div className="overflow-y-auto border border-slate-200 dark:border-slate-800 rounded-xl bg-white dark:bg-slate-900 flex-1">
          {filteredAndSortedEmployees.length === 0 ? (
            <div className="p-8 text-center space-y-2">
              <User className="w-10 h-10 text-slate-300 mx-auto" />
              <p className="text-sm font-semibold text-slate-600 dark:text-slate-300">
                Aucun salarié ne correspond à votre recherche.
              </p>
              <p className="text-xs text-slate-400">
                Essayez d'effacer les filtres ou vérifiez l'orthographe du nom.
              </p>
            </div>
          ) : (
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-100 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 font-bold">
                  <th className="py-3 px-4">Salarié</th>
                  <th className="py-3 px-4">Poste & Catégorie</th>
                  <th className="py-3 px-4">Salaire indicatif</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filteredAndSortedEmployees.map((emp) => {
                  const isSelected = emp.id === selectedUserId;
                  const initials = emp.name
                    ? emp.name
                        .split(" ")
                        .map((n) => n[0])
                        .join("")
                        .substring(0, 2)
                        .toUpperCase()
                    : "EMP";

                  return (
                    <tr
                      key={emp.id}
                      onClick={() => {
                        onSelectEmployee(emp);
                        onClose();
                      }}
                      className={`cursor-pointer transition-colors hover:bg-blue-50/60 dark:hover:bg-blue-950/30 ${
                        isSelected ? "bg-blue-50 dark:bg-blue-950/50" : ""
                      }`}
                    >
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs shrink-0 ${
                            isSelected
                              ? "bg-blue-600 text-white"
                              : "bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300"
                          }`}>
                            {initials}
                          </div>
                          <div>
                            <div className="font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                              {emp.name}
                              {isSelected && (
                                <NeuBadge variant="success" className="text-[10px] px-1.5 py-0">
                                  Sélectionné
                                </NeuBadge>
                              )}
                            </div>
                            {emp.email && (
                              <div className="text-[11px] text-slate-500 dark:text-slate-400">
                                {emp.email}
                              </div>
                            )}
                          </div>
                        </div>
                      </td>

                      <td className="py-3 px-4">
                        <div className="font-medium text-slate-800 dark:text-slate-200">
                          {emp.jobTitle || "Poste non défini"}
                        </div>
                        {emp.category && (
                          <div className="text-[10px] text-slate-400 uppercase tracking-wider">
                            {emp.category}
                          </div>
                        )}
                      </td>

                      <td className="py-3 px-4">
                        {emp.salary ? (
                          <span className="font-bold text-slate-900 dark:text-slate-100">
                            {emp.salary.toLocaleString()} FCFA
                          </span>
                        ) : (
                          <span className="text-slate-400 italic">Non renseigné</span>
                        )}
                      </td>

                      <td className="py-3 px-4 text-right">
                        <NeuButton
                          type="button"
                          variant={isSelected ? "accent" : "outline"}
                          className={`text-xs px-3 py-1 gap-1 ${
                            isSelected ? "bg-blue-600 text-white font-bold" : ""
                          }`}
                        >
                          {isSelected ? (
                            <>
                              <Check className="w-3.5 h-3.5" /> Sélectionné
                            </>
                          ) : (
                            "Choisir"
                          )}
                        </NeuButton>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>

        {/* Pied de modale */}
        <div className="flex items-center justify-between border-t border-slate-200 dark:border-slate-800 pt-4 mt-4">
          <NeuButton type="button" variant="outline" onClick={onClose} className="px-5 text-xs">
            Fermer
          </NeuButton>
        </div>
      </NeuCard>
    </div>
  );
}
