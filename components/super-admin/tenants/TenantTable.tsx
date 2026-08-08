"use client";

import React from "react";
import Link from "next/link";
import { Eye, Trash2, Lock, Unlock } from "lucide-react";
import { NeuCard } from "@/components/ui/neu-card";
import { NeuButton } from "@/components/ui/neu-button";
import { NeuBadge } from "@/components/ui/neu-badge";

export interface Tenant {
  id: string;
  name: string;
  taxNumber?: string;
  cnpsNumber?: string;
  rccm?: string;
  address?: string;
  city?: string;
  phone?: string;
  email?: string;
  isMain: boolean;
  status: "ACTIVE" | "INACTIVE" | "SUSPENDED";
  createdAt: string;
  employeeCount?: number;
  payrollCount?: number;
}

interface TenantTableProps {
  tenants: Tenant[];
  loading: boolean;
  onToggleStatus: (tenant: Tenant, newStatus: "ACTIVE" | "INACTIVE" | "SUSPENDED") => void;
  onOpenDeleteModal: (tenant: Tenant) => void;
}

export function TenantTable({
  tenants,
  loading,
  onToggleStatus,
  onOpenDeleteModal,
}: TenantTableProps) {
  return (
    <NeuCard className="overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="border-b border-[var(--neu-border)] bg-[var(--neu-surface-light)] text-[var(--neu-text-secondary)] uppercase font-semibold">
              <th className="p-3">Raison Sociale</th>
              <th className="p-3">Identifiants Fiscaux</th>
              <th className="p-3">Coordonnées</th>
              <th className="p-3">Volume Salariés</th>
              <th className="p-3">Statut</th>
              <th className="p-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--neu-border)]">
            {loading ? (
              <tr>
                <td colSpan={6} className="p-8 text-center text-[var(--neu-text-secondary)]">
                  Chargement des entreprises...
                </td>
              </tr>
            ) : tenants.length === 0 ? (
              <tr>
                <td colSpan={6} className="p-8 text-center text-[var(--neu-text-secondary)]">
                  Aucune entreprise trouvée.
                </td>
              </tr>
            ) : (
              tenants.map((t) => (
                <tr key={t.id} className="hover:bg-[var(--neu-surface-light)] transition-colors">
                  <td className="p-3">
                    <div className="font-bold text-[var(--neu-text)] flex items-center gap-1.5">
                      {t.name}
                      {t.isMain && (
                        <span className="text-[9px] bg-[#666cff]/15 text-[#666cff] px-1.5 py-0.5 rounded font-bold">
                          SIÈGE
                        </span>
                      )}
                    </div>
                    <div className="text-[10px] text-[var(--neu-text-secondary)]">
                      Créé le {new Date(t.createdAt).toLocaleDateString("fr-FR")}
                    </div>
                  </td>
                  <td className="p-3 font-mono text-[10px] space-y-0.5">
                    <div>N° CC : {t.taxNumber || "Non défini"}</div>
                    <div>N° CNPS : {t.cnpsNumber || "Non défini"}</div>
                  </td>
                  <td className="p-3 text-[11px]">
                    <div>{t.email || "Sans email"}</div>
                    <div className="text-[10px] text-[var(--neu-text-secondary)]">{t.phone || t.city || "Abidjan"}</div>
                  </td>
                  <td className="p-3">
                    <div className="font-semibold text-[var(--neu-text)]">{t.employeeCount || 0} Salariés</div>
                    <div className="text-[10px] text-[var(--neu-text-secondary)]">{t.payrollCount || 0} Bulletins</div>
                  </td>
                  <td className="p-3">
                    <NeuBadge
                      variant={
                        t.status === "ACTIVE"
                          ? "success"
                          : t.status === "SUSPENDED"
                          ? "warning"
                          : "danger"
                      }
                    >
                      {t.status}
                    </NeuBadge>
                  </td>
                  <td className="p-3 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Link href={`/super-admin/tenants/${t.id}`}>
                        <NeuButton size="icon" variant="ghost" className="h-7 w-7" title="Consulter la fiche">
                          <Eye size={14} className="text-[#666cff]" />
                        </NeuButton>
                      </Link>

                      {t.status === "ACTIVE" ? (
                        <NeuButton
                          size="icon"
                          variant="ghost"
                          className="h-7 w-7"
                          title="Suspendre l'entreprise"
                          onClick={() => onToggleStatus(t, "SUSPENDED")}
                        >
                          <Lock size={14} className="text-[#fdb528]" />
                        </NeuButton>
                      ) : (
                        <NeuButton
                          size="icon"
                          variant="ghost"
                          className="h-7 w-7"
                          title="Réactiver l'entreprise"
                          onClick={() => onToggleStatus(t, "ACTIVE")}
                        >
                          <Unlock size={14} className="text-[#72e128]" />
                        </NeuButton>
                      )}

                      {!t.isMain && (
                        <NeuButton
                          size="icon"
                          variant="ghost"
                          className="h-7 w-7"
                          title="Supprimer l'entreprise"
                          onClick={() => onOpenDeleteModal(t)}
                        >
                          <Trash2 size={14} className="text-[#ff4d49]" />
                        </NeuButton>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </NeuCard>
  );
}
