"use client";

import { fmtNum } from "../utils/formatters";

interface DeclarationPreviewProps {
  docType: string;
  month: number;
  year: number;
  itsData?: any;
  cnpsData?: any;
  rnsData?: any;
  empId?: string;
  name?: string;
  joiningStr?: string;
}

export function DeclarationPreview({
  docType,
  month,
  year,
  itsData,
  cnpsData,
  rnsData,
  name,
}: DeclarationPreviewProps) {
  const monthName = new Date(year, month - 1).toLocaleString("fr-FR", { month: "long" }).toUpperCase();

  return (
    <div className="doc-a4-page bg-white text-[#1e1e1e] p-6 text-[9px]" style={{ fontFamily: "Helvetica, Arial, sans-serif" }}>
      <div className="border-b-2 border-orange-600 pb-2 mb-4 flex justify-between items-center">
        <div>
          <h1 className="font-extrabold text-sm text-slate-900 uppercase">
            {docType === "declaration_its" ? "RÉPUBLIQUE DE CÔTE D'IVOIRE — DGI" : docType === "declaration_cnps" ? "CAISSE NATIONALE DE PRÉVOYANCE SOCIALE (CNPS)" : "RÉCAPITULATIF FISCAL & SOCIAL"}
          </h1>
          <p className="text-[8px] text-slate-500">Formulaire Officiel de Déclaration Mensuelle</p>
        </div>
        <div className="text-right font-bold text-orange-600">
          PÉRIODE : {monthName} {year}
        </div>
      </div>

      <div className="bg-slate-50 p-3 rounded border border-slate-200 mb-4 grid grid-cols-2 gap-2 text-[8.5px]">
        <div>
          <p><span className="font-bold">Entreprise :</span> LOGIPAIE RH 21 (SARL)</p>
          <p><span className="font-bold">N° Compte Contribuable :</span> 1234567 A</p>
        </div>
        <div>
          <p><span className="font-bold">N° CNPS Employeur :</span> 123456</p>
          <p><span className="font-bold">Centre des Impôts :</span> DGI Abidjan Cocody</p>
        </div>
      </div>

      <div className="space-y-3">
        <h3 className="font-bold text-[#1e3a5f] border-b pb-1">DÉTAIL DES RÈGLEMENTS DE LA PÉRIODE</h3>
        <table className="w-full border-collapse border border-slate-300">
          <thead>
            <tr className="bg-slate-100 font-bold text-left">
              <th className="border border-slate-300 p-1.5">RUBRIQUE FISCALE / SOCIALE</th>
              <th className="border border-slate-300 p-1.5 text-right">MONTANT A PAYER</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td className="border border-slate-300 p-1.5">ITS (Impôt sur Traitements et Salaires)</td>
              <td className="border border-slate-300 p-1.5 text-right font-mono">{fmtNum(itsData?.totalITS || 15000)} FCFA</td>
            </tr>
            <tr>
              <td className="border border-slate-300 p-1.5">CNPS (Régime Général Retraite & Prestations)</td>
              <td className="border border-slate-300 p-1.5 text-right font-mono">{fmtNum(cnpsData?.totalCNPSToPay || 85000)} FCFA</td>
            </tr>
            <tr className="bg-slate-50 font-bold">
              <td className="border border-slate-300 p-1.5">TOTAL ÉCHÉANCE DE LA PÉRIODE</td>
              <td className="border border-slate-300 p-1.5 text-right font-mono text-emerald-700">
                {fmtNum((itsData?.totalITS || 15000) + (cnpsData?.totalCNPSToPay || 85000))} FCFA
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div className="mt-12 text-right">
        <p>Fait à ABIDJAN, le {new Date().toLocaleDateString("fr-FR")}</p>
        <p className="font-bold mt-2">Cachet & Visa de la Direction</p>
      </div>
    </div>
  );
}
