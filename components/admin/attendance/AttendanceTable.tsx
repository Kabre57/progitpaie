"use client";

import React from "react";
import { Loader2, User as UserIcon } from "lucide-react";
import { NeuCard, NeuCardContent } from "@/components/ui/neu-card";
import { NeuBadge } from "@/components/ui/neu-badge";
import { NeuButton } from "@/components/ui/neu-button";
import { NeuPagination } from "@/components/ui/neu-pagination";

export interface AttendanceRecord {
  _id: string;
  userId: {
    _id: string;
    name: string;
    email: string;
    employeeId?: string;
  };
  date: string;
  checkIn: string;
  checkOut: string | null;
  status: "present" | "absent" | "late" | "half-day" | "on-leave";
  hoursWorked: number;
  notes?: string;
  overriddenBy?: { name: string };
  overriddenAt?: string;
  outOfOffice?: boolean;
  location?: {
    lat: number | null;
    lng: number | null;
  };
}

interface AttendanceTableProps {
  records: AttendanceRecord[];
  isLoading: boolean;
  onOpenOverrideDialog: (record: AttendanceRecord) => void;
  currentPage: number;
  totalPages: number;
  totalItems: number;
  itemsPerPage: number;
  onPageChange: (page: number) => void;
}

export function AttendanceTable({
  records,
  isLoading,
  onOpenOverrideDialog,
  currentPage,
  totalPages,
  totalItems,
  itemsPerPage,
  onPageChange,
}: AttendanceTableProps) {
  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case "present":
        return "present" as const;
      case "late":
        return "late" as const;
      case "absent":
        return "absent" as const;
      case "half-day":
        return "warning" as const;
      case "on-leave":
        return "accent" as const;
      default:
        return "default" as const;
    }
  };

  const getLocationBadge = (record: AttendanceRecord) => {
    if (!record.location?.lat || !record.location?.lng) {
      return <NeuBadge variant="default">No GPS</NeuBadge>;
    }
    if (record.outOfOffice) {
      return <NeuBadge variant="warning">Out of Office</NeuBadge>;
    }
    return <NeuBadge variant="success">In Office</NeuBadge>;
  };

  return (
    <NeuCard>
      <NeuCardContent className="p-0 overflow-x-auto">
        {isLoading ? (
          <div className="flex items-center justify-center h-48">
            <Loader2 className="w-8 h-8 animate-spin text-[var(--neu-accent)]" />
          </div>
        ) : (
          <table className="w-full text-left border-collapse text-sm">
            <thead>
              <tr className="border-b border-[var(--neu-border)] bg-[var(--neu-surface-light)] text-[var(--neu-text-secondary)] uppercase text-[11px] font-semibold tracking-wider">
                <th className="px-4 py-3">Employé</th>
                <th className="px-4 py-3">Date</th>
                <th className="px-4 py-3 text-center">Arrivée</th>
                <th className="px-4 py-3 text-center">Départ</th>
                <th className="px-4 py-3 text-center">Statut</th>
                <th className="px-4 py-3 text-center">Localisation</th>
                <th className="px-4 py-3 text-right">Heures</th>
                <th className="px-4 py-3 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--neu-border)] text-xs">
              {records.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-8 text-center text-[var(--neu-text-secondary)] font-medium">
                    Aucun pointage trouvé pour cette sélection.
                  </td>
                </tr>
              ) : (
                records.map((record) => (
                  <tr key={record._id} className="hover:bg-[var(--neu-surface-light)] transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <UserIcon className="w-4 h-4 text-[var(--neu-accent)] shrink-0" />
                        <div>
                          <p className="font-semibold text-[var(--neu-text)]">{record.userId.name}</p>
                          <p className="text-[10px] text-[var(--neu-text-secondary)] font-mono">{record.userId.employeeId || record.userId.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 font-mono text-[var(--neu-text-secondary)]">
                      {new Date(record.date).toLocaleDateString("fr-FR")}
                    </td>
                    <td className="px-4 py-3 text-center font-mono font-medium">
                      {record.checkIn ? new Date(record.checkIn).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" }) : "-"}
                    </td>
                    <td className="px-4 py-3 text-center font-mono font-medium">
                      {record.checkOut ? new Date(record.checkOut).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" }) : "-"}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <NeuBadge variant={getStatusBadgeVariant(record.status)}>
                        {record.status.toUpperCase()}
                      </NeuBadge>
                    </td>
                    <td className="px-4 py-3 text-center">{getLocationBadge(record)}</td>
                    <td className="px-4 py-3 text-right font-mono font-bold text-[var(--neu-text)]">
                      {record.hoursWorked.toFixed(1)}h
                    </td>
                    <td className="px-4 py-3 text-center">
                      <NeuButton size="sm" variant="ghost" onClick={() => onOpenOverrideDialog(record)}>
                        Ajuster
                      </NeuButton>
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
