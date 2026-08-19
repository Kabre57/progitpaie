"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Shield, Plus, Key, Layers, Users, RefreshCw, CheckCircle2, Lock } from "lucide-react";
import { NeuButton } from "@/components/ui/neu-button";
import { NeuCard } from "@/components/ui/neu-card";
import { NeuStatCard } from "@/components/ui/neu-stat-card";
import { useToast } from "@/components/ui/neu-toast";
import { RoleMatrixEditor } from "@/components/roles/role-matrix-editor";
import { PermissionCatalogManager } from "@/components/roles/permission-catalog-manager";
import { RoleList } from "@/components/roles/role-list";
import { RoleEntity } from "@/lib/domain/auth/entities/Role";
import { PermissionModuleEntity } from "@/lib/domain/auth/entities/PermissionCatalog";

export default function AdminRolesPage() {
  const toast = useToast();
  const [activeTab, setActiveTab] = useState<"roles" | "catalog">("roles");

  // Data states
  const [roles, setRoles] = useState<RoleEntity[]>([]);
  const [catalog, setCatalog] = useState<PermissionModuleEntity[]>([]);
  const [loading, setLoading] = useState(true);

  // Matrix Editor Modal
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [editingRole, setEditingRole] = useState<RoleEntity | null>(null);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const [rolesRes, catalogRes] = await Promise.all([
        fetch("/api/v2/roles"),
        fetch("/api/v2/permissions"),
      ]);

      const [rolesData, catalogData] = await Promise.all([
        rolesRes.json(),
        catalogRes.json(),
      ]);

      if (rolesData.success) {
        setRoles(rolesData.data || []);
      }
      if (catalogData.success) {
        setCatalog(catalogData.data || []);
      }
    } catch {
      toast.error("Impossible de charger les rôles et permissions");
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleCreateRole = () => {
    setEditingRole(null);
    setIsEditorOpen(true);
  };

  const handleEditRole = (role: RoleEntity) => {
    setEditingRole(role);
    setIsEditorOpen(true);
  };

  const handleDeleteRole = async (role: RoleEntity) => {
    if (!confirm(`Êtes-vous sûr de vouloir supprimer le rôle « ${role.name} » ?`)) {
      return;
    }

    try {
      const res = await fetch(`/api/v2/roles/${role.id}`, { method: "DELETE" });
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.error || "Erreur de suppression");

      toast.success("Rôle supprimé avec succès");
      fetchData();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Erreur de suppression");
    }
  };

  // Compute total permissions in catalog
  const totalPermissionsCount = catalog.reduce(
    (acc, mod) => acc + (mod.permissions?.length || 0),
    0
  );
  const totalAssignedUsers = roles.reduce(
    (acc, r) => acc + (r.userCount || 0),
    0
  );

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6 animate-fade-in">
      {/* Page Title & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-2xl bg-[#666cff]/15 text-[#666cff]">
            <Shield size={26} />
          </div>
          <div>
            <h1 className="text-xl font-bold text-[var(--neu-text)]">
              Rôles & Permissions Graduelles
            </h1>
            <p className="text-xs text-[var(--neu-text-secondary)] mt-0.5">
              Concevez vos catalogues de capacités et assignez des matrices de permissions précises à vos collaborateurs.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <NeuButton variant="outline" size="sm" onClick={fetchData} loading={loading}>
            <RefreshCw size={14} />
            Actualiser
          </NeuButton>

          {activeTab === "roles" && (
            <NeuButton variant="default" size="sm" onClick={handleCreateRole}>
              <Plus size={15} />
              Nouveau Rôle
            </NeuButton>
          )}
        </div>
      </div>

      {/* Metric Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <NeuStatCard
          title="Rôles Configurés"
          value={roles.length.toString()}
          icon={<Shield size={20} />}
          subtitle="Profils métier actifs"
        />
        <NeuStatCard
          title="Permissions Disponibles"
          value={totalPermissionsCount.toString()}
          icon={<Key size={20} />}
          subtitle={`${catalog.length} modules configurés`}
        />
        <NeuStatCard
          title="Salariés Affectés"
          value={totalAssignedUsers.toString()}
          icon={<Users size={20} />}
          subtitle="Bénéficiant d'un rôle personnalisé"
        />
      </div>

      {/* Tabs Switcher */}
      <div className="flex border-b border-[var(--neu-border)] gap-2">
        <button
          onClick={() => setActiveTab("roles")}
          className={`pb-3 px-4 text-xs font-bold transition-all border-b-2 flex items-center gap-2 ${
            activeTab === "roles"
              ? "border-[#666cff] text-[#666cff]"
              : "border-transparent text-[var(--neu-text-secondary)] hover:text-[var(--neu-text)]"
          }`}
        >
          <Shield size={16} />
          <span>Matrice des Rôles ({roles.length})</span>
        </button>

        <button
          onClick={() => setActiveTab("catalog")}
          className={`pb-3 px-4 text-xs font-bold transition-all border-b-2 flex items-center gap-2 ${
            activeTab === "catalog"
              ? "border-[#666cff] text-[#666cff]"
              : "border-transparent text-[var(--neu-text-secondary)] hover:text-[var(--neu-text)]"
          }`}
        >
          <Layers size={16} />
          <span>Catalogue des Permissions ({totalPermissionsCount})</span>
        </button>
      </div>

      {/* Tab Content */}
      {loading && roles.length === 0 && catalog.length === 0 ? (
        <div className="text-center py-16 text-xs text-[var(--neu-text-secondary)]">
          Chargement des rôles et permissions...
        </div>
      ) : activeTab === "roles" ? (
        <RoleList
          roles={roles}
          onEdit={handleEditRole}
          onDelete={handleDeleteRole}
          onCreateNew={handleCreateRole}
        />
      ) : (
        <PermissionCatalogManager catalog={catalog} onRefresh={fetchData} />
      )}

      {/* Interactive Matrix Modal */}
      <RoleMatrixEditor
        isOpen={isEditorOpen}
        onClose={() => setIsEditorOpen(false)}
        role={editingRole}
        catalog={catalog}
        onSaved={fetchData}
      />
    </div>
  );
}
