"use client";

import React from "react";
import { ShieldCheck, Check, X, FileText, Plus } from "lucide-react";
import { NeuCard } from "@/components/ui/neu-card";
import { NeuButton } from "@/components/ui/neu-button";
import { NeuBadge } from "@/components/ui/neu-badge";
import { NeuSelect } from "@/components/ui/neu-select";
import { NeuInput } from "@/components/ui/neu-input";
import type { CompanyKybDetailsDTO } from "@/lib/application/admin/dto/CompanyKybSubscriptionDTO";

interface KYBTabProps {
  kyb: CompanyKybDetailsDTO | null;
  verifyingKyb: boolean;
  onVerifyKyb: (status: string) => void;
  uploadDocType: string;
  setUploadDocType: (val: string) => void;
  uploadFileName: string;
  setUploadFileName: (val: string) => void;
  uploadingDoc: boolean;
  onUploadDoc: (e: React.FormEvent) => void;
}

export function KYBTab({
  kyb,
  verifyingKyb,
  onVerifyKyb,
  uploadDocType,
  setUploadDocType,
  uploadFileName,
  setUploadFileName,
  uploadingDoc,
  onUploadDoc,
}: KYBTabProps) {
  const kybBadgeVariant =
    kyb?.verificationStatus === "APPROVED"
      ? "success"
      : kyb?.verificationStatus === "REJECTED"
      ? "danger"
      : "warning";

  return (
    <NeuCard className="p-6 space-y-4">
      <div className="flex items-center justify-between border-b border-[var(--neu-border)] pb-3">
        <h2 className="text-sm font-bold text-[var(--neu-text)] flex items-center gap-2">
          <ShieldCheck size={18} className="text-[#666cff]" />
          Conformité Légale & Dossier KYB
        </h2>
        <NeuBadge variant={kybBadgeVariant}>
          {kyb?.verificationStatus || "PENDING"}
        </NeuBadge>
      </div>

      <p className="text-xs text-[var(--neu-text-secondary)]">
        Pièces justificatives d&apos;immatriculation soumises pour la vérification légale de l&apos;entreprise.
      </p>

      {/* Action buttons */}
      <div className="flex items-center gap-3 pt-1">
        <NeuButton
          variant="default"
          size="sm"
          className="flex-1"
          onClick={() => onVerifyKyb("APPROVED")}
          loading={verifyingKyb}
        >
          <Check size={14} /> Approuver le dossier
        </NeuButton>
        <NeuButton
          variant="danger"
          size="sm"
          className="flex-1"
          onClick={() => onVerifyKyb("REJECTED")}
          loading={verifyingKyb}
        >
          <X size={14} /> Rejeter le dossier
        </NeuButton>
      </div>

      {/* List of documents */}
      <div className="space-y-2 pt-2">
        <div className="text-xs font-semibold text-[var(--neu-text-secondary)] uppercase tracking-wider">
          Documents Transmis ({kyb?.documents.length ?? 0})
        </div>

        {kyb?.documents.length === 0 ? (
          <div className="text-xs text-[var(--neu-text-secondary)] text-center py-4 border border-dashed border-[var(--neu-border)] rounded-lg">
            Aucun document n&apos;a été téléversé pour le moment
          </div>
        ) : (
          kyb?.documents.map((doc) => (
            <div
              key={doc.id}
              className="flex items-center justify-between p-2.5 rounded-lg border border-[var(--neu-border)] bg-[var(--neu-surface-light)] text-xs"
            >
              <div className="flex items-center gap-2 min-w-0">
                <FileText size={15} className="text-[#666cff] shrink-0" />
                <div className="truncate">
                  <div className="font-semibold text-[var(--neu-text)]">{doc.fileName}</div>
                  <div className="text-[10px] text-[var(--neu-text-secondary)]">{doc.documentType}</div>
                </div>
              </div>
              <NeuBadge variant={doc.status === "APPROVED" ? "success" : "warning"}>
                {doc.status}
              </NeuBadge>
            </div>
          ))
        )}
      </div>

      {/* Form to record a document */}
      <form onSubmit={onUploadDoc} className="space-y-3 pt-3 border-t border-[var(--neu-border)]">
        <div className="text-xs font-semibold text-[var(--neu-text-secondary)] uppercase tracking-wider">
          Enregistrer une Pièce Jointe
        </div>
        <div className="flex items-end gap-2">
          <div className="w-1/3">
            <NeuSelect
              value={uploadDocType}
              onChange={(e) => setUploadDocType(e.target.value)}
              options={[
                { value: "RCCM", label: "RCCM" },
                { value: "DGI_CC", label: "DGI CC" },
                { value: "CNPS_ATTESTATION", label: "Attestation CNPS" },
                { value: "GERANT_ID", label: "Pièce Gérant" },
              ]}
            />
          </div>
          <div className="flex-1">
            <NeuInput
              type="text"
              placeholder="Nom du fichier (ex: rccm.pdf)"
              value={uploadFileName}
              onChange={(e) => setUploadFileName(e.target.value)}
            />
          </div>
          <NeuButton type="submit" size="sm" loading={uploadingDoc} disabled={!uploadFileName}>
            <Plus size={14} /> Ajouter
          </NeuButton>
        </div>
      </form>
    </NeuCard>
  );
}
