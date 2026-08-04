"use client";

import { useState, useEffect, useCallback } from "react";
import { Clock, Plus, Pencil, Trash2, Loader2, X, Check } from "lucide-react";
import { NeuCard, NeuCardHeader, NeuCardTitle, NeuCardContent } from "@/components/ui/neu-card";
import { NeuButton } from "@/components/ui/neu-button";
import { NeuInput } from "@/components/ui/neu-input";
import { NeuBadge } from "@/components/ui/neu-badge";
import {
  NeuTable,
  NeuTableHeader,
  NeuTableBody,
  NeuTableRow,
  NeuTableHead,
  NeuTableCell,
} from "@/components/ui/neu-table";
import { EmptyState } from "@/components/ui/empty-state";
import { List2, ListItem } from "@/components/ui/list-2";
import { IShift } from "@/types";

interface ShiftFormData {
  name: string;
  startTime: string;
  endTime: string;
  workingHours: number;
  lateThresholdMinutes: number;
}

import { NeuPagination } from "@/components/ui/neu-pagination";

export default function ShiftsPage() {
  const [shifts, setShifts] = useState<IShift[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const [error, setError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const totalPages = Math.ceil(shifts.length / itemsPerPage);
  const paginatedShifts = shifts.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);
  const [editingShift, setEditingShift] = useState<IShift | null>(null);
  const [formData, setFormData] = useState<ShiftFormData>({
    name: "",
    startTime: "",
    endTime: "",
    workingHours: 8,
    lateThresholdMinutes: 15,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Fetch shifts
  const fetchShifts = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/shifts");
      const data = await response.json();
      if (data.success) {
        setShifts(data.data);
      } else {
        setError(data.error || "Failed to fetch shifts");
      }
    } catch (err) {
      setError("Failed to fetch shifts");
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchShifts();
  }, [fetchShifts]);

  // Open modal for create/edit
  const openModal = (shift?: IShift) => {
    if (shift) {
      setEditingShift(shift);
      setFormData({
        name: shift.name,
        startTime: shift.startTime,
        endTime: shift.endTime,
        workingHours: shift.workingHours,
        lateThresholdMinutes: shift.lateThresholdMinutes,
      });
    } else {
      setEditingShift(null);
      setFormData({
        name: "",
        startTime: "",
        endTime: "",
        workingHours: 8,
        lateThresholdMinutes: 15,
      });
    }
    setIsModalOpen(true);
  };

  // Close modal
  const closeModal = () => {
    setIsModalOpen(false);
    setEditingShift(null);
    setFormData({
      name: "",
      startTime: "",
      endTime: "",
      workingHours: 8,
      lateThresholdMinutes: 15,
    });
  };

  // Handle form submit
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const url = editingShift ? `/api/shifts/${editingShift._id}` : "/api/shifts";
      const method = editingShift ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (data.success) {
        closeModal();
        fetchShifts();
      } else {
        setError(data.error || "Failed to save shift");
      }
    } catch (err) {
      setError("Failed to save shift");
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle delete
  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this shift?")) return;

    try {
      const response = await fetch(`/api/shifts/${id}`, {
        method: "DELETE",
      });

      const data = await response.json();

      if (data.success) {
        fetchShifts();
      } else {
        setError(data.error || "Failed to delete shift");
      }
    } catch (err) {
      setError("Failed to delete shift");
      console.error(err);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-[var(--neu-text)] flex items-center gap-3">
            <Clock className="w-8 h-8 text-[var(--neu-accent)]" />
            Planning & Horaires
          </h1>
          <p className="text-[var(--neu-text-secondary)] mt-1">
            Gérer les plannings et heures de travail des employés
          </p>
        </div>
        <NeuButton onClick={() => openModal()} variant="accent">
          <Plus className="w-4 h-4" />
          Ajouter un Planning
        </NeuButton>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="p-4 rounded-lg bg-[var(--neu-danger)]/10 border border-[var(--neu-danger)]/30 text-[var(--neu-danger)]">
          <div className="flex items-center justify-between">
            <span>{error}</span>
            <button onClick={() => setError(null)}>
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Shifts Table */}
      <NeuCard>
        <NeuCardHeader>
          <NeuCardTitle>Tous les Plannings de Travail</NeuCardTitle>
        </NeuCardHeader>
        <NeuCardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-[var(--neu-accent)]" />
            </div>
          ) : shifts.length === 0 ? (
            <div className="text-center py-12 text-[var(--neu-text-secondary)]">
              <Clock className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p className="font-semibold text-lg text-[var(--neu-text)]">Aucun planning de travail trouvé</p>
              <p className="text-sm mt-1">Cliquez sur &quot;Ajouter un Planning&quot; pour en créer un</p>
            </div>
          ) : (
            <List2 
              items={paginatedShifts.map((shift) => ({
                icon: <Clock className="w-5 h-5 text-[var(--neu-accent)]" />,
                title: shift.name,
                category: "ÉQUIPE / SHIFT",
                description: (
                  <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-3">
                      <span className="font-bold opacity-80">{shift.startTime} - {shift.endTime}</span>
                      <span className="text-[var(--neu-accent)] font-black">({shift.workingHours}h de Travail)</span>
                    </div>
                    <div className="text-xs opacity-60">
                      Tolérance Retard: {shift.lateThresholdMinutes} mins
                    </div>
                  </div>
                ),
                onClick: () => openModal(shift),
                status: (
                  <div className="flex items-center gap-3">
                    <NeuBadge variant={shift.isActive ? ("success" as const) : ("default" as const)}>
                      {shift.isActive ? "Actif" : "Inactif"}
                    </NeuBadge>
                    <NeuButton
                      size="icon"
                      variant="ghost"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDelete(shift._id || shift.id);
                      }}
                      className="text-[var(--neu-danger)] hover:bg-[var(--neu-danger)]/10 h-8 w-8"
                    >
                      <Trash2 className="w-4 h-4" />
                    </NeuButton>
                  </div>
                )
              }))}
            />
          )}
        </NeuCardContent>
        <NeuPagination
          currentPage={currentPage}
          totalPages={totalPages}
          totalItems={shifts.length}
          itemsPerPage={itemsPerPage}
          onPageChange={setCurrentPage}
        />
      </NeuCard>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="w-full max-w-md">
            <NeuCard>
              <NeuCardHeader>
                <NeuCardTitle>{editingShift ? "Modifier le Planning" : "Ajouter un Planning"}</NeuCardTitle>
              </NeuCardHeader>
              <form onSubmit={handleSubmit}>
                <NeuCardContent className="space-y-4">
                  <NeuInput
                    label="Nom du Planning"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                    placeholder="ex: Équipe du Matin"
                  />
                  <div className="grid grid-cols-2 gap-4">
                    <NeuInput
                      label="Heure de Début"
                      type="time"
                      value={formData.startTime}
                      onChange={(e) =>
                        setFormData({ ...formData, startTime: e.target.value })
                      }
                      required
                    />
                    <NeuInput
                      label="Heure de Fin"
                      type="time"
                      value={formData.endTime}
                      onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                      required
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <NeuInput
                      label="Heures Travaillées"
                      type="number"
                      min={1}
                      max={24}
                      value={formData.workingHours}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          workingHours: parseInt(e.target.value) || 0,
                        })
                      }
                      required
                    />
                    <NeuInput
                      label="Tolérance Retard (min)"
                      type="number"
                      min={0}
                      max={60}
                      value={formData.lateThresholdMinutes}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          lateThresholdMinutes: parseInt(e.target.value) || 0,
                        })
                      }
                      required
                    />
                  </div>
                </NeuCardContent>
                <div className="flex items-center justify-end gap-3 p-6 pt-0">
                  <NeuButton type="button" variant="ghost" onClick={closeModal}>
                    Annuler
                  </NeuButton>
                  <NeuButton
                    type="submit"
                    variant="accent"
                    loading={isSubmitting}
                    disabled={!formData.name.trim() || !formData.startTime || !formData.endTime}
                  >
                    <Check className="w-4 h-4 mr-2" />
                    {editingShift ? "Mettre à jour" : "Créer"}
                  </NeuButton>
                </div>
              </form>
            </NeuCard>
          </div>
        </div>
      )}
    </div>
  );
}
