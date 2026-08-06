"use client";

import { fmtNum } from "../utils/formatters";

interface PayslipPreviewProps {
  name: string;
  jobTitle: string;
  salary: number;
  sursalaire: number;
  transport: number;
  appearance?: any;
  legal?: any;
  rates?: any;
}

export function PayslipPreview({
  name,
  jobTitle,
  salary,
  sursalaire,
  transport,
  appearance,
  legal,
  rates,
}: PayslipPreviewProps) {
  const appearanceConfig = appearance || {
    primaryColor: "#BBD795",
    headerTitle: "BULLETIN DE PAIE",
    headerSubtitle: "",
  };
  const legalConfig = legal || {
    legalNotice: "Bulletin de paie régi par les articles L.31 et L.32 du Code du travail Ivoirien.",
    showEmployerStamp: true,
    showEmployeeSignature: true,
  };
  const ratesConfig = rates || {
    cnpsEmployeeRetraite: 6.3,
    cnpsEmployerRetraite: 7.7,
    cnpsEmployerAT: 3.0,
    cnpsEmployerPF: 5.75,
    fdfpTA: 0.4,
    fdfpFPC: 0.6,
    itsRate: 1.2,
    cmuBase: 1000,
    cmuEmployeeRate: 50,
    cmuEmployerRate: 50,
    transportExemptAmount: 30000,
    showCMU: true,
  };

  const showCMU = ratesConfig.showCMU !== false;

  const baseSalary = salary || 75000;
  const surs = sursalaire || 0;
  const seniorityVal = baseSalary * 0.03 > 0 ? Math.round(baseSalary * 0.03) : 0;
  const totalBrut = baseSalary + surs + seniorityVal;
  const itsTax = Math.round(totalBrut * (ratesConfig.itsRate / 100));
  const cnpsEmp = Math.round(totalBrut * (ratesConfig.cnpsEmployeeRetraite / 100));
  const cnpsPatRet = Math.round(totalBrut * (ratesConfig.cnpsEmployerRetraite / 100));
  const cnpsAT = Math.round(totalBrut * (ratesConfig.cnpsEmployerAT / 100));
  const cnpsPF = Math.round(totalBrut * (ratesConfig.cnpsEmployerPF / 100));
  const fdfpTFC = Math.round(totalBrut * (ratesConfig.fdfpFPC / 100));
  const fdfpTAP = Math.round(totalBrut * (ratesConfig.fdfpTA / 100));
  const totalGains = totalBrut + (transport || ratesConfig.transportExemptAmount);

  const cmuTotal = ratesConfig.cmuBase || 1000;
  const cmuEmployeeVal = Math.round(cmuTotal * (ratesConfig.cmuEmployeeRate / 100));
  const cmuEmployerVal = Math.round(cmuTotal * (ratesConfig.cmuEmployerRate / 100));

  const totalRetSal = itsTax + cnpsEmp + (showCMU ? cmuEmployeeVal : 0);
  const netSalary = totalGains - totalRetSal;
  const monthName = new Date().toLocaleString("fr-FR", { month: "long" }).toUpperCase();
  const yearNum = new Date().getFullYear();

  const rows = [
    { n: "01", label: "Salaire Catégoriel", base: fmtNum(baseSalary), taux: "30,00", gains: fmtNum(baseSalary), retSal: "", tauxPat: "", retPat: "" },
    { n: "02", label: "Sursalaire", base: fmtNum(surs), taux: "30,00", gains: fmtNum(surs), retSal: "", tauxPat: "", retPat: "" },
    { n: "03", label: "Prime d'Ancienneté", base: fmtNum(baseSalary), taux: "3,00", gains: fmtNum(seniorityVal), retSal: "", tauxPat: "", retPat: "" },
    { n: "", label: "", base: "", taux: "", gains: "", retSal: "", tauxPat: "", retPat: "" },
    { n: "30", label: "Total brut", base: "", taux: "", gains: fmtNum(totalBrut), retSal: "", tauxPat: "", retPat: "", bold: true },
    { n: "31", label: "Brut fiscal employé", base: fmtNum(totalBrut), taux: "", gains: "", retSal: "", tauxPat: "", retPat: "", bold: true },
    { n: "33", label: "Brut social", base: fmtNum(totalBrut), taux: "", gains: "", retSal: "", tauxPat: "", retPat: "", bold: true },
    { n: "34", label: "ITS. Imp. sur Trait. et Sal.", base: "", taux: "", gains: "", retSal: fmtNum(itsTax), tauxPat: ratesConfig.itsRate.toFixed(2), retPat: fmtNum(itsTax) },
    { n: "35", label: "CNPS. Régime de Retraite", base: fmtNum(totalBrut), taux: ratesConfig.cnpsEmployeeRetraite.toFixed(2), gains: "", retSal: fmtNum(cnpsEmp), tauxPat: ratesConfig.cnpsEmployerRetraite.toFixed(2), retPat: fmtNum(cnpsPatRet) },
    { n: "36", label: "CNPS. Accident Travail", base: "", taux: "", gains: "", retSal: "", tauxPat: ratesConfig.cnpsEmployerAT.toFixed(2), retPat: fmtNum(cnpsAT) },
    { n: "37", label: "CNPS. Prest. Famil.", base: "", taux: "", gains: "", retSal: "", tauxPat: ratesConfig.cnpsEmployerPF.toFixed(2), retPat: fmtNum(cnpsPF) },
    ...(showCMU
      ? [
          {
            n: "37b",
            label: "CMU. Couverture Maladie Univ.",
            base: fmtNum(cmuTotal),
            taux: `${ratesConfig.cmuEmployeeRate.toFixed(2)}%`,
            gains: "",
            retSal: fmtNum(cmuEmployeeVal),
            tauxPat: `${ratesConfig.cmuEmployerRate.toFixed(2)}%`,
            retPat: fmtNum(cmuEmployerVal),
          },
        ]
      : []),
    { n: "38", label: "FDFP (TFC/FPC)", base: fmtNum(totalBrut), taux: "", gains: "", retSal: "", tauxPat: ratesConfig.fdfpFPC.toFixed(2), retPat: fmtNum(fdfpTFC) },
    { n: "39", label: "FDFP (TA/Taxe d'Appr.)", base: fmtNum(totalBrut), taux: "", gains: "", retSal: "", tauxPat: ratesConfig.fdfpTA.toFixed(2), retPat: fmtNum(fdfpTAP) },
    { n: "40", label: "Prime de Transport (exonérée)", base: fmtNum(transport || ratesConfig.transportExemptAmount), taux: "", gains: fmtNum(transport || ratesConfig.transportExemptAmount), retSal: "", tauxPat: "", retPat: "" },
  ];

  return (
    <div className="doc-a4-page bg-white text-[#1e1e1e]" style={{ fontFamily: "Helvetica, Arial, sans-serif" }}>
      {/* En-tête Société & Titre */}
      <div className="flex justify-between items-start px-5 pt-4 pb-2 border-b border-[#ccc]">
        <div>
          <h2 className="text-[13px] font-bold text-[#1e3a5f] uppercase tracking-wide">
            LOGIPAIE RH 21 (SARL)
          </h2>
          <p className="text-[7.5px] text-[#646464] mt-0.5">
            01 BP 5115 ABIDJAN 01 - ABIDJAN • Tél: 0709470671
          </p>
        </div>
        <div className="text-right">
          <h1
            className="text-[15px] font-extrabold uppercase px-3 py-1 text-white rounded-sm"
            style={{ backgroundColor: appearanceConfig.primaryColor }}
          >
            {appearanceConfig.headerTitle || "BULLETIN DE PAIE"}
          </h1>
          <p className="text-[9px] font-bold text-[#333] mt-1">
            PÉRIODE : {monthName} {yearNum}
          </p>
        </div>
      </div>

      {/* Cartouche Salarié */}
      <div className="mx-5 mt-2 p-2.5 bg-[#f8fafc] border border-[#e2e8f0] rounded-sm text-[8px]">
        <div className="grid grid-cols-2 gap-2">
          <div>
            <p><span className="font-bold">Salarié :</span> {name}</p>
            <p><span className="font-bold">Emploi / Poste :</span> {jobTitle}</p>
          </div>
          <div>
            <p><span className="font-bold">Matricule :</span> EMP-001</p>
            <p><span className="font-bold">Ancienneté :</span> 3 ans</p>
          </div>
        </div>
      </div>

      {/* Tableau des Rubriques */}
      <div className="px-5 mt-3">
        <table className="w-full border-collapse text-[7.5px]">
          <thead>
            <tr className="bg-[#f1f5f9] text-[#1e293b] font-bold border-b border-[#cbd5e1]">
              <th className="p-1.5 text-left">Code</th>
              <th className="p-1.5 text-left">Libellé Rubrique</th>
              <th className="p-1.5 text-right">Base</th>
              <th className="p-1.5 text-right">Gains</th>
              <th className="p-1.5 text-right">Retenues</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#e2e8f0]">
            {rows.map((r, index) => (
              <tr key={index} className={r.bold ? "font-bold bg-slate-50" : ""}>
                <td className="p-1 text-slate-500">{r.n}</td>
                <td className="p-1">{r.label}</td>
                <td className="p-1 text-right">{r.base}</td>
                <td className="p-1 text-right text-emerald-700">{r.gains}</td>
                <td className="p-1 text-right text-rose-600">{r.retSal}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Bandeau Net à Payer */}
      <div
        className="mx-5 mt-4 flex items-center justify-between px-4 py-2.5 rounded-sm text-white font-extrabold text-[11px]"
        style={{ backgroundColor: appearanceConfig.primaryColor }}
      >
        <span>NET À PAYER :</span>
        <span>{fmtNum(netSalary)} FCFA</span>
      </div>
    </div>
  );
}
