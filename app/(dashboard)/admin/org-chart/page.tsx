"use client";

import { useEffect, useState } from "react";
import { NeuCard, NeuCardContent, NeuCardHeader, NeuCardTitle } from "@/components/ui/neu-card";
import { NeuButton } from "@/components/ui/neu-button";
import { NeuInput } from "@/components/ui/neu-input";
import { NeuSelect } from "@/components/ui/neu-select";
import { NeuBadge } from "@/components/ui/neu-badge";
import { ChipLoader } from "@/components/ui/chip-loader";
import { Network, Users, User, ChevronRight, ChevronDown, UserPlus, Search, Building2 } from "lucide-react";
import { OrgNodeDTO } from "@/app/api/v2/org-chart/route";

export default function AdminOrgChartPage() {
  const [loading, setLoading] = useState(true);
  const [tree, setTree] = useState<OrgNodeDTO[]>([]);
  const [allEmployees, setAllEmployees] = useState<OrgNodeDTO[]>([]);
  const [totalEmployees, setTotalEmployees] = useState(0);

  const [searchQuery, setSearchQuery] = useState("");
  const [deptFilter, setDeptFilter] = useState("all");
  const [expandedNodes, setExpandedNodes] = useState<Record<string, boolean>>({});

  // Modal d'assignation N1
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [selectedEmployeeId, setSelectedEmployeeId] = useState("");
  const [selectedManagerId, setSelectedManagerId] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const fetchOrgChart = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/v2/org-chart");
      const json = await res.json();
      if (json.success && json.data) {
        setTree(json.data.tree || []);
        setAllEmployees(json.data.allEmployees || []);
        setTotalEmployees(json.data.totalEmployees || 0);

        // Déplier le premier niveau par défaut
        const defaultExpanded: Record<string, boolean> = {};
        (json.data.tree || []).forEach((n: OrgNodeDTO) => {
          defaultExpanded[n.id] = true;
        });
        setExpandedNodes(defaultExpanded);
      }
    } catch (err) {
      console.error("Fetch org chart error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrgChart();
  }, []);

  const toggleNode = (nodeId: string) => {
    setExpandedNodes((prev) => ({ ...prev, [nodeId]: !prev[nodeId] }));
  };

  const expandAll = () => {
    const allExp: Record<string, boolean> = {};
    allEmployees.forEach((e) => {
      allExp[e.id] = true;
    });
    setExpandedNodes(allExp);
  };

  const collapseAll = () => {
    setExpandedNodes({});
  };

  const handleAssignManager = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEmployeeId) return;
    setSubmitting(true);
    try {
      const res = await fetch("/api/v2/org-chart/assign-manager", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          employeeId: selectedEmployeeId,
          managerId: selectedManagerId || null,
        }),
      });
      const json = await res.json();
      if (json.success) {
        setShowAssignModal(false);
        setSelectedEmployeeId("");
        setSelectedManagerId("");
        fetchOrgChart();
      } else {
        alert(json.error || "Erreur d'assignation");
      }
    } catch (err) {
      console.error("Assign manager error:", err);
    } finally {
      setSubmitting(false);
    }
  };

  // Liste des départements uniques
  const departments = Array.from(
    new Set(allEmployees.map((e) => e.departmentName).filter(Boolean))
  );

  // Filtrage des nœuds
  const matchesFilter = (node: OrgNodeDTO): boolean => {
    if (deptFilter !== "all" && node.departmentName !== deptFilter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      const matchSelf =
        node.name.toLowerCase().includes(q) ||
        (node.employeeId || "").toLowerCase().includes(q) ||
        (node.jobTitle || "").toLowerCase().includes(q);
      const matchChildren = node.subordinates.some(matchesFilter);
      return matchSelf || matchChildren;
    }
    return true;
  };

  const renderNode = (node: OrgNodeDTO, depth: number = 0) => {
    if (!matchesFilter(node)) return null;

    const isExpanded = !!expandedNodes[node.id];
    const hasChildren = node.subordinates && node.subordinates.length > 0;

    return (
      <div key={node.id} className="relative pl-6 my-2 border-l-2 border-[var(--neu-accent)]/30">
        <div className="flex items-center gap-3 p-3.5 bg-[var(--neu-surface)] hover:bg-[var(--neu-surface-light)] border border-[var(--neu-border)] rounded-2xl shadow-sm transition-all group">
          {hasChildren ? (
            <button
              onClick={() => toggleNode(node.id)}
              className="p-1.5 rounded-lg bg-[var(--neu-surface-light)] text-[var(--neu-accent)] hover:scale-110 transition-transform"
            >
              {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
            </button>
          ) : (
            <div className="w-7 h-7 flex items-center justify-center rounded-lg bg-[var(--neu-surface-light)] text-[var(--neu-text-secondary)]">
              <User className="w-4 h-4" />
            </div>
          )}

          <div className="flex-1">
            <div className="flex items-center gap-2">
              <span className="font-bold text-sm text-[var(--neu-text)]">{node.name}</span>
              {node.employeeId && (
                <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded bg-[var(--neu-surface-light)] text-[var(--neu-accent)]">
                  {node.employeeId}
                </span>
              )}
            </div>

            <div className="flex items-center gap-3 text-xs text-[var(--neu-text-secondary)] mt-0.5">
              <span>👔 {node.jobTitle || "Collaborateur"}</span>
              <span>•</span>
              <span>🏢 {node.departmentName}</span>
              {node.managerName && (
                <>
                  <span>•</span>
                  <span className="text-amber-500 font-medium">N1 : {node.managerName}</span>
                </>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2">
            {node.subordinatesCount > 0 && (
              <NeuBadge variant="accent">
                👥 {node.subordinatesCount} direct(s)
              </NeuBadge>
            )}

            <NeuButton
              size="sm"
              variant="ghost"
              onClick={() => {
                setSelectedEmployeeId(node.id);
                setSelectedManagerId(node.managerId || "");
                setShowAssignModal(true);
              }}
              title="Modifier le Supérieur Hiérarchique Direct N1"
            >
              <UserPlus className="w-3.5 h-3.5 mr-1" /> N1
            </NeuButton>
          </div>
        </div>

        {hasChildren && isExpanded && (
          <div className="mt-2 space-y-1">
            {node.subordinates.map((sub) => renderNode(sub, depth + 1))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* En-tête de la page */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[var(--neu-text)] flex items-center gap-2">
            <Network className="text-[var(--neu-accent)]" /> Organigramme RH & Arborescence
          </h1>
          <p className="text-xs text-[var(--neu-text-secondary)]">
            Visualisation hiérarchique de l'entreprise et gestion du Supérieur Direct N1 ({totalEmployees} salariés)
          </p>
        </div>

        <div className="flex items-center gap-2">
          <NeuButton variant="ghost" size="sm" onClick={expandAll}>
            Déplier Tout
          </NeuButton>
          <NeuButton variant="ghost" size="sm" onClick={collapseAll}>
            Replier Tout
          </NeuButton>
          <NeuButton
            variant="accent"
            size="sm"
            onClick={() => {
              setSelectedEmployeeId("");
              setSelectedManagerId("");
              setShowAssignModal(true);
            }}
          >
            <UserPlus className="w-4 h-4 mr-1.5" /> Assigner Supérieur N1
          </NeuButton>
        </div>
      </div>

      {/* Barre de filtres */}
      <NeuCard>
        <NeuCardContent className="p-4 flex flex-col md:flex-row items-center gap-4">
          <div className="flex-1 w-full relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[var(--neu-text-secondary)]" />
            <input
              type="text"
              placeholder="Rechercher par nom, matricule ou poste..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 rounded-xl bg-[var(--neu-surface-light)] border border-[var(--neu-border)] text-xs text-[var(--neu-text)] focus:outline-none focus:border-[var(--neu-accent)]"
            />
          </div>

          <div className="w-full md:w-64">
            <NeuSelect
              value={deptFilter}
              onChange={(e) => setDeptFilter(e.target.value)}
              options={[
                { value: "all", label: "Tous les Départements" },
                ...departments.map((d) => ({ value: d!, label: d! })),
              ]}
            />
          </div>
        </NeuCardContent>
      </NeuCard>

      {/* Arborescence Organigramme */}
      <NeuCard>
        <NeuCardHeader>
          <NeuCardTitle className="flex items-center gap-2 text-base">
            <Building2 className="w-5 h-5 text-[var(--neu-accent)]" /> Structure Hiérarchique des Équipes
          </NeuCardTitle>
        </NeuCardHeader>
        <NeuCardContent className="p-6">
          {loading ? (
            <div className="flex justify-center py-12">
              <ChipLoader label="Chargement de l'organigramme RH..." />
            </div>
          ) : tree.length === 0 ? (
            <p className="text-center py-8 text-xs text-[var(--neu-text-secondary)]">
              Aucun salarié trouvé pour cette sélection.
            </p>
          ) : (
            <div className="space-y-4">
              {tree.map((node) => renderNode(node))}
            </div>
          )}
        </NeuCardContent>
      </NeuCard>

      {/* Modal Assigner Supérieur Hiérarchique N1 */}
      {showAssignModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <NeuCard className="w-full max-w-lg p-6 space-y-4">
            <h2 className="text-lg font-bold text-[var(--neu-text)] flex items-center gap-2 border-b border-[var(--neu-border)] pb-3">
              <UserPlus className="text-[var(--neu-accent)]" /> Assigner le Supérieur Direct N1
            </h2>

            <form onSubmit={handleAssignManager} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-[var(--neu-text-secondary)] mb-1">Collaborateur *</label>
                <NeuSelect
                  value={selectedEmployeeId}
                  onChange={(e) => {
                    const selId = e.target.value;
                    setSelectedEmployeeId(selId);
                    const emp = allEmployees.find((x) => x.id === selId);
                    if (emp) setSelectedManagerId(emp.managerId || "");
                  }}
                  options={[
                    { value: "", label: "-- Sélectionner le collaborateur --" },
                    ...allEmployees.map((e) => ({
                      value: e.id,
                      label: `${e.name} (${e.jobTitle})`,
                    })),
                  ]}
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[var(--neu-text-secondary)] mb-1">Supérieur Hiérarchique Direct N1</label>
                <NeuSelect
                  value={selectedManagerId}
                  onChange={(e) => setSelectedManagerId(e.target.value)}
                  options={[
                    { value: "", label: "Aucun Supérieur Direct (Rattachement Direction)" },
                    ...allEmployees
                      .filter((e) => e.id !== selectedEmployeeId)
                      .map((e) => ({
                        value: e.id,
                        label: `${e.name} (${e.jobTitle} - ${e.departmentName})`,
                      })),
                  ]}
                />
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-[var(--neu-border)]">
                <NeuButton
                  type="button"
                  variant="ghost"
                  onClick={() => {
                    setShowAssignModal(false);
                    setSelectedEmployeeId("");
                    setSelectedManagerId("");
                  }}
                >
                  Annuler
                </NeuButton>
                <NeuButton type="submit" variant="accent" loading={submitting} disabled={!selectedEmployeeId}>
                  Enregistrer l'Attribution N1
                </NeuButton>
              </div>
            </form>
          </NeuCard>
        </div>
      )}
    </div>
  );
}
