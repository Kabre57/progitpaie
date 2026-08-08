"use client";

import React, { useState, useEffect } from "react";
import { Key, Plus, Copy, Check, ShieldCheck, Cpu, RefreshCw } from "lucide-react";
import { NeuCard } from "@/components/ui/neu-card";
import { NeuButton } from "@/components/ui/neu-button";
import { NeuInput } from "@/components/ui/neu-input";
import { ApiKeyItemDTO } from "@/shared/types/contracts/api-keys.contract";

export default function ApiKeysAdminPage() {
  const [keys, setKeys] = useState<ApiKeyItemDTO[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [showModal, setShowModal] = useState<boolean>(false);
  const [name, setName] = useState<string>("");
  const [newRawKey, setNewRawKey] = useState<string | null>(null);
  const [copied, setCopied] = useState<boolean>(false);

  const fetchKeys = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/api-keys");
      const json = await res.json();
      if (json.success) {
        setKeys(json.keys);
      }
    } catch (err) {
      console.error("Échec de chargement des clés API:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchKeys();
  }, []);

  const handleCreateKey = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name) return;

    try {
      const res = await fetch("/api/admin/api-keys", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, permissions: ["read:employees", "read:payroll"] }),
      });

      const json = await res.json();
      if (json.success) {
        setNewRawKey(json.key.rawKey);
        setName("");
        fetchKeys();
      }
    } catch (err) {
      console.error("Erreur de création de la clé API:", err);
    }
  };

  const handleCopyKey = () => {
    if (newRawKey) {
      navigator.clipboard.writeText(newRawKey);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* HEADER PAGE */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[var(--neu-text)] flex items-center gap-2">
            <Cpu className="text-purple-500" size={28} />
            API Publique & Connecteurs ERP (SAP, Sage, Odoo) 🔌
          </h1>
          <p className="text-sm text-[var(--neu-text-subtle)] mt-1">
            Gestion des clés API sécurisées (SHA-256) et des accès des systèmes tiers
          </p>
        </div>

        <NeuButton
          onClick={() => setShowModal(true)}
          className="bg-purple-600 hover:bg-purple-700 text-white flex items-center gap-2 px-4 py-2"
        >
          <Plus size={18} />
          Générer une Clé ERP
        </NeuButton>
      </div>

      {/* RAPPEL DOCUMENTATION API */}
      <NeuCard className="p-4 bg-purple-500/5 border border-purple-500/20 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <ShieldCheck className="text-purple-500 shrink-0" size={24} />
          <div>
            <h3 className="font-bold text-sm text-[var(--neu-text)]">API REST Gateway v2 &amp; GraphQL Actif</h3>
            <p className="text-xs text-[var(--neu-text-subtle)]">
              Endpoints disponibles : <code className="text-purple-600">/api/v2/employees</code>, <code className="text-purple-600">/api/v2/payroll</code> et <code className="text-purple-600">/api/graphql</code>
            </p>
          </div>
        </div>

        <button
          onClick={fetchKeys}
          className="text-xs text-[var(--neu-text-subtle)] hover:text-purple-500 flex items-center gap-1"
        >
          <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
          Actualiser
        </button>
      </NeuCard>

      {/* CLÉS API EXISTANTES */}
      <NeuCard className="p-6 space-y-4">
        <h2 className="text-lg font-bold text-[var(--neu-text)]">Clés d&apos;Intégration ERP Actives</h2>

        {loading ? (
          <div className="text-center py-8 text-[var(--neu-text-subtle)]">Chargement des clés d&apos;API ERP...</div>
        ) : keys.length === 0 ? (
          <div className="text-center py-8 text-[var(--neu-text-subtle)]">Aucune clé API générée.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-[var(--neu-bg-subtle)] text-[var(--neu-text-subtle)] border-b border-[var(--neu-border)]">
                <tr>
                  <th className="p-3 font-semibold">Intégration Tiers</th>
                  <th className="p-3 font-semibold">Préfixe Clé API</th>
                  <th className="p-3 font-semibold">Dernier Appel</th>
                  <th className="p-3 font-semibold">Date Création</th>
                  <th className="p-3 font-semibold">Statut</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--neu-border)]">
                {keys.map((k) => (
                  <tr key={k.id} className="hover:bg-[var(--neu-bg-subtle)]/50 transition">
                    <td className="p-3 font-medium text-[var(--neu-text)] flex items-center gap-2">
                      <Key size={16} className="text-purple-500" />
                      {k.name}
                    </td>
                    <td className="p-3 font-mono text-xs text-[var(--neu-text-subtle)]">{k.keyPrefix}...</td>
                    <td className="p-3 text-[var(--neu-text-subtle)]">
                      {k.lastUsedAt ? new Date(k.lastUsedAt).toLocaleString("fr-FR") : "Jamais"}
                    </td>
                    <td className="p-3 text-[var(--neu-text-subtle)]">
                      {new Date(k.createdAt).toLocaleDateString("fr-FR")}
                    </td>
                    <td className="p-3">
                      <span className="text-xs text-emerald-500 font-semibold bg-emerald-500/10 px-2 py-0.5 rounded-full">
                        Actif
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </NeuCard>

      {/* MODALE CRÉATION CLÉ API */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-[var(--neu-bg)] border border-[var(--neu-border)] p-6 rounded-2xl max-w-lg w-full space-y-4 shadow-xl">
            <h3 className="text-lg font-bold text-[var(--neu-text)]">Nouvelle Clé d&apos;API ERP</h3>

            {newRawKey ? (
              <div className="space-y-4">
                <div className="p-3 bg-amber-500/10 border border-amber-500/20 text-amber-500 text-xs rounded-xl">
                  ⚠️ Copiez immédiatement cette clé API. Elle ne sera plus jamais réaffichée par mesure de sécurité !
                </div>

                <div className="p-3 bg-[var(--neu-bg-subtle)] rounded-xl font-mono text-xs break-all flex items-center justify-between gap-2 border border-[var(--neu-border)]">
                  <span>{newRawKey}</span>
                  <button
                    onClick={handleCopyKey}
                    className="p-1.5 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition"
                  >
                    {copied ? <Check size={16} /> : <Copy size={16} />}
                  </button>
                </div>

                <div className="flex justify-end pt-2">
                  <NeuButton
                    onClick={() => {
                      setShowModal(false);
                      setNewRawKey(null);
                    }}
                    className="bg-purple-600 text-white"
                  >
                    J&apos;ai copié la clé
                  </NeuButton>
                </div>
              </div>
            ) : (
              <form onSubmit={handleCreateKey} className="space-y-4">
                <div>
                  <label className="text-xs font-semibold text-[var(--neu-text-subtle)] block mb-1">
                    Intitulé de l&apos;ERP ou Système Tiers *
                  </label>
                  <NeuInput
                    type="text"
                    placeholder="ex: Connecteur SAP Finance Production"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                  />
                </div>

                <div className="flex justify-end gap-3 pt-2">
                  <NeuButton type="button" onClick={() => setShowModal(false)}>
                    Annuler
                  </NeuButton>
                  <NeuButton type="submit" className="bg-purple-600 text-white">
                    Générer la Clé API
                  </NeuButton>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
