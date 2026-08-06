"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  Building2,
  Plus,
  Edit2,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  ShieldCheck,
  Search,
  Download,
  Filter,
  Eye,
  Trash2,
  Lock,
  Unlock,
  AlertTriangle,
  UserCheck,
} from "lucide-react";
import { NeuCard } from "@/components/ui/neu-card";
import { NeuButton } from "@/components/ui/neu-button";
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
        setErrorMessage(json.error || "Erreur de création");
      }
    } catch (err: any) {
      setErrorMessage(err.message || "Erreur de connexion");
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
          <h1 className="text-2xl font-bold text-[var(--neu-text)] flex items-center gap-2">
            <Building2 className="text-emerald-500" size={28} />
            Gestion des Entreprises (Tenants SaaS)
          </h1>
          <p className="text-sm text-[var(--neu-text-subtle)] mt-1">
            Super Administration des filiales, entités juridiques et comptes du groupe
          </p>
        </div>

        <div className="flex items-center gap-3">
          <NeuButton
            onClick={() => setShowCreateModal(true)}
            className="bg-emerald-600 hover:bg-emerald-700 text-white flex items-center gap-2 px-4 py-2"
          >
            <Plus size={18} />
            Nouvelle Entreprise
          </NeuButton>
        </div>
      </div>

      {/* STATISTIQUES RAPIDES */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <NeuCard className="p-4 flex items-center gap-4">
          <div className="p-3 bg-emerald-500/10 text-emerald-500 rounded-xl">
            <Building2 size={24} />
          </div>
          <div>
            <div className="text-xs text-[var(--neu-text-subtle)]">Total Entreprises</div>
            <div className="text-xl font-bold text-[var(--neu-text)]">{tenants.length}</div>
          </div>
        </NeuCard>

        <NeuCard className="p-4 flex items-center gap-4">
          <div className="p-3 bg-emerald-500/10 text-emerald-600 rounded-xl">
            <CheckCircle2 size={24} />
          </div>
          <div>
            <div className="text-xs text-[var(--neu-text-subtle)]">Entreprises Actives</div>
            <div className="text-xl font-bold text-emerald-600">{activeCount}</div>
          </div>
        </NeuCard>

        <NeuCard className="p-4 flex items-center gap-4">
          <div className="p-3 bg-amber-500/10 text-amber-500 rounded-xl">
            <AlertCircle size={24} />
          </div>
          <div>
            <div className="text-xs text-[var(--neu-text-subtle)]">Inactives / Suspendues</div>
            <div className="text-xl font-bold text-amber-500">{inactiveCount}</div>
          </div>
        </NeuCard>

        <NeuCard className="p-4 flex items-center gap-4">
          <div className="p-3 bg-blue-500/10 text-blue-500 rounded-xl">
            <ShieldCheck size={24} />
          </div>
          <div>
            <div className="text-xs text-[var(--neu-text-subtle)]">Siège Principal</div>
            <div className="text-sm font-semibold text-[var(--neu-text)] truncate max-w-[150px]">
              {mainTenant ? mainTenant.name : "PROGITPAIE"}
            </div>
          </div>
        </NeuCard>
      </div>

      {/* BARRE DE RECHERCHE & FILTRES AVANCÉS */}
      <NeuCard className="p-4">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="relative w-full md:w-96">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--neu-text-subtle)]" size={18} />
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
              <Filter size={16} className="text-[var(--neu-text-subtle)]" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="bg-[var(--neu-bg)] border border-[var(--neu-border)] text-sm rounded-lg px-3 py-2 text-[var(--neu-text)] focus:outline-none"
              >
                <option value="ALL">Tous les statuts</option>
                <option value="ACTIVE">Actives uniquement</option>
                <option value="INACTIVE">Inactives / Suspendues</option>
              </select>
            </div>

            <button
              onClick={fetchTenants}
              className="p-2 border border-[var(--neu-border)] text-[var(--neu-text-subtle)] hover:text-emerald-500 rounded-lg transition"
              title="Actualiser"
            >
              <RefreshCw size={18} className={loading ? "animate-spin" : ""} />
            </button>
          </div>
        </div>
      </NeuCard>

      {/* TABLEAU DES ENTREPRISES */}
      <NeuCard className="p-6">
        {loading ? (
          <div className="text-center py-12 text-[var(--neu-text-subtle)]">Chargement des entités juridiques...</div>
        ) : tenants.length === 0 ? (
          <div className="text-center py-12 text-[var(--neu-text-subtle)]">Aucune entreprise trouvée.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-[var(--neu-bg-subtle)] text-[var(--neu-text-subtle)] border-b border-[var(--neu-border)]">
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
                  <tr key={t.id} className="hover:bg-[var(--neu-bg-subtle)]/50 transition">
                    <td className="p-3 font-medium text-[var(--neu-text)] flex items-center gap-2">
                      <Building2 size={16} className="text-emerald-500" />
                      <div>
                        <div className="font-semibold">{t.name}</div>
                        <div className="text-xs text-[var(--neu-text-subtle)] font-mono">ID: {t.id}</div>
                      </div>
                    </td>
                    <td className="p-3 text-[var(--neu-text-subtle)]">{t.taxNumber || "-"}</td>
                    <td className="p-3 text-[var(--neu-text-subtle)]">{t.cnpsNumber || "-"}</td>
                    <td className="p-3 text-[var(--neu-text-subtle)]">{t.city || "Abidjan"}</td>
                    <td className="p-3">
                      {t.isMain ? (
                        <span className="px-2.5 py-1 bg-amber-500/10 text-amber-500 border border-amber-500/20 text-xs rounded-full font-semibold">
                          ★ Siège
                        </span>
                      ) : (
                        <span className="px-2.5 py-1 bg-blue-500/10 text-blue-500 border border-blue-500/20 text-xs rounded-full font-medium">
                          Filiale
                        </span>
                      )}
                    </td>
                    <td className="p-3">
                      {t.status === "ACTIVE" ? (
                        <span className="text-xs text-emerald-500 font-semibold flex items-center gap-1">
                          <CheckCircle2 size={12} /> Actif
                        </span>
                      ) : (
                        <span className="text-xs text-rose-500 font-semibold flex items-center gap-1">
                          <AlertCircle size={12} /> Inactif / Suspendu
                        </span>
                      )}
                    </td>
                    <td className="p-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Link
                          href={`/admin/tenants/${t.id}`}
                          className="p-1.5 text-[var(--neu-text-subtle)] hover:text-emerald-500 hover:bg-emerald-500/10 rounded-lg transition"
                          title="Fiche Détail"
                        >
                          <Eye size={16} />
                        </Link>

                        {!t.isMain && (
                          <>
                            {t.status === "ACTIVE" ? (
                              <button
                                onClick={() => handleToggleStatus(t, "SUSPENDED")}
                                className="p-1.5 text-amber-500 hover:bg-amber-500/10 rounded-lg transition"
                                title="Suspendre l'entreprise"
                              >
                                <Lock size={16} />
                              </button>
                            ) : (
                              <button
                                onClick={() => handleToggleStatus(t, "ACTIVE")}
                                className="p-1.5 text-emerald-500 hover:bg-emerald-500/10 rounded-lg transition"
                                title="Activer l'entreprise"
                              >
                                <Unlock size={16} />
                              </button>
                            )}

                            <button
                              onClick={() => {
                                setShowDeleteModal(t);
                                setDeleteConfirmInput("");
                              }}
                              className="p-1.5 text-rose-500 hover:bg-rose-500/10 rounded-lg transition"
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

      {/* MODALE CRÉATION D'ENTREPRISE */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-[var(--neu-bg)] border border-[var(--neu-border)] p-6 rounded-2xl max-w-2xl w-full space-y-4 shadow-2xl max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-bold text-[var(--neu-text)] flex items-center gap-2">
              <Plus className="text-emerald-500" size={20} />
              Ajouter une Nouvelle Entreprise (Tenant)
            </h3>

            {errorMessage && (
              <div className="p-3 bg-rose-500/10 border border-rose-500/20 text-rose-500 text-xs rounded-lg">
                {errorMessage}
              </div>
            )}

            <form onSubmit={handleCreateSubmit} className="space-y-4">
              <div className="space-y-3">
                <h4 className="text-xs font-bold text-emerald-500 uppercase tracking-wider">
                  📋 Informations Entreprise
                </h4>
                <div>
                  <label className="text-xs font-semibold text-[var(--neu-text-subtle)] block mb-1">Raison Sociale *</label>
                  <NeuInput
                    type="text"
                    placeholder="ex: PARABELLUM GROUPE SARL"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-semibold text-[var(--neu-text-subtle)] block mb-1">N° CC (DGI)</label>
                    <NeuInput
                      type="text"
                      placeholder="1234567 A"
                      value={formData.taxNumber}
                      onChange={(e) => setFormData({ ...formData, taxNumber: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-[var(--neu-text-subtle)] block mb-1">N° CNPS</label>
                    <NeuInput
                      type="text"
                      placeholder="123456"
                      value={formData.cnpsNumber}
                      onChange={(e) => setFormData({ ...formData, cnpsNumber: e.target.value })}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-semibold text-[var(--neu-text-subtle)] block mb-1">Ville</label>
                    <NeuInput
                      type="text"
                      placeholder="Abidjan / Bouaké"
                      value={formData.city}
                      onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-[var(--neu-text-subtle)] block mb-1">Téléphone</label>
                    <NeuInput
                      type="text"
                      placeholder="0709470671"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-3 pt-3 border-t border-[var(--neu-border)]">
                <h4 className="text-xs font-bold text-emerald-500 uppercase tracking-wider flex items-center gap-1">
                  <UserCheck size={14} /> Administrateur Principal Initial
                </h4>

                <div>
                  <label className="text-xs font-semibold text-[var(--neu-text-subtle)] block mb-1">Nom complet *</label>
                  <NeuInput
                    type="text"
                    placeholder="Jean-Marc KOUASSI"
                    value={formData.adminName}
                    onChange={(e) => setFormData({ ...formData, adminName: e.target.value })}
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-semibold text-[var(--neu-text-subtle)] block mb-1">Email Administrateur *</label>
                    <NeuInput
                      type="email"
                      placeholder="admin@parabellum.ci"
                      value={formData.adminEmail}
                      onChange={(e) => setFormData({ ...formData, adminEmail: e.target.value })}
                      required
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-[var(--neu-text-subtle)] block mb-1">Mot de passe initial *</label>
                    <NeuInput
                      type="password"
                      placeholder="MotDePasse123!"
                      value={formData.adminPassword}
                      onChange={(e) => setFormData({ ...formData, adminPassword: e.target.value })}
                      required
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-[var(--neu-border)]">
                <NeuButton type="button" onClick={() => setShowCreateModal(false)}>
                  Annuler
                </NeuButton>
                <NeuButton
                  type="submit"
                  disabled={submitting}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white"
                >
                  {submitting ? "Création en cours..." : "Créer l'entreprise"}
                </NeuButton>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODALE CONFIRMATION DE SUPPRESSION */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-[var(--neu-bg)] border border-[var(--neu-border)] p-6 rounded-2xl max-w-md w-full space-y-4 shadow-2xl">
            <h3 className="text-lg font-bold text-rose-500 flex items-center gap-2">
              <AlertTriangle size={20} />
              Confirmation de Suppression
            </h3>

            <p className="text-xs text-[var(--neu-text-subtle)] leading-relaxed">
              Êtes-vous sûr de vouloir supprimer l'entreprise <strong className="text-[var(--neu-text)]">{showDeleteModal.name}</strong> ?
              Cette action est <strong className="text-rose-500">IRRÉVERSIBLE</strong> et supprimera définitivement tous ses comptes et enregistrements associés.
            </p>

            {errorMessage && (
              <div className="p-2.5 bg-rose-500/10 border border-rose-500/20 text-rose-500 text-xs rounded-lg">
                {errorMessage}
              </div>
            )}

            <form onSubmit={handleDeleteSubmit} className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-[var(--neu-text-subtle)] block mb-1">
                  Tapez le nom de l'entreprise pour confirmer :
                </label>
                <NeuInput
                  type="text"
                  placeholder={showDeleteModal.name}
                  value={deleteConfirmInput}
                  onChange={(e) => setDeleteConfirmInput(e.target.value)}
                  required
                />
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-[var(--neu-border)]">
                <NeuButton type="button" onClick={() => setShowDeleteModal(null)}>
                  Annuler
                </NeuButton>
                <NeuButton
                  type="submit"
                  disabled={submitting || deleteConfirmInput.trim().toLowerCase() !== showDeleteModal.name.trim().toLowerCase()}
                  className="bg-rose-600 hover:bg-rose-700 text-white"
                >
                  {submitting ? "Suppression..." : "Supprimer Définitivement"}
                </NeuButton>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
