"use client";

import { fmtNum } from "../utils/formatters";

interface OrdreVirementPreviewProps {
  bankName: string;
  totalAmount: number;
  month: number;
  year: number;
}

export function OrdreVirementPreview({ bankName, totalAmount, month, year }: OrdreVirementPreviewProps) {
  const monthName = new Date(year, month - 1).toLocaleString("fr-FR", { month: "long" }).toUpperCase();
  const dateStr = new Date().toLocaleDateString("fr-FR");

  return (
    <div className="doc-a4-page bg-white text-[#1e1e1e]" style={{ fontFamily: "Helvetica, Arial, sans-serif" }}>
      <div className="h-[6px] bg-[#1e3a5f] rounded-t-sm" />
      <div className="px-6 pt-3 pb-1">
        <p className="text-[15px] font-bold text-[#1e3a5f] uppercase tracking-wide">
          LOGIPAIE RH 21 (SARL)
        </p>
        <p className="text-[8px] text-[#646464] mt-0.5">
          LOGIPAIE RH 21 • BP 5115 ABIDJAN 01 - ABIDJAN • Tél: 0709470671
        </p>
      </div>
      <div className="mx-6 border-t border-[#ccc]" />

      <div className="px-6 mt-4 flex justify-between">
        <p className="text-[10px]">N/Réf. : 001/LOG/SAL/{year}</p>
        <div className="text-right">
          <p className="text-[16px] font-bold text-[#1e3a5f]">A L&apos;ATTENTION DE :</p>
          <p className="text-[12px] font-bold mt-1">MONSIEUR LE DIRECTEUR DE LA BANQUE</p>
          <p className="text-[12px] font-bold">{bankName}</p>
          <p className="text-[10px] mt-2">ABIDJAN, le {dateStr}</p>
        </div>
      </div>
      <div className="px-6 mt-6">
        <p className="text-[11px] font-bold mb-4">Objet : Ordre de virement des salaires</p>
        <p className="text-[11px] mb-3">Monsieur,</p>
        <p className="text-[11px] leading-[18px] text-justify mb-6">
          Par la présente, nous vous prions de bien vouloir effectuer par le débit de notre compte le virement des
          salaires du mois de {monthName} {year} pour un montant total de :
        </p>
        <div className="bg-[#f5f7fa] border border-[#ddd] rounded px-5 py-4 mb-6">
          <p className="text-[14px] font-bold">MONTANT TOTAL A VIRER : {fmtNum(totalAmount)} FCFA</p>
        </div>
        <p className="text-[10px] mb-3">P.J. : Liste nominative des salaires à virer avec RIB.</p>
        <p className="text-[10px] leading-[16px] text-justify">
          Vous en souhaitant bonne réception, veuillez agréer, Monsieur, nos sincères salutations.
        </p>
      </div>

      <div className="px-6 mt-12 text-right">
        <p className="text-[9px]">Fait à ABIDJAN, le {dateStr}</p>
        <p className="text-[9px] font-bold mt-3">La Direction Générale</p>
      </div>
    </div>
  );
}
