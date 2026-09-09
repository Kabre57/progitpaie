"use client";

import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { ShieldAlert, ArrowLeft, Building2 } from "lucide-react";
import { NeuButton } from "@/components/ui/neu-button";

interface ImpersonationStatus {
  isImpersonating: boolean;
  superAdminId?: string;
  superAdminEmail?: string;
  targetCompanyId?: string;
  targetCompanyName?: string;
}

export function SupportImpersonationBanner() {
  const [exiting, setExiting] = useState(false);

  const { data: status } = useQuery<ImpersonationStatus | null>({
    queryKey: ["impersonation-status"],
    queryFn: async () => {
      const res = await fetch("/api/v2/admin/impersonate/status");
      const json = await res.json();
      if (json.success && json.data?.isImpersonating) {
        return json.data;
      }
      return null;
    },
    staleTime: 30000,
  });

  const handleExit = async () => {
    setExiting(true);
    try {
      await fetch("/api/v2/admin/impersonate/exit", { method: "POST" });
      const targetId = status?.targetCompanyId;
      window.location.href = targetId ? `/super-admin/tenants/${targetId}` : "/super-admin/dashboard";
    } catch (err) {
      console.error("Erreur lors de la sortie du mode support:", err);
      setExiting(false);
    }
  };

  if (!status || !status.isImpersonating) return null;

  return (
    <div className="w-full bg-gradient-to-r from-[#ff4d49] via-[#ff7849] to-[#fdb528] text-white px-4 py-2.5 shadow-lg relative z-50 flex items-center justify-between gap-4">
      <div className="flex items-center gap-2.5 text-xs sm:text-sm font-medium">
        <span className="p-1 rounded-md bg-black/20 flex items-center justify-center animate-pulse">
          <ShieldAlert size={16} />
        </span>
        <span>
          <strong>MODE SUPPORT ACTIF</strong> : Vous êtes connecté dans l&apos;espace client de{" "}
          <span className="underline font-bold inline-flex items-center gap-1">
            <Building2 size={13} /> {status.targetCompanyName}
          </span>
        </span>
      </div>

      <div className="flex items-center gap-2 shrink-0">
        <NeuButton
          size="sm"
          variant="outline"
          onClick={handleExit}
          loading={exiting}
          className="bg-black/30 hover:bg-black/40 text-white border-white/20 text-xs py-1 px-3"
        >
          <ArrowLeft size={13} />
          Quitter le support
        </NeuButton>
      </div>
    </div>
  );
}
