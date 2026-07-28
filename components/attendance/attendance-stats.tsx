"use client";

import { UserCheck, UserX, Clock, TrendingUp, Timer, Users } from "lucide-react";
import { NeuStatCard } from "@/components/ui/neu-stat-card";
import { ChipLoader } from "@/components/ui/chip-loader";

interface AttendanceStatsData {
  totalEmployees: number;
  presentToday: number;
  absentToday: number;
  lateToday: number;
  avgHoursThisMonth: number;
  attendanceRate: number;
  totalLateThisMonth: number;
  presentTrend: number;
  lateTrend: number;
  month: string;
}

interface AttendanceStatsProps {
  stats: AttendanceStatsData | null;
  isLoading?: boolean;
}

export function AttendanceStats({ stats }: AttendanceStatsProps) {
  const safeStats = stats || {
    totalEmployees: 0,
    presentToday: 0,
    absentToday: 0,
    lateToday: 0,
    avgHoursThisMonth: 0,
    attendanceRate: 0,
    totalLateThisMonth: 0,
    presentTrend: 0,
    lateTrend: 0,
    month: "",
  };

  const getTrend = (value: number): "up" | "down" | "neutral" => {
    if (value > 0) return "up";
    if (value < 0) return "down";
    return "neutral";
  };

  const formatTrendValue = (value: number): string => {
    const sign = value > 0 ? "+" : "";
    return `${sign}${value}%`;
  };

  return (
    <div className="space-y-4">
      {/* First Row - 4 cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <NeuStatCard
          title="Présents Aujourd'hui"
          value={safeStats.presentToday}
          icon={<UserCheck className="w-6 h-6" />}
          gradient="success"
          trend={getTrend(safeStats.presentTrend)}
          trendValue={safeStats.presentTrend !== 0 ? formatTrendValue(safeStats.presentTrend) : undefined}
          subtitle="par rapport à hier"
        />
        <NeuStatCard
          title="Absents Aujourd'hui"
          value={safeStats.absentToday}
          icon={<UserX className="w-6 h-6" />}
          gradient="danger"
          trend="down"
          subtitle="salariés"
        />
        <NeuStatCard
          title="En Retard Aujourd'hui"
          value={safeStats.lateToday}
          icon={<Clock className="w-6 h-6" />}
          gradient="warning"
          trend={getTrend(safeStats.lateTrend)}
          trendValue={safeStats.lateTrend !== 0 ? formatTrendValue(safeStats.lateTrend) : undefined}
          subtitle="par rapport à hier"
        />
        <NeuStatCard
          title="Taux de Présence"
          value={`${safeStats.attendanceRate}%`}
          icon={<TrendingUp className="w-6 h-6" />}
          gradient="cyan"
          trend={safeStats.attendanceRate >= 90 ? "up" : safeStats.attendanceRate >= 75 ? "neutral" : "down"}
          subtitle="ce mois-ci"
        />
      </div>

      {/* Second Row - 2 cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <NeuStatCard
          title="Moyenne Heures / Jour"
          value={`${safeStats.avgHoursThisMonth}h`}
          icon={<Timer className="w-6 h-6" />}
          gradient="primary"
          subtitle="ce mois-ci"
        />
        <NeuStatCard
          title="Effectif Total Salariés"
          value={safeStats.totalEmployees}
          icon={<Users className="w-6 h-6" />}
          gradient="primary"
          subtitle="salariés inscrits"
        />
      </div>
    </div>
  );
}
