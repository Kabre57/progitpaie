"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  Building2,
  Plus,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  ShieldCheck,
  Search,
  Filter,
  Eye,
  Trash2,
  Lock,
  Unlock,
} from "lucide-react";
import { NeuCard } from "@/components/ui/neu-card";
import { NeuButton } from "@/components/ui/neu-button";
import { NeuBadge } from "@/components/ui/neu-badge";
import { NeuInput } from "@/components/ui/neu-input";

interface Tenant {
  id: string;
  name: string;
  taxNumber?: string;
  cnpsNumber?: string;
  rccm?: string;
  address?: string;
  city?: string;
  phone?: string;
  email?: string;
  isMain: boolean;
  status: "ACTIVE" | "INACTIVE" | "SUSPENDED";
  createdAt: string;
  employeeCount?: number;
  payrollCount?: number;
}

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

  const fetchTenants = async () => {
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
  };

  useEffect(() => {
    fetchTenants();
  }, [search, statusFilter]);

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
    } catch (err: any) {
      setErrorMessage(err.message || "Erreur lors de la création");
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
    } catch (err: any) {
      setErrorMessage(err.message || "Erreur lors de la suppression");
    } finally {
      setSubmitting(false);
    }
  };

  const activeCount = tenants.filter((t) => t.status === "ACTIVE").length;
  const inactiveCount = tenants.filter((t) => t.status === "INACTIVE" || t.status === "SUSPENDED").length;
  const mainTenant = tenants.find((t) => t.isMain);

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
          <NeuButton
            onClick={() => setShowCreateModal(true)}
            variant="default"
            size="md"
          >
            <Plus size={16} />
            Nouvelle Entreprise
          </NeuButton>
        </div>
      </div>

      {/* STATISTIQUES RAPIDES */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <NeuCard className="p-4 flex items-center gap-4">
          <div className="p-3 bg-[#666cff]/15 text-[#666cff] rounded-xl">
            <Building2 size={22} />
          </div>
          <div>
            <div className="text-xs text-[var(--neu-text-secondary)]">Total Entreprises</div>
            <div className="text-xl font-bold text-[var(--neu-text)]">{tenants.length}</div>
          </div>
        </NeuCard>

        <NeuCard className="p-4 flex items-center gap-4">
          <div className="p-3 bg-[#72e128]/15 text-[#72e128] rounded-xl">
            <CheckCircle2 size={22} />
          </div>
          <div>
            <div className="text-xs text-[var(--neu-text-secondary)]">Actives</div>
            <div className="text-xl font-bold text-[#72e128]">{activeCount}</div>
          </div>
        </NeuCard>

        <NeuCard className="p-4 flex items-center gap-4">
          <div className="p-3 bg-[#ff4d49]/15 text-[#ff4d49] rounded-xl">
            <AlertCircle size={22} />
          </div>
          <div>
            <div className="text-xs text-[var(--neu-text-secondary)]">Inactives / Suspendues</div>
            <div className="text-xl font-bold text-[#ff4d49]">{inactiveCount}</div>
          </div>
        </NeuCard>

        <NeuCard className="p-4 flex items-center gap-4">
          <div className="p-3 bg-[#fdb528]/15 text-[#fdb528] rounded-xl">
            <ShieldCheck size={22} />
          </div>
          <div>
            <div className="text-xs text-[var(--neu-text-secondary)]">Siège Principal</div>
            <div className="text-sm font-bold text-[var(--neu-text)] truncate max-w-[140px]">
              {mainTenant?.name || "Aucun"}
            </div>
          </div>
        </NeuCard>
      </div>

      {/* BARRE DE RECHERCHE & FILTRES AVANCÉS */}
      <NeuCard className="p-4">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="relative w-full md:w-96">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--neu-text-muted)]" size={18} />
            <NeuInput
              type="text"
              placeholder="Rechercher par nom, CC, N° CNPS..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10 w-full"
            />
          </div>

          <div className="flex items-center gap-3 w-full md:w-auto">
            <div className="flex items-center gap-2">
              <Filter size={16} className="text-[var(--neu-text-muted)]" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="bg-[var(--neu-surface)] border border-[var(--neu-border)] text-xs rounded-lg px-3 py-2 text-[var(--neu-text)] focus:outline-none"
              >
                <option value="ALL">Tous les statuts</option>
                <option value="ACTIVE">Actives uniquement</option>
                <option value="INACTIVE">Inactives / Suspendues</option>
              </select>
            </div>

            <NeuButton
              variant="ghost"
              size="icon"
              onClick={fetchTenants}
              title="Actualiser"
            >
              <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
            </NeuButton>
          </div>
        </div>
      </NeuCard>

      {/* TABLEAU DES ENTREPRISES */}
      <NeuCard className="p-6">
        {loading ? (
          <div className="text-center py-12 text-[var(--neu-text-secondary)]">Chargement des entités juridiques...</div>
        ) : tenants.length === 0 ? (
          <div className="text-center py-12 text-[var(--neu-text-secondary)]">Aucune entreprise trouvée.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[var(--neu-surface-light)] text-[var(--neu-text-secondary)] border-b border-[var(--neu-border)]">
                <tr>
                  <th className="p-3 font-semibold">Raison Sociale</th>
                  <th className="p-3 font-semibold">Compte Contribuable (DGI)</th>
                  <th className="p-3 font-semibold">N° CNPS</th>
                  <th className="p-3 font-semibold">Ville</th>
                  <th className="p-3 font-semibold">Rôle / Type</th>
                  <th className="p-3 font-semibold">Statut</th>
                  <th className="p-3 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--neu-border)]">
                {tenants.map((t) => (
                  <tr key={t.id} className="hover:bg-[var(--neu-surface-light)] transition">
                    <td className="p-3 font-medium text-[var(--neu-text)] flex items-center gap-2">
                      <Building2 size={16} className="text-[#666cff]" />
                      <div>
                        <div className="font-semibold text-sm">{t.name}</div>
                        <div className="text-[10px] text-[var(--neu-text-secondary)] font-mono">ID: {t.id}</div>
                      </div>
                    </td>
                    <td className="p-3 text-[var(--neu-text-secondary)] font-mono">{t.taxNumber || "-"}</td>
                    <td className="p-3 text-[var(--neu-text-secondary)] font-mono">{t.cnpsNumber || "-"}</td>
                    <td className="p-3 text-[var(--neu-text-secondary)]">{t.city || "Abidjan"}</td>
                    <td className="p-3">
                      {t.isMain ? (
                        <NeuBadge variant="warning">★ Siège</NeuBadge>
                      ) : (
                        <NeuBadge variant="accent">Filiale</NeuBadge>
                      )}
                    </td>
                    <td className="p-3">
                      <NeuBadge variant={t.status === "ACTIVE" ? "success" : "danger"}>
                        {t.status === "ACTIVE" ? "Actif" : "Inactif"}
                      </NeuBadge>
                    </td>
                    <td className="p-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Link
                          href={`/super-admin/tenants/${t.id}`}
                          className="p-1.5 text-[var(--neu-text-secondary)] hover:text-[#666cff] hover:bg-[#666cff]/10 rounded-lg transition"
                          title="Fiche Détail"
                        >
                          <Eye size={16} />
                        </Link>

                        {!t.isMain && (
                          <>
                            {t.status === "ACTIVE" ? (
                              <button
                                onClick={() => handleToggleStatus(t, "SUSPENDED")}
                                className="p-1.5 text-[#fdb528] hover:bg-[#fdb528]/10 rounded-lg transition"
                                title="Suspendre l'entreprise"
                              >
                                <Lock size={16} />
                              </button>
                            ) : (
                              <button
                                onClick={() => handleToggleStatus(t, "ACTIVE")}
                                className="p-1.5 text-[#72e128] hover:bg-[#72e128]/10 rounded-lg transition"
                                title="Activer l'entreprise"
                              >
                                <Unlock size={16} />
                              </button>
                            )}

                            <button
                              onClick={() => setShowDeleteModal(t)}
                              className="p-1.5 text-[#ff4d49] hover:bg-[#ff4d49]/10 rounded-lg transition"
                              title="Supprimer l'entreprise"
                            >
                              <Trash2 size={16} />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </NeuCard>

      {/* MODAL CREATION ENTREPRISE */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <NeuCard className="w-full max-w-xl p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            <h2 className="text-lg font-bold text-[var(--neu-text)] flex items-center gap-2">
              <Building2 className="text-[#666cff]" size={20} />
              Créer une Nouvelle Entreprise (Tenant)
            </h2>

            {errorMessage && (
              <div className="p-3 bg-[#ff4d49]/10 border border-[#ff4d49]/20 text-[#ff4d49] text-xs rounded-xl">
                {errorMessage}
              </div>
            )}

            <form onSubmit={handleCreateSubmit} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <NeuInput
                  label="Raison Sociale *"
                  type="text"
                  required
                  placeholder="ex: IVOIRE LOGISTIQUE SA"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
                <NeuInput
                  label="Compte Contribuable (DGI)"
                  type="text"
                  placeholder="ex: 1234567 A"
                  value={formData.taxNumber}
                  onChange={(e) => setFormData({ ...formData, taxNumber: e.target.value })}
                />
                <NeuInput
                  label="N° Affiliation CNPS"
                  type="text"
                  placeholder="ex: 987654"
                  value={formData.cnpsNumber}
                  onChange={(e) => setFormData({ ...formData, cnpsNumber: e.target.value })}
                />
                <NeuInput
                  label="Registre du Commerce (RCCM)"
                  type="text"
                  placeholder="ex: CI-ABJ-2024-B-1234"
                  value={formData.rccm}
                  onChange={(e) => setFormData({ ...formData, rccm: e.target.value })}
                />
                <NeuInput
                  label="Ville"
                  type="text"
                  value={formData.city}
                  onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                />
                <NeuInput
                  label="Téléphone"
                  type="text"
                  placeholder="+225 0707070707"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                />
              </div>

              <div className="pt-2 border-t border-[var(--neu-border)]">
                <h3 className="font-bold text-[var(--neu-text)] text-xs mb-2 uppercase tracking-wider">
                  Administrateur Initial du Compte
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <NeuInput
                    label="Nom complet Admin *"
                    type="text"
                    required
                    placeholder="Nom complet"
                    value={formData.adminName}
                    onChange={(e) => setFormData({ ...formData, adminName: e.target.value })}
                  />
                  <NeuInput
                    label="Email Admin *"
                    type="email"
                    required
                    placeholder="admin@entreprise.ci"
                    value={formData.adminEmail}
                    onChange={(e) => setFormData({ ...formData, adminEmail: e.target.value })}
                  />
                  <div className="md:col-span-2">
                    <NeuInput
                      label="Mot de passe initial *"
                      type="password"
                      required
                      placeholder="Mot de passe temporaire"
                      value={formData.adminPassword}
                      onChange={(e) => setFormData({ ...formData, adminPassword: e.target.value })}
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3">
                <NeuButton
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowCreateModal(false)}
                >
                  Annuler
                </NeuButton>
                <NeuButton
                  type="submit"
                  variant="default"
                  size="sm"
                  loading={submitting}
                >
                  Créer l'Entreprise
                </NeuButton>
              </div>
            </form>
          </NeuCard>
        </div>
      )}

      {/* MODAL SUPPRESSION SECURISÉE */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <NeuCard className="w-full max-w-md p-6 space-y-4">
            <h2 className="text-base font-bold text-[#ff4d49] flex items-center gap-2">
              <Trash2 size={20} />
              Confirmation de Suppression Entreprise
            </h2>
            <p className="text-xs text-[var(--neu-text-secondary)] leading-relaxed">
              Attention : Cette action est irréversible. Pour supprimer définitivement l'entreprise{" "}
              <strong className="text-[var(--neu-text)] font-semibold">{showDeleteModal.name}</strong>, veuillez
              saisir son nom exact ci-dessous :
            </p>

            {errorMessage && (
              <div className="p-2.5 bg-[#ff4d49]/10 text-[#ff4d49] text-xs rounded-xl">
                {errorMessage}
              </div>
            )}

            <form onSubmit={handleDeleteSubmit} className="space-y-4">
              <NeuInput
                type="text"
                placeholder={showDeleteModal.name}
                value={deleteConfirmInput}
                onChange={(e) => setDeleteConfirmInput(e.target.value)}
                className="w-full text-xs"
              />

              <div className="flex justify-end gap-2">
                <NeuButton
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowDeleteModal(null)}
                >
                  Annuler
                </NeuButton>
                <NeuButton
                  type="submit"
                  variant="danger"
                  size="sm"
                  loading={submitting}
                  disabled={deleteConfirmInput !== showDeleteModal.name}
                >
                  Confirmer la suppression
                </NeuButton>
              </div>
            </form>
          </NeuCard>
        </div>
      )}
    </div>
  );
}
