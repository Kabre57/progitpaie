"use client";

import React, { useState, useEffect } from "react";
import { Key, Plus, Copy, Check, ShieldCheck, Cpu, RefreshCw, Ban, AlertTriangle, Calendar, Clock } from "lucide-react";
import { NeuCard } from "@/components/ui/neu-card";
import { NeuButton } from "@/components/ui/neu-button";
import { NeuInput } from "@/components/ui/neu-input";
import { NeuBadge } from "@/components/ui/neu-badge";
import { ApiKeyItemDTO } from "@/shared/types/contracts/api-keys.contract";
import { ALLOWED_API_SCOPES, ApiScope } from "@/shared/validation/api-keys-v2.schema";

const SCOPE_LABELS: Record<ApiScope, { label: string; desc: string }> = {
  "read:employees": { label: "Lecture Salariés", desc: "Consultation du registre du personnel" },
  "read:payroll": { label: "Lecture Paie", desc: "Consultation des bulletins et livre de paie" },
  "read:attendance": { label: "Lecture Présences", desc: "Consultation des pointages et présences" },
  "write:employees": { label: "Édition Salariés", desc: "Création et modification de fiches salariés" },
  "write:payroll": { label: "Gestion Paie", desc: "Calcul et validation des bulletins de paie" },
  "read:all": { label: "Accès Général (Super-Admin)", desc: "Lecture complète de l'ensemble des modules" },
};

