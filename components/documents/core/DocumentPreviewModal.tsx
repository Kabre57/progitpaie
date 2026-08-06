"use client";

import { useState } from "react";
import { NeuDialog } from "@/components/ui/neu-dialog";
import { NeuButton } from "@/components/ui/neu-button";
import { Download, Edit3, Eye } from "lucide-react";

import { DocumentPreviewModalProps } from "./types";
import { DOC_TYPE_LABELS, EDITABLE_DOC_TYPES } from "./constants";
import { usePayslipSettings } from "../hooks/usePayslipSettings";
import { useDocumentEditor } from "../hooks/useDocumentEditor";
import { useDocumentGeneration } from "../hooks/useDocumentGeneration";

import { ContractPreview } from "../previews/ContractPreview";
import { AttestationPreview } from "../previews/AttestationPreview";
import { PayslipPreview } from "../previews/PayslipPreview";
import { OrdreVirementPreview } from "../previews/OrdreVirementPreview";
import { DeclarationPreview } from "../previews/DeclarationPreview";

import { ContractEditor } from "../editors/ContractEditor";
import { AttestationEditor } from "../editors/AttestationEditor";
import { PayslipEditor } from "../editors/PayslipEditor";

import "../styles/document.css";

export function DocumentPreviewModal(props: DocumentPreviewModalProps) {
  const { isOpen, onClose, docType } = props;
  const [activeTab, setActiveTab] = useState<"preview" | "edit">("preview");

  const { payslipAppearance, payslipLegal, ratesConfig } = usePayslipSettings(docType, isOpen);
  const editorState = useDocumentEditor(props);
  const { generating, handleDownload } = useDocumentGeneration(props, editorState);

  const isEditable = EDITABLE_DOC_TYPES.includes(docType);

  // ─── Rendu du Preview ────────────────────────────────────────────────────────
  const renderPreview = () => {
    switch (docType) {
      case "contract":
        return (
          <ContractPreview
            name={editorState.name}
            jobTitle={editorState.jobTitle}
            category={editorState.category}
            salary={editorState.salary}
            sursalaire={editorState.sursalaire}
            transport={editorState.transport}
            joiningDate={props.defaultJoiningDate || ""}
            contractType={props.defaultContractType || "CDI"}
            cddMonths={props.defaultCddMonths || 6}
            bodyText={editorState.bodyText}
            articles={editorState.articles}
            companyName={editorState.companyName}
            companyAddress={editorState.companyAddress}
            companyRepresentative={editorState.companyRepresentative}
            employeeBirth={editorState.employeeBirth}
            employeeCni={editorState.employeeCni}
            employeeNationality={editorState.employeeNationality}
            employeeAddress={editorState.employeeAddress}
          />
        );
      case "attestation":
        return <AttestationPreview title="ATTESTATION DE TRAVAIL" bodyText={editorState.bodyText} />;
      case "certificat":
        return <AttestationPreview title="CERTIFICAT DE TRAVAIL" bodyText={editorState.bodyText} />;
      case "attestation_conge":
        return <AttestationPreview title="ATTESTATION DE CONGÉ PAYÉ" bodyText={editorState.bodyText} />;
      case "payslip":
        return (
          <PayslipPreview
            name={editorState.name}
            jobTitle={editorState.jobTitle}
            salary={editorState.salary}
            sursalaire={editorState.sursalaire}
            transport={editorState.transport}
            appearance={payslipAppearance}
            legal={payslipLegal}
            rates={ratesConfig}
          />
        );
      case "ordre_virement":
        return (
          <OrdreVirementPreview
            bankName={props.bankName || "SOCIÉTÉ GÉNÉRALE CI"}
            totalAmount={props.totalAmount || 0}
            month={props.month || 1}
            year={props.year || 2026}
          />
        );
      case "declaration_its":
      case "declaration_fdfp":
      case "declaration_cnps":
      case "rns":
        return (
          <DeclarationPreview
            docType={docType}
            month={props.month || 1}
            year={props.year || 2026}
            itsData={props.itsData}
            cnpsData={props.cnpsData}
            rnsData={props.rnsData}
            empId={props.userId}
            name={editorState.name}
            joiningStr={props.defaultJoiningDate ? new Date(props.defaultJoiningDate).toLocaleDateString("fr-FR") : "01/02/2020"}
          />
        );
      default:
        return <AttestationPreview title="DOCUMENT RH OFFICIEL" bodyText={editorState.bodyText} />;
    }
  };

  // ─── Rendu de l'Éditeur ──────────────────────────────────────────────────────
  const renderEditor = () => {
    if (docType === "contract") {
      return (
        <ContractEditor
          companyName={editorState.companyName}
          setCompanyName={editorState.setCompanyName}
          companyAddress={editorState.companyAddress}
          setCompanyAddress={editorState.setCompanyAddress}
          companyRepresentative={editorState.companyRepresentative}
          setCompanyRepresentative={editorState.setCompanyRepresentative}
          name={editorState.name}
          setName={editorState.setName}
          employeeBirth={editorState.employeeBirth}
          setEmployeeBirth={editorState.setEmployeeBirth}
          employeeNationality={editorState.employeeNationality}
          setEmployeeNationality={editorState.setEmployeeNationality}
          employeeCni={editorState.employeeCni}
          setEmployeeCni={editorState.setEmployeeCni}
          articles={editorState.articles}
          handleAddArticle={editorState.handleAddArticle}
          handleUpdateArticle={editorState.handleUpdateArticle}
          handleDeleteArticle={editorState.handleDeleteArticle}
          handleMoveArticle={editorState.handleMoveArticle}
        />
      );
    }

    if (docType === "payslip") {
      return (
        <PayslipEditor
          name={editorState.name}
          setName={editorState.setName}
          jobTitle={editorState.jobTitle}
          setJobTitle={editorState.setJobTitle}
          bodyText={editorState.bodyText}
          setBodyText={editorState.setBodyText}
        />
      );
    }

    return (
      <AttestationEditor
        name={editorState.name}
        setName={editorState.setName}
        jobTitle={editorState.jobTitle}
        setJobTitle={editorState.setJobTitle}
        docType={docType}
        leaveStart={editorState.leaveStart}
        setLeaveStart={editorState.setLeaveStart}
        leaveEnd={editorState.leaveEnd}
        setLeaveEnd={editorState.setLeaveEnd}
        leaveReturn={editorState.leaveReturn}
        setLeaveReturn={editorState.setLeaveReturn}
        bodyText={editorState.bodyText}
        setBodyText={editorState.setBodyText}
      />
    );
  };

  return (
    <NeuDialog
      open={isOpen}
      onClose={onClose}
      title={`${DOC_TYPE_LABELS[docType] || docType.toUpperCase()}`}
      className="!max-w-4xl"
    >
      <div className="space-y-4">
        {/* Onglets Prévisualisation / Édition */}
        {isEditable && (
          <div className="flex gap-1 bg-[var(--neu-surface-light)] p-1 rounded-lg border border-[var(--neu-border)]">
            <button
              onClick={() => setActiveTab("preview")}
              className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-md text-xs font-semibold transition-all ${
                activeTab === "preview"
                  ? "bg-[var(--neu-accent)] text-white shadow-md"
                  : "text-[var(--neu-text-secondary)] hover:bg-[var(--neu-surface)]"
              }`}
            >
              <Eye className="w-3.5 h-3.5" /> Prévisualisation A4
            </button>
            <button
              onClick={() => setActiveTab("edit")}
              className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-md text-xs font-semibold transition-all ${
                activeTab === "edit"
                  ? "bg-[var(--neu-accent)] text-white shadow-md"
                  : "text-[var(--neu-text-secondary)] hover:bg-[var(--neu-surface)]"
              }`}
            >
              <Edit3 className="w-3.5 h-3.5" /> Éditer le Contenu
            </button>
          </div>
        )}

        {/* Zone de contenu */}
        {activeTab === "preview" ? (
          <div className="bg-[#e8e8e8] rounded-lg p-4 max-h-[70vh] overflow-y-auto print:p-0 print:bg-white print:max-h-none">
            <div className="mx-auto shadow-xl print:shadow-none" style={{ width: "595px", minHeight: "842px" }}>
              {renderPreview()}
            </div>
          </div>
        ) : (
          <div className="max-h-[70vh] overflow-y-auto">
            {renderEditor()}
          </div>
        )}

        {/* Boutons d'action */}
        <div className="flex gap-3 pt-3 border-t border-[var(--neu-border)]">
          <NeuButton variant="accent" onClick={handleDownload} loading={generating} className="flex-1">
            <Download className="w-4 h-4 mr-2" /> Générer & Télécharger le PDF
          </NeuButton>
          {activeTab === "edit" && (
            <NeuButton variant="ghost" onClick={() => setActiveTab("preview")}>
              <Eye className="w-4 h-4 mr-1" /> Aperçu
            </NeuButton>
          )}
          <NeuButton variant="ghost" onClick={onClose} disabled={generating}>
            Fermer
          </NeuButton>
        </div>
      </div>
    </NeuDialog>
  );
}
