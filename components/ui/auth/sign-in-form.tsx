"use client";

import React, { useState } from "react";
import { Label, Input, PasswordInput, Button } from "@/components/ui/auth-fuse";

export interface SignInFormProps {
  onSubmit: (data: { email: string; password: string }) => void;
  isLoading?: boolean;
  error?: string | null;
}

export function SignInForm({ onSubmit, isLoading, error }: SignInFormProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    onSubmit({ email, password });
  };

  return (
    <form onSubmit={handleSubmit} autoComplete="on" className="flex flex-col gap-6">
      <div className="flex flex-col items-center gap-2 text-center">
        <h1 className="text-2xl font-bold text-[var(--neu-text)]">Connexion à votre compte</h1>
        <p className="text-sm text-[var(--neu-text-secondary)]">Saisissez vos identifiants ci-dessous pour accéder à votre espace</p>
      </div>

      {error && (
        <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-sm">
          {error}
        </div>
      )}

      <div className="grid gap-4">
        <div className="grid gap-2">
          <Label htmlFor="email">Adresse Email</Label>
          <Input
            id="email"
            name="email"
            type="email"
            placeholder="admin@attendance.com"
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
          autoComplete="current-password"
          placeholder="Saisissez votre mot de passe"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <Button type="submit" className="mt-2" disabled={isLoading}>
          {isLoading ? "Connexion en cours..." : "Se connecter"}
        </Button>
      </div>
    </form>
  );
}
