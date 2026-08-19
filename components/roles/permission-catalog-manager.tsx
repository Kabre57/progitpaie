"use client";

import React, { useState } from "react";
import { Plus, Trash2, Shield, FolderPlus, Key, Download, RefreshCw, AlertTriangle, Sparkles } from "lucide-react";
import { NeuCard } from "@/components/ui/neu-card";
import { NeuButton } from "@/components/ui/neu-button";
import { NeuInput } from "@/components/ui/neu-input";
import { NeuBadge } from "@/components/ui/neu-badge";
import { useToast } from "@/components/ui/neu-toast";
import { PermissionModuleEntity } from "@/lib/domain/auth/entities/PermissionCatalog";

interface PermissionCatalogManagerProps {
  catalog: PermissionModuleEntity[];
  onRefresh: () => void;
}

export function PermissionCatalogManager({ catalog, onRefresh }: PermissionCatalogManagerProps) {
  const toast = useToast();

  // Modals state
  const [isAddModuleOpen, setIsAddModuleOpen] = useState(false);
  const [isAddPermOpen, setIsAddPermOpen] = useState(false);
  const [isOperating, setIsOperating] = useState(false);

  // Add Module Form
  const [moduleName, setModuleName] = useState("");
  const [moduleCode, setModuleCode] = useState("");
  const [moduleDesc, setModuleDesc] = useState("");
  const [isSavingModule, setIsSavingModule] = useState(false);

  // Add Permission Form
  const [selectedModuleId, setSelectedModuleId] = useState("");
  const [permName, setPermName] = useState("");
  const [permCode, setPermCode] = useState("");
  const [permAction, setPermAction] = useState<string>("read");
  const [permDesc, setPermDesc] = useState("");
  const [isSavingPerm, setIsSavingPerm] = useState(false);

  const handleCreateModule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!moduleName.trim()) {
      toast.warning("Le nom du module est requis.");
      return;
    }

    setIsSavingModule(true);
    try {
      const res = await fetch("/api/v2/permissions/modules", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: moduleName.trim(),
          code: (moduleCode || moduleName).trim().toLowerCase().replace(/\s+/g, "_"),
          description: moduleDesc.trim() || undefined,
        }),
      });

      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.error || "Erreur de création");

      toast.success("Nouveau module ajouté au catalogue !");
      setModuleName("");
      setModuleCode("");
      setModuleDesc("");
      setIsAddModuleOpen(false);
      onRefresh();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Erreur");
    } finally {
      setIsSavingModule(false);
    }
  };

  const handleDeleteModule = async (id: string, name: string) => {
    if (!confirm(`Êtes-vous sûr de vouloir supprimer le module « ${name} » et toutes ses permissions associées ?`)) {
      return;
    }

    try {
      const res = await fetch(`/api/v2/permissions/modules?id=${id}`, { method: "DELETE" });
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.error || "Erreur de suppression");

      toast.success("Module supprimé avec succès");
      onRefresh();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Erreur");
    }
  };

  const handleCreatePermission = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedModuleId || !permName.trim()) {
      toast.warning("Veuillez sélectionner un module et un nom.");
      return;
    }

    setIsSavingPerm(true);
    try {
      const res = await fetch("/api/v2/permissions/definitions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          moduleId: selectedModuleId,
          name: permName.trim(),
          code: permCode.trim() || undefined,
          action: permAction,
          description: permDesc.trim() || undefined,
        }),
      });

      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.error || "Erreur de création");

      toast.success("Nouvelle permission ajoutée avec succès !");
      setPermName("");
      setPermCode("");
      setPermDesc("");
      setIsAddPermOpen(false);
      onRefresh();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Erreur");
    } finally {
      setIsSavingPerm(false);
    }
  };

  const handleDeletePermission = async (id: string, name: string) => {
    if (!confirm(`Supprimer la permission « ${name} » ?`)) return;

    try {
      const res = await fetch(`/api/v2/permissions/definitions?id=${id}`, { method: "DELETE" });
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.error || "Erreur de suppression");

      toast.success("Permission supprimée");
      onRefresh();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Erreur");
    }
  };

  const handleClearCatalog = async () => {
    if (!confirm("⚠️ ÊTES-VOUS SÛR de vouloir vider tout le catalogue de permissions ? Vous repartirez d'une page 100% vierge.")) {
      return;
    }

    setIsOperating(true);
    try {
      const res = await fetch("/api/v2/permissions/clear", { method: "POST" });
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.error || "Erreur lors du nettoyage");

      toast.success("Catalogue vidé. Vous avez un catalogue 100% vierge.");
      onRefresh();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Erreur");
    } finally {
      setIsOperating(false);
    }
  };

  const handleSeedCatalog = async () => {
    if (!confirm("Voulez-vous importer le catalogue standard préconfiguré (35 permissions) ?")) {
      return;
    }

    setIsOperating(true);
    try {
      const res = await fetch("/api/v2/permissions/seed", { method: "POST" });
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.error || "Erreur d'importation");

      toast.success("Catalogue standard importé avec succès !");
      onRefresh();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Erreur");
    } finally {
      setIsOperating(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Action Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 p-4 rounded-2xl bg-[var(--neu-surface)] border border-[var(--neu-border)]">
        <div>
          <h3 className="text-sm font-bold text-[var(--neu-text)] flex items-center gap-2">
            <Key size={18} className="text-[#666cff]" />
            Catalogue des Capacités & Permissions
          </h3>
          <p className="text-xs text-[var(--neu-text-secondary)] mt-0.5">
            Gérez vos modules métier de A à Z et définissez les permissions exactes de votre organisation.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {catalog.length > 0 && (
            <NeuButton
              variant="outline"
              size="sm"
              onClick={handleClearCatalog}
              loading={isOperating}
              className="text-[#ff4d49] hover:bg-[#ff4d49]/10 border-[#ff4d49]/30 text-xs"
              title="Supprimer toutes les permissions pour repartir de zéro"
            >
              <Trash2 size={13} />
              Vider le catalogue (0)
            </NeuButton>
          )}

          <NeuButton
            variant="outline"
            size="sm"
            onClick={handleSeedCatalog}
            loading={isOperating}
            className="text-xs"
            title="Importer ou recharger le modèle standard (35 permissions)"
          >
            <Download size={13} />
            Importer modèle standard
          </NeuButton>

          <NeuButton
            variant="outline"
            size="sm"
            onClick={() => setIsAddModuleOpen(true)}
            className="text-xs"
          >
            <FolderPlus size={14} />
            Ajouter un Module
          </NeuButton>

          {catalog.length > 0 && (
            <NeuButton
              variant="default"
              size="sm"
              onClick={() => {
                if (catalog.length > 0) setSelectedModuleId(catalog[0].id || "");
                setIsAddPermOpen(true);
              }}
              className="text-xs"
            >
              <Plus size={14} />
              Ajouter une Permission
            </NeuButton>
          )}
        </div>
      </div>

      {/* Empty State when catalog is empty */}
      {catalog.length === 0 ? (
        <NeuCard className="p-12 text-center space-y-5 border-dashed border-2 border-[var(--neu-border)]">
          <div className="w-16 h-16 rounded-3xl bg-[#666cff]/10 text-[#666cff] flex items-center justify-center mx-auto">
            <Sparkles size={32} />
          </div>
          <div className="max-w-md mx-auto space-y-1.5">
            <h4 className="text-base font-bold text-[var(--neu-text)]">
              Votre catalogue de permissions est 100% vierge
            </h4>
            <p className="text-xs text-[var(--neu-text-secondary)]">
              Vous avez le contrôle total : vous pouvez créer vos propres modules métier sur mesure ou importer le modèle standard en 1 clic.
            </p>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            <NeuButton
              variant="default"
              size="sm"
              onClick={() => setIsAddModuleOpen(true)}
            >
              <FolderPlus size={15} />
              Créer mon premier Module
            </NeuButton>

            <NeuButton
              variant="outline"
              size="sm"
              onClick={handleSeedCatalog}
              loading={isOperating}
            >
              <Download size={15} />
              Importer le modèle standard (35)
            </NeuButton>
          </div>
        </NeuCard>
      ) : (
        /* Catalog List */
        <div className="space-y-4">
          {catalog.map((mod) => (
            <NeuCard key={mod.id || mod.code} className="p-5 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[var(--neu-border)] pb-3">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-xl bg-[#666cff]/10 text-[#666cff]">
                    <Shield size={18} />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="font-bold text-sm text-[var(--neu-text)]">{mod.name}</h4>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[var(--neu-surface-light)] text-[var(--neu-text-secondary)] border border-[var(--neu-border)]">
                        {mod.code}
                      </span>
                    </div>
                    {mod.description && (
                      <p className="text-xs text-[var(--neu-text-secondary)] mt-0.5">{mod.description}</p>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2 self-end sm:self-auto">
                  <NeuBadge variant="info">
                    {(mod.permissions || []).length} permission{(mod.permissions || []).length > 1 ? "s" : ""}
                  </NeuBadge>
                  <NeuButton
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setSelectedModuleId(mod.id || "");
                      setIsAddPermOpen(true);
                    }}
                    className="text-xs h-7 px-2.5"
                  >
                    <Plus size={13} />
                    Ajouter une permission
                  </NeuButton>
                  {mod.id && (
                    <button
                      onClick={() => handleDeleteModule(mod.id!, mod.name)}
                      title="Supprimer ce module"
                      className="p-1.5 text-[var(--neu-text-secondary)] hover:text-[#ff4d49] rounded-lg hover:bg-[var(--neu-surface-hover)] transition-colors"
                    >
                      <Trash2 size={15} />
                    </button>
                  )}
                </div>
              </div>

              {/* Permission badges / table */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {(mod.permissions || []).map((p) => (
                  <div
                    key={p.id || p.code}
                    className="p-3 rounded-xl border border-[var(--neu-border)] bg-[var(--neu-surface-light)]/40 flex items-start justify-between gap-2 text-xs"
                  >
                    <div className="min-w-0">
                      <div className="font-semibold text-[var(--neu-text)] flex items-center gap-1.5">
                        <span>{p.name}</span>
                        <span className="text-[9px] uppercase px-1.5 py-0.2 rounded bg-[#666cff]/15 text-[#666cff] font-bold">
                          {p.action}
                        </span>
                      </div>
                      {p.description && (
                        <div className="text-[11px] text-[var(--neu-text-secondary)] mt-0.5">{p.description}</div>
                      )}
                      <div className="text-[10px] font-mono text-[var(--neu-text-secondary)] opacity-70 mt-1">
                        {p.code}
                      </div>
                    </div>

                    {p.id && (
                      <button
                        onClick={() => handleDeletePermission(p.id!, p.name)}
                        className="text-[var(--neu-text-secondary)] hover:text-[#ff4d49] p-1 shrink-0"
                      >
                        <Trash2 size={13} />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </NeuCard>
          ))}
        </div>
      )}

      {/* Modal 1: Add Module */}
      {isAddModuleOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-[var(--neu-surface)] border border-[var(--neu-border)] rounded-2xl p-6 w-full max-w-md shadow-2xl space-y-4">
            <h3 className="font-bold text-base text-[var(--neu-text)] flex items-center gap-2">
              <FolderPlus size={18} className="text-[#666cff]" />
              Nouveau Module de Permissions
            </h3>

            <form onSubmit={handleCreateModule} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-[var(--neu-text)] mb-1">
                  Nom du Module (ex: Gestion Flotte, Chantiers BTP) <span className="text-[#ff4d49]">*</span>
                </label>
                <NeuInput
                  value={moduleName}
                  onChange={(e) => setModuleName(e.target.value)}
                  placeholder="Ex: Véhicules & Logistique"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[var(--neu-text)] mb-1">
                  Code technique (Optionnel)
                </label>
                <NeuInput
                  value={moduleCode}
                  onChange={(e) => setModuleCode(e.target.value)}
                  placeholder="Ex: fleet_management"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[var(--neu-text)] mb-1">
                  Description
                </label>
                <NeuInput
                  value={moduleDesc}
                  onChange={(e) => setModuleDesc(e.target.value)}
                  placeholder="Description du périmètre métier"
                />
              </div>

              <div className="flex justify-end gap-3 pt-3">
                <NeuButton
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setIsAddModuleOpen(false)}
                >
                  Annuler
                </NeuButton>
                <NeuButton type="submit" variant="default" size="sm" loading={isSavingModule}>
                  Créer le module
                </NeuButton>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal 2: Add Permission */}
      {isAddPermOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-[var(--neu-surface)] border border-[var(--neu-border)] rounded-2xl p-6 w-full max-w-md shadow-2xl space-y-4">
            <h3 className="font-bold text-base text-[var(--neu-text)] flex items-center gap-2">
              <Key size={18} className="text-[#666cff]" />
              Nouvelle Permission Unitaire
            </h3>

            <form onSubmit={handleCreatePermission} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-[var(--neu-text)] mb-1">
                  Rattacher au Module <span className="text-[#ff4d49]">*</span>
                </label>
                <select
                  value={selectedModuleId}
                  onChange={(e) => setSelectedModuleId(e.target.value)}
                  className="w-full text-xs px-3 py-2 rounded-xl bg-[var(--neu-surface-light)] border border-[var(--neu-border)] text-[var(--neu-text)] focus:outline-none"
                  required
                >
                  {catalog.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.name} ({m.code})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[var(--neu-text)] mb-1">
                  Libellé de la permission <span className="text-[#ff4d49]">*</span>
                </label>
                <NeuInput
                  value={permName}
                  onChange={(e) => setPermName(e.target.value)}
                  placeholder="Ex: Valider les bons de carburant"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[var(--neu-text)] mb-1">
                    Code technique
                  </label>
                  <NeuInput
                    value={permCode}
                    onChange={(e) => setPermCode(e.target.value)}
                    placeholder="Ex: fleet.approve_fuel"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[var(--neu-text)] mb-1">
                    Type d'action
                  </label>
                  <select
                    value={permAction}
                    onChange={(e) => setPermAction(e.target.value)}
                    className="w-full text-xs px-3 py-2 rounded-xl bg-[var(--neu-surface-light)] border border-[var(--neu-border)] text-[var(--neu-text)] focus:outline-none"
                  >
                    <option value="read">Consultation (read)</option>
                    <option value="create">Création (create)</option>
                    <option value="update">Modification (update)</option>
                    <option value="approve">Validation (approve)</option>
                    <option value="delete">Suppression (delete)</option>
                    <option value="export">Export (export)</option>
                    <option value="custom">Spécial (custom)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[var(--neu-text)] mb-1">
                  Description explicative
                </label>
                <NeuInput
                  value={permDesc}
                  onChange={(e) => setPermDesc(e.target.value)}
                  placeholder="Détail de l'autorisation"
                />
              </div>

              <div className="flex justify-end gap-3 pt-3">
                <NeuButton
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setIsAddPermOpen(false)}
                >
                  Annuler
                </NeuButton>
                <NeuButton type="submit" variant="default" size="sm" loading={isSavingPerm}>
                  Ajouter la permission
                </NeuButton>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
