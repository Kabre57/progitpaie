"use client";

import React, { useState, useEffect } from "react";
import { Building2, Plus, Edit2, CheckCircle2, AlertCircle, RefreshCw, ShieldCheck } from "lucide-react";
import { NeuCard } from "@/components/ui/neu-card";
import { NeuButton } from "@/components/ui/neu-button";
import { NeuInput } from "@/components/ui/neu-input";

interface Company {
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
  isActive: boolean;
}

export default function MulticompanyAdminPage() {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [showModal, setShowModal] = useState<boolean>(false);
  const [formData, setFormData] = useState<Partial<Company>>({
    name: "",
    taxNumber: "",
    cnpsNumber: "",
    rccm: "",
    address: "",
    city: "Abidjan",
    phone: "",
    email: "",
    isMain: false,
  });

  const fetchCompanies = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/companies");
      const data = await res.json();
      if (data.success) {
        setCompanies(data.companies);
      }
    } catch (err) {
      console.error("Échec de chargement des entreprises:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCompanies();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name) return;

    try {
      const res = await fetch("/api/companies", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await res.json();
      if (data.success) {
        setShowModal(false);
        setFormData({
          name: "",
          taxNumber: "",
          cnpsNumber: "",
          rccm: "",
          address: "",
          city: "Abidjan",
          phone: "",
          email: "",
          isMain: false,
        });
        fetchCompanies();
      }
    } catch (err) {
      console.error("Erreur de sauvegarde entreprise:", err);
    }
  };

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* HEADER PAGE */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[var(--neu-text)] flex items-center gap-2">
            <Building2 className="text-emerald-500" size={28} />
            Gestion Multicompany & Entités Juridiques
          </h1>
          <p className="text-sm text-[var(--neu-text-subtle)] mt-1">
            Administration des filiales, succursales et sociétés du groupe (Côte d'Ivoire)
          </p>
        </div>

        <NeuButton
          onClick={() => setShowModal(true)}
          className="bg-emerald-600 hover:bg-emerald-700 text-white flex items-center gap-2 px-4 py-2"
        >
          <Plus size={18} />
          Nouvelle Entité Juridique
        </NeuButton>
      </div>

      {/* STATS RAPIDES */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <NeuCard className="p-4 flex items-center gap-4">
          <div className="p-3 bg-emerald-500/10 text-emerald-500 rounded-xl">
            <Building2 size={24} />
          </div>
          <div>
            <div className="text-xs text-[var(--neu-text-subtle)]">Total Entités Groupe</div>
            <div className="text-xl font-bold text-[var(--neu-text)]">{companies.length}</div>
          </div>
        </NeuCard>

        <NeuCard className="p-4 flex items-center gap-4">
          <div className="p-3 bg-blue-500/10 text-blue-500 rounded-xl">
            <ShieldCheck size={24} />
          </div>
          <div>
            <div className="text-xs text-[var(--neu-text-subtle)]">Siège / Entreprise Principale</div>
            <div className="text-sm font-semibold text-[var(--neu-text)] truncate max-w-[200px]">
              {companies.find((c) => c.isMain)?.name || "Non Définie"}
            </div>
          </div>
        </NeuCard>

        <NeuCard className="p-4 flex items-center gap-4">
          <div className="p-3 bg-amber-500/10 text-amber-500 rounded-xl">
            <CheckCircle2 size={24} />
          </div>
          <div>
            <div className="text-xs text-[var(--neu-text-subtle)]">Isolation Multi-Tenant</div>
            <div className="text-sm font-semibold text-emerald-600">Actif (PostgreSQL / Prisma)</div>
          </div>
        </NeuCard>
      </div>

      {/* TABLEAU DES ENTREPRISES */}
      <NeuCard className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-[var(--neu-text)]">Entités du Groupe PROGITPAIE</h2>
          <button
            onClick={fetchCompanies}
            className="text-xs text-[var(--neu-text-subtle)] hover:text-emerald-500 flex items-center gap-1"
          >
            <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
            Actualiser
          </button>
        </div>

        {loading ? (
          <div className="text-center py-8 text-[var(--neu-text-subtle)]">Chargement des entités juridiques...</div>
        ) : companies.length === 0 ? (
          <div className="text-center py-8 text-[var(--neu-text-subtle)]">Aucune entité juridique configurée.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-[var(--neu-bg-subtle)] text-[var(--neu-text-subtle)] border-b border-[var(--neu-border)]">
                <tr>
                  <th className="p-3 font-semibold">Raison Sociale</th>
                  <th className="p-3 font-semibold">Compte Contribuable (CC)</th>
                  <th className="p-3 font-semibold">N° CNPS</th>
                  <th className="p-3 font-semibold">Ville</th>
                  <th className="p-3 font-semibold">Type</th>
                  <th className="p-3 font-semibold">Statut</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--neu-border)]">
                {companies.map((company) => (
                  <tr key={company.id} className="hover:bg-[var(--neu-bg-subtle)]/50 transition">
                    <td className="p-3 font-medium text-[var(--neu-text)] flex items-center gap-2">
                      <Building2 size={16} className="text-emerald-500" />
                      {company.name}
                    </td>
                    <td className="p-3 text-[var(--neu-text-subtle)]">{company.taxNumber || "-"}</td>
                    <td className="p-3 text-[var(--neu-text-subtle)]">{company.cnpsNumber || "-"}</td>
                    <td className="p-3 text-[var(--neu-text-subtle)]">{company.city || "Abidjan"}</td>
                    <td className="p-3">
                      {company.isMain ? (
                        <span className="px-2 py-1 bg-amber-500/10 text-amber-500 border border-amber-500/20 text-xs rounded-full font-semibold">
                          ★ Siège
                        </span>
                      ) : (
                        <span className="px-2 py-1 bg-blue-500/10 text-blue-500 text-xs rounded-full font-medium">
                          Filiale
                        </span>
                      )}
                    </td>
                    <td className="p-3">
                      {company.isActive ? (
                        <span className="text-xs text-emerald-500 font-semibold flex items-center gap-1">
                          <CheckCircle2 size={12} /> Actif
                        </span>
                      ) : (
                        <span className="text-xs text-rose-500 font-semibold flex items-center gap-1">
                          <AlertCircle size={12} /> Inactif
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </NeuCard>

      {/* MODALE CRÉATION D'ENTREPRISE */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-[var(--neu-bg)] border border-[var(--neu-border)] p-6 rounded-2xl max-w-lg w-full space-y-4 shadow-xl">
            <h3 className="text-lg font-bold text-[var(--neu-text)]">Ajouter une Entité Juridique</h3>

            <form onSubmit={handleSubmit} className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-[var(--neu-text-subtle)] block mb-1">Raison Sociale *</label>
                <NeuInput
                  type="text"
                  placeholder="ex: PROGITPAIE SAN PEDRO"
                  value={formData.name || ""}
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
                    value={formData.taxNumber || ""}
                    onChange={(e) => setFormData({ ...formData, taxNumber: e.target.value })}
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-[var(--neu-text-subtle)] block mb-1">N° CNPS</label>
                  <NeuInput
                    type="text"
                    placeholder="123456"
                    value={formData.cnpsNumber || ""}
                    onChange={(e) => setFormData({ ...formData, cnpsNumber: e.target.value })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-[var(--neu-text-subtle)] block mb-1">Ville</label>
                  <NeuInput
                    type="text"
                    placeholder="Abidjan / San Pedro"
                    value={formData.city || ""}
                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-[var(--neu-text-subtle)] block mb-1">Téléphone</label>
                  <NeuInput
                    type="text"
                    placeholder="0709470671"
                    value={formData.phone || ""}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-[var(--neu-text-subtle)] block mb-1">Adresse physique</label>
                <NeuInput
                  type="text"
                  placeholder="BP 5115 ABIDJAN 01"
                  value={formData.address || ""}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-[var(--neu-border)]">
                <NeuButton type="button" onClick={() => setShowModal(false)}>
                  Annuler
                </NeuButton>
                <NeuButton type="submit" className="bg-emerald-600 hover:bg-emerald-700 text-white">
                  Enregistrer
                </NeuButton>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
