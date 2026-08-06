"use client";

import { NeuInput } from "@/components/ui/neu-input";
import { Edit3 } from "lucide-react";

interface AttestationEditorProps {
  name: string;
  setName: (v: string) => void;
  jobTitle: string;
  setJobTitle: (v: string) => void;
  docType: string;
  leaveStart: string;
  setLeaveStart: (v: string) => void;
  leaveEnd: string;
  setLeaveEnd: (v: string) => void;
  leaveReturn: string;
  setLeaveReturn: (v: string) => void;
  bodyText: string;
  setBodyText: (v: string) => void;
}

export function AttestationEditor({
  name, setName,
  jobTitle, setJobTitle,
  docType,
  leaveStart, setLeaveStart,
  leaveEnd, setLeaveEnd,
  leaveReturn, setLeaveReturn,
  bodyText, setBodyText,
}: AttestationEditorProps) {
  return (
    <div className="space-y-4 p-1">
      <div className="p-3 bg-[var(--neu-surface-light)] rounded-lg text-xs text-[var(--neu-text-secondary)] border border-[var(--neu-border)] flex items-center gap-2">
        <Edit3 className="w-4 h-4 text-[var(--neu-accent)] shrink-0" />
        Toutes les phrases sont pré-remplies dynamiquement. Vous pouvez tout modifier avant d&apos;imprimer.
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <NeuInput label="Nom & Prénom du Salarié" value={name} onChange={(e) => setName(e.target.value)} />
        <NeuInput label="Poste / Emploi" value={jobTitle} onChange={(e) => setJobTitle(e.target.value)} />
      </div>

      {docType === "attestation_conge" && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <NeuInput label="Date Début Congé" type="text" value={leaveStart} onChange={(e) => setLeaveStart(e.target.value)} />
          <NeuInput label="Date Fin Congé" type="text" value={leaveEnd} onChange={(e) => setLeaveEnd(e.target.value)} />
          <NeuInput label="Date Reprise Travail" type="text" value={leaveReturn} onChange={(e) => setLeaveReturn(e.target.value)} />
        </div>
      )}

      <div>
        <label className="block text-xs font-semibold text-[var(--neu-text-secondary)] mb-1">
          Corps du Texte (Dynamique & Éditable)
        </label>
        <textarea
          value={bodyText}
          onChange={(e) => setBodyText(e.target.value)}
          rows={6}
          className="w-full px-3 py-2 rounded bg-[var(--neu-surface)] text-[var(--neu-text)] border border-[var(--neu-border)] text-xs outline-none focus:border-[var(--neu-accent)] leading-relaxed"
        />
      </div>
    </div>
  );
}
