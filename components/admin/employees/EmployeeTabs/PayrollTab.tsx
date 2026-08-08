"use client";

import React from "react";
import { NeuInput } from "@/components/ui/neu-input";
import { NeuSelect } from "@/components/ui/neu-select";
import { EmployeeFormValues } from "../EmployeeModalForm";

interface PayrollTabProps {
  formData: EmployeeFormValues;
  setFormData: React.Dispatch<React.SetStateAction<EmployeeFormValues>>;
}

export function PayrollTab({ formData, setFormData }: PayrollTabProps) {
  return (
    <div className="space-y-3">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <NeuSelect
          label="Régime de Paie"
          options={[
            { value: "Général", label: "Général" },
            { value: "Agricole", label: "Agricole" },
          ]}
          value={formData.regime}
          onChange={(e) => setFormData((prev) => ({ ...prev, regime: e.target.value }))}
        />
        <NeuSelect
          label="Type de Paiement"
          options={[
            { value: "Mensuel", label: "Mensuel" },
            { value: "Horaire", label: "Horaire" },
          ]}
          value={formData.paymentType}
          onChange={(e) => setFormData((prev) => ({ ...prev, paymentType: e.target.value }))}
        />
        <NeuInput
          label="Catégorie Professionnelle"
          value={formData.category}
          placeholder="ex: 11 à 1A"
          onChange={(e) => setFormData((prev) => ({ ...prev, category: e.target.value }))}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <NeuInput
          label="Salaire de Base Categoriel (FCFA) *"
          type="number"
          value={formData.salary}
          onChange={(e) => setFormData((prev) => ({ ...prev, salary: e.target.value }))}
          required
        />
        <NeuInput
          label="Sursalaire Négocié (FCFA)"
          type="number"
          value={formData.sursalaire}
          onChange={(e) => setFormData((prev) => ({ ...prev, sursalaire: e.target.value }))}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2 border-t border-[var(--neu-border)]">
        <div className="flex items-center gap-2 pt-6">
          <input
            type="checkbox"
            id="cnpsExempt"
            checked={formData.cnpsExempt}
            onChange={(e) => setFormData((prev) => ({ ...prev, cnpsExempt: e.target.checked }))}
            className="w-4 h-4 rounded text-[var(--neu-accent)]"
          />
          <label htmlFor="cnpsExempt" className="text-sm text-[var(--neu-text)] font-medium">
            Salarié non soumis à la CNPS
          </label>
        </div>
        {!formData.cnpsExempt && (
          <NeuInput
            label="N° CNPS"
            value={formData.cnpsNumber}
            onChange={(e) => setFormData((prev) => ({ ...prev, cnpsNumber: e.target.value }))}
          />
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-2 border-t border-[var(--neu-border)]">
        <NeuSelect
          label="Mode de Règlement"
          options={[
            { value: "Virement", label: "Virement Bancaire" },
            { value: "Chèque", label: "Chèque" },
            { value: "Espèces", label: "Espèces" },
          ]}
          value={formData.paymentMethod}
          onChange={(e) => setFormData((prev) => ({ ...prev, paymentMethod: e.target.value }))}
        />
        <NeuInput
          label="Nom de la Banque"
          value={formData.bankName}
          onChange={(e) => setFormData((prev) => ({ ...prev, bankName: e.target.value }))}
        />
        <NeuInput
          label="RIB / N° Compte Bancaire"
          value={formData.bankAccount}
          onChange={(e) => setFormData((prev) => ({ ...prev, bankAccount: e.target.value }))}
        />
      </div>
    </div>
  );
}
