"use client";

import { useState, useEffect, useCallback } from "react";
import { NeuCard, NeuCardHeader, NeuCardTitle, NeuCardContent } from "@/components/ui/neu-card";
import { NeuButton } from "@/components/ui/neu-button";
import { NeuBadge } from "@/components/ui/neu-badge";
import { Building2, Download, Printer, Search, Loader2, DollarSign, CheckCircle2 } from "lucide-react";

interface BankGroup {
  bankName: string;
  count: number;
  totalAmount: number;
  employees: Array<{
    userId: string;
    name: string;
    employeeId: string;
    bankAccount: string;
    netSalary: number;
  }>;
}

export default function BankTransfersPage() {
  const [month, setMonth] = useState(new Date().getMonth() + 1);
  const [year, setYear] = useState(new Date().getFullYear());
  const [bankSummaries, setBankSummaries] = useState<BankGroup[]>([]);
  const [grandTotal, setGrandTotal] = useState(0);
  const [totalTransfers, setTotalTransfers] = useState(0);
  const [loading, setLoading] = useState(true);
  const [selectedBank, setSelectedBank] = useState<string | null>(null);
  const [downloadingBank, setDownloadingBank] = useState<string | null>(null);

  const fetchBankTransfers = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/payroll/bank-transfers?month=${month}&year=${year}`);
      const json = await res.json();
      if (json.success) {
        setBankSummaries(json.data.bankSummaries || []);
        setGrandTotal(json.data.grandTotal || 0);
        setTotalTransfers(json.data.totalTransfers || 0);
        if (json.data.bankSummaries?.length > 0 && !selectedBank) {
          setSelectedBank(json.data.bankSummaries[0].bankName);
        }
      }
    } catch (err) {
      console.error("Fetch bank transfers error:", err);
    } finally {
      setLoading(false);
    }
  }, [month, year]);

  useEffect(() => {
    fetchBankTransfers();
  }, [fetchBankTransfers]);

  const handlePrintOrdreVirement = async (group: BankGroup) => {
    setDownloadingBank(group.bankName);
    try {
      const res = await fetch("/api/documents/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          docType: "ordre_virement",
          bankName: group.bankName,
          totalAmount: group.totalAmount,
          month,
          year,
        }),
      });

      if (res.ok) {
        const blob = await res.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `ordre-virement-${group.bankName.replace(/\s+/g, "-")}-${month}-${year}.pdf`;
        document.body.appendChild(a);
        a.click();
        a.remove();
      } else {
        alert("Erreur lors de la génération de l'Ordre de Virement");
      }
    } catch (err) {
      console.error("Print ordre virement error:", err);
    } finally {
      setDownloadingBank(null);
    }
  };

  const currentGroup = bankSummaries.find((b) => b.bankName === selectedBank) || bankSummaries[0];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[var(--neu-text)] flex items-center gap-2">
            <Building2 className="text-[var(--neu-accent)]" /> Ordres de Virement & Bordereaux Bancaires (LOGIPAIE)
          </h1>
          <p className="text-[var(--neu-text-secondary)] text-sm mt-1">
            Édition des ordres de virement officiels et bordereaux nominatifs ventilés par établissement bancaire.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <select
            value={month}
            onChange={(e) => setMonth(Number(e.target.value))}
            className="px-3 py-1.5 rounded-lg bg-[var(--neu-surface-light)] border border-[var(--neu-border)] text-sm font-bold text-[var(--neu-text)] outline-none"
          >
            {Array.from({ length: 12 }, (_, i) => (
              <option key={i + 1} value={i + 1}>
                {new Date(2026, i).toLocaleString("fr-FR", { month: "long" })}
              </option>
            ))}
          </select>
          <select
            value={year}
            onChange={(e) => setYear(Number(e.target.value))}
            className="px-3 py-1.5 rounded-lg bg-[var(--neu-surface-light)] border border-[var(--neu-border)] text-sm font-bold text-[var(--neu-text)] outline-none"
          >
            {[2024, 2025, 2026, 2027].map((y) => (
              <option key={y} value={y}>
                {y}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <NeuCard>
          <NeuCardContent className="p-4 flex items-center gap-4">
            <div className="p-3 rounded-lg bg-[#666cff]/10 text-[#666cff]">
              <DollarSign className="w-6 h-6" />
            </div>
            <div>
              <div className="text-xs font-semibold text-[var(--neu-text-secondary)] uppercase">Total Général à Virer</div>
              <div className="text-xl font-extrabold text-[var(--neu-text)]">
                {grandTotal.toLocaleString()} FCFA
              </div>
            </div>
          </NeuCardContent>
        </NeuCard>

        <NeuCard>
          <NeuCardContent className="p-4 flex items-center gap-4">
            <div className="p-3 rounded-lg bg-emerald-500/10 text-emerald-500">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <div>
              <div className="text-xs font-semibold text-[var(--neu-text-secondary)] uppercase">Virements Effectués</div>
              <div className="text-xl font-extrabold text-[var(--neu-text)]">{totalTransfers} Salariés</div>
            </div>
          </NeuCardContent>
        </NeuCard>

        <NeuCard>
          <NeuCardContent className="p-4 flex items-center gap-4">
            <div className="p-3 rounded-lg bg-sky-500/10 text-sky-500">
              <Building2 className="w-6 h-6" />
            </div>
            <div>
              <div className="text-xs font-semibold text-[var(--neu-text-secondary)] uppercase">Établissements Bancaires</div>
              <div className="text-xl font-extrabold text-[var(--neu-text)]">{bankSummaries.length} Banques</div>
            </div>
          </NeuCardContent>
        </NeuCard>
      </div>

      {/* Bank Tabs */}
      {bankSummaries.length > 0 && (
        <div className="flex gap-2 overflow-x-auto pb-2 border-b border-[var(--neu-border)]">
          {bankSummaries.map((b) => (
            <NeuButton
              key={b.bankName}
              variant={selectedBank === b.bankName ? "accent" : "ghost"}
              onClick={() => setSelectedBank(b.bankName)}
              size="sm"
            >
              {b.bankName} ({b.count}) - {b.totalAmount.toLocaleString()} F
            </NeuButton>
          ))}
        </div>
      )}

      {/* Bank Schedule Detail */}
      {currentGroup && (
        <NeuCard>
          <NeuCardHeader className="flex flex-row items-center justify-between border-b border-[var(--neu-border)] p-4">
            <div>
              <NeuCardTitle className="text-lg font-bold flex items-center gap-2">
                Bordereau Nominatif : {currentGroup.bankName}
              </NeuCardTitle>
              <p className="text-xs text-[var(--neu-text-secondary)] mt-0.5">
                {currentGroup.count} virement(s) • Total : {currentGroup.totalAmount.toLocaleString()} FCFA
              </p>
            </div>
            <NeuButton
              variant="accent"
              onClick={() => handlePrintOrdreVirement(currentGroup)}
              loading={downloadingBank === currentGroup.bankName}
            >
              <Printer className="w-4 h-4 mr-2" /> Imprimer Ordre de Virement PDF
            </NeuButton>
          </NeuCardHeader>
          <NeuCardContent className="p-0 overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="border-b border-[var(--neu-border)] bg-[var(--neu-surface-light)] text-[var(--neu-text-secondary)] uppercase text-[11px] font-semibold tracking-wider">
                  <th className="px-4 py-3">Matricule</th>
                  <th className="px-4 py-3">Noms & Prénoms du Salarié</th>
                  <th className="px-4 py-3">Banque & Numéro de Compte (RIB)</th>
                  <th className="px-4 py-3 text-right">Net à Virer (FCFA)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--neu-border)] text-xs">
                {currentGroup.employees.map((emp) => (
                  <tr key={emp.userId} className="hover:bg-[var(--neu-surface-light)] transition-colors">
                    <td className="px-4 py-3 font-mono font-bold text-[var(--neu-accent)]">{emp.employeeId}</td>
                    <td className="px-4 py-3 font-bold text-[var(--neu-text)]">{emp.name}</td>
                    <td className="px-4 py-3 font-mono text-[var(--neu-text)]">{emp.bankAccount}</td>
                    <td className="px-4 py-3 text-right font-mono font-extrabold text-[var(--neu-text)] text-sm">
                      {emp.netSalary.toLocaleString()} FCFA
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </NeuCardContent>
        </NeuCard>
      )}
    </div>
  );
}
