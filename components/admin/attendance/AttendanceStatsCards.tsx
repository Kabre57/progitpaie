"use client";

import React from "react";
import { NeuCard, NeuCardContent } from "@/components/ui/neu-card";

export interface TodaySummary {
  totalEmployees: number;
  presentToday: number;
  absentToday: number;
  lateToday: number;
  onLeaveToday: number;
}

interface AttendanceStatsCardsProps {
  summary: TodaySummary | null;
}

export function AttendanceStatsCards({ summary }: AttendanceStatsCardsProps) {
  if (!summary) return null;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      <NeuCard>
        <NeuCardContent className="p-4 flex items-center justify-between">
          <div>
            <p className="text-xs text-[var(--neu-text-secondary)]">Présents aujourd&apos;hui</p>
            <p className="text-xl font-bold text-emerald-500 mt-1">
              {summary.presentToday} / {summary.totalEmployees}
            </p>
          </div>
          <div className="w-10 h-10 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-500 font-bold">
            ✓
          </div>
        </NeuCardContent>
      </NeuCard>

      <NeuCard>
        <NeuCardContent className="p-4 flex items-center justify-between">
          <div>
            <p className="text-xs text-[var(--neu-text-secondary)]">En retard</p>
            <p className="text-xl font-bold text-amber-500 mt-1">{summary.lateToday}</p>
          </div>
          <div className="w-10 h-10 rounded-full bg-amber-500/10 flex items-center justify-center text-amber-500 font-bold">
            ⏱
          </div>
        </NeuCardContent>
      </NeuCard>

      <NeuCard>
        <NeuCardContent className="p-4 flex items-center justify-between">
          <div>
            <p className="text-xs text-[var(--neu-text-secondary)]">Absents</p>
            <p className="text-xl font-bold text-rose-500 mt-1">{summary.absentToday}</p>
          </div>
          <div className="w-10 h-10 rounded-full bg-rose-500/10 flex items-center justify-center text-rose-500 font-bold">
            ✗
          </div>
        </NeuCardContent>
      </NeuCard>

      <NeuCard>
        <NeuCardContent className="p-4 flex items-center justify-between">
          <div>
            <p className="text-xs text-[var(--neu-text-secondary)]">En congé</p>
            <p className="text-xl font-bold text-purple-400 mt-1">{summary.onLeaveToday}</p>
          </div>
          <div className="w-10 h-10 rounded-full bg-purple-500/10 flex items-center justify-center text-purple-400 font-bold">
            ✈
          </div>
        </NeuCardContent>
      </NeuCard>
    </div>
  );
}
