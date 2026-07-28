"use client";

import { Loader2 } from "lucide-react";

interface ChipLoaderProps {
  size?: "sm" | "md" | "lg";
  label?: string;
  overlay?: boolean;
}

export function ChipLoader({
  size = "md",
  label,
  overlay = false,
}: ChipLoaderProps) {
  if (overlay) return null; // Ne jamais afficher de masque opaque bloquant

  const sizeMap = {
    sm: "w-4 h-4",
    md: "w-6 h-6",
    lg: "w-8 h-8",
  };

  return (
    <div className="flex items-center justify-center gap-2 py-4">
      <Loader2 className={`animate-spin text-[var(--neu-accent)] ${sizeMap[size] || "w-6 h-6"}`} />
      {label && <span className="text-xs text-[var(--neu-text-secondary)] font-medium">{label}</span>}
    </div>
  );
}
