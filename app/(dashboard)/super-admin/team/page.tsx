"use client";

import React, { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Users,
  ShieldCheck,
  UserPlus,
  RefreshCw,
  KeyRound,
  Trash2,
} from "lucide-react";
import { NeuCard } from "@/components/ui/neu-card";
import { NeuButton } from "@/components/ui/neu-button";
import { NeuBadge } from "@/components/ui/neu-badge";
import { NeuInput } from "@/components/ui/neu-input";
import { NeuDialog } from "@/components/ui/neu-dialog";
import type { SuperAdminMemberDTO } from "@/lib/application/admin/dto/SuperAdminTeamDTO";

export default function SuperAdminTeamPage() {
  const queryClient = useQueryClient();
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Invite form states
  const [inviteName, setInviteName] = useState("");
  const [inviteEmail, setInviteEmail] = useState("");
  const [invitePassword, setInvitePassword] = useState("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Password edit state
  const [editingPasswordMember, setEditingPasswordMember] = useState<SuperAdminMemberDTO | null>(null);
  const [newPassword, setNewPassword] = useState("");

  const { data: membersData, isLoading, isFetching, refetch } = useQuery<SuperAdminMemberDTO[]>({
    queryKey: ["super-admin-team"],
    queryFn: async () => {
      const res = await fetch("/api/v2/admin/team");
      const json = await res.json();
      if (json.success) {
        return (json.data || []) as SuperAdminMemberDTO[];
      }
      throw new Error(json.error || "Erreur chargement équipe");
    },
  });

  const members = membersData || [];

  const handleInviteSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setErrorMessage(null);
    try {
      const res = await fetch("/api/v2/admin/team", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: inviteName,
          email: inviteEmail,
          password: invitePassword,
        }),
      });
      const json = await res.json();
      if (json.success) {
        setShowInviteModal(false);
        setInviteName("");
        setInviteEmail("");
        setInvitePassword("");
        queryClient.invalidateQueries({ queryKey: ["super-admin-team"] });
      } else {
        setErrorMessage(json.error || "Échec de l'invitation");
      }
    } catch {
      setErrorMessage("Erreur de connexion");
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleActive = async (m: SuperAdminMemberDTO) => {
    try {
      const res = await fetch(`/api/v2/admin/team/${m.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !m.isActive }),
      });
      const json = await res.json();
      if (json.success) {
        queryClient.invalidateQueries({ queryKey: ["super-admin-team"] });
      } else {
        alert(json.error || "Impossible de modifier le statut");
      }
    } catch {
      alert("Erreur lors de la modification");
    }
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPasswordMember) return;
    setSubmitting(true);
    try {
      const res = await fetch(`/api/v2/admin/team/${editingPasswordMember.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: newPassword }),
      });
      const json = await res.json();
      if (json.success) {
        setEditingPasswordMember(null);
        setNewPassword("");
        alert("Mot de passe mis à jour avec succès !");
      } else {
        alert(json.error || "Échec de mise à jour");
      }
    } catch {
      alert("Erreur réseau");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteMember = async (m: SuperAdminMemberDTO) => {
    if (!confirm(`Êtes-vous sûr de vouloir révoquer l'accès Super Admin de ${m.name} (${m.email}) ?`)) {
      return;
    }
    try {
      const res = await fetch(`/api/v2/admin/team/${m.id}`, { method: "DELETE" });
      const json = await res.json();
      if (json.success) {
        queryClient.invalidateQueries({ queryKey: ["super-admin-team"] });
      } else {
        alert(json.error || "Impossible de supprimer ce membre");
      }
    } catch {
      alert("Erreur réseau");
    }
  };

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* ── EN-TÊTE ────────────────────────────────────────────────────────── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold text-[var(--neu-text)] flex items-center gap-3">
            <span className="p-2 rounded-xl bg-[#666cff]/15 text-[#666cff]">
              <Users size={22} />
            </span>
            Équipe Super Admin & Accès Plateforme SaaS
          </h1>
          <p className="text-xs text-[var(--neu-text-secondary)] mt-0.5">
            Gestion des administrateurs ayant un accès global à l&apos;ensemble du système
          </p>
        </div>

        <div className="flex items-center gap-3">
          <NeuButton variant="ghost" size="sm" onClick={() => refetch()} loading={isFetching}>
            <RefreshCw size={14} /> Actualiser
          </NeuButton>
          <NeuButton
            variant="default"
            size="sm"
            onClick={() => setShowInviteModal(true)}
            className="bg-gradient-to-r from-[#666cff] to-[#26c6f9] text-white"
          >
            <UserPlus size={14} /> + Ajouter un Super Admin
          </NeuButton>
        </div>
      </div>

      {/* ── LISTE DES MEMBRES ──────────────────────────────────────────────── */}
      <NeuCard className="p-6 space-y-4">
        <h2 className="text-sm font-bold text-[var(--neu-text)] flex items-center gap-2">
          <ShieldCheck size={18} className="text-[#666cff]" />
          Administrateurs Globaux Actifs ({members.length})
        </h2>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-[var(--neu-border)] text-[var(--neu-text-secondary)]">
                <th className="py-3 px-4">Nom & Email</th>
                <th className="py-3 px-4">Rôle</th>
                <th className="py-3 px-4">Statut</th>
                <th className="py-3 px-4">Créé le</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--neu-border)]">
              {isLoading ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-xs text-[var(--neu-text-secondary)]">
                    Chargement des membres de l&apos;équipe...
                  </td>
                </tr>
              ) : members.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-xs text-[var(--neu-text-secondary)]">
                    Aucun administrateur trouvé.
                  </td>
                </tr>
              ) : (
                members.map((m) => (
                <tr key={m.id} className="hover:bg-[var(--neu-surface-light)]/50 transition-colors">
                  <td className="py-3 px-4">
                    <div className="font-bold text-[var(--neu-text)]">{m.name}</div>
                    <div className="text-[11px] text-[var(--neu-text-secondary)] font-mono mt-0.5">{m.email}</div>
                  </td>
                  <td className="py-3 px-4">
                    <NeuBadge variant="warning">👑 SUPER ADMIN</NeuBadge>
                  </td>
                  <td className="py-3 px-4">
                    <button
                      onClick={() => handleToggleActive(m)}
                      className="cursor-pointer inline-flex items-center gap-1.5 focus:outline-none"
                    >
                      <NeuBadge variant={m.isActive ? "success" : "error"}>
                        {m.isActive ? "Actif" : "Désactivé"}
                      </NeuBadge>
                    </button>
                  </td>
                  <td className="py-3 px-4 text-[var(--neu-text-secondary)]">
                    {new Date(m.createdAt).toLocaleDateString("fr-FR")}
                  </td>
                  <td className="py-3 px-4 text-right space-x-2">
                    <NeuButton
                      size="sm"
                      variant="ghost"
                      onClick={() => {
                        setEditingPasswordMember(m);
                        setNewPassword("");
                      }}
                      title="Changer le mot de passe"
                    >
                      <KeyRound size={13} /> Mot de passe
                    </NeuButton>
                    <NeuButton
                      size="sm"
                      variant="ghost"
                      onClick={() => handleDeleteMember(m)}
                      title="Révoquer l'accès"
                      className="text-rose-500 hover:text-rose-600"
                    >
                      <Trash2 size={13} />
                    </NeuButton>
                  </td>
                </tr>
              )))}
            </tbody>
          </table>
        </div>
      </NeuCard>

      {/* ── MODAL INVITER SUPER ADMIN ──────────────────────────────────────── */}
      {showInviteModal && (
        <NeuDialog
          open={showInviteModal}
          onClose={() => setShowInviteModal(false)}
          title="Ajouter un Collaborateur Super Admin"
        >
          <form onSubmit={handleInviteSubmit} className="space-y-4">
            {errorMessage && (
              <div className="p-3 bg-rose-500/10 border border-rose-500/20 text-rose-500 rounded-lg text-xs font-medium">
                {errorMessage}
              </div>
            )}

            <div>
              <label className="text-xs font-semibold text-[var(--neu-text)] mb-1 block">Nom complet *</label>
              <NeuInput
                value={inviteName}
                onChange={(e) => setInviteName(e.target.value)}
                placeholder="Ex: Marc GOUROU"
                required
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-[var(--neu-text)] mb-1 block">Adresse Email *</label>
              <NeuInput
                type="email"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                placeholder="marc@progitpaie.online"
                required
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-[var(--neu-text)] mb-1 block">Mot de passe temporaire *</label>
              <NeuInput
                type="password"
                value={invitePassword}
                onChange={(e) => setInvitePassword(e.target.value)}
                placeholder="Minimum 12 caractères"
                required
              />
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-[var(--neu-border)]">
              <NeuButton variant="ghost" type="button" onClick={() => setShowInviteModal(false)}>
                Annuler
              </NeuButton>
              <NeuButton variant="default" type="submit" loading={submitting}>
                Créer le compte Super Admin
              </NeuButton>
            </div>
          </form>
        </NeuDialog>
      )}

      {/* ── MODAL CHANGER MOT DE PASSE ─────────────────────────────────────── */}
      {editingPasswordMember && (
        <NeuDialog
          open={Boolean(editingPasswordMember)}
          onClose={() => setEditingPasswordMember(null)}
          title={`Changer le mot de passe — ${editingPasswordMember.name}`}
        >
          <form onSubmit={handlePasswordSubmit} className="space-y-4">
            <div>
              <label className="text-xs font-semibold text-[var(--neu-text)] mb-1 block">Nouveau mot de passe *</label>
              <NeuInput
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Minimum 12 caractères"
                required
              />
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-[var(--neu-border)]">
              <NeuButton variant="ghost" type="button" onClick={() => setEditingPasswordMember(null)}>
                Annuler
              </NeuButton>
              <NeuButton variant="default" type="submit" loading={submitting}>
                Enregistrer le mot de passe
              </NeuButton>
            </div>
          </form>
        </NeuDialog>
      )}
    </div>
  );
}
