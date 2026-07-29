"use client";

import { useState, useEffect } from "react";
import { NeuCard } from "@/components/ui/neu-card";
import { NeuButton } from "@/components/ui/neu-button";
import { NeuSelect } from "@/components/ui/neu-select";
import { NeuBadge } from "@/components/ui/neu-badge";
import { FileSpreadsheet, Building, ShieldCheck, RefreshCw, Printer, FileText, Eye } from "lucide-react";
import { DocumentPreviewModal } from "@/components/documents/document-preview-modal";

export default function DeclarationsPage() {
  const [month, setMonth] = useState(new Date().getMonth() + 1);
  const [year, setYear] = useState(new Date().getFullYear());
  const [itsData, setItsData] = useState<any>(null);
  const [cnpsData, setCnpsData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [downloadingDoc, setDownloadingDoc] = useState<string | null>(null);
  const [previewDoc, setPreviewDoc] = useState<"declaration_its" | "declaration_fdfp" | "declaration_cnps" | null>(null);

  useEffect(() => {
    fetchDeclarations();
  }, [month, year]);

  const fetchDeclarations = async () => {
    setLoading(true);
    try {
      const [itsRes, cnpsRes] = await Promise.all([
        fetch(`/api/declarations/its?month=${month}&year=${year}`),
        fetch(`/api/declarations/cnps?month=${month}&year=${year}`),
      ]);
      const [itsJson, cnpsJson] = await Promise.all([itsRes.json(), cnpsRes.json()]);

      if (itsJson.success) setItsData(itsJson.data);
      if (cnpsJson.success) setCnpsData(cnpsJson.data);
    } catch (err) {
      console.error("Fetch declarations error:", err);
    } finally {
      setLoading(false);
    }
  };

  const handlePrintPdf = async (docType: string, filename: string) => {
    setDownloadingDoc(docType);
    try {
      const res = await fetch("/api/documents/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          docType,
          month,
          year,
          itsData,
          cnpsData,
        }),
      });

      if (res.ok) {
        const blob = await res.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `${filename}-${month}-${year}.pdf`;
        document.body.appendChild(a);
        a.click();
        a.remove();
      } else {
        alert("Erreur lors de la génération du document PDF");
      }
    } catch (err) {
      console.error("Print PDF error:", err);
    } finally {
      setDownloadingDoc(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[var(--neu-text)] flex items-center gap-2">
            <FileSpreadsheet className="text-[var(--neu-accent)]" /> Centre de Déclarations Fiscales (DGI) & Sociales (CNPS)
          </h1>
          <p className="text-[var(--neu-text-secondary)] text-sm mt-1">
            Formulaires officiels DGI (ITS, FDFP 1.6%, État 301) et CNPS (Appel de cotisations, DISA/DASC) - LOGIPAIE RH.
          </p>
        </div>
      </div>

      {/* Filter / Period Bar */}
      <NeuCard className="p-4 flex flex-wrap gap-4 items-center justify-between">
        <div className="flex gap-4 items-center">
          <div>
            <label className="text-xs text-[var(--neu-text-secondary)] block mb-1">Mois</label>
            <NeuSelect value={month} onChange={(e) => setMonth(parseInt(e.target.value, 10))}>
              {Array.from({ length: 12 }, (_, i) => (
                <option key={i + 1} value={i + 1}>
                  {new Date(2026, i).toLocaleString("fr-FR", { month: "long" })}
                </option>
              ))}
            </NeuSelect>
          </div>
          <div>
            <label className="text-xs text-[var(--neu-text-secondary)] block mb-1">Année</label>
            <NeuSelect value={year} onChange={(e) => setYear(parseInt(e.target.value, 10))}>
              {[2024, 2025, 2026, 2027].map((y) => (
                <option key={y} value={y}>
                  {y}
                </option>
              ))}
            </NeuSelect>
          </div>
        </div>

        <NeuButton onClick={fetchDeclarations} variant="ghost" className="flex items-center gap-2">
          <RefreshCw size={16} /> Actualiser
        </NeuButton>
      </NeuCard>

      {/* Declaration Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* 1. Déclaration ITS (DGI) */}
        <NeuCard className="p-6 space-y-4">
          <div className="flex justify-between items-center border-b border-[var(--neu-border)] pb-3">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-amber-500/10 text-amber-400 rounded-lg">
                <Building size={24} />
              </div>
              <div>
                <h3 className="font-bold text-lg text-[var(--neu-text)]">24-DÉCLARATION ITS (DGI)</h3>
                <p className="text-xs text-[var(--neu-text-secondary)]">Direction Générale des Impôts (DGI Côte d'Ivoire)</p>
              </div>
            </div>
            <NeuBadge variant="warning">DGI CI</NeuBadge>
          </div>

          {loading ? (
            <div className="py-6 text-center text-sm text-[var(--neu-text-secondary)]">Chargement de l'état DGI...</div>
          ) : (
            <div className="space-y-3 text-sm">
              <div className="flex justify-between py-1 border-b border-white/5">
                <span className="text-[var(--neu-text-secondary)]">Masse Salariale Brute :</span>
                <span className="font-mono font-semibold">{(itsData?.totalGrossSalary || 0).toLocaleString()} FCFA</span>
              </div>
              <div className="flex justify-between py-1 border-b border-white/5">
                <span className="text-[var(--neu-text-secondary)]">ITS / IS (1.2%) + IGR :</span>
                <span className="font-mono text-amber-400 font-semibold">{(itsData?.totalTaxToPay || 0).toLocaleString()} FCFA</span>
              </div>

              <div className="pt-2 flex flex-col gap-2">
                <div className="flex gap-2">
                  <NeuButton
                    variant="ghost"
                    onClick={() => setPreviewDoc("declaration_its")}
                    className="flex-1"
                  >
                    <Eye className="w-4 h-4 mr-2 text-[var(--neu-accent)]" /> Aperçu DGI ITS
                  </NeuButton>
                  <NeuButton
                    variant="accent"
                    onClick={() => handlePrintPdf("declaration_its", "declaration-its")}
                    loading={downloadingDoc === "declaration_its"}
                    className="flex-1"
                  >
                    <Printer className="w-4 h-4 mr-2" /> Imprimer DGI ITS PDF
                  </NeuButton>
                </div>
                <NeuButton
                  variant="ghost"
                  onClick={() => handlePrintPdf("etat_301", "etat-301-dgi")}
                  loading={downloadingDoc === "etat_301"}
                >
                  <FileText className="w-4 h-4 mr-2 text-indigo-400" /> Imprimer État 301 DGI PDF (31/32)
                </NeuButton>
              </div>
            </div>
          )}
        </NeuCard>

        {/* 2. Déclaration FDFP (25-DÉCLARATION FDFP) */}
        <NeuCard className="p-6 space-y-4">
          <div className="flex justify-between items-center border-b border-[var(--neu-border)] pb-3">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-emerald-500/10 text-emerald-400 rounded-lg">
                <FileSpreadsheet size={24} />
              </div>
              <div>
                <h3 className="font-bold text-lg text-[var(--neu-text)]">25-DÉCLARATION FDFP (1.6%)</h3>
                <p className="text-xs text-[var(--neu-text-secondary)]">Fonds de Développement de la Formation Professionnelle</p>
              </div>
            </div>
            <NeuBadge variant="success">FDFP CI</NeuBadge>
          </div>

          <div className="space-y-3 text-sm">
            <div className="flex justify-between py-1 border-b border-white/5">
              <span className="text-[var(--neu-text-secondary)]">Taxe Formation Continue TFC (1.2%) :</span>
              <span className="font-mono font-semibold">{Math.round((itsData?.totalGrossSalary || 0) * 0.012).toLocaleString()} FCFA</span>
            </div>
            <div className="flex justify-between py-1 border-b border-white/5">
              <span className="text-[var(--neu-text-secondary)]">Taxe d'Apprentissage TAP (0.4%) :</span>
              <span className="font-mono font-semibold">{Math.round((itsData?.totalGrossSalary || 0) * 0.004).toLocaleString()} FCFA</span>
            </div>
            <div className="flex justify-between py-2 font-bold text-base bg-[var(--neu-surface)] p-3 rounded-lg border border-[var(--neu-border)]">
              <span>Total à Payer FDFP :</span>
              <span className="font-mono text-emerald-400">{Math.round((itsData?.totalGrossSalary || 0) * 0.016).toLocaleString()} FCFA</span>
            </div>

            <div className="pt-2 flex gap-2">
              <NeuButton
                variant="ghost"
                onClick={() => setPreviewDoc("declaration_fdfp")}
                className="flex-1"
              >
                <Eye className="w-4 h-4 mr-2 text-[var(--neu-accent)]" /> Aperçu FDFP
              </NeuButton>
              <NeuButton
                variant="accent"
                onClick={() => handlePrintPdf("declaration_fdfp", "declaration-fdfp")}
                loading={downloadingDoc === "declaration_fdfp"}
                className="flex-1"
              >
                <Printer className="w-4 h-4 mr-2" /> Imprimer FDFP PDF
              </NeuButton>
            </div>
          </div>
        </NeuCard>

        {/* 3. Appel de Cotisations CNPS (27-DÉCLARATION CNPS & DISA 34/35) */}
        <NeuCard className="p-6 space-y-4 md:col-span-2">
          <div className="flex justify-between items-center border-b border-[var(--neu-border)] pb-3">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-sky-500/10 text-sky-400 rounded-lg">
                <ShieldCheck size={24} />
              </div>
              <div>
                <h3 className="font-bold text-lg text-[var(--neu-text)]">27-DÉCLARATION CNPS & 34-DISA / 35-DASC</h3>
                <p className="text-xs text-[var(--neu-text-secondary)]">Caisse Nationale de Prévoyance Sociale (Côte d'Ivoire)</p>
              </div>
            </div>
            <NeuBadge variant="info">CNPS CI</NeuBadge>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div className="space-y-2">
              <div className="flex justify-between py-1 border-b border-white/5">
                <span className="text-[var(--neu-text-secondary)]">Salaires Soumis CNPS :</span>
                <span className="font-mono font-semibold">{(cnpsData?.totalGrossSalary || 0).toLocaleString()} FCFA</span>
              </div>
              <div className="flex justify-between py-1 border-b border-white/5">
                <span className="text-[var(--neu-text-secondary)]">Retraite Part Salariée (6.3%) :</span>
                <span className="font-mono text-sky-400">{(cnpsData?.cnpsEmployeeTotal || 0).toLocaleString()} FCFA</span>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between py-1 border-b border-white/5">
                <span className="text-[var(--neu-text-secondary)]">CNPS Part Patronale (16.45%) :</span>
                <span className="font-mono text-sky-400">{(cnpsData?.cnpsEmployerTotal || 0).toLocaleString()} FCFA</span>
              </div>
              <div className="flex justify-between py-1 border-b border-white/5 font-bold text-base">
                <span>Total Chèque CNPS :</span>
                <span className="font-mono text-[var(--neu-accent)]">{(cnpsData?.totalCNPSToPay || 0).toLocaleString()} FCFA</span>
              </div>
            </div>
          </div>

          <div className="pt-2 flex flex-wrap gap-4">
            <NeuButton
              variant="ghost"
              onClick={() => setPreviewDoc("declaration_cnps")}
              className="flex-1"
            >
              <Eye className="w-4 h-4 mr-2 text-[var(--neu-accent)]" /> Aperçu Cotisations CNPS
            </NeuButton>
            <NeuButton
              variant="accent"
              onClick={() => handlePrintPdf("declaration_cnps", "declaration-cnps")}
              loading={downloadingDoc === "declaration_cnps"}
              className="flex-1"
            >
              <Printer className="w-4 h-4 mr-2" /> Imprimer CNPS PDF (27)
            </NeuButton>
            <NeuButton
              variant="ghost"
              onClick={() => handlePrintPdf("disa_cnps", "disa-dasc-cnps")}
              loading={downloadingDoc === "disa_cnps"}
              className="flex-1"
            >
              <FileText className="w-4 h-4 mr-2 text-sky-400" /> Imprimer DISA / DASC CNPS PDF (34/35)
            </NeuButton>
          </div>
        </NeuCard>
      </div>

      {/* Modal Prévisualisation Déclarations */}
      {previewDoc && (
        <DocumentPreviewModal
          isOpen={!!previewDoc}
          onClose={() => setPreviewDoc(null)}
          docType={previewDoc}
          month={month}
          year={year}
          itsData={itsData}
          cnpsData={cnpsData}
        />
      )}
    </div>
  );
}
