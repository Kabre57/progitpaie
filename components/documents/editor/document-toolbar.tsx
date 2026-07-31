"use client";

import React from "react";
import { Download, Printer, Copy, Check, FileText } from "lucide-react";
import { NeuButton } from "@/components/ui/neu-button";

export interface DocumentToolbarProps {
  documentTitle: string;
  onDownloadPDF: () => void;
  onPrint: () => void;
  onCopyHTML: () => void;
  isCopied?: boolean;
}

export function DocumentToolbar({
  documentTitle,
  onDownloadPDF,
  onPrint,
  onCopyHTML,
  isCopied,
}: DocumentToolbarProps) {
  return (
    <div className="flex items-center justify-between p-4 bg-[var(--neu-bg)] border-b border-[var(--neu-border)]">
      <div className="flex items-center gap-2">
        <FileText className="w-5 h-5 text-[var(--neu-accent)]" />
        <h3 className="font-bold text-[var(--neu-text)]">{documentTitle}</h3>
      </div>

      <div className="flex items-center gap-2">
        <NeuButton onClick={onCopyHTML} size="sm" variant="ghost">
          {isCopied ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
          <span>{isCopied ? "Copié !" : "Copier HTML"}</span>
        </NeuButton>

        <NeuButton onClick={onPrint} size="sm" variant="ghost">
          <Printer className="w-4 h-4" />
          <span>Imprimer</span>
        </NeuButton>

        <NeuButton onClick={onDownloadPDF} size="sm" variant="accent">
          <Download className="w-4 h-4" />
          <span>Télécharger PDF</span>
        </NeuButton>
      </div>
    </div>
  );
}
