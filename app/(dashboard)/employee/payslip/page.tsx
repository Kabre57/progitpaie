"use client";

import { useEffect, useState } from "react";
import { NeuCard, NeuCardContent } from "@/components/ui/neu-card";
import { NeuButton } from "@/components/ui/neu-button";
import { Spinner } from "@/components/ui/spinner";
import { EmptyState } from "@/components/ui/empty-state";
import { FileText, Download } from "lucide-react";

interface PayrollRecord {
  _id: string;
  month: number;
  year: number;
  basicSalary: number;
  presentDays: number;
  absentDeduction: number;
  lateDeduction: number;
  unpaidLeaveDeduction: number;
  bonuses: number;
  netSalary: number;
  status: string;
}

const MONTH_NAMES_FR = [
  "Janvier", "Février", "Mars", "Avril", "Mai", "Juin",
  "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre"
];

function formatFCFA(amount: number): string {
  return `${Math.round(amount || 0).toLocaleString("fr-FR")} FCFA`;
}

export default function EmployeePayslipPage() {
  const [payroll, setPayroll] = useState<PayrollRecord[]>([]);
  const [month, setMonth] = useState(new Date().getMonth() + 1);
  const [year, setYear] = useState(new Date().getFullYear());
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<{ _id: string; name: string; employeeId?: string } | null>(null);

  useEffect(() => {
    fetchData();
  }, [month, year]);

  const fetchData = async () => {
    try {
      const [payrollRes, userRes] = await Promise.all([
        fetch(`/api/payroll/my?month=${month}&year=${year}`),
        fetch("/api/auth/me"),
      ]);

      const payrollData = await payrollRes.json();
      const userData = await userRes.json();

      if (payrollData.success) setPayroll(payrollData.data);
      if (userData.success) setUser(userData.data);
    } catch (error) {
      console.error("Erreur lors de la récupération du bulletin de paie :", error);
    } finally {
      setLoading(false);
    }
  };

  const downloadPayslip = () => {
    if (user?._id) {
      window.open(`/api/export/payslip/${user._id}?month=${month}&year=${year}`, "_blank");
    }
  };

  const selectedPayroll = payroll[0];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-[var(--neu-text)]">Mon Bulletin de Paie</h2>
          <p className="text-sm text-[var(--neu-text-secondary)] mt-0.5">
            Consultation et téléchargement des fiches de paie mensuelles en FCFA.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <select
            value={month}
            onChange={(e) => setMonth(parseInt(e.target.value))}
            className="flex-1 sm:flex-none px-3 py-2 rounded-lg bg-[var(--neu-surface)] border border-[var(--neu-border)] text-sm text-[var(--neu-text)] font-medium"
          >
            {MONTH_NAMES_FR.map((name, i) => (
              <option key={i + 1} value={i + 1}>
                {name}
              </option>
            ))}
          </select>
          <select
            value={year}
            onChange={(e) => setYear(parseInt(e.target.value))}
            className="flex-1 sm:flex-none px-3 py-2 rounded-lg bg-[var(--neu-surface)] border border-[var(--neu-border)] text-sm text-[var(--neu-text)] font-medium"
          >
            {[2024, 2025, 2026].map((y) => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>
        </div>
      </div>

      {!selectedPayroll ? (
        <EmptyState
          icon={FileText}
          title="Aucun bulletin trouvé"
          description={`Aucun bulletin de paie disponible pour ${MONTH_NAMES_FR[month - 1]} ${year}.`}
        />
      ) : (
        <NeuCard>
          <NeuCardContent className="p-4 sm:p-8 space-y-8">
            {/* Entête Fiche de Paie */}
            <div className="border-b border-[var(--neu-border)] pb-6 mb-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <h3 className="text-xl font-bold text-[var(--neu-accent)] tracking-wide">LOGIPAIE RH</h3>
                  <p className="text-sm text-[var(--neu-text-secondary)]">Bulletin de Paie Salarié</p>
                </div>
                <div className="sm:text-right">
                  <p className="font-bold text-[var(--neu-text)]">{user?.name}</p>
                  <p className="text-sm font-mono text-[var(--neu-accent)]">Matricule : {user?.employeeId || "EMP-001"}</p>
                </div>
              </div>
              <div className="mt-4 flex items-center justify-between">
                <p className="text-lg font-semibold text-[var(--neu-text)]">
                  Période : {MONTH_NAMES_FR[month - 1]} {year}
                </p>
                <span className={`inline-block px-3 py-1 rounded-full text-xs font-bold ${
                  selectedPayroll.status === "finalized" 
                    ? "bg-emerald-500/10 text-emerald-500 border border-emerald-500/20" 
                    : "bg-amber-500/10 text-amber-500 border border-amber-500/20"
                }`}>
                  {selectedPayroll.status === "finalized" ? "VALIDE" : "BROUILLON"}
                </span>
              </div>
            </div>

            {/* Détails du Salaire et Retenues */}
            <div className="space-y-4 text-sm">
              <div className="flex justify-between py-3 border-b border-[var(--neu-border)]">
                <span className="text-[var(--neu-text-secondary)] font-medium">Salaire de Base Catégoriel</span>
                <span className="font-bold text-[var(--neu-text)]">{formatFCFA(selectedPayroll.basicSalary)}</span>
              </div>
              <div className="flex justify-between py-3 border-b border-[var(--neu-border)]">
                <span className="text-[var(--neu-text-secondary)] font-medium">Jours de Présence Effective</span>
                <span className="font-bold text-[var(--neu-text)]">{selectedPayroll.presentDays} jour(s)</span>
              </div>
              {selectedPayroll.absentDeduction > 0 && (
                <div className="flex justify-between py-3 border-b border-[var(--neu-border)] text-red-500">
                  <span className="font-medium">Retenue pour Absences</span>
                  <span className="font-bold">-{formatFCFA(selectedPayroll.absentDeduction)}</span>
                </div>
              )}
              {selectedPayroll.lateDeduction > 0 && (
                <div className="flex justify-between py-3 border-b border-[var(--neu-border)] text-amber-500">
                  <span className="font-medium">Retenue pour Retards</span>
                  <span className="font-bold">-{formatFCFA(selectedPayroll.lateDeduction)}</span>
                </div>
              )}
              {selectedPayroll.unpaidLeaveDeduction > 0 && (
                <div className="flex justify-between py-3 border-b border-[var(--neu-border)] text-red-500">
                  <span className="font-medium">Retenue Congés Non Payés</span>
                  <span className="font-bold">-{formatFCFA(selectedPayroll.unpaidLeaveDeduction)}</span>
                </div>
              )}
              {selectedPayroll.bonuses > 0 && (
                <div className="flex justify-between py-3 border-b border-[var(--neu-border)] text-emerald-500">
                  <span className="font-medium">Primes & Gratifications</span>
                  <span className="font-bold">+{formatFCFA(selectedPayroll.bonuses)}</span>
                </div>
              )}
              <div className="flex justify-between py-4 text-base font-bold border-t-2 border-[var(--neu-border)] mt-4">
                <span className="text-[var(--neu-text)]">Net à Payer</span>
                <span className="text-xl text-[var(--neu-accent)] font-mono">{formatFCFA(selectedPayroll.netSalary)}</span>
              </div>
            </div>

            {/* Pied de Page */}
            <div className="mt-8 pt-6 border-t border-[var(--neu-border)]">
              <p className="text-xs text-[var(--neu-text-secondary)]">
                Ce bulletin de paie est édité électroniquement par LOGIPAIE RH et ne nécessite pas de signature manuscrite.
              </p>
              <p className="text-xs text-[var(--neu-text-secondary)] mt-1">
                Généré le {new Date().toLocaleDateString("fr-FR")}
              </p>
            </div>

            {/* Bouton Téléchargement */}
            <div className="mt-6 flex justify-end">
              <NeuButton onClick={downloadPayslip} variant="accent">
                <Download className="w-4 h-4 mr-2" />
                Télécharger la Fiche PDF
              </NeuButton>
            </div>
          </NeuCardContent>
        </NeuCard>
      )}
    </div>
  );
}
