"use client";

import { useState, useEffect } from "react";
import { NeuDialog } from "@/components/ui/neu-dialog";
import { NeuInput } from "@/components/ui/neu-input";
import { NeuButton } from "@/components/ui/neu-button";
import { Download, Edit3, Eye, FileText } from "lucide-react";

// ─── Types ───────────────────────────────────────────────────────────────────

type DocType =
  | "contract"
  | "attestation"
  | "certificat"
  | "payslip"
  | "attestation_conge"
  | "ordre_virement"
  | "declaration_its"
  | "declaration_fdfp"
  | "declaration_cnps";

interface DocumentPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  userId?: string;
  defaultName?: string;
  defaultJobTitle?: string;
  defaultDepartment?: string;
  defaultSalary?: number;
  defaultSursalaire?: number;
  defaultTransport?: number;
  defaultCategory?: string;
  defaultJoiningDate?: string;
  defaultContractType?: string;
  defaultCddMonths?: number;
  startDate?: string;
  endDate?: string;
  returnDate?: string;
  docType: DocType;
  // Données pour ordres de virement
  bankName?: string;
  totalAmount?: number;
  month?: number;
  year?: number;
  // Données pour déclarations fiscales/sociales
  itsData?: {
    totalEmployees?: number;
    totalGrossSalary?: number;
    totalITS?: number;
    totalIGR?: number;
    totalCE?: number;
    totalTaxToPay?: number;
  };
  cnpsData?: {
    totalEmployees?: number;
    totalGrossSalary?: number;
    cnpsEmployeeTotal?: number;
    cnpsEmployerTotal?: number;
    totalCNPSToPay?: number;
  };
}

// ─── Utilitaires ─────────────────────────────────────────────────────────────

function fmtNum(val: number | string | null | undefined): string {
  if (val === undefined || val === null || val === "") return "0";
  const num = typeof val === "string" ? parseFloat(val) : val;
  if (isNaN(num)) return "0";
  return Math.round(num)
    .toString()
    .replace(/\B(?=(\d{3})+(?!\d))/g, " ");
}

// ─── Sous-Composants de Prévisualisation ─────────────────────────────────────

/** En-tête commun pour Contrats/Attestations/Certificats */
function DocHeader({ companyName, legalForm }: { companyName: string; legalForm: string }) {
  return (
    <>
      {/* Bandeau bleu foncé */}
      <div className="h-[6px] bg-[#1e3a5f] rounded-t-sm" />
      <div className="px-6 pt-3 pb-1">
        <p className="text-[15px] font-bold text-[#1e3a5f] uppercase tracking-wide">
          {companyName} {legalForm ? `(${legalForm})` : ""}
        </p>
        <p className="text-[8px] text-[#646464] mt-0.5">
          {companyName} • BP 5115 ABIDJAN 01 - ABIDJAN • Tél: 0709470671 • Email: erickourai17@gmail.com
        </p>
        <p className="text-[8px] text-[#646464]">
          N° CC : 1234567 A • N° RCCM : CI-ABJ-3000-A 451 • N° CNPS : 123456
        </p>
      </div>
      <div className="mx-6 border-t border-[#ccc]" />
    </>
  );
}

/** Pied de page avec date et signature */
function DocSignature({ city, dateStr, label }: { city: string; dateStr: string; label: string }) {
  return (
    <div className="px-6 mt-12">
      <p className="text-[9px] text-right">Fait à {city}, le {dateStr}</p>
      <p className="text-[9px] font-bold text-right mt-3">{label}</p>
    </div>
  );
}

/* ─── Contrat de Travail ────────────────────────────────────────────────────── */
function ContractPreview({ name, jobTitle, category, salary, sursalaire, transport, joiningDate, contractType, cddMonths, bodyText }: {
  name: string; jobTitle: string; category: string; salary: number; sursalaire: number; transport: number;
  joiningDate: string; contractType: string; cddMonths: number; bodyText: string;
}) {
  const companyName = "LOGIPAIE RH 21";
  return (
    <div className="doc-a4-page bg-white text-[#1e1e1e]" style={{ fontFamily: "Helvetica, Arial, sans-serif" }}>
      <DocHeader companyName={companyName} legalForm="SARL" />
      <div className="px-6 mt-6">
        <h2 className="text-center text-[16px] font-bold mb-6">CONTRAT DE TRAVAIL</h2>
        <p className="text-[10px] mb-2">Entre les soussignés :</p>
        <p className="text-[10px] font-bold mb-1">
          1. La Société {companyName}, représentée par la Direction Générale, ci-après &quot;l&apos;Employeur&quot;.
        </p>
        <p className="text-[10px] font-bold mb-4">
          2. M. {name}, résidant(e) à BP 5115 ABIDJAN 01, ci-après &quot;le Salarié&quot;.
        </p>
        <p className="text-[10px] italic mb-4">Il a été convenu et arrêté ce qui suit :</p>
        <div className="text-[10px] leading-[18px] whitespace-pre-line text-justify">{bodyText}</div>
      </div>
      <div className="px-6 mt-16 flex justify-between">
        <div>
          <p className="text-[9px]">Fait à ABIDJAN, le {new Date().toLocaleDateString("fr-FR")}</p>
          <p className="text-[9px] font-bold mt-4">LE SALARIÉ</p>
        </div>
        <div className="text-right">
          <p className="text-[9px] font-bold mt-[26px]">POUR L&apos;EMPLOYEUR</p>
        </div>
      </div>
    </div>
  );
}

