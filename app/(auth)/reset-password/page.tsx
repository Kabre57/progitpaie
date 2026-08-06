"use client";

import { useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { KeyRound, ShieldCheck, ArrowLeft, CheckCircle2 } from "lucide-react";
import { NeuCard } from "@/components/ui/neu-card";
import { NeuInput } from "@/components/ui/neu-input";
import { NeuButton } from "@/components/ui/neu-button";

function ResetPasswordForm() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token") || "";

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

    if (!token) {
      setError("Jeton de réinitialisation manquant. Veuillez utiliser le lien reçu par email.");
      setIsLoading(false);
      return;
    }

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
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, newPassword }),
      });

      const json = await res.json();

      if (!res.ok || !json.success) {
        setError(json.error || "Erreur lors de la réinitialisation du mot de passe.");
        setIsLoading(false);
        return;
      }

      setSuccess("Mot de passe réinitialisé avec succès ! Redirection vers la page de connexion...");
      setTimeout(() => {
        window.location.href = "/login";
      }, 2000);
    } catch (err) {
      console.error("Reset password error:", err);
      setError("Erreur réseau ou serveur. Veuillez réessayer.");
      setIsLoading(false);
    }
  };

  return (
    <NeuCard className="p-6">
      {success ? (
        <div className="space-y-4 text-center">
          <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-medium flex items-center justify-center gap-2">
            <CheckCircle2 size={18} />
            {success}
          </div>
          <Link
            href="/login"
            className="inline-flex items-center gap-1.5 text-xs text-[var(--neu-accent)] hover:underline font-semibold pt-2"
          >
            <ArrowLeft size={14} /> Se connecter
          </Link>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs font-medium">
              {error}
            </div>
          )}

          {!token && (
            <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-medium">
              Aucun jeton fourni dans l&apos;URL. Veuillez cliquer sur le lien reçu par email.
            </div>
          )}

          <NeuInput
            label="Nouveau mot de passe (min. 8 caractères)"
            type="password"
            placeholder="••••••••"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            required
            disabled={!token}
          />

          <NeuInput
            label="Confirmer le nouveau mot de passe"
            type="password"
            placeholder="••••••••"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
            disabled={!token}
          />

          <NeuButton
            type="submit"
            variant="accent"
            className="w-full mt-2"
            loading={isLoading}
            disabled={!token}
          >
            Réinitialiser mon mot de passe
          </NeuButton>

          <div className="text-center pt-2">
            <Link
              href="/login"
              className="inline-flex items-center gap-1 text-xs text-[var(--neu-text-secondary)] hover:text-[var(--neu-text)] font-medium"
            >
              <ArrowLeft size={14} /> Annuler et retourner à la connexion
            </Link>
          </div>
        </form>
      )}
    </NeuCard>
  );
}

export default function ResetPasswordPage() {
  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-[var(--neu-bg)]">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center space-y-2">
          <div className="inline-flex p-3 rounded-2xl bg-[var(--neu-accent)]/10 text-[var(--neu-accent)] mb-1 border border-[var(--neu-accent)]/20">
            <ShieldCheck size={28} />
          </div>
          <h1 className="text-2xl font-bold text-[var(--neu-text)] tracking-tight">
            Nouveau mot de passe
          </h1>
          <p className="text-xs text-[var(--neu-text-secondary)] max-w-sm mx-auto leading-relaxed">
            Veuillez saisir votre nouveau mot de passe sécurisé.
          </p>
        </div>

        <Suspense fallback={<div className="p-6 text-center text-xs text-slate-400">Chargement...</div>}>
          <ResetPasswordForm />
        </Suspense>
      </div>
    </div>
  );
}
