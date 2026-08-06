"use client";

import { useState } from "react";
import { Lock, ShieldCheck, KeyRound, ArrowRight } from "lucide-react";
import { NeuCard } from "@/components/ui/neu-card";
import { NeuInput } from "@/components/ui/neu-input";
import { NeuButton } from "@/components/ui/neu-button";

export default function ChangePasswordPage() {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    setSuccess(null);

    if (newPassword.length < 8) {
      setError("Le nouveau mot de passe doit contenir au moins 8 caractères.");
      setIsLoading(false);
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("Les nouveaux mots de passe ne correspondent pas.");
      setIsLoading(false);
      return;
    }

    try {
      const res = await fetch("/api/auth/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword, newPassword, confirmPassword }),
      });

      const json = await res.json();

      if (!res.ok || !json.success) {
        setError(json.error || "Erreur lors de la modification du mot de passe.");
        setIsLoading(false);
        return;
      }

      setSuccess("Mot de passe modifié avec succès ! Redirection en cours...");
      setTimeout(() => {
        window.location.href = "/employee";
      }, 1500);
    } catch (err) {
      console.error("Change password error:", err);
      setError("Erreur réseau ou serveur. Veuillez réessayer.");
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-[var(--neu-bg)]">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center space-y-2">
          <div className="inline-flex p-3 rounded-2xl bg-[var(--neu-accent)]/10 text-[var(--neu-accent)] mb-1 border border-[var(--neu-accent)]/20">
            <KeyRound size={28} />
          </div>
          <h1 className="text-2xl font-bold text-[var(--neu-text)] tracking-tight">
            Première Connexion
          </h1>
          <p className="text-xs text-[var(--neu-text-secondary)] max-w-sm mx-auto leading-relaxed">
            Pour des raisons de sécurité, vous devez modifier votre mot de passe temporaire avant d&apos;accéder à votre espace PROGITPAIE.
          </p>
        </div>

        <NeuCard className="p-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs font-medium">
                {error}
              </div>
            )}

            {success && (
              <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-medium flex items-center gap-2">
                <ShieldCheck size={16} />
                {success}
              </div>
            )}

            <NeuInput
              label="Mot de passe actuel (par défaut)"
              type="password"
              placeholder="••••••••"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              required
            />

            <NeuInput
              label="Nouveau mot de passe (min. 8 caractères)"
              type="password"
              placeholder="••••••••"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
            />

            <NeuInput
              label="Confirmer le nouveau mot de passe"
              type="password"
              placeholder="••••••••"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
            />

            <NeuButton
              type="submit"
              variant="accent"
              className="w-full mt-2"
              loading={isLoading}
            >
              Enregistrer le nouveau mot de passe <ArrowRight size={16} className="ml-2" />
            </NeuButton>
          </form>
        </NeuCard>
      </div>
    </div>
  );
}