/* ─── Attestation / Certificat ──────────────────────────────────────────────── */
function AttestationPreview({ title, bodyText }: { title: string; bodyText: string }) {
  return (
    <div className="doc-a4-page bg-white text-[#1e1e1e]" style={{ fontFamily: "Helvetica, Arial, sans-serif" }}>
      <DocHeader companyName="LOGIPAIE RH 21" legalForm="SARL" />
      <div className="px-6 mt-8">
        <h2 className="text-center text-[16px] font-bold mb-8">{title}</h2>
        <div className="text-[10px] leading-[18px] whitespace-pre-line text-justify">{bodyText}</div>
      </div>
      <DocSignature city="ABIDJAN" dateStr={new Date().toLocaleDateString("fr-FR")} label="LA DIRECTION GÉNÉRALE" />
    </div>
  );
}

/* ─── Bulletin de Paie ──────────────────────────────────────────────────────── */
function PayslipPreview({
  name,
  jobTitle,
  salary,
  sursalaire,
  transport,
  appearance,
  legal,
  rates,
}: {
  name: string;
  jobTitle: string;
  salary: number;
  sursalaire: number;
  transport: number;
  appearance?: any;
  legal?: any;
  rates?: any;
}) {
  const appearanceConfig = appearance || {
    primaryColor: "#BBD795",
    headerTitle: "BULLETIN DE PAIE",
    headerSubtitle: "",
  };
  const legalConfig = legal || {
    legalNotice:
      "Pour vous aider à faire valoir vos droits, conservez ce bulletin de paie sans limitation de durée. (L 3243-4 du Code du travail)",
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
    { n: "38", label: "FDFP. Taxe Apprentissage", base: "", taux: "", gains: "", retSal: "", tauxPat: ratesConfig.fdfpTA.toFixed(2), retPat: fmtNum(fdfpTAP) },
    { n: "39", label: "FDFP. Taxe Form. Continue", base: "", taux: "", gains: "", retSal: "", tauxPat: ratesConfig.fdfpFPC.toFixed(2), retPat: fmtNum(fdfpTFC) },
    { n: "22", label: "Prime Transport non impos.", base: fmtNum(ratesConfig.transportExemptAmount), taux: "30,00", gains: fmtNum(transport || ratesConfig.transportExemptAmount), retSal: "", tauxPat: "", retPat: "" },
  ];

  return (
    <div className="doc-a4-page bg-white text-[#1e1e1e] text-[7px]" style={{ fontFamily: "Helvetica, Arial, sans-serif" }}>
      {/* En-tête */}
      <div className="flex justify-between px-5 pt-4">
        <div className="flex flex-col">
          {appearanceConfig.logoBase64 && (
            <img src={appearanceConfig.logoBase64} alt="Logo" className="h-8 max-w-[100px] object-contain mb-1 self-start" />
          )}
          <p className="text-[12px] font-bold">LOGIPAIE RH 21</p>
          <p className="text-[7px] text-[#646464]">LOGIPAIE RH 21</p>
          <p className="text-[7px] text-[#646464]">BP 5115 ABIDJAN 01</p>
          <p className="text-[7px] text-[#646464]">N°RCCM : CI-ABJ-3000-A 451 &nbsp; N°CC : 1234567 A</p>
          <p className="text-[7px] text-[#646464]">N°CNPS : 123456</p>
        </div>
        <div className="text-right">
          <p className="text-[14px] font-bold">{appearanceConfig.headerTitle || "BULLETIN DE PAIE"}</p>
          {appearanceConfig.headerSubtitle && (
            <p className="text-[8px] text-[#646464] mt-0.5">{appearanceConfig.headerSubtitle}</p>
          )}
          <p className="text-[9px] mt-1">{monthName} {yearNum}</p>
        </div>
      </div>

      {/* Informations salarié */}
      <div className="flex gap-2 px-5 mt-3">
        <div className="flex-1 text-[8px] font-bold space-y-[3px]">
          <p>Matricule: 001</p>
          <p>CNPS N°: Exonéré</p>
          <p>Direction: ADMINISTRATION</p>
          <p>Service: SECRÉTARIAT EXÉCUTIF</p>
          <p>Emploi: {jobTitle}</p>
          <p>Catégorie: 1A</p>
          <p>Parts IGR: 4.5</p>
          <p>Date entré: 01/02/2020</p>
          <p>Ancienneté: 5 ans</p>
        </div>
        <div
          className="flex-1 rounded-sm p-4 flex flex-col justify-center items-center"
          style={{ backgroundColor: appearanceConfig.primaryColor }}
        >
          <p className="text-[10px] font-bold">M. {name}</p>
          <p className="text-[8px] mt-1">BP 5115 ABIDJAN 01</p>
        </div>
      </div>

      {/* Tableau principal style Capture 1 LOGIPAIE RH */}
      <div className="px-5 mt-3">
        <div className="border border-[#666]">
          {/* Header */}
          <table className="w-full border-collapse text-[7px] border-b border-[#666]">
            <thead>
              <tr className="bg-[#f0f0f0]">
                <th className="border-r border-[#666] px-1 py-1 text-center w-[24px]" rowSpan={2}>N°</th>
                <th className="border-r border-[#666] px-2 py-1 text-center min-w-[140px]" rowSpan={2}>DESIGNATION</th>
                <th className="border-r border-[#666] px-1 py-1 text-center w-[55px]" rowSpan={2}>BASE</th>
                <th className="border-r border-[#666] px-1 py-0.5 text-center border-b border-[#666]" colSpan={3}>PART SALARIALE</th>
                <th className="px-1 py-0.5 text-center border-b border-[#666]" colSpan={2}>PART PATRONALE</th>
              </tr>
              <tr className="bg-[#f0f0f0]">
                <th className="border-r border-[#666] px-1 py-0.5 text-center w-[40px]">Nbre/taux</th>
                <th className="border-r border-[#666] px-1 py-0.5 text-center w-[55px]">GAINS</th>
                <th className="border-r border-[#666] px-1 py-0.5 text-center w-[55px]">RETENUES</th>
                <th className="border-r border-[#666] px-1 py-0.5 text-center w-[40px]">Nbre/taux</th>
                <th className="px-1 py-0.5 text-center w-[55px]">RETENUES</th>
              </tr>
            </thead>
          </table>

          {/* Corps de données avec colonnes verticales séparées sans lignes horizontales intérieures */}
          <table className="w-full border-collapse text-[7px]">
            <tbody>
              {rows.map((r, i) => (
                <tr key={i} className={r.bold ? "font-bold" : ""}>
                  <td className="border-r border-[#666] px-1 py-[2px] text-center w-[24px]">{r.n}</td>
                  <td className="border-r border-[#666] px-2 py-[2px] text-left min-w-[140px]">{r.label}</td>
                  <td className="border-r border-[#666] px-1 py-[2px] text-right w-[55px]">{r.base}</td>
                  <td className="border-r border-[#666] px-1 py-[2px] text-right w-[40px]">{r.taux}</td>
                  <td className="border-r border-[#666] px-1 py-[2px] text-right w-[55px]">{r.gains}</td>
                  <td className="border-r border-[#666] px-1 py-[2px] text-right w-[55px]">{r.retSal}</td>
                  <td className="border-r border-[#666] px-1 py-[2px] text-right w-[40px]">{r.tauxPat}</td>
                  <td className="px-1 py-[2px] text-right w-[55px]">{r.retPat}</td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Ligne totaux avec bordure supérieure */}
          <table className="w-full border-collapse text-[7px] border-t border-[#666] font-bold">
            <tbody>
              <tr>
                <td className="border-r border-[#666] px-1 py-[2px] w-[24px]"></td>
                <td className="border-r border-[#666] px-2 py-[2px] min-w-[140px]"></td>
                <td className="border-r border-[#666] px-1 py-[2px] w-[55px]"></td>
                <td className="border-r border-[#666] px-1 py-[2px] w-[40px]"></td>
                <td className="border-r border-[#666] px-1 py-[2px] text-right w-[55px]">{fmtNum(totalGains)}</td>
                <td className="border-r border-[#666] px-1 py-[2px] text-right w-[55px]">
                  {fmtNum(totalRetSal)}
                </td>
                <td className="border-r border-[#666] px-1 py-[2px] w-[40px]"></td>
                <td className="px-1 py-[2px] text-right w-[55px]">
                  {fmtNum(
                    cnpsPatRet +
                      cnpsAT +
                      cnpsPF +
                      fdfpTFC +
                      fdfpTAP +
                      (showCMU ? cmuEmployerVal : 0)
                  )}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Bande Net à Payer */}
      <div
        className="mx-5 mt-1 flex items-center justify-between px-3 py-2 rounded-sm"
        style={{ backgroundColor: appearanceConfig.primaryColor }}
      >
        <span className="text-[9px] font-bold">50</span>
        <span className="text-[9px] font-bold">Arrondi:</span>
        <span className="text-[9px] font-bold">NET A PAYER :</span>
        <span className="text-[9px] font-bold">{fmtNum(netSalary)} FCFA</span>
      </div>

      {/* Tableau des Cumuls conforme à la capture Excel */}
      <div className="px-5 mt-2">
        <table className="w-full border-collapse text-[6.5px]">
          <thead>
            <tr className="bg-[#f0f0f0] text-center font-bold">
              <th className="border border-[#666] px-1 py-[2px]">CUMULS</th>
              <th className="border border-[#666] px-1 py-[2px]">Heures</th>
              <th className="border border-[#666] px-1 py-[2px]" colSpan={3}>Congés</th>
              <th className="border border-[#666] px-1 py-[2px]">Brut social</th>
              <th className="border border-[#666] px-1 py-[2px]">Brut fiscal</th>
              <th className="border border-[#666] px-1 py-[2px]">ITS</th>
              <th className="border border-[#666] px-1 py-[2px]">Retraite</th>
              <th className="border border-[#666] px-1 py-[2px]">Émargement</th>
            </tr>
          </thead>
          <tbody>
            <tr className="text-center">
              <td className="border border-[#666] px-1 py-[1.5px] font-bold">Période</td>
              <td className="border border-[#666] px-1 py-[1.5px]">173,33</td>
              <td className="border border-[#666] px-1 py-[1.5px]">acquis</td>
              <td className="border border-[#666] px-1 py-[1.5px]">pris</td>
              <td className="border border-[#666] px-1 py-[1.5px]">à Prendre</td>
              <td className="border border-[#666] px-1 py-[1.5px] font-mono">{fmtNum(totalBrut)}</td>
              <td className="border border-[#666] px-1 py-[1.5px] font-mono">{fmtNum(totalBrut)}</td>
              <td className="border border-[#666] px-1 py-[1.5px] font-mono">{fmtNum(itsTax)}</td>
              <td className="border border-[#666] px-1 py-[1.5px] font-mono">{fmtNum(cnpsEmp)}</td>
              <td className="border border-[#666] px-1 py-[1.5px]"></td>
            </tr>
            <tr className="text-center">
              <td className="border border-[#666] px-1 py-[1.5px] font-bold">Année</td>
              <td className="border border-[#666] px-1 py-[1.5px]">173</td>
              <td className="border border-[#666] px-1 py-[1.5px]"></td>
              <td className="border border-[#666] px-1 py-[1.5px]"></td>
              <td className="border border-[#666] px-1 py-[1.5px]"></td>
              <td className="border border-[#666] px-1 py-[1.5px] font-mono">{fmtNum(totalBrut * 12)}</td>
              <td className="border border-[#666] px-1 py-[1.5px] font-mono">{fmtNum(totalBrut * 12)}</td>
              <td className="border border-[#666] px-1 py-[1.5px] font-mono">{fmtNum(itsTax * 12)}</td>
              <td className="border border-[#666] px-1 py-[1.5px] font-mono">{fmtNum(cnpsEmp * 12)}</td>
              <td className="border border-[#666] px-1 py-[1.5px]"></td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Cases de signature si configurées */}
      {(legalConfig.showEmployerStamp || legalConfig.showEmployeeSignature) && (
        <div className="flex justify-between px-5 mt-4 text-[7px] font-bold text-[#505050]">
          <div className="w-[80px]">
            {legalConfig.showEmployerStamp && (
              <>
                <p>Signature & Tampon Employeur</p>
                <div className="border border-[#666] h-[25px] w-full mt-1" />
              </>
            )}
          </div>
          <div className="w-[80px] text-right">
            {legalConfig.showEmployeeSignature && (
              <>
                <p>Émargement Salarié</p>
                <div className="border border-[#666] h-[25px] w-full mt-1" />
              </>
            )}
          </div>
        </div>
      )}

      <p className="text-[7.5px] font-bold text-[#505050] text-center mt-3">
        {legalConfig.legalNotice}
      </p>
    </div>
  );
}

