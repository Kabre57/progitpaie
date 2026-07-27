"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { LogOut } from "lucide-react";
import { NotificationBell } from "./notification-bell";
import { ThemeToggle } from "@/components/ui/theme-toggle";

interface UserData {
  name: string;
  email: string;
  role: string;
}

export function Header() {
  const pathname = usePathname();
  const [user, setUser] = useState<UserData | null>(null);

  useEffect(() => {
    // Récupérer le profil utilisateur connecté
    const fetchUser = async () => {
      try {
        const response = await fetch("/api/auth/me");
        const data = await response.json();
        if (data.success) {
          setUser(data.data);
        }
      } catch (error) {
        console.error("Erreur lors de la récupération de l'utilisateur", error);
      }
    };
    fetchUser();
  }, []);

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      window.location.href = "/login";
    } catch (error) {
      console.error("Échec de la déconnexion", error);
    }
  };

  // Titres des pages en Français
  const getPageTitle = () => {
    const path = pathname.split("/").pop();
    if (!path || path === "admin" || path === "employee") return "Tableau de Bord";
    
    const titles: Record<string, string> = {
      employees: "Salariés & Personnel",
      contracts: "Contrats RH",
      attendance: "Pointages & Présences",
      overtime: "Heures Supplémentaires",
      leaves: "Demandes de Congés",
      payroll: "Gestion de la Paie",
      payslip: "Mon Bulletin de Paie",
      cumuls: "Cumuls RH & Paie",
      gratifications: "Gratifications",
      "bank-transfers": "Ordres de Virement",
      rns: "Relevé RNS CNPS",
      loans: "Prêts & Avances",
      severance: "Solde Tout Compte",
      accounting: "Comptabilité SYSCOHADA",
      provisions: "Provisions Congés & Retraite",
      declarations: "Déclarations Fiscales & CNPS",
      shifts: "Planning & Horaires",
      departments: "Départements & Services",
      reports: "Rapports & Statistiques",
      "audit-logs": "Journal d'Audit",
      settings: "Paramètres",
      notifications: "Mes Notifications",
    };

    return titles[path] || (path.charAt(0).toUpperCase() + path.slice(1).replace(/-/g, " "));
  };

  const initials = user?.name
    ?.split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase() || "U";

  return (
    <header className="h-16 bg-[var(--neu-surface)] text-[var(--neu-text)] border-b border-[var(--neu-border)] flex items-center justify-between px-6 sticky top-0 z-30 shadow-sm">
      {/* Titre de Page */}
      <h1 className="text-xl font-semibold text-[var(--neu-text)] capitalize lg:ml-0 ml-12 tracking-tight">
        {getPageTitle()}
      </h1>

      {/* Profil & Actions de droite */}
      <div className="flex items-center gap-4">
        {/* Toggle Thème */}
        <ThemeToggle />

        {/* Cloche Notifications */}
        <NotificationBell />

        {/* Utilisateur Connecté */}
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-[var(--neu-accent)] flex items-center justify-center text-white font-bold text-sm shadow-[0px_2px_8px_0px_rgba(102,108,255,0.4)]">
            {initials}
          </div>
          <div className="hidden md:block">
            <p className="text-sm font-semibold text-[var(--neu-text)]">
              {user?.name || "Chargement..."}
            </p>
            <p className="text-xs text-[var(--neu-text-secondary)] capitalize">
              {user?.role === "admin" ? "Administrateur" : user?.role === "employee" ? "Employé" : user?.role || ""}
            </p>
          </div>

          {/* Déconnexion */}
          <button
            onClick={handleLogout}
            className="p-2 rounded-lg hover:bg-[var(--neu-surface-light)] text-[var(--neu-text-secondary)] hover:text-red-500 transition-colors"
            title="Se déconnecter"
          >
            <LogOut size={18} />
          </button>
        </div>
      </div>
    </header>
  );
}
