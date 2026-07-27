"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Users,
  ClipboardCheck,
  Calendar,
  DollarSign,
  Clock,
  Building2,
  BarChart2,
  ScrollText,
  Settings,
  Menu,
  X,
  ChevronLeft,
  ChevronRight,
  FileText,
  Timer,
  CreditCard,
  UserX,
  BookOpen,
  FileSpreadsheet,
  Calculator,
  Gift,
  ShieldCheck,
  Send,
  PieChart,
} from "lucide-react";
import { useState } from "react";
import { useSidebar } from "@/lib/SidebarContext";

const navItems = [
  { name: "Tableau de Bord", href: "/admin", icon: LayoutDashboard },
  { name: "Salariés & Personnel", href: "/admin/employees", icon: Users },
  { name: "Contrats RH", href: "/admin/contracts", icon: FileText },
  { name: "Pointages & Présences", href: "/admin/attendance", icon: ClipboardCheck },
  { name: "Heures Supp", href: "/admin/overtime", icon: Timer },
  { name: "Congés & Absences", href: "/admin/leaves", icon: Calendar },
  { name: "Gestion de la Paie", href: "/admin/payroll", icon: DollarSign },
  { name: "Cumuls RH & Paie", href: "/admin/cumuls", icon: Calculator },
  { name: "Gratifications", href: "/admin/gratifications", icon: Gift },
  { name: "Ordres de Virement", href: "/admin/bank-transfers", icon: Send },
  { name: "Relevé RNS CNPS", href: "/admin/rns", icon: ShieldCheck },
  { name: "Prêts & Avances", href: "/admin/loans", icon: CreditCard },
  { name: "Solde Tout Compte", href: "/admin/severance", icon: UserX },
  { name: "Comptabilité SYSCOHADA", href: "/admin/accounting", icon: BookOpen },
  { name: "Provisions Congés & Retraite", href: "/admin/provisions", icon: PieChart },
  { name: "Déclarations Fiscales & CNPS", href: "/admin/declarations", icon: FileSpreadsheet },
  { name: "Planning & Horaires", href: "/admin/shifts", icon: Clock },
  { name: "Départements & Services", href: "/admin/departments", icon: Building2 },
  { name: "Rapports & Statistiques", href: "/admin/reports", icon: BarChart2 },
  { name: "Journal d'Audit", href: "/admin/audit-logs", icon: ScrollText },
  { name: "Paramètres", href: "/admin/settings", icon: Settings },
];

export function AdminSidebar() {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const { isAdminCollapsed: isCollapsed, setIsAdminCollapsed: setIsCollapsed } = useSidebar();

  return (
    <>
      {/* Mobile hamburger */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="lg:hidden fixed top-4 left-4 z-50 p-2 bg-[var(--neu-surface)] rounded-lg shadow-[var(--neu-shadow)]"
      >
        {isOpen ? <X size={24} /> : <Menu size={24} />}
      </button>

      {/* Overlay */}
      {isOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/50 z-40"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed left-0 top-0 h-screen bg-[var(--neu-surface)] text-[var(--neu-text)] border-r border-[var(--neu-border)] z-40 transition-all duration-300 shadow-sm flex flex-col",
          isCollapsed ? "w-20" : "w-64",
          isOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        )}
      >
        {/* Logo & Toggle Header */}
        <div className="h-20 flex items-center justify-between border-b border-[var(--neu-border)] px-4 bg-[var(--neu-surface)] shrink-0 relative">
          <Link href="/admin" prefetch={false} className="flex items-center gap-2 overflow-hidden">
            <img 
              src="/logo.png" 
              alt="progitpaie Logo" 
              className={cn(
                "transition-all duration-300",
                isCollapsed ? "w-10 h-10 object-contain mx-auto" : "h-12 w-auto object-contain"
              )} 
            />
          </Link>

          {/* Sidebar Expand / Collapse Toggle Button */}
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className={cn(
              "hidden lg:flex w-8 h-8 rounded-lg items-center justify-center text-[var(--neu-text-secondary)] shadow-sm hover:bg-[#666cff] hover:text-white transition-all shrink-0 border border-[var(--neu-border)] bg-[var(--neu-surface-light)]",
              isCollapsed && "mx-auto"
            )}
            title={isCollapsed ? "Déplier le menu" : "Replier le menu"}
          >
            {isCollapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
          </button>
        </div>

        {/* Nav items */}
        <nav className="p-4 space-y-1.5 overflow-y-auto flex-1 pb-12">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href || (item.href !== "/admin" && pathname.startsWith(`${item.href}`));

            return (
              <Link
                key={item.name}
                href={item.href}
                prefetch={false}
                onClick={() => setIsOpen(false)}
                title={isCollapsed ? item.name : undefined}
                className={cn(
                  "flex items-center gap-3 px-3.5 py-2.5 rounded-[0.5rem] transition-all text-sm font-medium border border-transparent",
                  isActive
                    ? "bg-[#666cff] text-white shadow-[0px_4px_14px_0px_rgba(102,108,255,0.4)]"
                    : "text-[var(--neu-text-secondary)] hover:bg-[var(--neu-surface-light)] hover:text-[var(--neu-text)]",
                  isCollapsed && "justify-center px-0"
                )}
              >
                <Icon size={18} className="shrink-0" />
                {!isCollapsed && <span className="truncate">{item.name}</span>}
              </Link>
            );
          })}
        </nav>
      </aside>
    </>
  );
}
