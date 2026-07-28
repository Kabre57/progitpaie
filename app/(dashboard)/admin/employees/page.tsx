"use client";

import { useState, useMemo } from "react";
import { Plus, Pencil, Search, Users, Loader2, Download, FileSpreadsheet } from "lucide-react";
import { NeuCard, NeuCardContent } from "@/components/ui/neu-card";
import { NeuButton } from "@/components/ui/neu-button";
import { NeuInput } from "@/components/ui/neu-input";
import { NeuSelect } from "@/components/ui/neu-select";
import { NeuDialog } from "@/components/ui/neu-dialog";
import { NeuBadge } from "@/components/ui/neu-badge";
import { useEmployees, useCreateEmployee, useUpdateEmployee } from "@/lib/hooks/useEmployees";
import { useToast } from "@/components/ui/neu-toast";
import { NeuPagination } from "@/components/ui/neu-pagination";

interface Employee {
  _id: string;
  id: string;
  name: string;
  email: string;
  role: "admin" | "employee";
  employeeId?: string;
  department?: { id: string; name: string } | null;
  salary?: number;
  sursalaire?: number;
  joiningDate?: string;
  isActive?: boolean;
  civility?: string;
  gender?: string;
  birthDate?: string;
  birthPlace?: string;
  idCardType?: string;
  idCardNumber?: string;
  nationality?: string;
  maritalStatus?: string;
  childrenCount?: number;
  address?: string;
  phone?: string;
  contractType?: string;
  contractSignDate?: string;
  cddDurationMonths?: number;
  exitDate?: string;
  direction?: string;
  service?: string;
  jobTitle?: string;
  jobCode?: string;
  regime?: string;
  paymentType?: string;
  category?: string;
  cnpsExempt?: boolean;
  cnpsNumber?: string;
  paymentMethod?: string;
  bankAccount?: string;
  bankName?: string;
}

const emptyFormData = {
  id: "",
  name: "",
  email: "",
  password: "",
  employeeId: "",
  civility: "M.",
  gender: "M",
  birthDate: "",
  birthPlace: "",
  idCardType: "CNI",
  idCardNumber: "",
  nationality: "IVOIRIENNE",
  maritalStatus: "Célibataire",
  childrenCount: "0",
  address: "",
  phone: "",
  contractType: "CDI",
  contractSignDate: "",
  cddDurationMonths: "",
  joiningDate: new Date().toISOString().split("T")[0],
  exitDate: "",
  direction: "ADMINISTRATION",
  service: "SECRETARIAT EXECUTE",
  jobTitle: "Collaborateur",
  jobCode: "CM",
  regime: "Général",
  paymentType: "Mensuel",
  category: "1A",
  cnpsExempt: false,
  cnpsNumber: "",
  paymentMethod: "Virement",
  bankAccount: "",
  bankName: "SOCIETE GENERALE CI",
  salary: "300000",
  sursalaire: "0",
  department: "",
};