/* ─── Ordre de Virement ─────────────────────────────────────────────────────── */
function OrdreVirementPreview({ bankName, totalAmount, month, year }: {
  bankName: string; totalAmount: number; month: number; year: number;
}) {
  const monthName = new Date(year, month - 1).toLocaleString("fr-FR", { month: "long" }).toUpperCase();
  const dateStr = new Date().toLocaleDateString("fr-FR");

  return (
    <div className="doc-a4-page bg-white text-[#1e1e1e]" style={{ fontFamily: "Helvetica, Arial, sans-serif" }}>
      <DocHeader companyName="LOGIPAIE RH 21" legalForm="SARL" />
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
      <DocSignature city="ABIDJAN" dateStr={dateStr} label="La Direction Générale" />
    </div>
  );
}

/* ─── Déclarations (ITS / FDFP / CNPS) ─────────────────────────────────────── */
function DeclarationPreview({ docType, month, year, itsData, cnpsData }: {
  docType: string; month: number; year: number;
  itsData?: DocumentPreviewModalProps["itsData"];
  cnpsData?: DocumentPreviewModalProps["cnpsData"];
}) {
  const dateStr = new Date().toLocaleDateString("fr-FR");
  const companyName = "LOGIPAIE RH 21";

  if (docType === "declaration_its") {
    const items = [
      ["Nombre de Salariés en Effectif", `${itsData?.totalEmployees || 0}`],
      ["Masse Salariale Brute Totale", `${fmtNum(itsData?.totalGrossSalary)} FCFA`],
      ["IS (Impôt sur Salaire 1.2%)", `${fmtNum(itsData?.totalITS)} FCFA`],
      ["IGR (Impôt Général sur le Revenu)", `${fmtNum(itsData?.totalIGR)} FCFA`],
      ["Contribution Employeur CE (11.50%)", `${fmtNum(itsData?.totalCE)} FCFA`],
    ];
    return (
      <div className="doc-a4-page bg-white text-[#1e1e1e]" style={{ fontFamily: "Helvetica, Arial, sans-serif" }}>
        <DocHeader companyName={companyName} legalForm="SARL" />
        <div className="mx-6 mt-4 bg-[#ea580c] text-white px-4 py-2 rounded-sm">
          <p className="text-[11px] font-bold">DIRECTION GÉNÉRALE DES IMPÔTS (DGI CÔTE D&apos;IVOIRE)</p>
        </div>
        <p className="px-6 mt-3 text-[13px] font-bold">DÉCLARATION DES IMPÔTS SUR LES TRAITEMENTS ET SALAIRES (ITS)</p>
        <div className="mx-6 mt-3 border border-[#c8c8c8] p-3 rounded-sm text-[9px] font-bold space-y-1">
          <div className="flex justify-between">
            <span>CONTRIBUABLE : {companyName}</span>
            <span>N° COMPTE CONTRIBUABLE (NCC) : 1234567 A</span>
          </div>
          <div className="flex justify-between">
            <span>PÉRIODE D&apos;IMPOSITION : {month}/{year}</span>
            <span>RÉGIME : RÉEL NORMAL</span>
          </div>
        </div>
        <div className="px-6 mt-3">
          <table className="w-full border-collapse text-[9px]">
            <thead><tr className="bg-[#ea580c] text-white">
              <th className="border border-[#ea580c] px-2 py-1.5 text-left">NATURE DES IMPÔTS ET CONTRIBUTIONS FISCALES DGI</th>
              <th className="border border-[#ea580c] px-2 py-1.5 text-right">MONTANT (FCFA)</th>
            </tr></thead>
            <tbody>
              {items.map(([label, val], i) => (
                <tr key={i} className={i % 2 === 0 ? "bg-[#fdf2ec]" : ""}>
                  <td className="border border-[#eee] px-2 py-1">{label}</td>
                  <td className="border border-[#eee] px-2 py-1 text-right font-mono">{val}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="mx-6 mt-4 bg-[#1e3a5f] text-white px-4 py-3 rounded-sm">
          <p className="text-[12px] font-bold">TOTAL NET IMPÔTS DGI A PAYER : {fmtNum(itsData?.totalTaxToPay)} FCFA</p>
        </div>
        <DocSignature city="ABIDJAN" dateStr={dateStr} label="CACHET ET SIGNATURE DU CONTRIBUABLE" />
      </div>
    );
  }

  if (docType === "declaration_fdfp") {
    const gross = itsData?.totalGrossSalary || 0;
    const tfc = Math.round(gross * 0.012);
    const tap = Math.round(gross * 0.004);
    const items = [
      ["Masse Salariale Brute Soumise à FDFP", `${fmtNum(gross)} FCFA`],
      ["Taxe de Formation Continue - TFC (1.20%)", `${fmtNum(tfc)} FCFA`],
      ["Taxe d'Apprentissage - TAP (0.40%)", `${fmtNum(tap)} FCFA`],
      ["TOTAL A PAYER FDFP (1.60%)", `${fmtNum(tfc + tap)} FCFA`],
    ];
    return (
      <div className="doc-a4-page bg-white text-[#1e1e1e]" style={{ fontFamily: "Helvetica, Arial, sans-serif" }}>
        <DocHeader companyName={companyName} legalForm="SARL" />
        <div className="mx-6 mt-4 bg-[#10b981] text-white px-4 py-2 rounded-sm">
          <p className="text-[11px] font-bold">DÉCLARATION MENSUELLE FDFP (25-DECLARATION FDFP)</p>
        </div>
        <p className="px-6 mt-3 text-[13px] font-bold">TAXE DE FORMATION CONTINUE &amp; APPRENTISSAGE (FDFP)</p>
        <div className="px-6 mt-3">
          <table className="w-full border-collapse text-[10px]">
            <thead><tr className="bg-[#10b981] text-white">
              <th className="border border-[#10b981] px-2 py-1.5 text-left">RUBRIQUE TAXES ET CONTRIBUTIONS FDFP</th>
              <th className="border border-[#10b981] px-2 py-1.5 text-right">MONTANT (FCFA)</th>
            </tr></thead>
            <tbody>
              {items.map(([label, val], i) => (
                <tr key={i} className={i === items.length - 1 ? "font-bold bg-[#ecfdf5]" : ""}>
                  <td className="border border-[#ddd] px-2 py-1">{label}</td>
                  <td className="border border-[#ddd] px-2 py-1 text-right font-mono">{val}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <DocSignature city="ABIDJAN" dateStr={dateStr} label="CACHET ET SIGNATURE" />
      </div>
    );
  }

  // declaration_cnps
  const cnpsItems = [
    ["Nombre d'Assurés en Effectif", `${cnpsData?.totalEmployees || 0}`],
    ["Salaires Soumis à Cotisations CNPS", `${fmtNum(cnpsData?.totalGrossSalary)} FCFA`],
    ["Cotisation Retraite Part Salariée (6.30%)", `${fmtNum(cnpsData?.cnpsEmployeeTotal)} FCFA`],
    ["Cotisation Retraite Part Patronale (7.70%)", `${fmtNum(cnpsData?.cnpsEmployerTotal)} FCFA`],
    ["Prestations Familiales PF (5.75%)", `${fmtNum((cnpsData?.totalGrossSalary || 0) * 0.0575)} FCFA`],
    ["Accidents du Travail AT (3.00%)", `${fmtNum((cnpsData?.totalGrossSalary || 0) * 0.03)} FCFA`],
  ];

  return (
    <div className="doc-a4-page bg-white text-[#1e1e1e]" style={{ fontFamily: "Helvetica, Arial, sans-serif" }}>
      <DocHeader companyName={companyName} legalForm="SARL" />
      <div className="mx-6 mt-4 bg-[#0ea5e9] text-white px-4 py-2 rounded-sm">
        <p className="text-[11px] font-bold">CNPS - APPEL DE COTISATION MENSUEL (27-DÉCLARATION CNPS)</p>
      </div>
      <div className="px-6 mt-3">
        <table className="w-full border-collapse text-[9px]">
          <thead><tr className="bg-[#0ea5e9] text-white">
            <th className="border border-[#0ea5e9] px-2 py-1.5 text-left">COTISATIONS ET PRESTATIONS CNPS</th>
            <th className="border border-[#0ea5e9] px-2 py-1.5 text-right">MONTANT (FCFA)</th>
          </tr></thead>
          <tbody>
            {cnpsItems.map(([label, val], i) => (
              <tr key={i} className={i % 2 === 0 ? "bg-[#f0f9ff]" : ""}>
                <td className="border border-[#ddd] px-2 py-1">{label}</td>
                <td className="border border-[#ddd] px-2 py-1 text-right font-mono">{val}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="px-6 mt-4">
        <p className="text-[12px] font-bold">TOTAL CHÈQUE CNPS A VERSER : {fmtNum(cnpsData?.totalCNPSToPay)} FCFA</p>
      </div>
      <DocSignature city="ABIDJAN" dateStr={dateStr} label="CACHET ET SIGNATURE" />
    </div>
  );
}

// ─── Composant Principal ─────────────────────────────────────────────────────

export function DocumentPreviewModal({
  isOpen,
  onClose,
  userId = "",
  defaultName = "",
  defaultJobTitle = "Collaborateur",
  defaultDepartment = "Général",
  defaultSalary = 0,
  defaultSursalaire = 0,
  defaultTransport = 30000,
  defaultCategory = "1A",
  defaultJoiningDate = "",
  defaultContractType = "CDI",
  defaultCddMonths = 6,
  startDate = "",
  endDate = "",
  returnDate = "",
  docType,
  bankName = "SOCIÉTÉ GÉNÉRALE CI",
  totalAmount = 0,
  month,
  year,
  itsData,
  cnpsData,
}: DocumentPreviewModalProps) {
  const [activeTab, setActiveTab] = useState<"preview" | "edit">("preview");

  // Configuration du bulletin de paie et taux
  const [payslipAppearance, setPayslipAppearance] = useState<any>(null);
  const [payslipLegal, setPayslipLegal] = useState<any>(null);
  const [ratesConfig, setRatesConfig] = useState<any>(null);

  useEffect(() => {
    if (docType === "payslip" && isOpen) {
      // Charger la configuration d'apparence et mentions légales
      fetch("/api/settings/payslip")
        .then((res) => res.json())
        .then((json) => {
          if (json.success && json.data) {
            setPayslipAppearance(json.data.appearance);
            setPayslipLegal(json.data.legal);
          }
        })
        .catch((err) => console.error("Error loading payslip settings for preview:", err));

      // Charger les taux de paie
      fetch("/api/settings/rates")
        .then((res) => res.json())
        .then((json) => {
          if (json.success && json.data) {
            setRatesConfig(json.data);
          }
        })
        .catch((err) => console.error("Error loading rates for preview:", err));
    }
  }, [docType, isOpen]);

  // ─── État d'édition (copié de DocumentEditorModal) ──────────────────────────
  const [name, setName] = useState(defaultName);
  const [jobTitle, setJobTitle] = useState(defaultJobTitle);
  const [department, setDepartment] = useState(defaultDepartment);
  const [salary, setSalary] = useState(defaultSalary);
  const [sursalaire, setSursalaire] = useState(defaultSursalaire);
  const [transport, setTransport] = useState(defaultTransport);
  const [category, setCategory] = useState(defaultCategory);
  const [leaveStart, setLeaveStart] = useState(startDate);
  const [leaveEnd, setLeaveEnd] = useState(endDate);
  const [leaveReturn, setLeaveReturn] = useState(returnDate);
  const [article1, setArticle1] = useState("");
  const [article2, setArticle2] = useState("");
  const [article3, setArticle3] = useState("");
  const [bodyText, setBodyText] = useState("");
  const [generating, setGenerating] = useState(false);

  // Préremplissage automatique des textes
  useEffect(() => {
    setName(defaultName);
    setJobTitle(defaultJobTitle);
    setDepartment(defaultDepartment);
    setSalary(defaultSalary);
    setSursalaire(defaultSursalaire);
    setTransport(defaultTransport);
    setCategory(defaultCategory);
    setLeaveStart(startDate);
    setLeaveEnd(endDate);
    setLeaveReturn(returnDate);
    setActiveTab("preview");

    const formattedDate = defaultJoiningDate
      ? new Date(defaultJoiningDate).toLocaleDateString("fr-FR")
      : new Date().toLocaleDateString("fr-FR");
    const totalSalaryVal = (defaultSalary || 0) + (defaultSursalaire || 0);

    if (docType === "attestation_conge") {
      setBodyText(
        `Attestons que ${defaultName}, employé(e) dans notre société en qualité de ${defaultJobTitle}, est en Congés annuels du ${startDate || formattedDate} au ${endDate || new Date().toLocaleDateString("fr-FR")} inclus.\n\nLa reprise du travail est fixée au ${returnDate || new Date().toLocaleDateString("fr-FR")} à 08 heures 00.\n\nEn foi de quoi, nous lui délivrons le présent certificat, pour servir et valoir ce que de droit.`
      );
    } else if (docType === "attestation") {
      setBodyText(
        `Attestons que ${defaultName}, est employé(e) dans notre société en qualité de ${defaultJobTitle}, catégorie ${defaultCategory}, depuis le ${formattedDate}.\n\nEn foi de quoi, nous lui délivrons la présente attestation, pour servir et valoir ce que de droit.`
      );
    } else if (docType === "certificat") {
      setBodyText(
        `Certifions que M. / Mme ${defaultName} a été employé(e) dans notre société du ${formattedDate} au ${new Date().toLocaleDateString("fr-FR")} en qualité de ${defaultJobTitle}, libre de tout engagement à compter de ce jour.`
      );
    } else if (docType === "contract") {
      if (defaultContractType === "CDD") {
        setArticle1(`Article 1er : ${defaultName} est engagé(e) pour une période de ${defaultCddMonths} mois, allant du ${formattedDate}, au poste de ${defaultJobTitle}, correspondant à la catégorie professionnelle ${defaultCategory}, conformément à la Convention Collective Interprofessionnelle (CCI).`);
        setArticle2(`Article 2 : Le présent contrat ne peut être rompu avant terme que pour force majeure, accord commun ou faute lourde de l'une des parties.`);
      } else {
        setArticle1(`Article 1er : ${defaultName} est engagé(e) à la date du ${formattedDate}, au poste de ${defaultJobTitle}, correspondant à la catégorie professionnelle ${defaultCategory}, conformément à la Convention Collective Interprofessionnelle (CCI).`);
        setArticle2(`Article 2 : Le présent contrat prend fin sur décision unilatérale de l'une ou l'autre des parties au contrat, conformément aux dispositions du Code du Travail.`);
      }
      setArticle3(`Article 3 : ${defaultName} percevra une rémunération mensuelle brute de ${fmtNum(totalSalaryVal)} FCFA et une prime de transport de ${fmtNum(defaultTransport)} FCFA.`);
      setBodyText(`Formule d'engagement contractuel régie par la loi n°2015-532 portant Code du Travail de la République de Côte d'Ivoire.`);
    } else if (docType === "payslip") {
      setBodyText(`Bulletin de paie individuel calculé selon le barème officiel LOGIPAIE RH.`);
    }
  }, [defaultName, defaultJobTitle, defaultDepartment, defaultSalary, defaultSursalaire, defaultTransport, defaultCategory, defaultJoiningDate, defaultContractType, defaultCddMonths, startDate, endDate, returnDate, docType, isOpen]);

  // ─── Téléchargement PDF ─────────────────────────────────────────────────────
  const handleDownload = async () => {
    setGenerating(true);
    try {
      const fullTextCombined = docType === "contract"
        ? `${article1}\n\n${article2}\n\n${article3}\n\n${bodyText}`
        : bodyText;

      const payload: Record<string, unknown> = {
        userId,
        docType,
        customName: name,
        customJobTitle: jobTitle,
        customDepartment: department,
        customSalary: salary,
        customSursalaire: sursalaire,
        customBodyText: fullTextCombined,
        startDate: leaveStart,
        endDate: leaveEnd,
        returnDate: leaveReturn,
      };

      // Props spécifiques aux déclarations et virements
      if (docType === "ordre_virement") {
        payload.bankName = bankName;
        payload.totalAmount = totalAmount;
        payload.month = month;
        payload.year = year;
      }
      if (docType.startsWith("declaration_")) {
        payload.month = month;
        payload.year = year;
        payload.itsData = itsData;
        payload.cnpsData = cnpsData;
      }

      const res = await fetch("/api/documents/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        const blob = await res.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `${docType}-${(name || "document").toLowerCase().replace(/\s+/g, "-")}-${Date.now()}.pdf`;
        document.body.appendChild(a);
        a.click();
        a.remove();
        onClose();
      } else {
        const errJson = await res.json().catch(() => ({}));
        alert(errJson.error || "Erreur lors de la génération du document PDF");
      }
    } catch (error) {
      console.error("Generate error:", error);
      alert("Erreur lors de la génération du document");
    } finally {
      setGenerating(false);
    }
  };

  // ─── Titres ─────────────────────────────────────────────────────────────────
  const docTypeLabels: Record<string, string> = {
    contract: "Contrat de Travail",
    attestation: "Attestation de Travail",
    certificat: "Certificat de Travail",
    payslip: "Bulletin de Paie",
    attestation_conge: "Attestation de Congé Payé",
    ordre_virement: "Ordre de Virement",
    declaration_its: "Déclaration ITS (DGI)",
    declaration_fdfp: "Déclaration FDFP",
    declaration_cnps: "Déclaration CNPS",
  };

  const isEditable = ["contract", "attestation", "certificat", "payslip", "attestation_conge"].includes(docType);

  // ─── Rendu de la Prévisualisation ───────────────────────────────────────────
  const renderPreview = () => {
    const fullBody = docType === "contract"
      ? `${article1}\n\n${article2}\n\n${article3}\n\n${bodyText}`
      : bodyText;

    switch (docType) {
      case "contract":
        return (
          <ContractPreview
            name={name} jobTitle={jobTitle} category={category}
            salary={salary} sursalaire={sursalaire} transport={transport}
            joiningDate={defaultJoiningDate || ""} contractType={defaultContractType || "CDI"}
            cddMonths={defaultCddMonths || 6} bodyText={fullBody}
          />
        );
      case "attestation":
        return <AttestationPreview title="ATTESTATION DE TRAVAIL" bodyText={bodyText} />;
      case "certificat":
        return <AttestationPreview title="CERTIFICAT DE TRAVAIL" bodyText={bodyText} />;
      case "attestation_conge":
        return <AttestationPreview title="ATTESTATION DE CONGÉ PAYÉ" bodyText={bodyText} />;
      case "payslip":
        return (
          <PayslipPreview
            name={name}
            jobTitle={jobTitle}
            salary={salary}
            sursalaire={sursalaire}
            transport={transport}
            appearance={payslipAppearance}
            legal={payslipLegal}
            rates={ratesConfig}
          />
        );
      case "ordre_virement":
        return <OrdreVirementPreview bankName={bankName || ""} totalAmount={totalAmount || 0} month={month || 1} year={year || 2026} />;
      case "declaration_its":
      case "declaration_fdfp":
      case "declaration_cnps":
        return <DeclarationPreview docType={docType} month={month || 1} year={year || 2026} itsData={itsData} cnpsData={cnpsData} />;
      default:
        return <AttestationPreview title="DOCUMENT RH OFFICIEL" bodyText={bodyText} />;
    }
  };

  // ─── Rendu de l'Éditeur ─────────────────────────────────────────────────────
  const renderEditor = () => {
    return (
      <div className="space-y-4 p-1">
        <div className="p-3 bg-[var(--neu-surface-light)] rounded-lg text-xs text-[var(--neu-text-secondary)] border border-[var(--neu-border)] flex items-center gap-2">
          <Edit3 className="w-4 h-4 text-[var(--neu-accent)] shrink-0" />
          Toutes les phrases sont pré-remplies dynamiquement. Vous pouvez tout modifier avant d&apos;imprimer.
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <NeuInput label="Nom & Prénom du Salarié" value={name} onChange={(e) => setName(e.target.value)} />
          <NeuInput label="Poste / Emploi" value={jobTitle} onChange={(e) => setJobTitle(e.target.value)} />
        </div>

        {docType === "attestation_conge" && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <NeuInput label="Date Début Congé" type="text" value={leaveStart} onChange={(e) => setLeaveStart(e.target.value)} />
            <NeuInput label="Date Fin Congé" type="text" value={leaveEnd} onChange={(e) => setLeaveEnd(e.target.value)} />
            <NeuInput label="Date Reprise Travail" type="text" value={leaveReturn} onChange={(e) => setLeaveReturn(e.target.value)} />
          </div>
        )}

        {docType === "contract" ? (
          <div className="space-y-3">
            <div>
              <label className="block text-xs font-semibold text-[var(--neu-text-secondary)] mb-1">Article 1</label>
              <textarea value={article1} onChange={(e) => setArticle1(e.target.value)} rows={3} className="w-full px-3 py-2 rounded bg-[var(--neu-surface)] text-[var(--neu-text)] border border-[var(--neu-border)] text-xs outline-none focus:border-[var(--neu-accent)]" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-[var(--neu-text-secondary)] mb-1">Article 2</label>
              <textarea value={article2} onChange={(e) => setArticle2(e.target.value)} rows={3} className="w-full px-3 py-2 rounded bg-[var(--neu-surface)] text-[var(--neu-text)] border border-[var(--neu-border)] text-xs outline-none focus:border-[var(--neu-accent)]" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-[var(--neu-text-secondary)] mb-1">Article 3</label>
              <textarea value={article3} onChange={(e) => setArticle3(e.target.value)} rows={3} className="w-full px-3 py-2 rounded bg-[var(--neu-surface)] text-[var(--neu-text)] border border-[var(--neu-border)] text-xs outline-none focus:border-[var(--neu-accent)]" />
            </div>
          </div>
        ) : (
          <div>
            <label className="block text-xs font-semibold text-[var(--neu-text-secondary)] mb-1">
              Corps du Texte (Dynamique & Éditable)
            </label>
            <textarea
              value={bodyText}
              onChange={(e) => setBodyText(e.target.value)}
              rows={6}
              className="w-full px-3 py-2 rounded bg-[var(--neu-surface)] text-[var(--neu-text)] border border-[var(--neu-border)] text-xs outline-none focus:border-[var(--neu-accent)]"
            />
          </div>
        )}
      </div>
    );
  };

  return (
    <NeuDialog
      open={isOpen}
      onClose={onClose}
      title={`${docTypeLabels[docType] || docType.toUpperCase()}`}
      className="!max-w-4xl"
    >
      <div className="space-y-4">
        {/* Onglets Prévisualisation / Édition */}
        {isEditable && (
          <div className="flex gap-1 bg-[var(--neu-surface-light)] p-1 rounded-lg border border-[var(--neu-border)]">
            <button
              onClick={() => setActiveTab("preview")}
              className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-md text-xs font-semibold transition-all ${
                activeTab === "preview"
                  ? "bg-[var(--neu-accent)] text-white shadow-md"
                  : "text-[var(--neu-text-secondary)] hover:bg-[var(--neu-surface)]"
              }`}
            >
              <Eye className="w-3.5 h-3.5" /> Prévisualisation A4
            </button>
            <button
              onClick={() => setActiveTab("edit")}
              className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-md text-xs font-semibold transition-all ${
                activeTab === "edit"
                  ? "bg-[var(--neu-accent)] text-white shadow-md"
                  : "text-[var(--neu-text-secondary)] hover:bg-[var(--neu-surface)]"
              }`}
            >
              <Edit3 className="w-3.5 h-3.5" /> Éditer le Contenu
            </button>
          </div>
        )}

        {/* Zone de contenu */}
        {activeTab === "preview" ? (
          <div className="bg-[#e8e8e8] rounded-lg p-4 max-h-[70vh] overflow-y-auto print:p-0 print:bg-white print:max-h-none">
            <div className="mx-auto shadow-xl print:shadow-none" style={{ width: "595px", minHeight: "842px" }}>
              {renderPreview()}
            </div>
          </div>
        ) : (
          <div className="max-h-[70vh] overflow-y-auto">
            {renderEditor()}
          </div>
        )}

        {/* Boutons d'action */}
        <div className="flex gap-3 pt-3 border-t border-[var(--neu-border)]">
          <NeuButton variant="accent" onClick={handleDownload} loading={generating} className="flex-1">
            <Download className="w-4 h-4 mr-2" /> Générer & Télécharger le PDF
          </NeuButton>
          {activeTab === "edit" && (
            <NeuButton variant="ghost" onClick={() => setActiveTab("preview")}>
              <Eye className="w-4 h-4 mr-1" /> Aperçu
            </NeuButton>
          )}
          <NeuButton variant="ghost" onClick={onClose} disabled={generating}>
            Fermer
          </NeuButton>
        </div>
      </div>

      {/* CSS pour l'impression Ctrl+P */}
      <style jsx global>{`
        .doc-a4-page {
          width: 595px;
          min-height: 842px;
          padding-bottom: 24px;
        }
        @media print {
          body * { visibility: hidden !important; }
          .doc-a4-page, .doc-a4-page * { visibility: visible !important; }
          .doc-a4-page {
            position: absolute;
            left: 0;
            top: 0;
            width: 210mm;
            min-height: 297mm;
          }
        }
      `}</style>
    </NeuDialog>
  );
}
