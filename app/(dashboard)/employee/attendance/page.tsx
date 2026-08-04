"use client";

import { useEffect, useState } from "react";
import { NeuCard, NeuCardContent } from "@/components/ui/neu-card";
import { Spinner } from "@/components/ui/spinner";
import { EmptyState } from "@/components/ui/empty-state";
import { ClipboardCheck, Calendar, Clock } from "lucide-react";
import { List2, ListItem } from "@/components/ui/list-2";
import { NeuBadge } from "@/components/ui/neu-badge";

interface AttendanceRecord {
  _id: string;
  date: string;
  checkIn?: string;
  checkOut?: string;
  status: string;
  hoursWorked: number;
}

export default function EmployeeAttendancePage() {
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [month, setMonth] = useState(new Date().getMonth() + 1);
  const [year, setYear] = useState(new Date().getFullYear());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAttendance();
  }, [month, year]);

  const fetchAttendance = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/attendance?month=${year}-${String(month).padStart(2, "0")}`);
      const data = await response.json();
      if (data.success) {
        setRecords(data.data.records || []);
      }
    } catch (error) {
      console.error("Failed to fetch attendance", error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case "present": return "present" as const;
      case "late": return "late" as const;
      case "absent": return "absent" as const;
      case "half-day": return "warning" as const;
      case "on-leave": return "accent" as const;
      default: return "default" as const;
    }
  };

  const getStatusBadgeLabel = (status: string) => {
    switch (status) {
      case "present": return "Présent";
      case "late": return "En Retard";
      case "absent": return "Absent";
      case "half-day": return "Demi-Journée";
      case "on-leave": return "En Congé";
      default: return status;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h2 className="text-2xl font-bold text-[var(--neu-text)]">Mon Historique de Pointages</h2>
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <select
            value={month}
            onChange={(e) => setMonth(parseInt(e.target.value))}
            className="flex-1 sm:flex-none px-3 py-2 rounded-lg bg-[var(--neu-surface)] border border-[var(--neu-border)] text-sm outline-none transition-colors hover:border-[var(--neu-accent)]/50 focus:border-[var(--neu-accent)]"
          >
            {Array.from({ length: 12 }, (_, i) => (
              <option key={i + 1} value={i + 1}>
                {new Date(0, i).toLocaleString("fr-FR", { month: "long" })}
              </option>
            ))}
          </select>
          <select
            value={year}
            onChange={(e) => setYear(parseInt(e.target.value))}
            className="flex-1 sm:flex-none px-3 py-2 rounded-lg bg-[var(--neu-surface)] border border-[var(--neu-border)] text-sm outline-none transition-colors hover:border-[var(--neu-accent)]/50 focus:border-[var(--neu-accent)]"
          >
            {[2024, 2025, 2026].map((y) => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>
        </div>
      </div>

      <NeuCard>
        <NeuCardContent className="p-6">
          {records.length === 0 ? (
            <EmptyState
              icon={ClipboardCheck}
              title="Aucun historique de pointage"
              description="Aucun pointage enregistré trouvé pour ce mois."
            />
          ) : (
            <List2 
              items={records.map((record) => ({
                icon: <Calendar className="w-5 h-5 text-[var(--neu-accent)]" />,
                title: new Date(record.date).toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long", year: "numeric" }),
                category: "POINTAGE D'ARRIVÉE",
                description: (
                  <div className="flex flex-col gap-1">
                    <span className="font-bold text-[var(--neu-accent)]">
                      {record.hoursWorked?.toFixed(1) || "0"}h de Travail
                    </span>
                  </div>
                ),
                status: (
                  <NeuBadge variant={getStatusBadgeVariant(record.status)}>
                    {getStatusBadgeLabel(record.status)}
                  </NeuBadge>
                )
              }))}
            />
          )}
        </NeuCardContent>
      </NeuCard>
    </div>
  );
}
