"use client";

import React, { useState, useEffect, useMemo } from "react";
import { X, Check, Shield, CheckSquare, Square, Info } from "lucide-react";
import { NeuButton } from "@/components/ui/neu-button";
import { NeuInput } from "@/components/ui/neu-input";
import { NeuBadge } from "@/components/ui/neu-badge";
import { useToast } from "@/components/ui/neu-toast";
import { PermissionModuleEntity } from "@/lib/domain/auth/entities/PermissionCatalog";
import { RoleEntity } from "@/lib/domain/auth/entities/Role";

interface RoleMatrixEditorProps {
  isOpen: boolean;
  onClose: () => void;
  role?: RoleEntity | null;
  catalog: PermissionModuleEntity[];
  onSaved: () => void;
}

export function RoleMatrixEditor({
  isOpen,
  onClose,
  role,
  catalog,
  onSaved,
}: RoleMatrixEditorProps) {
  const toast = useToast();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [selectedPermissions, setSelectedPermissions] = useState<Set<string>>(new Set());
  const [isSaving, setIsSaving] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  const isEditing = Boolean(role?.id);

  // Initialize or reset form when role changes
  useEffect(() => {
    if (role) {
      setName(role.name || "");
      setDescription(role.description || "");
      setSelectedPermissions(new Set(role.permissions || []));
    } else {
      setName("");
      setDescription("");
      setSelectedPermissions(new Set());
    }
  }, [role, isOpen]);

  // All permission codes in the entire catalog
  const allCatalogCodes = useMemo(() => {
    const codes: string[] = [];
    catalog.forEach((mod) => {
      mod.permissions?.forEach((p) => codes.push(p.code));
    });
    return codes;
  }, [catalog]);

  const togglePermission = (code: string) => {
    setSelectedPermissions((prev) => {
      const next = new Set(prev);
      if (next.has(code)) {
        next.delete(code);
      } else {
        next.add(code);
      }
      return next;
    });
  };

  const toggleModulePermissions = (mod: PermissionModuleEntity) => {
    const modCodes = (mod.permissions || []).map((p) => p.code);
    const allChecked = modCodes.every((c) => selectedPermissions.has(c));

    setSelectedPermissions((prev) => {
      const next = new Set(prev);
      if (allChecked) {
        modCodes.forEach((c) => next.delete(c));
      } else {
        modCodes.forEach((c) => next.add(c));
      }
      return next;
    });
  };

  const toggleAllGlobal = () => {
    const allChecked = allCatalogCodes.every((c) => selectedPermissions.has(c));
    if (allChecked) {
      setSelectedPermissions(new Set());
    } else {
      setSelectedPermissions(new Set(allCatalogCodes));
    }
  };

  // Filter modules/permissions according to search term
  const filteredCatalog = useMemo(() => {
    if (!searchTerm.trim()) return catalog;
    const term = searchTerm.toLowerCase().trim();

    return catalog
      .map((mod) => {
        const matchModName = mod.name.toLowerCase().includes(term);
        const filteredPerms = (mod.permissions || []).filter(
          (p) =>
            p.name.toLowerCase().includes(term) ||
            p.code.toLowerCase().includes(term) ||
            (p.description && p.description.toLowerCase().includes(term))
        );

        if (matchModName) return mod;
        if (filteredPerms.length > 0) {
          return { ...mod, permissions: filteredPerms };
        }
        return null;
      })
      .filter((mod): mod is PermissionModuleEntity => mod !== null);
  }, [catalog, searchTerm]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.warning("Le nom du rôle est obligatoire.");
      return;
    }

    setIsSaving(true);
    try {
      const payload = {
        name: name.trim(),
        description: description.trim() || undefined,
        permissions: Array.from(selectedPermissions),
      };

      const url = isEditing ? `/api/v2/roles/${role!.id}` : "/api/v2/roles";
      const method = isEditing ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || "Erreur lors de l'enregistrement du rôle");
      }

      toast.success(isEditing ? "Rôle mis à jour avec succès !" : "Nouveau rôle créé avec succès !");

      onSaved();
      onClose();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Erreur de sauvegarde");
    } finally {
      setIsSaving(false);
    }
  };

  if (!isOpen) return null;

  const totalCount = allCatalogCodes.length;
  const selectedCount = selectedPermissions.size;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-[var(--neu-surface)] border border-[var(--neu-border)] rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="p-6 border-b border-[var(--neu-border)] flex items-center justify-between bg-[var(--neu-surface)]">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-[#666cff]/15 text-[#666cff]">
              <Shield size={22} />
            </div>
            <div>
              <h2 className="text-lg font-bold text-[var(--neu-text)]">
                {isEditing ? `Modifier le rôle : ${role?.name}` : "Créer un nouveau rôle personnalisé"}
              </h2>
              <p className="text-xs text-[var(--neu-text-secondary)] mt-0.5">
                Définissez le nom et cochez les permissions autorisées pour ce profil.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-[var(--neu-text-secondary)] hover:text-[var(--neu-text)] rounded-lg hover:bg-[var(--neu-surface-hover)] transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Role metadata */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-[var(--neu-text)] mb-1">
                Nom du rôle <span className="text-[#ff4d49]">*</span>
              </label>
              <NeuInput
                placeholder="Ex: Gestionnaire Paie Junior, Superviseur Chantier"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-[var(--neu-text)] mb-1">
                Description / Rôle métier
              </label>
              <NeuInput
                placeholder="Ex: Traitement des fiches de paie et congés sans suppression"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>
          </div>

          {/* Matrix Header & Tools */}
          <div className="pt-2 border-t border-[var(--neu-border)]">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold uppercase tracking-wider text-[var(--neu-text)]">
                  Matrice des Permissions
                </span>
                <NeuBadge variant={selectedCount > 0 ? "info" : "default"}>
                  {selectedCount} / {totalCount} sélectionnée{selectedCount > 1 ? "s" : ""}
                </NeuBadge>
              </div>

              <div className="flex items-center gap-3">
                <input
                  type="text"
                  placeholder="Rechercher une permission..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="text-xs px-3 py-1.5 rounded-lg bg-[var(--neu-surface-light)] border border-[var(--neu-border)] text-[var(--neu-text)] focus:outline-none focus:border-[#666cff]"
                />
                <NeuButton
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={toggleAllGlobal}
                >
                  {selectedCount === totalCount ? "Tout décocher" : "Tout cocher"}
                </NeuButton>
              </div>
            </div>

            {/* Modules & Permission Grid */}
            <div className="space-y-4">
              {filteredCatalog.length === 0 ? (
                <div className="text-center py-8 text-xs text-[var(--neu-text-secondary)]">
                  Aucun module ou permission ne correspond à votre recherche.
                </div>
              ) : (
                filteredCatalog.map((mod) => {
                  const modCodes = (mod.permissions || []).map((p) => p.code);
                  const isAllModChecked = modCodes.length > 0 && modCodes.every((c) => selectedPermissions.has(c));
                  const isSomeModChecked = modCodes.some((c) => selectedPermissions.has(c)) && !isAllModChecked;

                  return (
                    <div
                      key={mod.id || mod.code}
                      className="border border-[var(--neu-border)] rounded-xl bg-[var(--neu-surface-light)]/40 p-4 transition-all"
                    >
                      {/* Module Header */}
                      <div className="flex items-center justify-between pb-3 mb-3 border-b border-[var(--neu-border)]">
                        <div className="flex items-center gap-2.5">
                          <button
                            type="button"
                            onClick={() => toggleModulePermissions(mod)}
                            className="text-[#666cff] hover:opacity-80 transition-opacity"
                          >
                            {isAllModChecked ? (
                              <CheckSquare size={18} />
                            ) : isSomeModChecked ? (
                              <div className="w-[18px] h-[18px] rounded border-2 border-[#666cff] bg-[#666cff]/20 flex items-center justify-center">
                                <div className="w-2 h-2 bg-[#666cff] rounded-sm" />
                              </div>
                            ) : (
                              <Square size={18} className="text-[var(--neu-text-secondary)]" />
                            )}
                          </button>
                          <div>
                            <span className="font-bold text-sm text-[var(--neu-text)]">
                              {mod.name}
                            </span>
                            {mod.description && (
                              <span className="text-xs text-[var(--neu-text-secondary)] ml-2 hidden sm:inline">
                                — {mod.description}
                              </span>
                            )}
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() => toggleModulePermissions(mod)}
                          className="text-[11px] text-[#666cff] font-medium hover:underline"
                        >
                          {isAllModChecked ? "Décocher le module" : "Tout cocher"}
                        </button>
                      </div>

                      {/* Permissions Checkboxes */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
                        {(mod.permissions || []).map((perm) => {
                          const isChecked = selectedPermissions.has(perm.code);
                          return (
                            <label
                              key={perm.code}
                              onClick={() => togglePermission(perm.code)}
                              className={`flex items-start gap-2.5 p-2.5 rounded-lg border text-xs cursor-pointer transition-all ${
                                isChecked
                                  ? "border-[#666cff]/50 bg-[#666cff]/10 text-[var(--neu-text)]"
                                  : "border-[var(--neu-border)] bg-[var(--neu-surface)] hover:bg-[var(--neu-surface-hover)] text-[var(--neu-text-secondary)]"
                              }`}
                            >
                              <div className="mt-0.5 shrink-0">
                                {isChecked ? (
                                  <div className="w-4 h-4 rounded bg-[#666cff] text-white flex items-center justify-center">
                                    <Check size={12} strokeWidth={3} />
                                  </div>
                                ) : (
                                  <div className="w-4 h-4 rounded border border-[var(--neu-border)] bg-[var(--neu-surface)]" />
                                )}
                              </div>
                              <div className="min-w-0 flex-1">
                                <div className="font-semibold leading-tight text-[var(--neu-text)]">
                                  {perm.name}
                                </div>
                                {perm.description && (
                                  <div className="text-[10px] text-[var(--neu-text-secondary)] mt-0.5 line-clamp-1">
                                    {perm.description}
                                  </div>
                                )}
                                <div className="text-[9px] font-mono text-[var(--neu-text-secondary)] opacity-70 mt-0.5">
                                  {perm.code}
                                </div>
                              </div>
                            </label>
                          );
                        })}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </form>

        {/* Footer */}
        <div className="p-4 border-t border-[var(--neu-border)] flex items-center justify-between bg-[var(--neu-surface)] shrink-0">
          <div className="text-xs text-[var(--neu-text-secondary)] flex items-center gap-1.5">
            <Info size={14} className="text-[#666cff]" />
            <span>Les modifications s'appliqueront instantanément aux salariés rattachés.</span>
          </div>

          <div className="flex items-center gap-3">
            <NeuButton type="button" variant="outline" size="sm" onClick={onClose} disabled={isSaving}>
              Annuler
            </NeuButton>
            <NeuButton
              type="button"
              variant="default"
              size="sm"
              onClick={handleSubmit}
              loading={isSaving}
            >
              {isEditing ? "Mettre à jour le rôle" : "Enregistrer le rôle"}
            </NeuButton>
          </div>
        </div>
      </div>
    </div>
  );
}
