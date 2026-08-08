"use client";

import React, { useState } from "react";
import { NeuDialog } from "@/components/ui/neu-dialog";
import { NeuButton } from "@/components/ui/neu-button";
import { GeneralTab } from "./EmployeeTabs/GeneralTab";
import { ContractTab } from "./EmployeeTabs/ContractTab";
import { PayrollTab } from "./EmployeeTabs/PayrollTab";

export interface EmployeeFormValues {
  id: string;
  name: string;
  email: string;
  password: string;
  employeeId: string;
  civility: string;
  gender: string;
  birthDate: string;
  birthPlace: string;
  idCardType: string;
  idCardNumber: string;
  nationality: string;
  maritalStatus: string;
  childrenCount: string;
  address: string;
  phone: string;
  contractType: string;
  contractSignDate: string;
  cddDurationMonths: string;
  joiningDate: string;
  exitDate: string;
  direction: string;
  service: string;
  jobTitle: string;
  jobCode: string;
  regime: string;
  paymentType: string;
  category: string;
  cnpsExempt: boolean;
  cnpsNumber: string;
  paymentMethod: string;
  bankAccount: string;
  bankName: string;
  salary: string;
  sursalaire: string;
  department: string;
}

interface EmployeeModalFormProps {
  isOpen: boolean;
  onClose: () => void;
  isEditMode: boolean;
  employeeId: string;
  formData: EmployeeFormValues;
  setFormData: React.Dispatch<React.SetStateAction<EmployeeFormValues>>;
  onSubmit: (e: React.FormEvent) => Promise<void>;
  formSubmitting: boolean;
}

export function EmployeeModalForm({
  isOpen,
  onClose,
  isEditMode,
  employeeId,
  formData,
  setFormData,
  onSubmit,
  formSubmitting,
}: EmployeeModalFormProps) {
  const [activeFormTab, setActiveFormTab] = useState<"general" | "contract" | "bank">("general");

  return (
    <NeuDialog
      open={isOpen}
      onClose={onClose}
      title={isEditMode ? `Éditer la Fiche du Personnel (${employeeId})` : "Ajouter un Salarié au Registre du Personnel"}
    >
      <form onSubmit={onSubmit} className="space-y-4">
        {/* Navigation Tabs Form */}
        <div className="flex gap-2 border-b border-[var(--neu-border)] pb-2">
          <NeuButton
            type="button"
            variant={activeFormTab === "general" ? "accent" : "ghost"}
            onClick={() => setActiveFormTab("general")}
            size="sm"
          >
            1. État Civil & Identité
          </NeuButton>
          <NeuButton
            type="button"
            variant={activeFormTab === "contract" ? "accent" : "ghost"}
            onClick={() => setActiveFormTab("contract")}
            size="sm"
          >
            2. Contrat & Fonction
          </NeuButton>
          <NeuButton
            type="button"
            variant={activeFormTab === "bank" ? "accent" : "ghost"}
            onClick={() => setActiveFormTab("bank")}
            size="sm"
          >
            3. Rémunération & Banque
          </NeuButton>
        </div>

        {activeFormTab === "general" && (
          <GeneralTab formData={formData} setFormData={setFormData} isEditMode={isEditMode} />
        )}

        {activeFormTab === "contract" && (
          <ContractTab formData={formData} setFormData={setFormData} />
        )}

        {activeFormTab === "bank" && (
          <PayrollTab formData={formData} setFormData={setFormData} />
        )}

        {/* Action Buttons */}
        <div className="flex justify-end gap-3 pt-4 border-t border-[var(--neu-border)]">
          <NeuButton type="button" variant="ghost" onClick={onClose}>
            Annuler
          </NeuButton>
          <NeuButton type="submit" variant="accent" disabled={formSubmitting}>
            {formSubmitting ? "Enregistrement..." : isEditMode ? "Enregistrer les modifications" : "Créer le Salarié"}
          </NeuButton>
        </div>
      </form>
    </NeuDialog>
  );
}
