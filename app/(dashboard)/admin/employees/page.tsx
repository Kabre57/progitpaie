"use client";

import { useState, useMemo } from "react";
import { Plus, Users } from "lucide-react";
import { NeuButton } from "@/components/ui/neu-button";
import { useEmployees, useCreateEmployee, useUpdateEmployee } from "@/lib/hooks/useEmployees";
import { useToast } from "@/components/ui/neu-toast";
import { CreateEmployeeInput, EmployeeDTO } from "@/shared/types/contracts/employees.contract";
import { EmployeeFilterBar } from "@/components/admin/employees/EmployeeFilterBar";
import { EmployeeTable } from "@/components/admin/employees/EmployeeTable";
import { EmployeeModalForm } from "@/components/admin/employees/EmployeeModalForm";

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

  // React Query Hooks
  const { data: employeesResponse, isLoading } = useEmployees({ limit: 100 });
  const createEmployeeMutation = useCreateEmployee();
  const updateEmployeeMutation = useUpdateEmployee();

  const employees: EmployeeDTO[] = useMemo(() => {
    if (!employeesResponse) return [];
    const res = employeesResponse as unknown as { data?: EmployeeDTO[] };
    if (Array.isArray(res.data)) return res.data;
    if (Array.isArray(employeesResponse)) return employeesResponse as unknown as EmployeeDTO[];
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

  const handleOpenEdit = (emp: EmployeeDTO) => {
    setFormData({
      id: emp.id || emp._id || "",
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
      const payload = {
        ...formData,
        role: "employee" as const,
        salary: Number(formData.salary) || 0,
        sursalaire: Number(formData.sursalaire) || 0,
        childrenCount: Number(formData.childrenCount) || 0,
      } as unknown as CreateEmployeeInput;

      if (isEditMode) {
        await updateEmployeeMutation.mutateAsync({ id: formData.id, data: payload });
        toast.success("Fiche du salarié mise à jour avec succès");
      } else {
        await createEmployeeMutation.mutateAsync(payload);
        toast.success("Salarié enregistré avec succès dans le registre");
      }
      setIsDialogOpen(false);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Erreur lors de la soumission de la fiche";
      toast.error(msg);
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
            Gestion complète des fiches d&apos;état civil, des contrats, de la CNPS et des RIB bancaires des salariés.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <NeuButton variant="accent" onClick={handleOpenAdd}>
            <Plus className="w-4 h-4 mr-1.5" /> Nouveau Salarié
          </NeuButton>
        </div>
      </div>

      {/* Barre de Recherche & Filtres */}
      <EmployeeFilterBar
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        filteredCount={filtered.length}
      />

      {/* Tableau du Personnel */}
      <EmployeeTable
        employees={paginatedEmployees}
        isLoading={isLoading}
        onEditClick={handleOpenEdit}
        currentPage={currentPage}
        totalPages={totalPages}
        totalItems={filtered.length}
        itemsPerPage={itemsPerPage}
        onPageChange={setCurrentPage}
      />

      {/* Modal Ajout / Édition Fiche du Personnel */}
      <EmployeeModalForm
        isOpen={isDialogOpen}
        onClose={() => setIsDialogOpen(false)}
        isEditMode={isEditMode}
        employeeId={formData.employeeId}
        formData={formData}
        setFormData={setFormData}
        onSubmit={handleSubmit}
        formSubmitting={formSubmitting}
      />
    </div>
  );
}
