"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Building2, Plus } from "lucide-react";
import { NeuButton } from "@/components/ui/neu-button";
import { NeuInput } from "@/components/ui/neu-input";
import { NeuDialog } from "@/components/ui/neu-dialog";
import { TenantStatsCards } from "@/components/super-admin/tenants/TenantStatsCards";
import { TenantFilterBar } from "@/components/super-admin/tenants/TenantFilterBar";
import { TenantTable, Tenant } from "@/components/super-admin/tenants/TenantTable";

export default function SuperAdminTenantsPage() {
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [search, setSearch] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [showCreateModal, setShowCreateModal] = useState<boolean>(false);
  const [showDeleteModal, setShowDeleteModal] = useState<Tenant | null>(null);
  const [deleteConfirmInput, setDeleteConfirmInput] = useState<string>("");
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    name: "",
    taxNumber: "",
    cnpsNumber: "",
    rccm: "",
    address: "",
    city: "Abidjan",
    phone: "",
    email: "",
    adminName: "",
    adminEmail: "",
    adminPassword: "",
  });

  const fetchTenants = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.set("search", search);
      if (statusFilter !== "ALL") params.set("status", statusFilter);

      const res = await fetch(`/api/v2/admin/tenants?${params.toString()}`);
      const json = await res.json();
      if (json.success) {
        setTenants(json.data.tenants || []);
      }
    } catch (err) {
      console.error("Échec de chargement des entreprises:", err);
    } finally {
      setLoading(false);
    }
  }, [search, statusFilter]);

  useEffect(() => {
    fetchTenants();
  }, [fetchTenants]);

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setErrorMessage(null);

    try {
      const res = await fetch("/api/v2/admin/tenants", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const json = await res.json();
      if (json.success) {
        setShowCreateModal(false);
        setFormData({
          name: "",
          taxNumber: "",
          cnpsNumber: "",
          rccm: "",
          address: "",
          city: "Abidjan",
          phone: "",
          email: "",
          adminName: "",
          adminEmail: "",
          adminPassword: "",
        });
        fetchTenants();
      } else {
        setErrorMessage(json.error || "Échec de la création");
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Erreur lors de la création";
      setErrorMessage(msg);
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleStatus = async (tenant: Tenant, newStatus: "ACTIVE" | "INACTIVE" | "SUSPENDED") => {
    try {
      const res = await fetch(`/api/v2/admin/tenants/${tenant.id}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      const json = await res.json();
      if (json.success) {
        fetchTenants();
      } else {
        alert(json.error);
      }
    } catch (err) {
      console.error("Échec du changement de statut:", err);
    }
  };

  const handleDeleteSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!showDeleteModal) return;
    setSubmitting(true);
    setErrorMessage(null);

    try {
      const res = await fetch(`/api/v2/admin/tenants/${showDeleteModal.id}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ confirmationName: deleteConfirmInput }),
      });

      const json = await res.json();
      if (json.success) {
        setShowDeleteModal(null);
        setDeleteConfirmInput("");
        fetchTenants();
      } else {
        setErrorMessage(json.error || "Échec de la suppression");
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Erreur lors de la suppression";
      setErrorMessage(msg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* HEADER PAGE */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold text-[var(--neu-text)] flex items-center gap-2">
            <Building2 className="text-[#666cff]" size={24} />
            Gestion des Entreprises (Tenants SaaS)
          </h1>
          <p className="text-xs text-[var(--neu-text-secondary)] mt-0.5">
            Super Administration des filiales, entités juridiques et comptes du groupe
          </p>
        </div>

        <div className="flex items-center gap-3">
          <NeuButton onClick={() => setShowCreateModal(true)} variant="default" size="md">
            <Plus size={16} />
            Nouvelle Entreprise
          </NeuButton>
        </div>
      </div>

      {/* STATISTIQUES RAPIDES */}
      <TenantStatsCards tenants={tenants} />

      {/* BARRE DE RECHERCHE & FILTRES */}
      <TenantFilterBar
        search={search}
        onSearchChange={setSearch}
        statusFilter={statusFilter}
        onStatusFilterChange={setStatusFilter}
        onRefresh={fetchTenants}
        loading={loading}
      />

      {/* TABLEAU DES ENTREPRISES */}
      <TenantTable
        tenants={tenants}
        loading={loading}
        onToggleStatus={handleToggleStatus}
        onOpenDeleteModal={(tenant) => {
          setShowDeleteModal(tenant);
          setDeleteConfirmInput("");
          setErrorMessage(null);
        }}
      />

      {/* MODAL CRÉATION ENTREPRISE */}
      <NeuDialog
        open={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        title="Créer une Nouvelle Entité Juridique / Tenant"
      >
        <form onSubmit={handleCreateSubmit} className="space-y-4">
          {errorMessage && (
            <div className="p-3 bg-rose-500/10 border border-rose-500/20 text-rose-500 rounded-lg text-xs font-medium">
              {errorMessage}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <NeuInput
              label="Raison Sociale *"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
            />
            <NeuInput
              label="Email Professionnel *"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              required
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <NeuInput
              label="N° Compte Contribuable (CC)"
              value={formData.taxNumber}
              onChange={(e) => setFormData({ ...formData, taxNumber: e.target.value })}
            />
            <NeuInput
              label="N° Employeur CNPS"
              value={formData.cnpsNumber}
              onChange={(e) => setFormData({ ...formData, cnpsNumber: e.target.value })}
            />
            <NeuInput
              label="N° RCCM"
              value={formData.rccm}
              onChange={(e) => setFormData({ ...formData, rccm: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <NeuInput
              label="Nom & Prénoms Admin Principal *"
              value={formData.adminName}
              onChange={(e) => setFormData({ ...formData, adminName: e.target.value })}
              required
            />
            <NeuInput
              label="Email Admin *"
              type="email"
              value={formData.adminEmail}
              onChange={(e) => setFormData({ ...formData, adminEmail: e.target.value })}
              required
            />
          </div>

          <NeuInput
            label="Mot de Passe Admin Initial *"
            type="password"
            value={formData.adminPassword}
            onChange={(e) => setFormData({ ...formData, adminPassword: e.target.value })}
            required
          />

          <div className="flex justify-end gap-3 pt-3 border-t border-[var(--neu-border)]">
            <NeuButton type="button" variant="ghost" onClick={() => setShowCreateModal(false)}>
              Annuler
            </NeuButton>
            <NeuButton type="submit" variant="accent" disabled={submitting}>
              {submitting ? "Création en cours..." : "Créer le Tenant"}
            </NeuButton>
          </div>
        </form>
      </NeuDialog>

      {/* MODAL SUPPRESSION ENTREPRISE */}
      <NeuDialog
        open={Boolean(showDeleteModal)}
        onClose={() => setShowDeleteModal(null)}
        title={`Supprimer ${showDeleteModal?.name}`}
      >
        <form onSubmit={handleDeleteSubmit} className="space-y-4">
          <p className="text-xs text-rose-500 font-medium">
            Attention : Cette action est irréversible. Pour confirmer, tapez le nom de l&apos;entreprise ci-dessous.
          </p>
          <NeuInput
            label={`Tapez "${showDeleteModal?.name}" pour confirmer`}
            value={deleteConfirmInput}
            onChange={(e) => setDeleteConfirmInput(e.target.value)}
            required
          />
          {errorMessage && (
            <div className="p-2 bg-rose-500/10 text-rose-500 text-xs rounded font-medium">
              {errorMessage}
            </div>
          )}
          <div className="flex justify-end gap-3 pt-3 border-t border-[var(--neu-border)]">
            <NeuButton type="button" variant="ghost" onClick={() => setShowDeleteModal(null)}>
              Annuler
            </NeuButton>
            <NeuButton
              type="submit"
              variant="accent"
              disabled={submitting || deleteConfirmInput !== showDeleteModal?.name}
            >
              {submitting ? "Suppression..." : "Confirmer la suppression"}
            </NeuButton>
          </div>
        </form>
      </NeuDialog>
    </div>
  );
}
