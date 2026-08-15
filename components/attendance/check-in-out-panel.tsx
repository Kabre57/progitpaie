"use client";

import { getErrorMessage } from "@/lib/error-message";
import * as React from "react";
import { Clock, LogIn, LogOut, CheckCircle, MapPin, AlertCircle, RefreshCw, Send } from "lucide-react";
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
  const [geoState, setGeoState] = React.useState<{
    loading: boolean;
    lat?: number;
    lng?: number;
    accuracy?: number;
    error?: string;
  }>({ loading: false });

  const [showExceptionModal, setShowExceptionModal] = React.useState(false);
  const [exceptionType, setExceptionType] = React.useState("MISSION");
  const [exceptionReason, setExceptionReason] = React.useState("");
  const [submittingException, setSubmittingException] = React.useState(false);

  const toast = useToast();
  const { data: todayRecord, refetch } = useTodayAttendance();
  const checkInMutation = useCheckIn();
  const checkOutMutation = useCheckOut();

  const isCheckedIn = Boolean(todayRecord);
  const isCheckedOut = Boolean(todayRecord?.checkOut);

  React.useEffect(() => {
    setCurrentTime(new Date());
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  /**
   * Obtient les coordonnées GPS réelles de l'appareil
   */
  const requestGeolocation = (): Promise<{ lat: number; lng: number; accuracy: number }> => {
    setGeoState({ loading: true });
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        const errMsg = "La géolocalisation n'est pas supportée par votre navigateur.";
        setGeoState({ loading: false, error: errMsg });
        reject(new Error(errMsg));
        return;
      }

      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const res = {
            lat: pos.coords.latitude,
            lng: pos.coords.longitude,
            accuracy: pos.coords.accuracy,
          };
          setGeoState({ loading: false, ...res });
          resolve(res);
        },
        (err) => {
          let errMsg = "Erreur d'accès GPS.";
          if (err.code === err.PERMISSION_DENIED) {
            errMsg = "Accès GPS refusé. Veuillez autoriser la géolocalisation dans votre navigateur.";
          } else if (err.code === err.POSITION_UNAVAILABLE) {
            errMsg = "Position GPS indisponible.";
          } else if (err.code === err.TIMEOUT) {
            errMsg = "Délai d'attente GPS dépassé.";
          }
          setGeoState({ loading: false, error: errMsg });
          reject(new Error(errMsg));
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
      );
    });
  };

  /**
   * Clic sur Pointer Arrivée
   */
  const handleCheckIn = async () => {
    try {
      const gps = await requestGeolocation();
      await checkInMutation.mutateAsync({
        latitude: gps.lat,
        longitude: gps.lng,
        accuracyMeters: gps.accuracy,
        outOfOffice: false,
        isRemote: false,
      });
      toast.success("Votre présence au bureau a été validée par GPS.");
    } catch (error: unknown) {
      if (getErrorMessage(error)?.includes("hors zone") || getErrorMessage(error)?.includes("GPS")) {
        setShowExceptionModal(true);
      } else {
        toast.error(getErrorMessage(error) || "Échec du pointage d'arrivée");
      }
    }
  };

  /**
   * Clic sur Pointer Départ
   */
  const handleCheckOut = async () => {
    try {
      await checkOutMutation.mutateAsync({});
      toast.success("Votre départ a été enregistré avec succès.");
    } catch (error: unknown) {
      toast.error(getErrorMessage(error) || "Échec du pointage de départ");
    }
  };

  /**
   * Soumission d'une demande d'exception RH
   */
  const handleSubmitException = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmittingException(true);
    try {
      const res = await fetch("/api/attendance/exception", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          exceptionType,
          exceptionReason,
          latitude: geoState.lat,
          longitude: geoState.lng,
        }),
      });

      const json = await res.json();
      if (json.success) {
        toast.success("Demande d'exception transmise à la RH.");
        setShowExceptionModal(false);
        setExceptionReason("");
        refetch();
      } else {
        toast.error(json.error || "Erreur de soumission");
      }
    } catch (err) {
      toast.error("Erreur serveur");
    } finally {
      setSubmittingException(false);
    }
  };

  return (
    <NeuCard className="w-full">
      <NeuCardContent className="p-6 space-y-6">
        {/* HORLOGE CENTRALE */}
        <div className="text-center space-y-2">
          <div className="flex items-center justify-center gap-2 text-sm text-[var(--neu-text-subtle)] font-medium">
            <Clock className="w-4 h-4 text-emerald-500" />
            <span className="capitalize">{currentTime ? formatDate(currentTime) : "Chargement..."}</span>
          </div>

          <div className="text-4xl font-extrabold tracking-tight font-mono text-[var(--neu-text)]">
            {currentTime ? formatTime(currentTime) : "--:--:--"}
          </div>

          {/* INDICATEUR GPS EN TEMPS RÉEL */}
          <div className="flex items-center justify-center gap-2 text-xs font-semibold">
            {geoState.loading ? (
              <span className="text-blue-500 flex items-center gap-1">
                <RefreshCw size={12} className="animate-spin" /> Recherche de votre position GPS...
              </span>
            ) : geoState.lat ? (
              <span className="text-emerald-600 flex items-center gap-1 bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/20">
                <MapPin size={12} /> GPS Détecté (Précision ±{Math.round(geoState.accuracy || 0)}m)
              </span>
            ) : geoState.error ? (
              <span className="text-rose-500 flex items-center gap-1 bg-rose-500/10 px-2.5 py-1 rounded-full border border-rose-500/20">
                <AlertCircle size={12} /> {geoState.error}
              </span>
            ) : (
              <span className="text-[var(--neu-text-subtle)] flex items-center gap-1">
                <MapPin size={12} /> Pointage conditionné au bureau (Geofencing GPS)
              </span>
            )}
          </div>
        </div>

        {/* BOUTON PRINCIPAL DE POINTAGE */}
        <div className="flex justify-center pt-2">
          {!isCheckedIn ? (
            <NeuButton
              onClick={handleCheckIn}
              disabled={checkInMutation.isPending || geoState.loading}
              className="bg-emerald-600 hover:bg-emerald-700 text-white px-8 py-3 rounded-2xl font-bold flex items-center gap-2 shadow-lg"
            >
              <LogIn size={20} />
              {geoState.loading ? "Acquisition GPS..." : "Pointer mon Arrivée"}
            </NeuButton>
          ) : !isCheckedOut ? (
            <NeuButton
              onClick={handleCheckOut}
              disabled={checkOutMutation.isPending}
              className="bg-amber-600 hover:bg-amber-700 text-white px-8 py-3 rounded-2xl font-bold flex items-center gap-2 shadow-lg"
            >
              <LogOut size={20} />
              Pointer mon Départ
            </NeuButton>
          ) : (
            <div className="flex items-center gap-2 text-emerald-600 bg-emerald-500/10 px-6 py-3 rounded-2xl font-bold border border-emerald-500/20">
              <CheckCircle size={20} />
              Journée de travail clôturée
            </div>
          )}
        </div>
      </NeuCardContent>

      {/* MODALE DE DEMANDE D'EXCEPTION RH */}
      {showExceptionModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-[var(--neu-bg)] border border-[var(--neu-border)] p-6 rounded-2xl max-w-md w-full space-y-4 shadow-xl">
            <div className="flex items-center gap-2 text-amber-500 font-bold text-lg">
              <AlertCircle size={24} />
              Pointage Hors Zone / Exception RH
            </div>

            <p className="text-xs text-[var(--neu-text-subtle)]">
              Vous êtes situé en dehors du rayon autorisé ou votre GPS est indisponible. Veuillez formuler une demande d'exception au service RH.
            </p>

            <form onSubmit={handleSubmitException} className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-[var(--neu-text-subtle)] block mb-1">Motif de l'exception *</label>
                <select
                  value={exceptionType}
                  onChange={(e) => setExceptionType(e.target.value)}
                  className="w-full p-2 text-xs rounded-xl bg-[var(--neu-bg-subtle)] border border-[var(--neu-border)] text-[var(--neu-text)] outline-none"
                >
                  <option value="MISSION">Mission extérieure / Déplacement client</option>
                  <option value="REMOTE">Télétravail non programmé</option>
                  <option value="GPS_FAILURE">Problème d'appareil / GPS bloqué</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-[var(--neu-text-subtle)] block mb-1">Justification détaillée *</label>
                <textarea
                  required
                  rows={3}
                  placeholder="Explication claire du déplacement..."
                  value={exceptionReason}
                  onChange={(e) => setExceptionReason(e.target.value)}
                  className="w-full p-2 text-xs rounded-xl bg-[var(--neu-bg-subtle)] border border-[var(--neu-border)] text-[var(--neu-text)] outline-none resize-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <NeuButton type="button" onClick={() => setShowExceptionModal(false)}>
                  Annuler
                </NeuButton>
                <NeuButton type="submit" disabled={submittingException} className="bg-amber-600 text-white flex items-center gap-1">
                  <Send size={14} /> Soumettre la Demande
                </NeuButton>
              </div>
            </form>
          </div>
        </div>
      )}
    </NeuCard>
  );
}
