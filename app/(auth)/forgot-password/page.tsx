"use client";

import { useState } from "react";
import Link from "next/link";
import { Mail, ArrowLeft, CheckCircle2 } from "lucide-react";
import { NeuCard } from "@/components/ui/neu-card";
import { NeuInput } from "@/components/ui/neu-input";
import { NeuButton } from "@/components/ui/neu-button";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    setMessage(null);

    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const json = await res.json();

      if (!res.ok || !json.success) {
        setError(json.error || "Une erreur est survenue lors de l'envoi de la demande.");
        setIsLoading(false);
        return;
      }

      setMessage(json.message || "Instructions envoyées si l'adresse email existe.");
    } catch (err) {
      console.error("Forgot password error:", err);
      setError("Erreur réseau ou serveur. Veuillez réessayer.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-[var(--neu-bg)]">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center space-y-2">
          <div className="inline-flex p-3 rounded-2xl bg-[var(--neu-accent)]/10 text-[var(--neu-accent)] mb-1 border border-[var(--neu-accent)]/20">
            <Mail size={28} />
          </div>
          <h1 className="text-2xl font-bold text-[var(--neu-text)] tracking-tight">
            Mot de passe oublié ?
          </h1>
          <p className="text-xs text-[var(--neu-text-secondary)] max-w-sm mx-auto leading-relaxed">
            Saisissez votre adresse email professionnelle. Nous vous transmettrons les instructions pour réinitialiser votre accès.
          </p>
        </div>

        <NeuCard className="p-6">
          {message ? (
            <div className="space-y-4 text-center">
              <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-medium flex items-center justify-center gap-2">
                <CheckCircle2 size={18} />
                {message}
              </div>
              <p className="text-xs text-[var(--neu-text-secondary)] leading-relaxed">
                Veuillez consulter votre boîte de réception (et vos indésirables).
              </p>
              <Link
                href="/login"
                className="inline-flex items-center gap-1.5 text-xs text-[var(--neu-accent)] hover:underline font-semibold pt-2"
              >
                <ArrowLeft size={14} /> Retour à la connexion
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs font-medium">
                  {error}
                </div>
              )}

              <NeuInput
                label="Adresse Email Professionnelle"
                type="email"
                placeholder="votre.nom@entreprise.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />

              <NeuButton
                type="submit"
                variant="accent"
                className="w-full mt-2"
                loading={isLoading}
              >
                Envoyer le lien de réinitialisation
              </NeuButton>

              <div className="text-center pt-2">
                <Link
                  href="/login"
                  className="inline-flex items-center gap-1 text-xs text-[var(--neu-text-secondary)] hover:text-[var(--neu-text)] font-medium"
                >
                  <ArrowLeft size={14} /> Retour à la page de connexion
                </Link>
              </div>
            </form>
          )}
        </NeuCard>
      </div>
    </div>
  );
}