export default function ApiKeysAdminPage() {
  const [keys, setKeys] = useState<ApiKeyItemDTO[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [showModal, setShowModal] = useState<boolean>(false);
  const [name, setName] = useState<string>("");
  const [selectedScopes, setSelectedScopes] = useState<ApiScope[]>(["read:employees", "read:payroll"]);
  const [expiresInDays, setExpiresInDays] = useState<number | null>(90);
  const [newRawKey, setNewRawKey] = useState<string | null>(null);
  const [copied, setCopied] = useState<boolean>(false);

  // Modales d'actions Révocation & Rotation
  const [keyToRevoke, setKeyToRevoke] = useState<ApiKeyItemDTO | null>(null);
  const [keyToRotate, setKeyToRotate] = useState<ApiKeyItemDTO | null>(null);
  const [processingAction, setProcessingAction] = useState<boolean>(false);

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

  const handleToggleScope = (scope: ApiScope) => {
    if (selectedScopes.includes(scope)) {
      if (selectedScopes.length === 1) return; // Garder au moins 1 scope
      setSelectedScopes(selectedScopes.filter((s) => s !== scope));
    } else {
      setSelectedScopes([...selectedScopes, scope]);
    }
  };

  const handleCreateKey = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || selectedScopes.length === 0) return;

    try {
      const res = await fetch("/api/admin/api-keys", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          permissions: selectedScopes,
          expiresInDays: expiresInDays,
        }),
      });

      const json = await res.json();
      if (json.success) {
        setNewRawKey(json.key.rawKey);
        setName("");
        setSelectedScopes(["read:employees", "read:payroll"]);
        fetchKeys();
      } else {
        alert(json.error || "Erreur de création de la clé API");
      }
    } catch (err) {
      console.error("Erreur de création de la clé API:", err);
    }
  };

  const handleRevokeKeySubmit = async () => {
    if (!keyToRevoke) return;
    setProcessingAction(true);
    try {
      const res = await fetch(`/api/admin/api-keys/${keyToRevoke.id}/revoke`, {
        method: "PATCH",
      });
      const json = await res.json();
      if (res.ok && json.success) {
        setKeyToRevoke(null);
        fetchKeys();
      } else {
        alert(json.error || "Erreur lors de la révocation.");
      }
    } catch (err) {
      console.error("Revoke key error:", err);
    } finally {
      setProcessingAction(false);
    }
  };

  const handleRotateKeySubmit = async () => {
    if (!keyToRotate) return;
    setProcessingAction(true);
    try {
      const res = await fetch(`/api/admin/api-keys/${keyToRotate.id}/rotate`, {
        method: "POST",
      });
      const json = await res.json();
      if (res.ok && json.success) {
        setKeyToRotate(null);
        setNewRawKey(json.key.rawKey);
        setShowModal(true);
        fetchKeys();
      } else {
        alert(json.error || "Erreur lors de la rotation.");
      }
    } catch (err) {
      console.error("Rotate key error:", err);
    } finally {
      setProcessingAction(false);
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
            API Publique & Connecteurs ERP
          </h1>
          <p className="text-sm text-[var(--neu-text-subtle)] mt-1">
            Gestion sécurisée des clés API (SHA-256), contrôle des scopes et suivi des accès des systèmes tiers (SAP, Sage, Odoo).
          </p>
        </div>

        <NeuButton
          onClick={() => {
            setNewRawKey(null);
            setShowModal(true);
          }}
          className="bg-purple-600 hover:bg-purple-700 text-white flex items-center gap-2 px-4 py-2 font-bold"
        >
          <Plus size={18} />
          Générer une Clé ERP
        </NeuButton>
      </div>

      {/* RAPPEL SÉCURITÉ & DOCUMENTATION */}
      <NeuCard className="p-4 bg-purple-500/5 border border-purple-500/20 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <ShieldCheck className="text-purple-500 shrink-0" size={24} />
          <div>
            <h3 className="font-bold text-sm text-[var(--neu-text)]">API REST Gateway v2 — Authentification & Scopes Actifs</h3>
            <p className="text-xs text-[var(--neu-text-subtle)]">
              En-tête HTTP : <code className="text-purple-600 bg-purple-100 dark:bg-purple-950 px-1 py-0.5 rounded font-bold">X-API-Key: pk_live_...</code> • Scopes vérifiés automatiquement par le serveur.
            </p>
          </div>
        </div>

        <button
          onClick={fetchKeys}
          className="text-xs font-semibold text-[var(--neu-text-subtle)] hover:text-purple-500 flex items-center gap-1 shrink-0"
        >
          <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
          Actualiser
        </button>
      </NeuCard>

      {/* CLÉS API EXISTANTES */}
      <NeuCard className="p-6 space-y-4">
        <h2 className="text-lg font-bold text-[var(--neu-text)]">Clés d&apos;Intégration ERP Actives & Révoquées</h2>

        {loading ? (
          <div className="text-center py-8 text-[var(--neu-text-subtle)]">Chargement des clés d&apos;API ERP...</div>
        ) : keys.length === 0 ? (
          <div className="text-center py-8 text-[var(--neu-text-subtle)]">Aucune clé API générée pour le moment.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-slate-100 dark:bg-slate-800/60 text-slate-600 dark:text-slate-300 border-b border-slate-200 dark:border-slate-800">
                <tr>
                  <th className="p-3 font-semibold">Intégration Tiers</th>
                  <th className="p-3 font-semibold">Préfixe Clé</th>
                  <th className="p-3 font-semibold">Permissions (Scopes)</th>
                  <th className="p-3 font-semibold">Dernier Appel</th>
                  <th className="p-3 font-semibold">Expiration</th>
                  <th className="p-3 font-semibold">Statut</th>
                  <th className="p-3 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {keys.map((k) => {
                  const permissionsArray: string[] = Array.isArray(k.permissions)
                    ? k.permissions
                    : k.permissions && typeof k.permissions === "object"
                    ? Object.keys(k.permissions)
                    : [];

                  return (
                    <tr key={k.id} className="hover:bg-slate-50 dark:hover:bg-slate-900/50 transition">
                      <td className="p-3 font-medium text-slate-900 dark:text-slate-100">
                        <div className="flex items-center gap-2">
                          <Key size={15} className={k.isActive ? "text-purple-500" : "text-slate-400"} />
                          <div>
                            <span className="font-bold">{k.name}</span>
                            <span className="block text-[10px] text-slate-400">
                              Créée le {new Date(k.createdAt).toLocaleDateString("fr-FR")}
                            </span>
                          </div>
                        </div>
                      </td>

                      <td className="p-3 font-mono text-[11px] text-slate-500 dark:text-slate-400">
                        {k.keyPrefix}...
                      </td>

                      <td className="p-3">
                        <div className="flex flex-wrap gap-1">
                          {permissionsArray.map((p) => (
                            <span
                              key={p}
                              className="text-[10px] bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300 font-semibold px-2 py-0.5 rounded-md border border-purple-200 dark:border-purple-800"
                            >
                              {p}
                            </span>
                          ))}
                        </div>
                      </td>

                      <td className="p-3 text-slate-600 dark:text-slate-400">
                        {k.lastUsedAt ? (
                          <span className="flex items-center gap-1 font-mono text-[11px]">
                            <Clock size={12} className="text-slate-400" />
                            {new Date(k.lastUsedAt).toLocaleString("fr-FR")}
                          </span>
                        ) : (
                          <span className="text-slate-400 italic">Jamais utilisée</span>
                        )}
                      </td>

                      <td className="p-3 text-slate-600 dark:text-slate-400">
                        {k.expiresAt ? (
                          <span className="flex items-center gap-1 text-[11px]">
                            <Calendar size={12} className="text-slate-400" />
                            {new Date(k.expiresAt).toLocaleDateString("fr-FR")}
                          </span>
                        ) : (
                          <span className="text-emerald-600 dark:text-emerald-400 font-semibold text-[11px]">
                            Permanente
                          </span>
                        )}
                      </td>

                      <td className="p-3">
                        {k.isActive ? (
                          <NeuBadge variant="success" className="text-[10px] px-2 py-0.5">
                            Actif
                          </NeuBadge>
                        ) : (
                          <NeuBadge variant="error" className="text-[10px] px-2 py-0.5">
                            Révoqué
                          </NeuBadge>
                        )}
                      </td>

                      <td className="p-3 text-right">
                        {k.isActive && (
                          <div className="flex items-center justify-end gap-1">
                            <NeuButton
                              size="sm"
                              variant="ghost"
                              onClick={() => setKeyToRotate(k)}
                              className="text-xs text-blue-600 hover:text-blue-700 hover:bg-blue-50 dark:hover:bg-blue-950/30 px-2 py-1 gap-1"
                              title="Effectuer une rotation sécurisée de la clé"
                            >
                              <RefreshCw size={13} /> Rotation
                            </NeuButton>

                            <NeuButton
                              size="sm"
                              variant="ghost"
                              onClick={() => setKeyToRevoke(k)}
                              className="text-xs text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/30 px-2 py-1 gap-1"
                              title="Révoquer définitivement cette clé API"
                            >
                              <Ban size={13} /> Révoquer
                            </NeuButton>
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </NeuCard>

      {/* MODALE CRÉATION & ROTATION CLÉ API */}
      {showModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-2xl max-w-xl w-full space-y-5 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <Key className="text-purple-600 w-5 h-5" />
                {newRawKey ? "Nouvelle Clé API Générée" : "Créer une Clé d'API ERP"}
              </h3>
            </div>

            {newRawKey ? (
              <div className="space-y-4">
                <div className="p-3.5 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-200 text-xs rounded-xl space-y-1">
                  <p className="font-bold flex items-center gap-1.5 text-amber-600">
                    <AlertTriangle className="w-4 h-4" /> ATTENTION — SAUVEGARDEZ VOTRE CLÉ BRUTE
                  </p>
                  <p>
                    Copiez immédiatement cette clé API. Seul son hachage SHA-256 est conservé en base de données. Elle ne pourra plus jamais vous être réaffichée !
                  </p>
                </div>

                <div className="p-3.5 bg-slate-100 dark:bg-slate-800 rounded-xl font-mono text-xs break-all flex items-center justify-between gap-2 border border-slate-200 dark:border-slate-700">
                  <span className="text-purple-600 dark:text-purple-400 font-bold">{newRawKey}</span>
                  <button
                    type="button"
                    onClick={handleCopyKey}
                    className="p-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition shrink-0"
                    title="Copier dans le presse-papier"
                  >
                    {copied ? <Check size={16} /> : <Copy size={16} />}
                  </button>
                </div>

                <div className="flex justify-end pt-2">
                  <NeuButton
                    type="button"
                    onClick={() => {
                      setShowModal(false);
                      setNewRawKey(null);
                    }}
                    className="bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs px-5"
                  >
                    J&apos;ai bien copié ma clé API
                  </NeuButton>
                </div>
              </div>
            ) : (
              <form onSubmit={handleCreateKey} className="space-y-5">
                <div>
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                    Intitulé du système ERP / Partenaire *
                  </label>
                  <NeuInput
                    type="text"
                    placeholder="ex: Connecteur SAP RH Production / Sage Paie"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-2">
                    Portée des autorisations (Scopes API) *
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {(ALLOWED_API_SCOPES.filter((s) => s !== "read:all") as ApiScope[]).map((scope) => {
                      const isSelected = selectedScopes.includes(scope);
                      const meta = SCOPE_LABELS[scope];
                      return (
                        <div
                          key={scope}
                          onClick={() => handleToggleScope(scope)}
                          className={`p-3 rounded-xl border cursor-pointer transition-all ${
                            isSelected
                              ? "bg-purple-50 dark:bg-purple-950/40 border-purple-300 dark:border-purple-800"
                              : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-slate-300"
                          }`}
                        >
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-xs font-bold text-slate-900 dark:text-slate-100">
                              {meta.label}
                            </span>
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => {}}
                              className="rounded text-purple-600 focus:ring-purple-500"
                            />
                          </div>
                          <span className="text-[10px] text-slate-500 dark:text-slate-400 block">
                            {meta.desc}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                    Durée de validité de la clé
                  </label>
                  <select
                    value={expiresInDays === null ? "never" : String(expiresInDays)}
                    onChange={(e) => {
                      const val = e.target.value;
                      setExpiresInDays(val === "never" ? null : Number(val));
                    }}
                    className="w-full p-2.5 text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-slate-100 font-medium outline-none"
                  >
                    <option value="30">30 Jours</option>
                    <option value="90">90 Jours (Recommandé)</option>
                    <option value="365">1 An (365 Jours)</option>
                    <option value="never">Sans expiration (Clé permanente)</option>
                  </select>
                </div>

                <div className="flex justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
                  <NeuButton type="button" variant="outline" onClick={() => setShowModal(false)} className="text-xs">
                    Annuler
                  </NeuButton>
                  <NeuButton type="submit" className="bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs px-5">
                    Générer la Clé API
                  </NeuButton>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* MODAL CONFIRMATION RÉVOCATION */}
      {keyToRevoke && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-2xl max-w-md w-full space-y-4 shadow-2xl">
            <div className="flex items-center gap-3 text-red-600 border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="w-10 h-10 rounded-full bg-red-100 dark:bg-red-950 flex items-center justify-center shrink-0">
                <Ban className="w-5 h-5 text-red-600" />
              </div>
              <div>
                <h3 className="font-bold text-base text-slate-900 dark:text-slate-100">
                  Révoquer cette Clé API ?
                </h3>
                <p className="text-xs text-slate-500">Désactivation irréversible de l'accès ERP</p>
              </div>
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-300">
              Êtes-vous sûr de vouloir révoquer la clé <strong className="text-slate-900 dark:text-slate-100">{keyToRevoke.name}</strong> ({keyToRevoke.keyPrefix}...) ? Tout système ERP utilisant cette clé sera immédiatement bloqué.
            </p>

            <div className="flex items-center justify-end gap-3 pt-2">
              <NeuButton variant="outline" onClick={() => setKeyToRevoke(null)} className="text-xs px-4">
                Annuler
              </NeuButton>
              <NeuButton
                onClick={handleRevokeKeySubmit}
                disabled={processingAction}
                className="text-xs px-4 bg-red-600 hover:bg-red-700 text-white font-bold gap-1.5"
              >
                <Ban className="w-3.5 h-3.5" />
                {processingAction ? "Révocation…" : "Confirmer la Révocation"}
              </NeuButton>
            </div>
          </div>
        </div>
      )}

      {/* MODAL CONFIRMATION ROTATION */}
      {keyToRotate && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-2xl max-w-md w-full space-y-4 shadow-2xl">
            <div className="flex items-center gap-3 text-blue-600 border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-950 flex items-center justify-center shrink-0">
                <RefreshCw className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <h3 className="font-bold text-base text-slate-900 dark:text-slate-100">
                  Rotation de la Clé API
                </h3>
                <p className="text-xs text-slate-500">Désactivation de l'ancienne clé & génération d'une nouvelle</p>
              </div>
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-300">
              Cette action va désactiver la clé actuelle de <strong className="text-slate-900 dark:text-slate-100">{keyToRotate.name}</strong> et en générer immédiatement une nouvelle avec les mêmes autorisations.
            </p>

            <div className="flex items-center justify-end gap-3 pt-2">
              <NeuButton variant="outline" onClick={() => setKeyToRotate(null)} className="text-xs px-4">
                Annuler
              </NeuButton>
              <NeuButton
                onClick={handleRotateKeySubmit}
                disabled={processingAction}
                className="text-xs px-4 bg-blue-600 hover:bg-blue-700 text-white font-bold gap-1.5"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                {processingAction ? "Rotation…" : "Confirmer la Rotation"}
              </NeuButton>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
