"use client";

import { useState, useEffect, useCallback } from "react";
import { NeuCard, NeuCardHeader, NeuCardTitle, NeuCardContent } from "@/components/ui/neu-card";
import { NeuButton } from "@/components/ui/neu-button";
import { NeuBadge } from "@/components/ui/neu-badge";
import { BookOpen, CheckCircle2, AlertTriangle, RefreshCw } from "lucide-react";

interface VoucherRow {
  account: string;
  label: string;
  debit: number;
  credit: number;
}

export default function AccountingPage() {
  const [month, setMonth] = useState(new Date().getMonth() + 1);
  const [year, setYear] = useState(new Date().getFullYear());
  const [vouchers, setVouchers] = useState<VoucherRow[]>([]);
  const [totalDebit, setTotalDebit] = useState(0);
  const [totalCredit, setTotalCredit] = useState(0);
  const [isBalanced, setIsBalanced] = useState(true);
  const [loading, setLoading] = useState(true);

  const fetchAccounting = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/payroll/accounting?month=${month}&year=${year}`);
      const json = await res.json();
      if (json.success) {
        setVouchers(json.data.journalVouchers || []);
        setTotalDebit(json.data.totalDebit || 0);
        setTotalCredit(json.data.totalCredit || 0);
        setIsBalanced(json.data.isBalanced ?? true);
      }
    } catch (err) {
      console.error("Fetch accounting error:", err);
    } finally {
      setLoading(false);
    }
  }, [month, year]);

  useEffect(() => {
    fetchAccounting();
  }, [fetchAccounting]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[var(--neu-text)] flex items-center gap-2">
            <BookOpen className="text-[var(--neu-accent)]" /> Journal des Imputations Comptables SYSCOHADA 
          </h1>
          <p className="text-[var(--neu-text-secondary)] text-sm mt-1">
            Génération automatique des pièces comptables de paie conformes au plan comptable SYSCOHADA.
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

          <NeuButton onClick={fetchAccounting} variant="ghost" size="sm">
            <RefreshCw className="w-4 h-4 mr-1" /> Actualiser
          </NeuButton>
        </div>
      </div>

      {/* Balance Indicator */}
      <NeuCard className="p-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          {isBalanced ? (
            <div className="p-3 bg-emerald-500/10 text-emerald-500 rounded-lg">
              <CheckCircle2 size={24} />
            </div>
          ) : (
            <div className="p-3 bg-rose-500/10 text-rose-500 rounded-lg">
              <AlertTriangle size={24} />
            </div>
          )}
          <div>
            <div className="text-lg font-bold text-[var(--neu-text)]">
              {isBalanced ? "Écriture Comptable Équilibrée (Débit = Crédit)" : "Déséquilibre Comptable Détecté"}
            </div>
            <div className="text-xs text-[var(--neu-text-secondary)]">
              Journal OD Paie • Période : {new Date(2026, month - 1).toLocaleString("fr-FR", { month: "long" })} {year}
            </div>
          </div>
        </div>

        <NeuBadge variant={isBalanced ? "success" : "danger"}>
          {isBalanced ? "SYSCOHADA OK" : "ERREUR BALANCE"}
        </NeuBadge>
      </NeuCard>

      {/* Vouchers Table */}
      <NeuCard>
        <NeuCardHeader className="p-4 border-b border-[var(--neu-border)]">
          <NeuCardTitle className="text-lg font-bold">Pièce Comptable : Écritures de Centralisation de Paie</NeuCardTitle>
        </NeuCardHeader>
        <NeuCardContent className="p-0 overflow-x-auto">
          <table className="w-full text-left border-collapse text-sm">
            <thead>
              <tr className="border-b border-[var(--neu-border)] bg-[var(--neu-surface-light)] text-[var(--neu-text-secondary)] uppercase text-[11px] font-semibold tracking-wider">
                <th className="px-4 py-3">Compte Général SYSCOHADA</th>
                <th className="px-4 py-3">Intitulé du Compte / Libellé d'Écriture</th>
                <th className="px-4 py-3 text-right">Débit (FCFA)</th>
                <th className="px-4 py-3 text-right">Crédit (FCFA)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--neu-border)] text-xs">
              {vouchers.map((row, idx) => (
                <tr key={idx} className="hover:bg-[var(--neu-surface-light)] transition-colors">
                  <td className="px-4 py-3 font-mono font-bold text-[var(--neu-accent)]">{row.account}</td>
                  <td className="px-4 py-3 font-medium text-[var(--neu-text)]">{row.label}</td>
                  <td className="px-4 py-3 text-right font-mono font-bold text-emerald-500">
                    {row.debit > 0 ? `${row.debit.toLocaleString()} FCFA` : "-"}
                  </td>
                  <td className="px-4 py-3 text-right font-mono font-bold text-amber-500">
                    {row.credit > 0 ? `${row.credit.toLocaleString()} FCFA` : "-"}
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="border-t-2 border-[var(--neu-border)] bg-[var(--neu-surface-light)] font-bold text-sm">
                <td colSpan={2} className="px-4 py-3 uppercase text-right">TOTAL GENERAL GENERAL :</td>
                <td className="px-4 py-3 text-right font-mono text-emerald-500 font-extrabold">{totalDebit.toLocaleString()} FCFA</td>
                <td className="px-4 py-3 text-right font-mono text-amber-500 font-extrabold">{totalCredit.toLocaleString()} FCFA</td>
              </tr>
            </tfoot>
          </table>
        </NeuCardContent>
      </NeuCard>
    </div>
  );
}
