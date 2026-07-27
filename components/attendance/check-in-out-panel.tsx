"use client";

import * as React from "react";
import { Clock, LogIn, LogOut, CheckCircle } from "lucide-react";
import { ChipLoader } from "@/components/ui/chip-loader";
import { NeuCard, NeuCardContent } from "@/components/ui/neu-card";
import { NeuButton } from "@/components/ui/neu-button";
import { NeuBadge } from "@/components/ui/neu-badge";
import { useTodayAttendance, useCheckIn, useCheckOut } from "@/lib/hooks/useAttendance";
import { useToast } from "@/components/ui/neu-toast";

function formatTime(date: Date): string {
  return date.toLocaleTimeString("fr-FR", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

function formatDate(date: Date): string {
  return date.toLocaleDateString("fr-FR", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

function formatShortTime(dateStr: Date | string): string {
  const date = new Date(dateStr);
  return date.toLocaleTimeString("fr-FR", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function CheckInOutPanel() {
  const [currentTime, setCurrentTime] = React.useState<Date | null>(null);
  const toast = useToast();

  const { data: todayRecord, isLoading: isFetchingToday } = useTodayAttendance();
  const checkInMutation = useCheckIn();
  const checkOutMutation = useCheckOut();

  const loading = checkInMutation.isPending || checkOutMutation.isPending;

  React.useEffect(() => {
    setCurrentTime(new Date());
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const handleCheckIn = async () => {
    try {
      await checkInMutation.mutateAsync({ outOfOffice: false });
      toast.success("Votre arrivée a été enregistrée avec succès.");
    } catch (error: any) {
      toast.error(error.message || "Échec du pointage d'arrivée");
    }
  };

  const handleCheckOut = async () => {
    try {
      await checkOutMutation.mutateAsync({});
      toast.success("Votre départ a été enregistré avec succès.");
    } catch (error: any) {
      toast.error(error.message || "Échec du pointage de départ");
    }
  };

  const isCheckedIn = Boolean(todayRecord);
  const isCheckedOut = Boolean(todayRecord?.checkOut);
  const isCompleted = isCheckedIn && isCheckedOut;

  const getStatusInfo = () => {
    if (!isCheckedIn || !todayRecord) {
      return {
        text: "Non pointé aujourd'hui",
        color: "text-[var(--neu-text-muted)]",
      };
    }
    if (!isCheckedOut) {
      return {
        text: `Arrivé à ${formatShortTime(todayRecord.checkIn)}`,
        color: "text-[var(--neu-success)]",
      };
    }
    return {
      text: `Départ enregistré — ${todayRecord.hoursWorked?.toFixed(1) || 0}h effectuées`,
      color: "text-[var(--neu-accent)]",
    };
  };

  const statusInfo = getStatusInfo();

  const getBadgeVariant = (status?: string): "success" | "warning" | "error" | "info" => {
    if (status === "present") return "success";
    if (status === "late") return "warning";
    if (status === "absent") return "error";
    return "info";
  };

  return (
    <NeuCard className="w-full">
      <NeuCardContent className="p-8">
        <div className="flex flex-col items-center space-y-6">
          {/* Horloge en direct */}
          <div className="text-center">
            <div className="flex items-center justify-center gap-2 mb-1">
              <Clock className="w-5 h-5 md:w-6 md:h-6 text-[var(--neu-accent)]" />
              <span className="text-3xl md:text-5xl font-bold text-[var(--neu-text)] tracking-tight" suppressHydrationWarning>
                {currentTime ? formatTime(currentTime) : "--:--:--"}
              </span>
            </div>
            <p className="text-lg text-[var(--neu-text-secondary)] capitalize" suppressHydrationWarning>
              {currentTime ? formatDate(currentTime) : "Chargement..."}
            </p>
          </div>

          {/* Indicateur de Statut */}
          <div className="flex items-center gap-3">
            <span className={`text-lg font-medium ${statusInfo.color}`}>
              {statusInfo.text}
            </span>
            {isCheckedIn && todayRecord?.status && (
              <NeuBadge variant={getBadgeVariant(todayRecord.status)}>
                {todayRecord.status === "present" ? "Présent" : todayRecord.status === "late" ? "En Retard" : todayRecord.status}
              </NeuBadge>
            )}
          </div>

          {/* Boutons d'action React Query */}
          {isFetchingToday ? (
            <div className="w-full flex justify-center py-4">
              <ChipLoader size="sm" />
            </div>
          ) : isCompleted ? (
            <NeuButton
              size="lg"
              disabled
              className="w-48 h-14 text-lg opacity-60"
            >
              <CheckCircle className="w-5 h-5" />
              Pointage Terminé
            </NeuButton>
          ) : !isCheckedIn ? (
            <NeuButton
              variant="accent"
              size="lg"
              loading={loading}
              onClick={handleCheckIn}
              className="w-48 h-14 text-lg bg-[var(--neu-success)] hover:brightness-110"
            >
              <LogIn className="w-5 h-5" />
              Pointer l'Arrivée
            </NeuButton>
          ) : (
            <NeuButton
              size="lg"
              loading={loading}
              onClick={handleCheckOut}
              className="w-48 h-14 text-lg bg-[var(--neu-warning)] text-[var(--neu-bg)] hover:brightness-110"
            >
              <LogOut className="w-5 h-5" />
              Pointer le Départ
            </NeuButton>
          )}
        </div>
      </NeuCardContent>
    </NeuCard>
  );
}
