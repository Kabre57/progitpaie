"use client";

import { ArticleItem } from "../core/types";

interface ContractPreviewProps {
  name: string;
  jobTitle: string;
  category: string;
  salary: number;
  sursalaire: number;
  transport: number;
  joiningDate: string;
  contractType: string;
  cddMonths: number;
  bodyText: string;
  articles?: ArticleItem[];
  companyName?: string;
  companyAddress?: string;
  companyRepresentative?: string;
  employeeBirth?: string;
  employeeCni?: string;
  employeeNationality?: string;
  employeeAddress?: string;
}

export function ContractPreview({
  name,
  contractType,
  bodyText,
  articles,
  companyName,
  companyAddress,
  companyRepresentative,
  employeeBirth,
  employeeCni,
  employeeNationality,
  employeeAddress,
}: ContractPreviewProps) {
  const compName = companyName || "LOGIPAIE RH 21";
  const compAddr = companyAddress || "ABIDJAN COCODY, 01 BP 5115 ABIDJAN 01";
  const compRep = companyRepresentative || "la Direction Générale";

  return (
    <div className="doc-a4-page bg-white text-[#1e1e1e]" style={{ fontFamily: "Helvetica, Arial, sans-serif" }}>
      {/* Bandeau Supérieur */}
      <div className="h-[6px] bg-[#1e3a5f] rounded-t-sm" />
      <div className="px-6 pt-3 pb-1">
        <p className="text-[15px] font-bold text-[#1e3a5f] uppercase tracking-wide">
          {compName} (SARL)
        </p>
        <p className="text-[8px] text-[#646464] mt-0.5">
          {compName} • {compAddr} • Tél: 0709470671
        </p>
      </div>
      <div className="mx-6 border-t border-[#ccc]" />

      <div className="px-6 mt-4 space-y-2">
        <h2 className="text-center text-[15px] font-bold uppercase tracking-wide text-slate-800 border-b border-slate-200 pb-2">
          CONTRAT DE TRAVAIL A DUREE {contractType === "CDD" ? "DETERMINEE (CDD)" : "INDETERMINEE (CDI)"}
        </h2>
        <div className="text-[10px] space-y-1 leading-relaxed">
          <p className="font-bold">Entre les soussignés :</p>
          <p>
            1. L&apos;entité dénommée <strong>{compName}</strong>{companyAddress ? `, sise à ${companyAddress}` : ""}, représentée par {compRep}, ci-après désignée &quot;L&apos;Employeur&quot;,
          </p>
          <p className="text-right font-bold text-[#1e3a5f]">D&apos;une part,</p>

          <p className="font-bold pt-1">ET :</p>
          <p>
            2. M. / Mme <strong>{name}</strong>
            {employeeBirth ? `, né(e) le ${employeeBirth}` : ""}
            {employeeNationality ? `, de nationalité ${employeeNationality}` : ""}
            {employeeCni ? `, CNI N° ${employeeCni}` : ""}
            {employeeAddress ? `, demeurant à ${employeeAddress}` : ""}, ci-après désigné(e) &quot;Le Salarié&quot;,
          </p>
          <p className="text-right font-bold text-[#1e3a5f]">D&apos;autre part,</p>

          <p className="italic pt-2 font-bold text-slate-900 uppercase">IL A ÉTÉ CONVENU ET ARRÊTÉ CE QUI SUIT :</p>
        </div>

        {articles && articles.length > 0 ? (
          <div className="space-y-2.5 pt-2">
            {articles.map((art) => (
              <div key={art.id} className="text-[10px] space-y-0.5">
                <p className="font-bold text-slate-900">{art.title}</p>
                <p className="text-slate-700 leading-relaxed text-justify">{art.content}</p>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-[10px] leading-[18px] whitespace-pre-line text-justify">{bodyText}</div>
        )}
      </div>

      <div className="px-6 mt-10 flex justify-between text-[9px]">
        <div>
          <p>Fait à ABIDJAN, le {new Date().toLocaleDateString("fr-FR")}</p>
          <p className="font-bold mt-3">LE SALARIÉ</p>
          <p className="text-[8px] text-slate-400 mt-6">(Mention &quot;Lu et approuvé&quot; + signature)</p>
          <p className="font-bold text-slate-800">{name}</p>
        </div>
        <div className="text-right">
          <p className="font-bold mt-[15px]">POUR L&apos;EMPLOYEUR</p>
          <p className="text-[8px] text-slate-400 mt-6">(Nom, cachet et signature)</p>
        </div>
      </div>
    </div>
  );
}
