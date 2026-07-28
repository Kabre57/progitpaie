"use client";

import { useState, useEffect, useCallback } from "react";
import { NeuCard, NeuCardHeader, NeuCardTitle, NeuCardContent } from "@/components/ui/neu-card";
import { NeuButton } from "@/components/ui/neu-button";
import { NeuBadge } from "@/components/ui/neu-badge";
import { FileSpreadsheet, Download, Search, Loader2, ShieldCheck, Printer } from "lucide-react";

import { NeuPagination } from "@/components/ui/neu-pagination";

interface RnsEmployee {
  userId: string;
  name: string;
  employeeId: string;
  cnpsNumber: string;
  joiningDate: string;
  exitDate?: string;
  jobTitle: string;
  years: Record<number, { year: number; monthsWorked: number; grossCnpsSalary: number }>;
}

export default function RnsPage() {
  const [employees, setEmployees] = useState<RnsEmployee[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const fetchRnsData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/payroll/rns");
      const json = await res.json();
      if (json.success) {
        setEmployees(json.data || []);
      }
    } catch (err) {
      console.error("Fetch RNS error:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRnsData();
  }, [fetchRnsData]);

  const handleDownloadRnsPdf = async (emp: RnsEmployee) => {
    setDownloadingId(emp.userId);
    try {
      const yearArray = Object.values(emp.years).sort((a, b) => b.year - a.year);
      const res = await fetch("/api/documents/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: emp.userId,
          docType: "rns",
          customName: emp.name,
          customJobTitle: emp.jobTitle,
          rnsData: yearArray,
        }),
      });

      if (res.ok) {
        const blob = await res.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `CNPS-RNS-${emp.employeeId}-${emp.name.replace(/\s+/g, "-")}.pdf`;
        document.body.appendChild(a);
        a.click();
        a.remove();
      } else {
        alert("Erreur lors de la génération du Relevé Nominatif des Salaires CNPS");
      }
    } catch (err) {
      console.error("Download RNS PDF error:", err);
    } finally {
      setDownloadingId(null);
    }
  };

  const filtered = employees.filter((e) =>
    e.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    e.employeeId.toLowerCase().includes(searchQuery.toLowerCase()) ||
    e.cnpsNumber.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const totalPages = Math.ceil(filtered.length / itemsPerPage);
  const paginated = filtered.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[var(--neu-text)] flex items-center gap-2">
            <ShieldCheck className="text-[var(--neu-accent)]" /> Relevé Nominatif des Salaires CNPS (RNS)
          </h1>
          <p className="text-[var(--neu-text-secondary)] text-sm mt-1">
            Formulaire officiel CNPS récapitulant l'historique des salaires bruts soumis à cotisations sociales.
          </p>
        </div>
      </div>

      {/* Filter & Search */}
      <NeuCard>
        <NeuCardContent className="p-4 flex flex-col sm:flex-row items-center gap-4">
          <div className="relative flex-1 w-full">
            <Search className="absolute left-3 top-2.5 w-4 h-4 text-[var(--neu-text-secondary)]" />
            <input
              type="text"
              placeholder="Rechercher par nom, matricule ou N° CNPS..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 rounded-lg bg-[var(--neu-surface-light)] border border-[var(--neu-border)] text-sm text-[var(--neu-text)] outline-none focus:border-[var(--neu-accent)]"
            />
          </div>
          <NeuBadge variant="accent">{filtered.length} salariés affiliés CNPS</NeuBadge>
        </NeuCardContent>
      </NeuCard>

      {/* RNS Table */}
      <NeuCard>
        <NeuCardContent className="p-0 overflow-x-auto">
          {loading ? (
            <div className="flex items-center justify-center h-48">
              <Loader2 className="w-8 h-8 animate-spin text-[var(--neu-accent)]" />
            </div>
          ) : (
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="border-b border-[var(--neu-border)] bg-[var(--neu-surface-light)] text-[var(--neu-text-secondary)] uppercase text-[11px] font-semibold tracking-wider">
                  <th className="px-4 py-3">Matricule</th>
                  <th className="px-4 py-3">Noms & Prénoms</th>
                  <th className="px-4 py-3">N° Affiliation CNPS</th>
                  <th className="px-4 py-3">Date d'Entrée</th>
                  <th className="px-4 py-3">Historique des Années RNS</th>
                  <th className="px-4 py-3 text-center">Impression RNS PDF</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--neu-border)] text-xs">
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-8 text-center text-[var(--neu-text-secondary)]">
                      Aucune donnée RNS CNPS trouvée.
                    </td>
                  </tr>
                ) : (
                  paginated.map((emp) => {
                    const yearList = Object.values(emp.years).sort((a, b) => b.year - a.year);
                    return (
                      <tr key={emp.userId} className="hover:bg-[var(--neu-surface-light)] transition-colors">
                        <td className="px-4 py-3 font-mono font-bold text-[var(--neu-accent)]">{emp.employeeId}</td>
                        <td className="px-4 py-3">
                          <div className="font-bold text-[var(--neu-text)]">{emp.name}</div>
                          <div className="text-[10px] text-[var(--neu-text-secondary)]">{emp.jobTitle}</div>
                        </td>
                        <td className="px-4 py-3 font-mono font-semibold text-[var(--neu-text)]">
                          {emp.cnpsNumber}
                        </td>
                        <td className="px-4 py-3 text-[var(--neu-text-secondary)]">
                          {emp.joiningDate ? new Date(emp.joiningDate).toLocaleDateString("fr-FR") : "-"}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex flex-wrap gap-1.5">
                            {yearList.map((y) => (
                              <span key={y.year} className="bg-[#666cff]/10 text-[#666cff] px-2 py-0.5 rounded text-[10px] font-bold">
                                {y.year}: {y.grossCnpsSalary.toLocaleString()} F ({y.monthsWorked}m)
                              </span>
                            ))}
                          </div>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <NeuButton
                            size="sm"
                            variant="accent"
                            onClick={() => handleDownloadRnsPdf(emp)}
                            loading={downloadingId === emp.userId}
                          >
                            <Printer className="w-3.5 h-3.5 mr-1" /> Imprimer RNS CNPS PDF
                          </NeuButton>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          )}
        </NeuCardContent>
        <NeuPagination
          currentPage={currentPage}
          totalPages={totalPages}
          totalItems={filtered.length}
          itemsPerPage={itemsPerPage}
          onPageChange={setCurrentPage}
        />
      </NeuCard>
    </div>
  );
}
