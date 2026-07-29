"use client";

import { useState, useCallback, useRef } from "react";
import {
  Palette, FileText, Save, Upload, X, Eye, ImageIcon, RotateCcw,
} from "lucide-react";
import { NeuCard, NeuCardHeader, NeuCardTitle, NeuCardContent } from "@/components/ui/neu-card";
import { NeuButton } from "@/components/ui/neu-button";
import { NeuInput } from "@/components/ui/neu-input";
import {
  PayslipAppearanceConfig,
  PayslipLegalConfig,
  DEFAULT_PAYSLIP_APPEARANCE,
  DEFAULT_PAYSLIP_LEGAL,
  COLOR_PRESETS,
  LOGO_MAX_SIZE_BYTES,
  LOGO_ALLOWED_MIME_TYPES,
} from "@/lib/payslip-config";

interface PayslipCustomizerCardProps {
  appearance: PayslipAppearanceConfig;
  setAppearance: (val: PayslipAppearanceConfig) => void;
  legal: PayslipLegalConfig;
  setLegal: (val: PayslipLegalConfig) => void;
  onSave: () => void;
  saving: boolean;
  onPreview?: () => void;
}

export function PayslipCustomizerCard({
  appearance,
  setAppearance,
  legal,
  setLegal,
  onSave,
  saving,
  onPreview,
}: PayslipCustomizerCardProps) {
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // ═══════════════════════════════════════════════
  // HANDLERS
  // ═══════════════════════════════════════════════

  const handleResetAppearance = useCallback(() => {
    if (confirm("Restaurer l'apparence par défaut du bulletin ?")) {
      setAppearance({ ...DEFAULT_PAYSLIP_APPEARANCE });
    }
  }, [setAppearance]);

  const handleResetLegal = useCallback(() => {
    if (confirm("Restaurer les mentions légales par défaut ?")) {
      setLegal({ ...DEFAULT_PAYSLIP_LEGAL });
    }
  }, [setLegal]);

  const handleLogoUpload = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadError(null);

    // Validation côté client (avant d'envoyer au serveur)
    if (!LOGO_ALLOWED_MIME_TYPES.includes(file.type as any)) {
      setUploadError(`Type de fichier non autorisé : ${file.type}. Utilisez PNG, JPEG ou WebP.`);
      return;
    }

    if (file.size > LOGO_MAX_SIZE_BYTES) {
      const maxKB = Math.round(LOGO_MAX_SIZE_BYTES / 1024);
      setUploadError(`Le fichier dépasse ${maxKB} KB (taille : ${Math.round(file.size / 1024)} KB).`);
      return;
    }

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("logo", file);

      const res = await fetch("/api/settings/upload", {
        method: "POST",
        body: formData,
      });
      const json = await res.json();

      if (json.success) {
        // Relire la config depuis l'API pour obtenir le logo en Base64
        const configRes = await fetch("/api/settings/payslip");
        const configJson = await configRes.json();
        if (configJson.success && configJson.data?.appearance?.logoBase64) {
          setAppearance({
            ...appearance,
            logoBase64: configJson.data.appearance.logoBase64,
          });
        }
      } else {
        setUploadError(json.error || "Erreur lors de l'upload");
      }
    } catch (err) {
      setUploadError("Erreur réseau lors de l'upload du logo");
    } finally {
      setUploading(false);
      // Reset le file input
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }, [appearance, setAppearance]);

  const handleRemoveLogo = useCallback(async () => {
    if (!confirm("Supprimer le logo actuel du bulletin ?")) return;

    try {
      const res = await fetch("/api/settings/upload", { method: "DELETE" });
      const json = await res.json();
      if (json.success) {
        setAppearance({ ...appearance, logoBase64: undefined });
      }
    } catch (err) {
      console.error("Erreur suppression logo:", err);
    }
  }, [appearance, setAppearance]);

  return (
    <NeuCard>
      <NeuCardHeader>
        <NeuCardTitle className="flex items-center justify-between">
          <span className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-[var(--neu-accent)]" /> Personnalisation du Bulletin de Paie
          </span>
        </NeuCardTitle>
      </NeuCardHeader>
      <NeuCardContent className="space-y-8">

        {/* ══════════════════════════════════════════ */}
        {/* SECTION 1 : APPARENCE & COULEURS          */}
        {/* ══════════════════════════════════════════ */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-bold text-sm text-[var(--neu-accent)] uppercase tracking-wider flex items-center gap-2">
              <Palette className="w-4 h-4" /> 1. Apparence & Couleurs
            </h3>
            <NeuButton
              size="sm"
              variant="ghost"
              onClick={handleResetAppearance}
              className="text-amber-400 hover:bg-amber-500/10"
              title="Restaurer l'apparence par défaut"
            >
              <RotateCcw className="w-4 h-4 mr-1" /> Par défaut
            </NeuButton>
          </div>

          {/* Couleur de la bande Net à Payer */}
          <div className="space-y-3">
            <label className="block text-sm font-medium text-[var(--neu-text-secondary)]">
              Couleur de la bande &quot;Net à Payer&quot;
            </label>
            <div className="flex items-center gap-3">
              {/* Color picker natif */}
              <input
                type="color"
                value={appearance.primaryColor}
                onChange={(e) =>
                  setAppearance({ ...appearance, primaryColor: e.target.value })
                }
                className="w-12 h-10 rounded-lg border border-[var(--neu-border)] cursor-pointer bg-transparent"
                title="Choisir une couleur personnalisée"
              />
              {/* Préréglages de couleurs */}
              <div className="flex gap-2 flex-wrap">
                {COLOR_PRESETS.map((preset) => (
                  <button
                    key={preset.value}
                    onClick={() =>
                      setAppearance({ ...appearance, primaryColor: preset.value })
                    }
                    className={`w-8 h-8 rounded-full border-2 transition-all duration-200 hover:scale-110 ${
                      appearance.primaryColor === preset.value
                        ? "border-white shadow-lg scale-110"
                        : "border-transparent opacity-70 hover:opacity-100"
                    }`}
                    style={{ backgroundColor: preset.value }}
                    title={preset.name}
                  />
                ))}
              </div>
              {/* Affichage du code hex */}
              <span className="text-xs font-mono text-[var(--neu-text-muted)] bg-[var(--neu-surface)] px-2 py-1 rounded">
                {appearance.primaryColor}
              </span>
            </div>

            {/* Aperçu de la bande */}
            <div
              className="w-full h-10 rounded-lg flex items-center justify-center text-sm font-bold transition-colors duration-300"
              style={{ backgroundColor: appearance.primaryColor, color: "#000" }}
            >
              NET À PAYER ▸ 350 000 FCFA
            </div>
          </div>

          {/* Titre & Sous-titre du bulletin */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
            <NeuInput
              label="Titre du bulletin"
              value={appearance.headerTitle}
              onChange={(e) =>
                setAppearance({ ...appearance, headerTitle: e.target.value })
              }
              placeholder="BULLETIN DE PAIE"
              maxLength={100}
            />
            <NeuInput
              label="Sous-titre / Régime"
              value={appearance.headerSubtitle}
              onChange={(e) =>
                setAppearance({ ...appearance, headerSubtitle: e.target.value })
              }
              placeholder="Régime Général"
              maxLength={100}
            />
          </div>

          {/* Upload de Logo */}
          <div className="mt-4">
            <label className="block text-sm font-medium text-[var(--neu-text-secondary)] mb-2">
              Logo de l&apos;entreprise (PNG, JPEG, WebP — max 200 KB)
            </label>
            <div className="flex items-center gap-4">
              {/* Aperçu du logo actuel */}
              {appearance.logoBase64 ? (
                <div className="relative group">
                  <img
                    src={appearance.logoBase64}
                    alt="Logo entreprise"
                    className="h-16 max-w-[200px] object-contain rounded-lg border border-[var(--neu-border)] bg-white p-1"
                  />
                  <button
                    onClick={handleRemoveLogo}
                    className="absolute -top-2 -right-2 w-5 h-5 rounded-full bg-red-500 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                    title="Supprimer le logo"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ) : (
                <div className="h-16 w-32 rounded-lg border-2 border-dashed border-[var(--neu-border)] flex items-center justify-center text-[var(--neu-text-muted)]">
                  <ImageIcon className="w-6 h-6 opacity-40" />
                </div>
              )}
              {/* Bouton d'upload */}
              <div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/png,image/jpeg,image/webp"
                  onChange={handleLogoUpload}
                  className="hidden"
                  id="logo-upload-input"
                />
                <NeuButton
                  size="sm"
                  variant="ghost"
                  onClick={() => fileInputRef.current?.click()}
                  loading={uploading}
                  className="text-[var(--neu-accent)]"
                >
                  <Upload className="w-4 h-4 mr-1" />
                  {appearance.logoBase64 ? "Remplacer" : "Téléverser"}
                </NeuButton>
              </div>
            </div>
            {uploadError && (
              <p className="mt-2 text-sm text-red-400">{uploadError}</p>
            )}
          </div>
        </div>

        {/* ══════════════════════════════════════════ */}
        {/* SECTION 2 : MENTIONS LÉGALES & FOOTER     */}
        {/* ══════════════════════════════════════════ */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-bold text-sm text-[var(--neu-accent)] uppercase tracking-wider flex items-center gap-2">
              <FileText className="w-4 h-4" /> 2. Mentions Légales & Pied de Page
            </h3>
            <NeuButton
              size="sm"
              variant="ghost"
              onClick={handleResetLegal}
              className="text-amber-400 hover:bg-amber-500/10"
              title="Restaurer les mentions légales par défaut"
            >
              <RotateCcw className="w-4 h-4 mr-1" /> Par défaut
            </NeuButton>
          </div>

          {/* Mention légale de bas de page */}
          <div>
            <label className="block text-sm font-medium text-[var(--neu-text-secondary)] mb-2">
              Mention légale de bas de page
            </label>
            <textarea
              value={legal.legalNotice}
              onChange={(e) =>
                setLegal({ ...legal, legalNotice: e.target.value })
              }
              maxLength={500}
              rows={3}
              className="w-full px-4 py-2.5 rounded-[var(--neu-radius)] bg-[var(--neu-surface)] text-[var(--neu-text)] border border-[var(--neu-border)] shadow-[inset_4px_4px_8px_var(--neu-shadow-dark),inset_-4px_-4px_8px_var(--neu-shadow-light)] placeholder:text-[var(--neu-text-muted)] transition-all duration-200 ease-out focus:outline-none focus:border-[var(--neu-accent)] resize-none"
              placeholder="Pour vous aider à faire valoir vos droits..."
            />
            <p className="text-xs text-[var(--neu-text-muted)] mt-1">
              {legal.legalNotice.length} / 500 caractères
            </p>
          </div>

          {/* Toggles Signature / Émargement */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
            <label className="flex items-center gap-3 p-3 rounded-lg bg-[var(--neu-surface)] border border-[var(--neu-border)] cursor-pointer hover:border-[var(--neu-accent)] transition-colors">
              <input
                type="checkbox"
                checked={legal.showEmployerStamp}
                onChange={(e) =>
                  setLegal({ ...legal, showEmployerStamp: e.target.checked })
                }
                className="w-5 h-5 rounded accent-[var(--neu-accent)]"
              />
              <div>
                <span className="text-sm font-medium text-[var(--neu-text)]">
                  Zone Signature Employeur
                </span>
                <p className="text-xs text-[var(--neu-text-muted)]">
                  Affiche l&apos;espace pour le tampon et signature de l&apos;employeur
                </p>
              </div>
            </label>

            <label className="flex items-center gap-3 p-3 rounded-lg bg-[var(--neu-surface)] border border-[var(--neu-border)] cursor-pointer hover:border-[var(--neu-accent)] transition-colors">
              <input
                type="checkbox"
                checked={legal.showEmployeeSignature}
                onChange={(e) =>
                  setLegal({ ...legal, showEmployeeSignature: e.target.checked })
                }
                className="w-5 h-5 rounded accent-[var(--neu-accent)]"
              />
              <div>
                <span className="text-sm font-medium text-[var(--neu-text)]">
                  Zone Émargement Salarié
                </span>
                <p className="text-xs text-[var(--neu-text-muted)]">
                  Affiche l&apos;espace pour la signature de l&apos;employé
                </p>
              </div>
            </label>
          </div>
        </div>

        {/* ══════════════════════════════════════════ */}
        {/* ACTIONS                                    */}
        {/* ══════════════════════════════════════════ */}
        <div className="flex justify-between items-center pt-4 border-t border-[var(--neu-border)]">
          {onPreview && (
            <NeuButton variant="ghost" onClick={onPreview}>
              <Eye className="w-4 h-4 mr-2" /> Aperçu A4 Live
            </NeuButton>
          )}
          <div className="flex-1" />
          <NeuButton variant="accent" onClick={onSave} loading={saving}>
            <Save className="w-4 h-4 mr-2" /> Enregistrer la Configuration
          </NeuButton>
        </div>
      </NeuCardContent>
    </NeuCard>
  );
}
