"use client";

import * as React from "react";
import { CalendarDays, Clock, TrendingUp } from "lucide-react";
import { NeuCard, NeuCardHeader, NeuCardTitle, NeuCardContent } from "@/components/ui/neu-card";
import { NeuStatCard } from "@/components/ui/neu-stat-card";
import { NeuBadge } from "@/components/ui/neu-badge";
import { cn } from "@/lib/utils";
import CheckInOutPanel from "@/components/attendance/check-in-out-panel";
import { ChipLoader } from "@/components/ui/chip-loader";
import { List2 } from "@/components/ui/list-2";
import { Clock as ClockIcon } from "lucide-react";

interface User {
  _id: string;
  name: string;
  email: string;
  role: string;
  department: string;
}

interface AttendanceRecord {
  _id: string;
  date: string;
  checkIn: string;
  checkOut: string | null;
  status: "present" | "absent" | "late";
  hoursWorked: number;
}

function formatShortTime(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleTimeString("fr-FR", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
}

function formatDisplayDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString("fr-FR", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });
}

function getMonthName(monthStr: string): string {
  const [year, month] = monthStr.split("-");
  const date = new Date(parseInt(year), parseInt(month) - 1);
  return date.toLocaleDateString("fr-FR", { month: "long", year: "numeric" });
}

function getCurrentMonth(): string {
  const now = new Date();
  return now.toISOString().slice(0, 7);
}

function getWorkingDaysInMonth(month: string): number {
  const [year, monthNum] = month.split("-").map(Number);
  const daysInMonth = new Date(year, monthNum, 0).getDate();
  let workingDays = 0;
  
  for (let day = 1; day <= daysInMonth; day++) {
    const date = new Date(year, monthNum - 1, day);
    const dayOfWeek = date.getDay();
    if (dayOfWeek !== 0 && dayOfWeek !== 6) {
      workingDays++;
    }
  }
  
  return workingDays;
}

export default function EmployeeDashboard() {
  const [user, setUser] = React.useState<User | null>(null);
  const [records, setRecords] = React.useState<AttendanceRecord[]>([]);
  const [currentMonth, setCurrentMonth] = React.useState<string>("");
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    setCurrentMonth(getCurrentMonth());
    fetchUserData();
  }, []);

  React.useEffect(() => {
    if (currentMonth) {
      fetchAttendanceData();
    }
  }, [currentMonth]);

  const fetchUserData = async () => {
    try {
      const response = await fetch("/api/auth/me");
      const data = await response.json();
      if (data.success) {
        setUser(data.data);
      }
    } catch (error) {
      console.error("Erreur lors de la récupération du profil utilisateur :", error);
    }
  };

  const fetchAttendanceData = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/attendance?month=${currentMonth}`);
      const data = await response.json();
      if (data.success) {
        setRecords(Array.isArray(data.data.records) ? data.data.records : []);
      }
    } catch (error) {
      console.error("Erreur lors de la récupération des pointages :", error);
    } finally {
      setLoading(false);
    }
  };

  // Statistiques
  const workingDays = currentMonth ? getWorkingDaysInMonth(currentMonth) : 0;
  const daysPresent = records.filter(
    (r) => r.status === "present" || r.status === "late"
  ).length;
  const totalHours = records.reduce((sum, r) => sum + (r.hoursWorked || 0), 0);
  const attendancePercentage = workingDays > 0 
    ? Math.round((daysPresent / workingDays) * 100) 
    : 0;

  return (
    <div className="space-y-8">
      {/* Salutation */}
      <div className="space-y-2">
        <h1 className="text-3xl font-bold text-[var(--neu-text)] capitalize">
          Ravi de vous revoir{user ? `, ${user.name.split(" ")[0]} !` : " !"}
        </h1>
        <p className="text-[var(--neu-text-secondary)] capitalize">
          {user?.department && `${user.department} • `}
          {currentMonth ? `Aperçu du mois de ${getMonthName(currentMonth)}` : "Chargement..."}
        </p>
      </div>

      {/* Cartes de Statistiques */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <NeuStatCard
          title="Présence ce Mois"
          value={`${daysPresent} jours`}
          subtitle={`sur ${workingDays} jours ouvrés`}
          icon={<CalendarDays className="w-6 h-6" />}
        />
        <NeuStatCard
          title="Heures Travaillées"
          value={`${totalHours.toFixed(1)}h`}
          subtitle="au total ce mois-ci"
          icon={<Clock className="w-6 h-6" />}
        />
        <NeuStatCard
          title="Taux d'Assiduité"
          value={`${attendancePercentage}%`}
          trend={attendancePercentage >= 90 ? "up" : attendancePercentage >= 70 ? "neutral" : "down"}
          trendValue={attendancePercentage >= 90 ? "Excellent !" : attendancePercentage >= 70 ? "Satisfaisant" : "À améliorer"}
          icon={<TrendingUp className="w-6 h-6" />}
        />
      </div>

      {/* Panneau de Pointage Arrivée / Départ */}
      <CheckInOutPanel />

      {/* Historique des Pointages du Mois */}
      <NeuCard>
        <NeuCardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <NeuCardTitle>Historique des Pointages du Mois</NeuCardTitle>
            <div className="flex items-center gap-3 w-full sm:w-auto">
              <label className="text-sm font-medium text-[var(--neu-text-secondary)] whitespace-nowrap">Mois de consultation :</label>
              <input
                type="month"
                value={currentMonth}
                onChange={(e) => setCurrentMonth(e.target.value)}
                className="w-full sm:w-auto px-3 py-1.5 rounded-lg border border-[var(--neu-border)] bg-[var(--neu-bg)] text-sm font-medium text-[var(--neu-text)] focus:outline-none focus:ring-2 focus:ring-[var(--neu-accent)]/20 transition-all cursor-pointer"
              />
            </div>
          </div>
        </NeuCardHeader>
        <NeuCardContent>
          {loading ? (
            <ChipLoader size="sm" />
          ) : records.length === 0 ? (
            <p className="text-center text-[var(--neu-text-muted)] py-8">
              Aucun pointage enregistré pour ce mois
            </p>
          ) : (
            <List2 
              items={records.slice(0, 31).map((record) => ({
                icon: <ClockIcon className={cn("w-5 h-5", record.status === "late" ? "text-[var(--neu-warning)]" : "text-[var(--neu-accent)]")} />,
                title: formatDisplayDate(record.date),
                category: "POINTAGE REGISTRÉ",
                description: (
                  <div className="flex items-center gap-3 text-sm">
                    <span className="opacity-70">
                      {record.checkIn ? formatShortTime(record.checkIn) : "--:--"}
                    </span>
                    <span>→</span>
                    <span className="opacity-70">
                      {record.checkOut ? formatShortTime(record.checkOut) : "--:--"}
                    </span>
                    <span className="ml-2 font-black text-[var(--neu-text)]">
                      {record.hoursWorked ? `${record.hoursWorked.toFixed(1)}h` : "-"}
                    </span>
                  </div>
                ),
                status: (
                  <NeuBadge variant={record.status === "present" ? "success" : record.status === "late" ? "warning" : "error"}>
                    {record.status === "present" ? "Présent" : record.status === "late" ? "En Retard" : "Absent"}
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
