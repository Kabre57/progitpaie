"use client";

import React from "react";
import { Users, Shield, Edit3, Trash2, Key, AlertCircle } from "lucide-react";
import { NeuCard } from "@/components/ui/neu-card";
import { NeuButton } from "@/components/ui/neu-button";
import { NeuBadge } from "@/components/ui/neu-badge";
import { RoleEntity } from "@/lib/domain/auth/entities/Role";

interface RoleListProps {
  roles: RoleEntity[];
  onEdit: (role: RoleEntity) => void;
  onDelete: (role: RoleEntity) => void;
  onCreateNew: () => void;
}

export function RoleList({ roles, onEdit, onDelete, onCreateNew }: RoleListProps) {
  if (roles.length === 0) {
    return (
      <NeuCard className="p-12 text-center flex flex-col items-center justify-center space-y-4">
        <div className="p-4 rounded-2xl bg-[#666cff]/10 text-[#666cff]">
          <Shield size={36} />
        </div>
        <div className="max-w-md">
          <h3 className="text-base font-bold text-[var(--neu-text)]">Aucun rôle personnalisé</h3>
          <p className="text-xs text-[var(--neu-text-secondary)] mt-1">
            Vous n'avez pas encore créé de rôle avec matrice de permissions graduelles.
            Créez des rôles pour vos gestionnaires, comptables ou superviseurs.
          </p>
        </div>
        <NeuButton variant="default" size="sm" onClick={onCreateNew}>
          Créer un premier rôle
        </NeuButton>
      </NeuCard>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {roles.map((role) => {
        const permCount = role.permissions?.length || 0;
        const userCount = role.userCount || 0;

        return (
          <NeuCard
            key={role.id}
            className="p-5 flex flex-col justify-between space-y-4 hover:border-[#666cff]/50 transition-all group"
          >
            <div className="space-y-3">
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-xl bg-[#666cff]/10 text-[#666cff] group-hover:bg-[#666cff] group-hover:text-white transition-colors">
                    <Shield size={18} />
                  </div>
                  <div>
                    <h4 className="font-bold text-sm text-[var(--neu-text)]">{role.name}</h4>
                    {role.isSystem && (
                      <NeuBadge variant="warning" className="text-[10px] mt-0.5">
                        Système
                      </NeuBadge>
                    )}
                  </div>
                </div>

                <NeuBadge variant={permCount > 0 ? "info" : "default"} className="text-xs">
                  {permCount} permission{permCount > 1 ? "s" : ""}
                </NeuBadge>
              </div>

              {role.description ? (
                <p className="text-xs text-[var(--neu-text-secondary)] line-clamp-2">
                  {role.description}
                </p>
              ) : (
                <p className="text-xs italic text-[var(--neu-text-secondary)] opacity-60">
                  Aucune description
                </p>
              )}
            </div>

            <div className="pt-3 border-t border-[var(--neu-border)] flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-xs text-[var(--neu-text-secondary)]">
                <Users size={14} className="text-[#666cff]" />
                <span>
                  {userCount} utilisateur{userCount > 1 ? "s" : ""}
                </span>
              </div>

              <div className="flex items-center gap-1.5">
                <NeuButton
                  variant="outline"
                  size="sm"
                  onClick={() => onEdit(role)}
                  className="text-xs py-1 px-2.5"
                >
                  <Edit3 size={13} />
                  Matrice
                </NeuButton>

                {!role.isSystem && (
                  <button
                    onClick={() => onDelete(role)}
                    title="Supprimer ce rôle"
                    className="p-1.5 text-[var(--neu-text-secondary)] hover:text-[#ff4d49] rounded-lg hover:bg-[var(--neu-surface-hover)] transition-colors"
                  >
                    <Trash2 size={15} />
                  </button>
                )}
              </div>
            </div>
          </NeuCard>
        );
      })}
    </div>
  );
}