export default function EmployeeManagementPage() {
  const toast = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [formData, setFormData] = useState(emptyFormData);
  const [activeFormTab, setActiveFormTab] = useState<"general" | "contract" | "bank">("general");

  // React Query Hooks
  const { data: employeesResponse, isLoading } = useEmployees({ limit: 100 });
  const createEmployeeMutation = useCreateEmployee();
  const updateEmployeeMutation = useUpdateEmployee();

  const employees: Employee[] = useMemo(() => {
    if (!employeesResponse) return [];
    if (Array.isArray((employeesResponse as any).data)) return (employeesResponse as any).data;
    if (Array.isArray(employeesResponse)) return employeesResponse as any;
    return [];
  }, [employeesResponse]);

  const handleOpenAdd = () => {
    setFormData({
      ...emptyFormData,
      employeeId: `EMP-00${employees.length + 1}`,
    });
    setIsEditMode(false);
    setIsDialogOpen(true);
  };

  const handleOpenEdit = (emp: Employee) => {
    setFormData({
      id: emp.id || emp._id,
      name: emp.name || "",
      email: emp.email || "",
      password: "",
      employeeId: emp.employeeId || "",
      civility: emp.civility || "M.",
      gender: emp.gender || "M",
      birthDate: emp.birthDate ? emp.birthDate.split("T")[0] : "",
      birthPlace: emp.birthPlace || "",
      idCardType: emp.idCardType || "CNI",
      idCardNumber: emp.idCardNumber || "",
      nationality: emp.nationality || "IVOIRIENNE",
      maritalStatus: emp.maritalStatus || "Célibataire",
      childrenCount: String(emp.childrenCount || 0),
      address: emp.address || "",
      phone: emp.phone || "",
      contractType: emp.contractType || "CDI",
      contractSignDate: emp.contractSignDate ? emp.contractSignDate.split("T")[0] : "",
      cddDurationMonths: emp.cddDurationMonths ? String(emp.cddDurationMonths) : "",
      joiningDate: emp.joiningDate ? emp.joiningDate.split("T")[0] : new Date().toISOString().split("T")[0],
      exitDate: emp.exitDate ? emp.exitDate.split("T")[0] : "",
      direction: emp.direction || "ADMINISTRATION",
      service: emp.service || "SECRETARIAT EXECUTE",
      jobTitle: emp.jobTitle || "Collaborateur",
      jobCode: emp.jobCode || "CM",
      regime: emp.regime || "Général",
      paymentType: emp.paymentType || "Mensuel",
      category: emp.category || "1A",
      cnpsExempt: Boolean(emp.cnpsExempt),
      cnpsNumber: emp.cnpsNumber || "",
      paymentMethod: emp.paymentMethod || "Virement",
      bankAccount: emp.bankAccount || "",
      bankName: emp.bankName || "SOCIETE GENERALE CI",
      salary: String(emp.salary || 0),
      sursalaire: String(emp.sursalaire || 0),
      department: emp.department?.name || "",
    });
    setIsEditMode(true);
    setIsDialogOpen(true);
  };

  const formSubmitting = createEmployeeMutation.isPending || updateEmployeeMutation.isPending;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload: any = {
        ...formData,
        salary: Number(formData.salary) || 0,
        sursalaire: Number(formData.sursalaire) || 0,
        childrenCount: Number(formData.childrenCount) || 0,
      };

      if (isEditMode) {
        await updateEmployeeMutation.mutateAsync({ id: formData.id, data: payload });
        toast.success("Fiche du salarié mise à jour avec succès");
      } else {
        await createEmployeeMutation.mutateAsync(payload);
        toast.success("Salarié enregistré avec succès dans le registre");
      }
      setIsDialogOpen(false);
    } catch (err: any) {
      toast.error(err.message || "Erreur lors de la soumission de la fiche");
    }
  };

  const filtered = useMemo(() => {
    return employees.filter((e) =>
      e.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      e.employeeId?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      e.jobTitle?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      e.direction?.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [employees, searchQuery]);

  const totalPages = Math.ceil(filtered.length / itemsPerPage);
  const paginatedEmployees = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filtered.slice(start, start + itemsPerPage);
  }, [filtered, currentPage, itemsPerPage]);

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[var(--neu-text)] flex items-center gap-2">
            <Users className="w-6 h-6 text-[var(--neu-accent)]" /> Registre du Personnel
          </h1>
          <p className="text-[var(--neu-text-secondary)] text-sm">
            Gestion complète des fiches d'état civil, des contrats, de la CNPS et des RIB bancaires des salariés.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <NeuButton variant="accent" onClick={handleOpenAdd}>
            <Plus className="w-4 h-4 mr-1.5" /> Nouveau Salarié
          </NeuButton>
        </div>
      </div>

      {/* Barre de Recherche & Filtres */}
      <NeuCard>
        <NeuCardContent className="p-4 flex flex-col sm:flex-row items-center gap-4">
          <div className="relative flex-1 w-full">
            <Search className="absolute left-3 top-2.5 w-4 h-4 text-[var(--neu-text-secondary)]" />
            <input
              type="text"
              placeholder="Rechercher par nom, matricule, fonction, direction..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 rounded-lg bg-[var(--neu-surface-light)] border border-[var(--neu-border)] text-sm text-[var(--neu-text)] outline-none focus:border-[var(--neu-accent)]"
            />
          </div>
          <NeuBadge variant="accent">{filtered.length} salariés inscrits</NeuBadge>
        </NeuCardContent>
      </NeuCard>

      {/* Tableau du Personnel */}
      <NeuCard>
        <NeuCardContent className="p-0 overflow-x-auto">
          {isLoading ? (
            <div className="flex items-center justify-center h-48">
              <Loader2 className="w-8 h-8 animate-spin text-[var(--neu-accent)]" />
            </div>
          ) : (
            <table className="w-full text-left border-collapse text-sm min-w-[1200px]">
              <thead>
                <tr className="border-b border-[var(--neu-border)] bg-[var(--neu-surface-light)] text-[var(--neu-text-secondary)] uppercase text-[11px] font-semibold tracking-wider">
                  <th className="px-3 py-3">Matricule</th>
                  <th className="px-3 py-3">Civilité & Noms & Prénoms</th>
                  <th className="px-3 py-3">Contrat</th>
                  <th className="px-3 py-3">Date d'Entrée</th>
                  <th className="px-3 py-3">Direction & Service</th>
                  <th className="px-3 py-3">Emploi (Code)</th>
                  <th className="px-3 py-3">Régime / Cat.</th>
                  <th className="px-3 py-3">N° CNPS</th>
                  <th className="px-3 py-3">Mode & Banque</th>
                  <th className="px-3 py-3 text-right">Salaire Base</th>
                  <th className="px-3 py-3 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--neu-border)] text-xs">
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={11} className="px-4 py-8 text-center text-[var(--neu-text-secondary)]">
                      Aucun employé trouvé dans le registre du personnel.
                    </td>
                  </tr>
                ) : (
                  paginatedEmployees.map((emp) => (
                    <tr key={emp.id || emp._id} className="hover:bg-[var(--neu-surface-light)] transition-colors">
                      <td className="px-3 py-3 font-mono font-bold text-[var(--neu-accent)]">
                        {emp.employeeId || "EMP-000"}
                      </td>
                      <td className="px-3 py-3">
                        <div className="font-bold text-[var(--neu-text)]">
                          <span className="text-[var(--neu-text-secondary)] mr-1">{emp.civility}</span>
                          {emp.name}
                        </div>
                        <div className="text-[10px] text-[var(--neu-text-secondary)]">
                          {emp.maritalStatus} • {emp.childrenCount || 0} enfant(s) • {emp.phone || emp.email}
                        </div>
                      </td>
                      <td className="px-3 py-3">
                        <NeuBadge variant={emp.contractType === "CDD" ? "warning" : "success"}>
                          {emp.contractType || "CDI"}
                        </NeuBadge>
                        {emp.cddDurationMonths && (
                          <span className="text-[10px] text-[var(--neu-text-secondary)] block mt-0.5">
                            ({emp.cddDurationMonths} mois)
                          </span>
                        )}
                      </td>
                      <td className="px-3 py-3 text-[var(--neu-text-secondary)]">
                        {emp.joiningDate ? new Date(emp.joiningDate).toLocaleDateString("fr-FR") : "-"}
                      </td>
                      <td className="px-3 py-3">
                        <div className="font-semibold text-[var(--neu-text)]">{emp.direction || "ADMINISTRATION"}</div>
                        <div className="text-[10px] text-[var(--neu-text-secondary)]">{emp.service || "GÉNÉRAL"}</div>
                      </td>
                      <td className="px-3 py-3">
                        <div className="font-semibold text-[var(--neu-text)]">{emp.jobTitle || "Collaborateur"}</div>
                        <div className="text-[10px] text-[var(--neu-text-secondary)] font-mono">Code: {emp.jobCode || "CM"}</div>
                      </td>
                      <td className="px-3 py-3">
                        <span className="font-medium text-[var(--neu-text)]">{emp.regime || "Général"}</span>
                        <span className="text-[10px] bg-[#666cff]/10 text-[#666cff] px-1.5 py-0.5 rounded font-bold ml-1">
                          Cat {emp.category || "1A"}
                        </span>
                      </td>
                      <td className="px-3 py-3 font-mono">
                        {emp.cnpsExempt ? (
                          <span className="text-amber-500 text-[10px] font-bold">Non soumis</span>
                        ) : (
                          emp.cnpsNumber || "Exonéré"
                        )}
                      </td>
                      <td className="px-3 py-3">
                        <div className="font-medium text-[var(--neu-text)]">{emp.paymentMethod || "Virement"}</div>
                        <div className="text-[10px] text-[var(--neu-text-secondary)] font-mono truncate max-w-[120px]" title={emp.bankAccount || ""}>
                          {emp.bankName} ({emp.bankAccount || "Sans RIB"})
                        </div>
                      </td>
                      <td className="px-3 py-3 text-right font-mono font-bold text-[var(--neu-text)]">
                        {(emp.salary || 0).toLocaleString()} F
                      </td>
                      <td className="px-3 py-3 text-center">
                        <NeuButton size="icon" variant="ghost" onClick={() => handleOpenEdit(emp)} className="h-7 w-7">
                          <Pencil className="w-3.5 h-3.5 text-[var(--neu-accent)]" />
                        </NeuButton>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          )}
        </NeuCardContent>
        <NeuPagination
          currentPage={currentPage}
          totalPages={totalPages}
          totalItems={filtered.length}
          itemsPerPage={itemsPerPage}
          onPageChange={setCurrentPage}
        />
      </NeuCard>

      {/* Modal Ajout / Édition Fiche du Personnel */}
      <NeuDialog
        open={isDialogOpen}
        onClose={() => setIsDialogOpen(false)}
        title={isEditMode ? `Éditer la Fiche du Personnel (${formData.employeeId})` : "Ajouter un Salarié au Registre du Personnel"}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Navigation Tabs Form */}
          <div className="flex gap-2 border-b border-[var(--neu-border)] pb-2">
            <NeuButton
              type="button"
              variant={activeFormTab === "general" ? "accent" : "ghost"}
              onClick={() => setActiveFormTab("general")}
              size="sm"
            >
              1. État Civil & Identité
            </NeuButton>
            <NeuButton
              type="button"
              variant={activeFormTab === "contract" ? "accent" : "ghost"}
              onClick={() => setActiveFormTab("contract")}
              size="sm"
            >
              2. Contrat & Fonction
            </NeuButton>
            <NeuButton
              type="button"
              variant={activeFormTab === "bank" ? "accent" : "ghost"}
              onClick={() => setActiveFormTab("bank")}
              size="sm"
            >
              3. Rémunération & Banque
            </NeuButton>
          </div>

          {/* Tab 1: État Civil */}
          {activeFormTab === "general" && (
            <div className="space-y-3">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <NeuInput
                  label="Matricule *"
                  value={formData.employeeId}
                  onChange={(e) => setFormData({ ...formData, employeeId: e.target.value })}
                  required
                />
                <NeuSelect
                  label="Civilité"
                  options={[
                    { value: "M.", label: "M. (Monsieur)" },
                    { value: "Mme", label: "Mme (Madame)" },
                    { value: "Mlle", label: "Mlle (Mademoiselle)" },
                  ]}
                  value={formData.civility}
                  onChange={(e) => setFormData({ ...formData, civility: e.target.value })}
                />
                <NeuInput
                  label="Nom & Prénoms *"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <NeuInput
                  label="Email Professionnel *"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  required
                />
                {!isEditMode && (
                  <NeuInput
                    label="Mot de Passe Initial"
                    type="password"
                    value={formData.password}
                    placeholder="Par défaut: 123456"
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  />
                )}
                <NeuInput
                  label="Téléphone"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <NeuInput
                  label="Date de Naissance"
                  type="date"
                  value={formData.birthDate}
                  onChange={(e) => setFormData({ ...formData, birthDate: e.target.value })}
                />
                <NeuInput
                  label="Lieu de Naissance"
                  value={formData.birthPlace}
                  onChange={(e) => setFormData({ ...formData, birthPlace: e.target.value })}
                />
                <NeuInput
                  label="Nationalité"
                  value={formData.nationality}
                  onChange={(e) => setFormData({ ...formData, nationality: e.target.value })}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <NeuSelect
                  label="Situation Matrimoniale"
                  options={[
                    { value: "Célibataire", label: "Célibataire" },
                    { value: "Marié(e)", label: "Marié(e)" },
                    { value: "Divorcé(e)", label: "Divorcé(e)" },
                    { value: "Veuf(ve)", label: "Veuf(ve)" },
                  ]}
                  value={formData.maritalStatus}
                  onChange={(e) => setFormData({ ...formData, maritalStatus: e.target.value })}
                />
                <NeuInput
                  label="Nombre d'enfants à charge"
                  type="number"
                  value={formData.childrenCount}
                  onChange={(e) => setFormData({ ...formData, childrenCount: e.target.value })}
                />
                <NeuInput
                  label="Adresse Complète"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2 border-t border-[var(--neu-border)]">
                <NeuSelect
                  label="Pièce d'Identité"
                  options={[
                    { value: "CNI", label: "CNI" },
                    { value: "Passeport", label: "Passeport" },
                    { value: "Attestation", label: "Attestation d'Identité" },
                    { value: "Carte Consulaire", label: "Carte Consulaire" },
                  ]}
                  value={formData.idCardType}
                  onChange={(e) => setFormData({ ...formData, idCardType: e.target.value })}
                />
                <NeuInput
                  label="N° Pièce d'Identité"
                  value={formData.idCardNumber}
                  onChange={(e) => setFormData({ ...formData, idCardNumber: e.target.value })}
                />
              </div>
            </div>
          )}

          {/* Tab 2: Contrat & Emploi */}
          {activeFormTab === "contract" && (
            <div className="space-y-3">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <NeuSelect
                  label="Type de Contrat"
                  options={[
                    { value: "CDI", label: "CDI" },
                    { value: "CDD", label: "CDD" },
                    { value: "STAGE", label: "Stage" },
                    { value: "FREELANCE", label: "Prestation / Freelance" },
                  ]}
                  value={formData.contractType}
                  onChange={(e) => setFormData({ ...formData, contractType: e.target.value })}
                />
                <NeuInput
                  label="Date de Signature"
                  type="date"
                  value={formData.contractSignDate}
                  onChange={(e) => setFormData({ ...formData, contractSignDate: e.target.value })}
                />
                <NeuInput
                  label="Date d'Entrée Effective"
                  type="date"
                  value={formData.joiningDate}
                  onChange={(e) => setFormData({ ...formData, joiningDate: e.target.value })}
                />
              </div>

              {formData.contractType === "CDD" && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 bg-amber-500/10 p-3 rounded-lg border border-amber-500/20">
                  <NeuInput
                    label="Durée CDD (mois)"
                    type="number"
                    value={formData.cddDurationMonths}
                    onChange={(e) => setFormData({ ...formData, cddDurationMonths: e.target.value })}
                  />
                  <NeuInput
                    label="Date de Fin Prévisionnelle"
                    type="date"
                    value={formData.exitDate}
                    onChange={(e) => setFormData({ ...formData, exitDate: e.target.value })}
                  />
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <NeuInput
                  label="Direction / Département"
                  value={formData.direction}
                  onChange={(e) => setFormData({ ...formData, direction: e.target.value })}
                />
                <NeuInput
                  label="Service"
                  value={formData.service}
                  onChange={(e) => setFormData({ ...formData, service: e.target.value })}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <NeuInput
                  label="Intitulé Emploi / Fonction *"
                  value={formData.jobTitle}
                  onChange={(e) => setFormData({ ...formData, jobTitle: e.target.value })}
                  required
                />
                <NeuInput
                  label="Code Emploi"
                  value={formData.jobCode}
                  placeholder="ex: CM, CS"
                  onChange={(e) => setFormData({ ...formData, jobCode: e.target.value })}
                />
              </div>
            </div>
          )}

          {/* Tab 3: Rémunération & Banque */}
          {activeFormTab === "bank" && (
            <div className="space-y-3">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <NeuSelect
                  label="Régime de Paie"
                  options={[
                    { value: "Général", label: "Général" },
                    { value: "Agricole", label: "Agricole" },
                  ]}
                  value={formData.regime}
                  onChange={(e) => setFormData({ ...formData, regime: e.target.value })}
                />
                <NeuSelect
                  label="Type de Paiement"
                  options={[
                    { value: "Mensuel", label: "Mensuel" },
                    { value: "Horaire", label: "Horaire" },
                  ]}
                  value={formData.paymentType}
                  onChange={(e) => setFormData({ ...formData, paymentType: e.target.value })}
                />
                <NeuInput
                  label="Catégorie Professionnelle"
                  value={formData.category}
                  placeholder="ex: 11 à 1A"
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <NeuInput
                  label="Salaire de Base Categoriel (FCFA) *"
                  type="number"
                  value={formData.salary}
                  onChange={(e) => setFormData({ ...formData, salary: e.target.value })}
                  required
                />
                <NeuInput
                  label="Sursalaire Négocié (FCFA)"
                  type="number"
                  value={formData.sursalaire}
                  onChange={(e) => setFormData({ ...formData, sursalaire: e.target.value })}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2 border-t border-[var(--neu-border)]">
                <div className="flex items-center gap-2 pt-6">
                  <input
                    type="checkbox"
                    id="cnpsExempt"
                    checked={formData.cnpsExempt}
                    onChange={(e) => setFormData({ ...formData, cnpsExempt: e.target.checked })}
                    className="w-4 h-4 rounded text-[var(--neu-accent)]"
                  />
                  <label htmlFor="cnpsExempt" className="text-sm text-[var(--neu-text)] font-medium">
                    Salarié non soumis à la CNPS
                  </label>
                </div>
                {!formData.cnpsExempt && (
                  <NeuInput
                    label="N° CNPS"
                    value={formData.cnpsNumber}
                    onChange={(e) => setFormData({ ...formData, cnpsNumber: e.target.value })}
                  />
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-2 border-t border-[var(--neu-border)]">
                <NeuSelect
                  label="Mode de Règlement"
                  options={[
                    { value: "Virement", label: "Virement Bancaire" },
                    { value: "Chèque", label: "Chèque" },
                    { value: "Espèces", label: "Espèces" },
                  ]}
                  value={formData.paymentMethod}
                  onChange={(e) => setFormData({ ...formData, paymentMethod: e.target.value })}
                />
                <NeuInput
                  label="Nom de la Banque"
                  value={formData.bankName}
                  onChange={(e) => setFormData({ ...formData, bankName: e.target.value })}
                />
                <NeuInput
                  label="N° de Compte / RIB Bancaire"
                  value={formData.bankAccount}
                  onChange={(e) => setFormData({ ...formData, bankAccount: e.target.value })}
                />
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex justify-end gap-3 pt-4 border-t border-[var(--neu-border)]">
            <NeuButton type="button" variant="ghost" onClick={() => setIsDialogOpen(false)}>
              Annuler
            </NeuButton>
            <NeuButton type="submit" variant="accent" loading={formSubmitting}>
              {isEditMode ? "Mettre à jour" : "Enregistrer Salarié"}
            </NeuButton>
          </div>
        </form>
      </NeuDialog>
    </div>
  );
}
