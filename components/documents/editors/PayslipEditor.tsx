"use client";

import { NeuInput } from "@/components/ui/neu-input";
import { Edit3 } from "lucide-react";

interface PayslipEditorProps {
  name: string;
  setName: (v: string) => void;
  jobTitle: string;
  setJobTitle: (v: string) => void;
  bodyText: string;
  setBodyText: (v: string) => void;
}

export function PayslipEditor({
  name, setName,
  jobTitle, setJobTitle,
  bodyText, setBodyText,
}: PayslipEditorProps) {
  return (
    <div className="space-y-4 p-1">
      <div className="p-3 bg-[var(--neu-surface-light)] rounded-lg text-xs text-[var(--neu-text-secondary)] border border-[var(--neu-border)] flex items-center gap-2">
        <Edit3 className="w-4 h-4 text-[var(--neu-accent)] shrink-0" />
        Bulletin de paie individuel. Vous pouvez modifier les informations principales du salarié.
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <NeuInput label="Nom & Prénom du Salarié" value={name} onChange={(e) => setName(e.target.value)} />
        <NeuInput label="Poste / Emploi" value={jobTitle} onChange={(e) => setJobTitle(e.target.value)} />
      </div>

      <div>
        <label className="block text-xs font-semibold text-[var(--neu-text-secondary)] mb-1">
          Remarques / Notes sur le Bulletin
        </label>
        <textarea
          value={bodyText}
          onChange={(e) => setBodyText(e.target.value)}
          rows={4}
          className="w-full px-3 py-2 rounded bg-[var(--neu-surface)] text-[var(--neu-text)] border border-[var(--neu-border)] text-xs outline-none focus:border-[var(--neu-accent)] leading-relaxed"
        />
      </div>
    </div>
  );
}
