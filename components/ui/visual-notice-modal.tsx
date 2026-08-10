"use client";

import React, { createContext, useContext, useState, ReactNode } from "react";
import { CheckCircle2, ShieldCheck, AlertCircle, Unplug, RefreshCw, ArrowLeft } from "lucide-react";
import { NeuButton } from "@/components/ui/neu-button";

export type NoticeVariant = "validation_submission" | "validation_payment" | "error_form" | "error_tech";

export interface VisualNoticeOptions {
  variant: NoticeVariant;
  title?: string;
  description?: string;
  confirmLabel?: string;
  secondaryLabel?: string;
  onConfirm?: () => void;
  onSecondary?: () => void;
}

interface VisualNoticeModalProps {
  isOpen: boolean;
  onClose: () => void;
  variant: NoticeVariant;
  title?: string;
  description?: string;
  confirmLabel?: string;
  secondaryLabel?: string;
  onConfirm?: () => void;
  onSecondary?: () => void;
}

export function VisualNoticeModal({
  isOpen,
  onClose,
  variant,
  title,
  description,
  confirmLabel,
  secondaryLabel,
  onConfirm,
  onSecondary,
}: VisualNoticeModalProps) {
  if (!isOpen) return null;

  const handleConfirm = () => {
    if (onConfirm) onConfirm();
    onClose();
  };

  const handleSecondary = () => {
    if (onSecondary) onSecondary();
    onClose();
  };

  const renderContent = () => {
    switch (variant) {
      case "validation_submission":
        return {
          icon: (
            <div className="w-20 h-20 rounded-full bg-emerald-500/10 border-2 border-emerald-500/30 flex items-center justify-center shadow-lg shadow-emerald-500/10 animate-bounce-short">
              <CheckCircle2 className="w-10 h-10 text-emerald-500" />
            </div>
          ),
          defaultTitle: "FÉLICITATIONS !",
          defaultDesc: "Votre opération a été effectuée avec succès.",
          defaultConfirm: "Continuer",
          accentColor: "border-emerald-500/40 text-emerald-600 dark:text-emerald-400",
          buttonVariant: "accent" as const,
        };

      case "validation_payment":
        return {
          icon: (
            <div className="w-20 h-20 rounded-full bg-emerald-500/10 border-2 border-emerald-500/30 flex items-center justify-center shadow-lg shadow-emerald-500/10">
              <ShieldCheck className="w-10 h-10 text-emerald-500" />
            </div>
          ),
          defaultTitle: "PAIEMENT CONFIRMÉ",
          defaultDesc: "Votre commande a bien été enregistrée. Un e-mail de confirmation vous a été envoyé.",
          defaultConfirm: "Voir mes commandes",
          accentColor: "border-emerald-500/40 text-emerald-600 dark:text-emerald-400",
          buttonVariant: "accent" as const,
        };

      case "error_form":
        return {
          icon: (
            <div className="w-20 h-20 rounded-full bg-rose-500/10 border-2 border-rose-500/30 flex items-center justify-center shadow-lg shadow-rose-500/10 animate-pulse">
              <AlertCircle className="w-10 h-10 text-rose-500" />
            </div>
          ),
          defaultTitle: "ACTION IMPOSSIBLE",
          defaultDesc: "Certains champs obligatoires sont manquants ou incorrects. Veuillez vérifier vos informations.",
          defaultConfirm: "Corriger les erreurs",
          accentColor: "border-rose-500/40 text-rose-600 dark:text-rose-400",
          buttonVariant: "danger" as const,
        };

      case "error_tech":
      default:
        return {
          icon: (
            <div className="w-20 h-20 rounded-full bg-amber-500/10 border-2 border-amber-500/30 flex items-center justify-center shadow-lg shadow-amber-500/10">
              <Unplug className="w-10 h-10 text-amber-500" />
            </div>
          ),
          defaultTitle: "OUPS ! UNE ERREUR EST SURVENUE",
          defaultDesc: "Le serveur ne répond pas. Cela ne prendra que quelques instants à réparer.",
          defaultConfirm: "Réessayer",
          defaultSecondary: "Retour",
          accentColor: "border-amber-500/40 text-amber-600 dark:text-amber-400",
          buttonVariant: "accent" as const,
        };
    }
  };

  const config = renderContent();

  return (
    <div className="fixed inset-0 z-50 bg-black/65 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="w-full max-w-lg bg-[var(--neu-surface)] border border-[var(--neu-border)] rounded-3xl p-8 shadow-2xl space-y-6 text-center relative overflow-hidden">
        {/* Glow effet d'arrière-plan */}
        <div className="absolute -top-24 -left-24 w-48 h-48 bg-[var(--neu-accent)]/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -right-24 w-48 h-48 bg-[var(--neu-accent)]/10 rounded-full blur-3xl pointer-events-none" />

        {/* Icône principale */}
        <div className="flex justify-center pt-2">
          {config.icon}
        </div>

        {/* Titre & Description */}
        <div className="space-y-2">
          <h2 className={`text-xl font-extrabold tracking-tight ${config.accentColor}`}>
            {title || config.defaultTitle}
          </h2>
          <p className="text-sm text-[var(--neu-text-secondary)] leading-relaxed px-4">
            {description || config.defaultDesc}
          </p>
        </div>

        {/* Actions / Boutons */}
        <div className="flex flex-wrap items-center justify-center gap-3 pt-4 border-t border-[var(--neu-border)]">
          {(secondaryLabel || config.defaultSecondary) && (
            <NeuButton variant="ghost" onClick={handleSecondary} className="px-6">
              <ArrowLeft className="w-4 h-4 mr-2" /> {secondaryLabel || config.defaultSecondary}
            </NeuButton>
          )}

          <NeuButton variant={config.buttonVariant} onClick={handleConfirm} className="px-8 font-bold shadow-md">
            {variant === "error_tech" && <RefreshCw className="w-4 h-4 mr-2" />}
            {confirmLabel || config.defaultConfirm}
          </NeuButton>
        </div>
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════════
// REACT CONTEXT & HOOK GLOBAL POUR LES AFFICHES VISUELLES
// ════════════════════════════════════════════════════════════════════════

interface VisualNoticeContextType {
  showNotice: (options: VisualNoticeOptions) => void;
  showValidationSubmission: (options?: Omit<VisualNoticeOptions, "variant">) => void;
  showValidationPayment: (options?: Omit<VisualNoticeOptions, "variant">) => void;
  showErrorForm: (options?: Omit<VisualNoticeOptions, "variant">) => void;
  showErrorTech: (options?: Omit<VisualNoticeOptions, "variant">) => void;
  closeNotice: () => void;
}

const VisualNoticeContext = createContext<VisualNoticeContextType | null>(null);

export function VisualNoticeProvider({ children }: { children: ReactNode }) {
  const [noticeState, setNoticeState] = useState<VisualNoticeOptions & { isOpen: boolean }>({
    isOpen: false,
    variant: "validation_submission",
  });

  const showNotice = (options: VisualNoticeOptions) => {
    setNoticeState({ ...options, isOpen: true });
  };

  const showValidationSubmission = (options?: Omit<VisualNoticeOptions, "variant">) => {
    showNotice({ variant: "validation_submission", ...options });
  };

  const showValidationPayment = (options?: Omit<VisualNoticeOptions, "variant">) => {
    showNotice({ variant: "validation_payment", ...options });
  };

  const showErrorForm = (options?: Omit<VisualNoticeOptions, "variant">) => {
    showNotice({ variant: "error_form", ...options });
  };

  const showErrorTech = (options?: Omit<VisualNoticeOptions, "variant">) => {
    showNotice({ variant: "error_tech", ...options });
  };

  const closeNotice = () => {
    setNoticeState((prev) => ({ ...prev, isOpen: false }));
  };

  return (
    <VisualNoticeContext.Provider
      value={{
        showNotice,
        showValidationSubmission,
        showValidationPayment,
        showErrorForm,
        showErrorTech,
        closeNotice,
      }}
    >
      {children}
      <VisualNoticeModal
        isOpen={noticeState.isOpen}
        onClose={closeNotice}
        variant={noticeState.variant}
        title={noticeState.title}
        description={noticeState.description}
        confirmLabel={noticeState.confirmLabel}
        secondaryLabel={noticeState.secondaryLabel}
        onConfirm={noticeState.onConfirm}
        onSecondary={noticeState.onSecondary}
      />
    </VisualNoticeContext.Provider>
  );
}

export function useVisualNotice(): VisualNoticeContextType {
  const context = useContext(VisualNoticeContext);
  if (!context) {
    throw new Error("useVisualNotice doit être utilisé au sein de VisualNoticeProvider");
  }
  return context;
}
