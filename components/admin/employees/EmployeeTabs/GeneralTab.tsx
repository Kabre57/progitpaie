"use client";

import React from "react";
import { NeuInput } from "@/components/ui/neu-input";
import { NeuSelect } from "@/components/ui/neu-select";
import { EmployeeFormValues } from "../EmployeeModalForm";

interface GeneralTabProps {
  formData: EmployeeFormValues;
  setFormData: React.Dispatch<React.SetStateAction<EmployeeFormValues>>;
  isEditMode: boolean;
}

export function GeneralTab({ formData, setFormData, isEditMode }: GeneralTabProps) {
  return (
    <div className="space-y-3">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <NeuInput
          label="Matricule *"
          value={formData.employeeId}
          onChange={(e) => setFormData((prev) => ({ ...prev, employeeId: e.target.value }))}
          required
        />
        <NeuSelect
          label="Civilité"
          options={[
            { value: "M.", label: "M. (Monsieur)" },
            { value: "Mme", label: "Mme (Madame)" },
            { value: "Mlle", label: "Mlle (Mademoiselle)" },
          ]}
          value={formData.civility}
          onChange={(e) => setFormData((prev) => ({ ...prev, civility: e.target.value }))}
        />
        <NeuInput
          label="Nom & Prénoms *"
          value={formData.name}
          onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
          required
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <NeuInput
          label="Email Professionnel *"
          type="email"
          value={formData.email}
          onChange={(e) => setFormData((prev) => ({ ...prev, email: e.target.value }))}
          required
        />
        {!isEditMode && (
          <NeuInput
            label="Mot de Passe Initial"
            type="password"
            value={formData.password || ""}
            placeholder="Par défaut: 123456"
            onChange={(e) => setFormData((prev) => ({ ...prev, password: e.target.value }))}
          />
        )}
        <NeuInput
          label="Téléphone"
          value={formData.phone}
          onChange={(e) => setFormData((prev) => ({ ...prev, phone: e.target.value }))}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <NeuInput
          label="Date de Naissance"
          type="date"
          value={formData.birthDate}
          onChange={(e) => setFormData((prev) => ({ ...prev, birthDate: e.target.value }))}
        />
        <NeuInput
          label="Lieu de Naissance"
          value={formData.birthPlace}
          onChange={(e) => setFormData((prev) => ({ ...prev, birthPlace: e.target.value }))}
        />
        <NeuInput
          label="Nationalité"
          value={formData.nationality}
          onChange={(e) => setFormData((prev) => ({ ...prev, nationality: e.target.value }))}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <NeuSelect
          label="Situation Matrimoniale"
          options={[
            { value: "Célibataire", label: "Célibataire" },
            { value: "Marié(e)", label: "Marié(e)" },
            { value: "Divorcé(e)", label: "Divorcé(e)" },
            { value: "Veuf(ve)", label: "Veuf(ve)" },
          ]}
          value={formData.maritalStatus}
          onChange={(e) => setFormData((prev) => ({ ...prev, maritalStatus: e.target.value }))}
        />
        <NeuInput
          label="Nombre d'enfants à charge"
          type="number"
          value={formData.childrenCount}
          onChange={(e) => setFormData((prev) => ({ ...prev, childrenCount: e.target.value }))}
        />
        <NeuInput
          label="Adresse Complète"
          value={formData.address}
          onChange={(e) => setFormData((prev) => ({ ...prev, address: e.target.value }))}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2 border-t border-[var(--neu-border)]">
        <NeuSelect
          label="Pièce d'Identité"
          options={[
            { value: "CNI", label: "CNI" },
            { value: "Passeport", label: "Passeport" },
            { value: "Attestation", label: "Attestation d'Identité" },
            { value: "Carte Consulaire", label: "Carte Consulaire" },
          ]}
          value={formData.idCardType}
          onChange={(e) => setFormData((prev) => ({ ...prev, idCardType: e.target.value }))}
        />
        <NeuInput
          label="N° Pièce d'Identité"
          value={formData.idCardNumber}
          onChange={(e) => setFormData((prev) => ({ ...prev, idCardNumber: e.target.value }))}
        />
      </div>
    </div>
  );
}
