"use client";

import React, { useState, useEffect } from "react";
import { MapPin, CheckCircle, XCircle, Clock, AlertTriangle, RefreshCw } from "lucide-react";
import { NeuCard } from "@/components/ui/neu-card";
import { NeuButton } from "@/components/ui/neu-button";

interface AttendanceException {
  id: string;
  date: string;
  checkIn: string;
  exceptionStatus: "PENDING" | "APPROVED" | "REJECTED";
  exceptionType: string;
  exceptionReason: string;
  user: {
    name: string;
    employeeId: string;
    email: string;
  };
}

export default function AttendanceExceptionsAdminPage() {
  const [exceptions, setExceptions] = useState<AttendanceException[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [processingId, setProcessingId] = useState<string | null>(null);

  const fetchExceptions = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/attendance/exceptions");
      const json = await res.json();
      if (json.success) {
        setExceptions(json.exceptions);
      }
    } catch (err) {
      console.error("Échec de chargement des exceptions:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchExceptions();
  }, []);

  const handleAction = async (attendanceId: string, action: "APPROVED" | "REJECTED") => {
    setProcessingId(attendanceId);
    try {
      const res = await fetch("/api/attendance/exceptions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ attendanceId, action }),
      });

      const json = await res.json();
      if (json.success) {
        fetchExceptions();
      }
    } catch (err) {
      console.error("Erreur de traitement exception:", err);
    } finally {
      setProcessingId(null);
    }
  };

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* HEADER PAGE */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[var(--neu-text)] flex items-center gap-2">
            <MapPin className="text-amber-500" size={28} />
            Validation des Exceptions de Pointage RH 📍
          </h1>
          <p className="text-sm text-[var(--neu-text-subtle)] mt-1">
            Gestion des demandes de pointage hors zone (Missions extérieures, Télétravail, Problèmes GPS)
          </p>
        </div>

        <button
          onClick={fetchExceptions}
          className="text-xs text-[var(--neu-text-subtle)] hover:text-amber-500 flex items-center gap-1 bg-[var(--neu-bg-subtle)] px-3 py-2 rounded-xl"
        >
          <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
          Actualiser
        </button>
      </div>

      {/* LISTE DES EXCEPTIONS */}
      <NeuCard className="p-6 space-y-4">
        <h2 className="text-lg font-bold text-[var(--neu-text)]">Demandes d'Exceptions Soumises</h2>

        {loading ? (
          <div className="text-center py-8 text-[var(--neu-text-subtle)]">Chargement des demandes...</div>
        ) : exceptions.length === 0 ? (
          <div className="text-center py-8 text-[var(--neu-text-subtle)]">Aucune demande d'exception de pointage enregistrée.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-[var(--neu-bg-subtle)] text-[var(--neu-text-subtle)] border-b border-[var(--neu-border)]">
                <tr>
                  <th className="p-3 font-semibold">Salarié</th>
                  <th className="p-3 font-semibold">Date & Heure</th>
                  <th className="p-3 font-semibold">Type Exception</th>
                  <th className="p-3 font-semibold">Motif / Justification</th>
                  <th className="p-3 font-semibold">Statut</th>
                  <th className="p-3 font-semibold text-right">Actions RH</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--neu-border)]">
                {exceptions.map((ex) => (
                  <tr key={ex.id} className="hover:bg-[var(--neu-bg-subtle)]/50 transition">
                    <td className="p-3 font-medium text-[var(--neu-text)]">
                      {ex.user?.name} ({ex.user?.employeeId})
                    </td>
                    <td className="p-3 text-[var(--neu-text-subtle)] font-mono text-xs">
                      {ex.date} — {new Date(ex.checkIn).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}
                    </td>
                    <td className="p-3">
                      <span className="px-2 py-0.5 bg-amber-500/10 text-amber-500 text-xs font-bold rounded-md">
                        {ex.exceptionType}
                      </span>
                    </td>
                    <td className="p-3 text-[var(--neu-text)] text-xs max-w-xs truncate">{ex.exceptionReason}</td>
                    <td className="p-3">
                      {ex.exceptionStatus === "PENDING" ? (
                        <span className="text-xs text-amber-500 font-bold flex items-center gap-1 bg-amber-500/10 px-2 py-0.5 rounded-full">
                          <Clock size={12} /> En Attente
                        </span>
                      ) : ex.exceptionStatus === "APPROVED" ? (
                        <span className="text-xs text-emerald-500 font-bold flex items-center gap-1 bg-emerald-500/10 px-2 py-0.5 rounded-full">
                          <CheckCircle size={12} /> Validé
                        </span>
                      ) : (
                        <span className="text-xs text-rose-500 font-bold flex items-center gap-1 bg-rose-500/10 px-2 py-0.5 rounded-full">
                          <XCircle size={12} /> Rejeté
                        </span>
                      )}
                    </td>
                    <td className="p-3 text-right">
                      {ex.exceptionStatus === "PENDING" && (
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleAction(ex.id, "APPROVED")}
                            disabled={processingId === ex.id}
                            className="p-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1"
                          >
                            <CheckCircle size={14} /> Approuver
                          </button>
                          <button
                            onClick={() => handleAction(ex.id, "REJECTED")}
                            disabled={processingId === ex.id}
                            className="p-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1"
                          >
                            <XCircle size={14} /> Rejeter
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </NeuCard>
    </div>
  );
}
