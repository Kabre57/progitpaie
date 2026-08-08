"use client";

import React from "react";
import { NeuInput } from "@/components/ui/neu-input";
import { NeuSelect } from "@/components/ui/neu-select";
import { EmployeeFormValues } from "../EmployeeModalForm";

interface ContractTabProps {
  formData: EmployeeFormValues;
  setFormData: React.Dispatch<React.SetStateAction<EmployeeFormValues>>;
}

export function ContractTab({ formData, setFormData }: ContractTabProps) {
  return (
    <div className="space-y-3">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <NeuSelect
          label="Type de Contrat"
          options={[
            { value: "CDI", label: "CDI" },
            { value: "CDD", label: "CDD" },
            { value: "STAGE", label: "Stage" },
            { value: "FREELANCE", label: "Prestation / Freelance" },
          ]}
          value={formData.contractType}
          onChange={(e) => setFormData((prev) => ({ ...prev, contractType: e.target.value }))}
        />
        <NeuInput
          label="Date de Signature"
          type="date"
          value={formData.contractSignDate}
          onChange={(e) => setFormData((prev) => ({ ...prev, contractSignDate: e.target.value }))}
        />
        <NeuInput
          label="Date d'Entrée Effective"
          type="date"
          value={formData.joiningDate}
          onChange={(e) => setFormData((prev) => ({ ...prev, joiningDate: e.target.value }))}
        />
      </div>

      {formData.contractType === "CDD" && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 bg-amber-500/10 p-3 rounded-lg border border-amber-500/20">
          <NeuInput
            label="Durée CDD (mois)"
            type="number"
            value={formData.cddDurationMonths}
            onChange={(e) => setFormData((prev) => ({ ...prev, cddDurationMonths: e.target.value }))}
          />
          <NeuInput
            label="Date de Fin Prévisionnelle"
            type="date"
            value={formData.exitDate}
            onChange={(e) => setFormData((prev) => ({ ...prev, exitDate: e.target.value }))}
          />
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <NeuInput
          label="Direction / Département"
          value={formData.direction}
          onChange={(e) => setFormData((prev) => ({ ...prev, direction: e.target.value }))}
        />
        <NeuInput
          label="Service"
          value={formData.service}
          onChange={(e) => setFormData((prev) => ({ ...prev, service: e.target.value }))}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <NeuInput
          label="Intitulé Emploi / Fonction *"
          value={formData.jobTitle}
          onChange={(e) => setFormData((prev) => ({ ...prev, jobTitle: e.target.value }))}
          required
        />
        <NeuInput
          label="Code Emploi"
          value={formData.jobCode}
          placeholder="ex: CM, CS"
          onChange={(e) => setFormData((prev) => ({ ...prev, jobCode: e.target.value }))}
        />
      </div>
    </div>
  );
}
