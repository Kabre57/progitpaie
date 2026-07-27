"use client";

import { useTheme } from "@/lib/ThemeProvider";
import { Sun, Moon } from "lucide-react";

export function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();

  return (
    <button
      onClick={toggleTheme}
      className="p-2 rounded-lg bg-[var(--neu-surface-light)] text-[var(--neu-text-secondary)] hover:text-[var(--neu-accent)] hover:bg-[var(--neu-surface)] transition-all flex items-center justify-center border border-[var(--neu-border)]"
      title={theme === "dark" ? "Passer en mode Clair (Materialize Light)" : "Passer en mode Sombre (Materialize Dark)"}
      aria-label="Toggle theme"
    >
      {theme === "dark" ? (
        <Sun size={18} className="text-amber-400" />
      ) : (
        <Moon size={18} className="text-indigo-600" />
      )}
    </button>
  );
}
