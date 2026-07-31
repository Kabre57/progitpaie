"use client";

import React, { useState } from "react";
import { Label, Input, PasswordInput, Button } from "@/components/ui/auth-fuse";

export interface SignUpFormProps {
  onSubmit: (data: { name: string; email: string; password: string; department?: string }) => void;
  isLoading?: boolean;
  error?: string | null;
}

export function SignUpForm({ onSubmit, isLoading, error }: SignUpFormProps) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [department, setDepartment] = useState("");

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (password !== confirmPassword) {
      return;
    }
    onSubmit({ name, email, password, department: department || undefined });
  };

  const departmentOptions = [
    { value: "", label: "Sélectionnez un département (Optionnel)" },
    { value: "Engineering", label: "Ingénierie & IT" },
    { value: "Design", label: "Design & Produit" },
    { value: "Marketing", label: "Marketing" },
    { value: "Sales", label: "Ventes & Commercial" },
    { value: "HR", label: "Ressources Humaines" },
    { value: "Finance", label: "Finance & Comptabilité" },
    { value: "Operations", label: "Opérations" },
    { value: "Management", label: "Direction" },
    { value: "Other", label: "Autre" },
  ];

  return (
    <form onSubmit={handleSubmit} autoComplete="on" className="flex flex-col gap-6">
      <div className="flex flex-col items-center gap-2 text-center">
        <h1 className="text-2xl font-bold text-[var(--neu-text)]">Créer un compte</h1>
        <p className="text-sm text-[var(--neu-text-secondary)]">Renseignez vos informations ci-dessous pour vous inscrire</p>
      </div>

      {error && (
        <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-sm">
          {error}
        </div>
      )}

      <div className="grid gap-4">
        <div className="grid gap-2">
          <Label htmlFor="name">Nom Complet</Label>
          <Input
            id="name"
            name="name"
            type="text"
            placeholder="Kouassi Jean"
            required
            autoComplete="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="email">Adresse Email</Label>
          <Input
            id="email"
            name="email"
            type="email"
            placeholder="kouassi@entreprise.ci"
            required
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>
        <PasswordInput
          name="password"
          label="Mot de passe"
          required
          autoComplete="new-password"
          placeholder="Créer un mot de passe (min 6 caractères)"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <PasswordInput
          name="confirmPassword"
          label="Confirmer le mot de passe"
          required
          autoComplete="new-password"
          placeholder="Confirmez votre mot de passe"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
        />
        <div className="grid gap-2">
          <Label htmlFor="department">Département</Label>
          <select
            id="department"
            name="department"
            value={department}
            onChange={(e) => setDepartment(e.target.value)}
            className="flex h-11 w-full rounded-xl bg-[var(--neu-bg)] px-4 py-3 text-sm text-[var(--neu-text)] shadow-[inset_2px_2px_4px_var(--neu-shadow-dark),inset_-2px_-2px-4px_var(--neu-shadow-light)] border-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--neu-accent)]/20 appearance-none cursor-pointer"
          >
            {departmentOptions.map((option) => (
              <option key={option.value} value={option.value} className="bg-[var(--neu-surface)]">
                {option.label}
              </option>
            ))}
          </select>
        </div>
        <Button type="submit" className="mt-2" disabled={isLoading}>
          {isLoading ? "Création du compte..." : "Créer un compte"}
        </Button>
      </div>
    </form>
  );
}
