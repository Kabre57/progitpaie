"use client";

import { useEffect, useState } from "react";
import { NeuCard, NeuCardContent } from "@/components/ui/neu-card";
import { NeuButton } from "@/components/ui/neu-button";
import { NeuBadge } from "@/components/ui/neu-badge";
import { EmptyState } from "@/components/ui/empty-state";
import { CheckCircle, XCircle, Calendar, FileText } from "lucide-react";
import { useToast } from "@/components/ui/neu-toast";
import { ChipLoader } from "@/components/ui/chip-loader";
import { List2, ListItem } from "@/components/ui/list-2";
import { User as UserIcon, Calendar as CalendarIcon } from "lucide-react";
import { DocumentEditorModal } from "@/components/documents/document-editor-modal";

interface LeaveRequest {
  _id: string;
  userId: { _id?: string; id?: string; name: string; email: string };
  leaveType: string;
  startDate: string;
  endDate: string;
  totalDays: number;
  reason: string;
  status: "pending" | "approved" | "rejected";
}

import { NeuPagination } from "@/components/ui/neu-pagination";

export default function AdminLeavesPage() {
  const [leaves, setLeaves] = useState<LeaveRequest[]>([]);
  const [filter, setFilter] = useState("all");
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [activeEditDoc, setActiveEditDoc] = useState<{
    userId: string;
    name: string;
    startDate: string;
    endDate: string;
    returnDate: string;
    docType: "attestation_conge";
  } | null>(null);

  const { error: toastError, success: toastSuccess } = useToast();

  useEffect(() => {
    fetchLeaves();
  }, [filter]);

  const totalPages = Math.ceil(leaves.length / itemsPerPage);
  const paginatedLeaves = leaves.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const fetchLeaves = async () => {
    setLoading(true);
    try {
      const url = filter !== "all" ? `/api/leaves/all?status=${filter}` : "/api/leaves/all";
      const response = await fetch(url);
      const data = await response.json();
      if (data.success) {
        setLeaves(data.data);
      } else {
        toastError(data.error || "Failed to fetch leaves");
      }
    } catch (error) {
      console.error("Failed to fetch leaves", error);
      toastError("An unexpected error occurred while fetching leaves");
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (id: string) => {
    setActionLoading(id);
    try {
      const response = await fetch(`/api/leaves/${id}/approve`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      const data = await response.json();
      
      if (response.ok && data.success) {
        toastSuccess("Demande de congé approuvée");
        fetchLeaves();
      } else {
        toastError(data.error || "Échec de l'approbation");
      }
    } catch (error) {
      console.error("Failed to approve leave", error);
      toastError("Une erreur est survenue lors de l'approbation");
    } finally {
      setActionLoading(null);
    }
  };

  const handleReject = async (id: string) => {
    setActionLoading(id);
    try {
      const response = await fetch(`/api/leaves/${id}/reject`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ adminComment: "Rejeté par l'administrateur" }),
      });
      if (response.ok) {
        fetchLeaves();
      }
    } catch (error) {
      console.error("Failed to reject leave", error);
    } finally {
      setActionLoading(null);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "approved":
        return <NeuBadge variant="success">Approuvé</NeuBadge>;
      case "rejected":
        return <NeuBadge variant="error">Rejeté</NeuBadge>;
      default:
        return <NeuBadge variant="warning">En attente</NeuBadge>;
    }
  };

  return (
    <div className="space-y-6 relative" style={{ minHeight: "400px" }}>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Calendar className="text-[var(--neu-accent)]" /> Gestion des Congés Payés & Attestations
          </h2>
          <p className="text-[var(--neu-text-secondary)] text-sm">
            Validation des demandes de congés et impression des Attestations de Congés .
          </p>
        </div>
        <div className="flex flex-wrap gap-2 w-full sm:w-auto">
          {["all", "pending", "approved", "rejected"].map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-1 flex-1 sm:flex-none text-center rounded-lg text-sm capitalize transition-all duration-200 ${
                filter === f
                  ? "bg-[var(--neu-accent)] text-white shadow-sm scale-105"
                  : "bg-[var(--neu-surface)] text-[var(--neu-text-secondary)] hover:bg-[var(--neu-surface-light)] hover:text-[var(--neu-text)]"
              }`}
            >
              {f === "all" ? "Tous" : f === "pending" ? "En attente" : f === "approved" ? "Approuvés" : "Rejetés"}
            </button>
          ))}
        </div>
      </div>

      {/* Leaves Table */}
      <NeuCard>
        <NeuCardContent className="p-6">
          {leaves.length === 0 ? (
            <EmptyState
              icon={Calendar}
              title="Aucune demande de congé"
              description={`Aucune demande trouvée.`}
            />
          ) : (
            <List2 
              items={paginatedLeaves.map((leave) => {
                const sDate = new Date(leave.startDate);
                const eDate = new Date(leave.endDate);
                const rDate = new Date(eDate);
                rDate.setDate(rDate.getDate() + 1);

                return {
                  icon: <UserIcon className="w-5 h-5" />,
                  title: leave.userId?.name || "Employé Inconnu",
                  category: leave.leaveType.toUpperCase(),
                  description: (
                    <div className="flex flex-col gap-1">
                      <div className="flex items-center gap-2 opacity-80 text-sm">
                        <CalendarIcon className="w-4 h-4 text-[var(--neu-accent)]" />
                        <span>{sDate.toLocaleDateString("fr-FR")} - {eDate.toLocaleDateString("fr-FR")}</span>
                        <span className="font-bold text-[var(--neu-accent)]">({leave.totalDays} Jours)</span>
                      </div>
                      <div className="text-sm italic opacity-60 line-clamp-1">
                        "{leave.reason}"
                      </div>
                    </div>
                  ),
                  status: (
                    <div className="flex items-center gap-2">
                      {getStatusBadge(leave.status)}
                      {leave.status === "approved" && (
                        <NeuButton
                          size="sm"
                          variant="ghost"
                          onClick={() => setActiveEditDoc({
                            userId: leave.userId?.id || leave.userId?._id || "",
                            name: leave.userId?.name || "",
                            startDate: sDate.toLocaleDateString("fr-FR"),
                            endDate: eDate.toLocaleDateString("fr-FR"),
                            returnDate: rDate.toLocaleDateString("fr-FR"),
                            docType: "attestation_conge"
                          })}
                          className="text-[var(--neu-accent)]"
                          title="Imprimer l'Attestation de Congé PDF"
                        >
                          <FileText className="w-4 h-4 mr-1" /> Attestation de Congé
                        </NeuButton>
                      )}
                      {leave.status === "pending" && (
                        <div className="flex gap-1 ml-2">
                          <NeuButton
                            size="icon"
                            variant="ghost"
                            onClick={() => handleApprove(leave._id)}
                            disabled={!!actionLoading}
                            className="h-8 w-8 text-[var(--neu-success)] hover:bg-[var(--neu-success)]/10"
                          >
                            <CheckCircle className="w-4 h-4" />
                          </NeuButton>
                          <NeuButton
                            size="icon"
                            variant="ghost"
                            onClick={() => handleReject(leave._id)}
                            disabled={!!actionLoading}
                            className="h-8 w-8 text-[var(--neu-danger)] hover:bg-[var(--neu-danger)]/10"
                          >
                            <XCircle className="w-4 h-4" />
                          </NeuButton>
                        </div>
                      )}
                    </div>
                  )
                };
              })}
            />
          )}
        </NeuCardContent>
        <NeuPagination
          currentPage={currentPage}
          totalPages={totalPages}
          totalItems={leaves.length}
          itemsPerPage={itemsPerPage}
          onPageChange={setCurrentPage}
        />
      </NeuCard>

      {/* Modal Édition & Génération Attestation de Congé */}
      {activeEditDoc && (
        <DocumentEditorModal
          isOpen={!!activeEditDoc}
          onClose={() => setActiveEditDoc(null)}
          userId={activeEditDoc.userId}
          defaultName={activeEditDoc.name}
          startDate={activeEditDoc.startDate}
          endDate={activeEditDoc.endDate}
          returnDate={activeEditDoc.returnDate}
          docType={activeEditDoc.docType}
        />
      )}
    </div>
  );
}
