"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  Search,
  Building2,
  Activity,
  CreditCard,
  ScrollText,
  Settings,
  Archive,
  UserCheck,
  LayoutGrid,
  Command,
  ArrowRight,
  Sparkles,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface CommandItem {
  id: string;
  title: string;
  category: "Navigation" | "Entreprises" | "Actions Rapides" | "Système";
  href?: string;
  action?: () => void;
  icon: React.ReactNode;
  badge?: string;
}

export function CommandPalette() {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [tenants, setTenants] = useState<{ id: string; name: string; slug: string }[]>([]);
  const router = useRouter();

  // Écoute du raccourci clavier Ctrl+K / Cmd+K
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setIsOpen((prev) => !prev);
      }
      if (e.key === "Escape") {
        setIsOpen(false);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Chargement des entreprises pour la recherche rapide
  useEffect(() => {
    if (!isOpen) return;
    fetch("/api/v2/admin/tenants")
      .then((res) => res.json())
      .then((json) => {
        if (json.success && Array.isArray(json.data?.tenants)) {
          setTenants(
            json.data.tenants.map((t: { id: string; name: string; slug: string }) => ({
              id: t.id,
              name: t.name,
              slug: t.slug,
            }))
          );
        }
      })
      .catch(() => {});
  }, [isOpen]);

  const baseItems: CommandItem[] = [
    {
      id: "nav-dash",
      title: "Dashboard Groupe",
      category: "Navigation",
      href: "/super-admin/dashboard",
      icon: <LayoutGrid className="w-4 h-4 text-[#666cff]" />,
    },
    {
      id: "nav-tenants",
      title: "Gestion des Entreprises (Tenants)",
      category: "Navigation",
      href: "/super-admin/tenants",
      icon: <Building2 className="w-4 h-4 text-[#26c6f9]" />,
      badge: `${tenants.length} entreprises`,
    },
    {
      id: "nav-subs",
      title: "Abonnements & Licences SaaS",
      category: "Navigation",
      href: "/super-admin/subscriptions",
      icon: <CreditCard className="w-4 h-4 text-[#72e128]" />,
    },
    {
      id: "nav-health",
      title: "Santé & Monitoring Système",
      category: "Système",
      href: "/super-admin/system",
      icon: <Activity className="w-4 h-4 text-[#fdb528]" />,
    },
    {
      id: "nav-audit",
      title: "Journal d'Audit Global",
      category: "Système",
      href: "/super-admin/audit-logs",
      icon: <ScrollText className="w-4 h-4 text-[#ff4d49]" />,
    },
    {
      id: "nav-team",
      title: "Équipe Super Admin & Rôles",
      category: "Navigation",
      href: "/super-admin/team",
      icon: <UserCheck className="w-4 h-4 text-[#666cff]" />,
    },
    {
      id: "nav-settings",
      title: "Paramètres Globaux de la Plateforme",
      category: "Navigation",
      href: "/super-admin/settings",
      icon: <Settings className="w-4 h-4 text-[var(--neu-text-secondary)]" />,
    },
    {
      id: "nav-backups",
      title: "Sauvegardes & Exports de Données",
      category: "Système",
      href: "/super-admin/backups",
      icon: <Archive className="w-4 h-4 text-[#26c6f9]" />,
    },
  ];

  const tenantItems: CommandItem[] = tenants.map((t) => ({
    id: `tenant-${t.id}`,
    title: t.name,
    category: "Entreprises",
    href: `/super-admin/tenants/${t.id}`,
    icon: <Building2 className="w-4 h-4 text-[#666cff]" />,
    badge: "Fiche Entreprise",
  }));

  const allItems = [...baseItems, ...tenantItems];

  const filteredItems = allItems.filter((item) =>
    item.title.toLowerCase().includes(query.toLowerCase()) ||
    item.category.toLowerCase().includes(query.toLowerCase())
  );

  const handleSelect = useCallback((item: CommandItem) => {
    setIsOpen(false);
    setQuery("");
    if (item.href) {
      router.push(item.href);
    } else if (item.action) {
      item.action();
    }
  }, [router]);

  // Navigation au clavier dans la liste
  useEffect(() => {
    if (!isOpen) return;
    const handleListNav = (e: KeyboardEvent) => {
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setSelectedIndex((prev) => (prev + 1) % (filteredItems.length || 1));
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setSelectedIndex((prev) => (prev - 1 + filteredItems.length) % (filteredItems.length || 1));
      } else if (e.key === "Enter") {
        e.preventDefault();
        if (filteredItems[selectedIndex]) {
          handleSelect(filteredItems[selectedIndex]);
        }
      }
    };

    window.addEventListener("keydown", handleListNav);
    return () => window.removeEventListener("keydown", handleListNav);
  }, [isOpen, filteredItems, selectedIndex, handleSelect]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 sm:pt-28 px-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        className="w-full max-w-2xl bg-[var(--neu-bg)] border border-[var(--neu-border)] rounded-2xl shadow-2xl overflow-hidden flex flex-col transition-all duration-300"
        style={{
          boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.45), 0 0 0 1px var(--neu-border)",
        }}
      >
        {/* Champ de recherche */}
        <div className="flex items-center gap-3 px-4 py-3.5 border-b border-[var(--neu-border)] bg-[var(--neu-surface-secondary)]/50">
          <Search className="w-5 h-5 text-[var(--neu-text-secondary)] shrink-0" />
          <input
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setSelectedIndex(0);
            }}
            placeholder="Rechercher une entreprise, une action ou un module (ex: Orange, Santé, Audit)..."
            className="flex-1 bg-transparent border-none outline-none text-sm sm:text-base text-[var(--neu-text)] placeholder-[var(--neu-text-secondary)]/60"
            autoFocus
          />
          <div className="flex items-center gap-1 text-[10px] uppercase font-mono text-[var(--neu-text-secondary)] bg-[var(--neu-bg)] px-2 py-1 rounded-md border border-[var(--neu-border)]">
            <Command size={11} /> K
          </div>
        </div>

        {/* Liste des résultats */}
        <div className="max-h-96 overflow-y-auto p-2 divide-y divide-[var(--neu-border)]/30">
          {filteredItems.length === 0 ? (
            <div className="p-8 text-center text-sm text-[var(--neu-text-secondary)]">
              Aucun résultat pour <span className="font-semibold text-[var(--neu-text)]">&quot;{query}&quot;</span>
            </div>
          ) : (
            filteredItems.map((item, index) => {
              const isSelected = index === selectedIndex;
              return (
                <div
                  key={item.id}
                  onClick={() => handleSelect(item)}
                  onMouseEnter={() => setSelectedIndex(index)}
                  className={cn(
                    "flex items-center justify-between gap-3 px-3.5 py-2.5 rounded-xl cursor-pointer transition-colors duration-150 text-xs sm:text-sm",
                    isSelected
                      ? "bg-[#666cff]/15 text-[#666cff] font-medium"
                      : "text-[var(--neu-text)] hover:bg-[var(--neu-surface-secondary)]"
                  )}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="p-1.5 rounded-lg bg-[var(--neu-bg)] border border-[var(--neu-border)] shrink-0">
                      {item.icon}
                    </div>
                    <div className="truncate">
                      <span className="text-[10px] text-[var(--neu-text-secondary)] uppercase tracking-wider block font-semibold">
                        {item.category}
                      </span>
                      <span className="truncate">{item.title}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    {item.badge && (
                      <span className="px-2 py-0.5 text-[10px] rounded-full bg-[var(--neu-bg)] border border-[var(--neu-border)] text-[var(--neu-text-secondary)] font-mono">
                        {item.badge}
                      </span>
                    )}
                    {isSelected && <ArrowRight size={14} className="text-[#666cff]" />}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer info raccourcis */}
        <div className="px-4 py-2.5 bg-[var(--neu-surface-secondary)]/30 border-t border-[var(--neu-border)] flex items-center justify-between text-[11px] text-[var(--neu-text-secondary)]">
          <div className="flex items-center gap-3">
            <span>
              <kbd className="px-1.5 py-0.5 rounded bg-[var(--neu-bg)] border border-[var(--neu-border)] font-mono text-[10px]">↑</kbd>{" "}
              <kbd className="px-1.5 py-0.5 rounded bg-[var(--neu-bg)] border border-[var(--neu-border)] font-mono text-[10px]">↓</kbd> Naviguer
            </span>
            <span>
              <kbd className="px-1.5 py-0.5 rounded bg-[var(--neu-bg)] border border-[var(--neu-border)] font-mono text-[10px]">↵</kbd> Ouvrir
            </span>
          </div>
          <span className="flex items-center gap-1">
            <Sparkles size={11} className="text-[#666cff]" /> PROGITPAIE Command Center
          </span>
        </div>
      </div>
    </div>
  );
}
