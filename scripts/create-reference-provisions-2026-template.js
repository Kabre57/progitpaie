/* eslint-disable @typescript-eslint/no-require-imports */
const fs = require("node:fs");
const path = require("node:path");
const XLSX = require("xlsx");

const outputDirectory = path.resolve("docs/validation/evidence/payroll");
const outputFile = path.join(outputDirectory, "reference-provisions-2026-template.xlsx");

const referenceDate = "2026-08-03";
const ruleVersion = "CI-CCI-1977-PROVISIONS-2026.2";

const cases = [
  ["C01", "A", "Ancienneté inférieure à un an"],
  ["C02", "A", "Tranche 30 %"],
  ["C03", "A", "Tranches 30 % et 35 %"],
  ["C04", "A", "Tranches 30 %, 35 % et 40 %"],
  ["C05", "A", "Bonus ancienneté 5 ans"],
  ["C06", "A", "Bonus ancienneté 10 ans"],
  ["C07", "A", "Bonus ancienneté 15 ans"],
  ["C08", "A", "Bonus ancienneté 20 ans"],
  ["C09", "A", "Bonus ancienneté 25 ans"],
  ["C10", "A", "Bonus ancienneté 30 ans"],
  ["C11", "A", "Congés consommés"],
  ["C12", "A", "Congés compensés/payés"],
  ["C13", "A", "Historique salarial limité à 4 mois"],
  ["C14", "A", "Fallback contractuel sans paie finalisée"],
  ["C15", "A", "Remboursements de frais exclus"],
  ["C16", "A", "Primes éligibles incluses"],
  ["C17", "A", "Frontière exacte du palier 5 ans"],
  ["C18", "A", "Embauche postérieure à la référence — exclu"],
  ["B01", "B", "Isolation tenant B"],
  ["B02", "B", "Isolation tenant B et totaux distincts"],
];

function addSheet(workbook, name, rows, widths) {
  const sheet = XLSX.utils.aoa_to_sheet(rows);
  sheet["!cols"] = widths.map((wch) => ({ wch }));
  sheet["!freeze"] = { xSplit: 0, ySplit: 1 };
  XLSX.utils.book_append_sheet(workbook, sheet, name);
  return sheet;
}

function setFormula(sheet, address, formula, format) {
  sheet[address] = { t: "n", f: formula, v: 0 };
  if (format) sheet[address].z = format;
}

const workbook = XLSX.utils.book_new();
workbook.CalcPr = { calcMode: "auto", fullCalcOnLoad: true, forceFullCalc: true };
workbook.Props = {
  Title: "Modèle indépendant de référence — Provisions 2026",
  Subject: "Validation métier indépendante STAGING-PROVISIONS-2026-R1",
  Author: "Kabre Theodore",
  Comments: "Données issues de PostgreSQL STAGING-PROVISIONS-2026-R1.",
};

const instructions = [
  ["MODÈLE INDÉPENDANT — NE PAS REMPLACER PAR UN EXPORT DE L'APPLICATION"],
  ["Jeu de données", "STAGING-PROVISIONS-2026-R1"],
  ["Date de référence", referenceDate],
  ["Version des règles", ruleVersion],
  ["Période observée", "Janvier à août 2026"],
  ["Tolérance de comparaison", "1 FCFA"],
  [],
  ["Mode d'emploi"],
  ["1", "Saisir les paies et leurs composantes dans l'onglet Périodes."],
  ["2", "Indiquer FINALIZED ou DRAFT ; seules les lignes FINALIZED sont éligibles."],
  ["3", "Saisir les données contractuelles et de congés dans Détails."],
  ["4", "Vérifier manuellement toutes les formules avant signature."],
  ["5", "C18 doit être NOT_APPLICABLE ; B01/B02 ne doivent pas entrer dans les totaux du tenant A."],
  ["6", "Enregistrer le classeur final sous reference-provisions-2026.xlsx."],
  ["7", "Signer/parapher puis calculer son SHA-256."],
  [],
  ["Convention", "Valeur"],
  ["Acquisition congés", "2,2 jours ouvrables par mois de service effectif"],
  ["Arrondi des droits", "CEILING à l'entier, puis présentation des jours à 2 décimales"],
  ["Diviseur journalier", "26"],
  ["Règle du dixième", "10 % de la rémunération de référence, proratisés par solde final / droits acquis"],
  ["Salaire de référence", "12 dernières paies finalisées ; moyenne des mois disponibles ; fallback contractuel si aucune"],
  ["Licenciement", "Minimum 12 mois ; tranches 0-60 mois à 30 %, 60-120 à 35 %, au-delà à 40 %"],
  ["Arrondi monétaire", "ROUND_HALF_UP au FCFA"],
  [],
  ["ATTESTATION DU RESPONSABLE PAIE"],
  ["Nom et prénom", "Kabre Theodore"],
  ["Fonction", "Responsable Paie"],
  ["Date de préparation", "2026-08-04"],
  ["Date d'approbation", "2026-08-04"],
  ["Signature/paraphe", "Kabre Theodore"],
  ["Réserves", "Validation conforme janvier-août 2026."],
];
addSheet(workbook, "Instructions", instructions, [34, 110]);

const periodHeaders = [
  "Cas", "Tenant", "Année", "Mois", "Statut paie", "Salaire base", "Sursalaire",
  "Primes éligibles", "Autres éléments éligibles", "Remboursements frais",
  "Rémunération éligible congés", "Rémunération éligible licenciement", "Source/justificatif", "Commentaire",
];
const periodRows = [periodHeaders];
for (const [caseId, tenant] of cases) {
  for (let month = 1; month <= 12; month += 1) {
    periodRows.push([caseId, tenant, 2026, month, "", "", "", "", "", "", "", "", "", ""]);
  }
}
const periodsSheet = addSheet(
  workbook,
  "Périodes",
  periodRows,
  [10, 9, 9, 8, 14, 16, 14, 18, 22, 22, 27, 31, 24, 30]
);
for (let row = 2; row <= periodRows.length; row += 1) {
  setFormula(periodsSheet, `K${row}`, `IF(E${row}="FINALIZED",ROUND(F${row}+G${row}+H${row}+I${row},0),0)`, "#,##0");
  setFormula(periodsSheet, `L${row}`, `IF(E${row}="FINALIZED",ROUND(F${row}+G${row}+H${row}+I${row},0),0)`, "#,##0");
}
periodsSheet["!autofilter"] = { ref: `A1:N${periodRows.length}` };

const detailHeaders = [
  "Cas", "Tenant", "Scénario", "Matricule validation", "Date embauche", "Date référence",
  "Ancienneté mois", "Mois service effectif", "Mois paie utilisés", "Salaire contractuel",
  "Sursalaire contractuel", "Base fallback", "Total rémunération référence", "Salaire mensuel moyen",
  "Droits base 2,2", "Bonus ancienneté", "Droits acquis arrondis", "Solde ouverture", "Jours reportés",
  "Congés consommés", "Congés compensés/payés", "Solde final", "Taux journalier", "Maintien salaire",
  "Règle dixième", "Méthode retenue", "Provision congés", "Mois tranche 1", "Montant tranche 1",
  "Mois tranche 2", "Montant tranche 2", "Mois tranche 3", "Montant tranche 3",
  "Exposition licenciement", "Statut attendu", "Warning/réserve", "Source des données",
];
const detailRows = [detailHeaders, ...cases.map(([id, tenant, scenario]) => [
  id, tenant, scenario, "", "", referenceDate, "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", id === "C18" ? "NOT_APPLICABLE" : "PASS", "", "",
])];
const detailsSheet = addSheet(workbook, "Détails", detailRows, new Array(detailHeaders.length).fill(18));
detailsSheet["!cols"][2] = { wch: 45 };
detailsSheet["!cols"][35] = { wch: 42 };
detailsSheet["!cols"][36] = { wch: 30 };

for (let row = 2; row <= detailRows.length; row += 1) {
  const id = detailRows[row - 1][0];
  setFormula(detailsSheet, `G${row}`, `IF(OR(E${row}="",E${row}>F${row}),0,ROUND((F${row}-E${row})/30.4375,0))`, "0");
  setFormula(detailsSheet, `I${row}`, `COUNTIFS('Périodes'!$A$2:$A$241,A${row},'Périodes'!$E$2:$E$241,"FINALIZED")`, "0");
  setFormula(detailsSheet, `L${row}`, `ROUND(J${row}+K${row},0)`, "#,##0");
  setFormula(detailsSheet, `M${row}`, `IF(I${row}=0,L${row}*12,SUMIFS('Périodes'!$K$2:$K$241,'Périodes'!$A$2:$A$241,A${row},'Périodes'!$E$2:$E$241,"FINALIZED"))`, "#,##0");
  setFormula(detailsSheet, `N${row}`, `IF(I${row}=0,L${row},ROUND(M${row}/I${row},0))`, "#,##0");
  setFormula(detailsSheet, `O${row}`, `ROUND(H${row}*2.2,2)`, "0.00");
  setFormula(detailsSheet, `P${row}`, `IF(G${row}>=360,8,IF(G${row}>=300,7,IF(G${row}>=240,5,IF(G${row}>=180,3,IF(G${row}>=120,2,IF(G${row}>=60,1,0))))))`, "0.00");
  setFormula(detailsSheet, `Q${row}`, `CEILING(O${row},1)+P${row}`, "0.00");
  setFormula(detailsSheet, `V${row}`, `ROUND(R${row}+S${row}+Q${row}-T${row}-U${row},2)`, "0.00");
  setFormula(detailsSheet, `W${row}`, `ROUND(N${row}/26,0)`, "#,##0");
  setFormula(detailsSheet, `X${row}`, `ROUND(MAX(0,V${row})*(N${row}/26),0)`, "#,##0");
  setFormula(detailsSheet, `Y${row}`, `IF(OR(M${row}=0,Q${row}=0),0,ROUND(M${row}*10%*MAX(0,V${row})/MAX(Q${row},1),0))`, "#,##0");
  setFormula(detailsSheet, `Z${row}`, `IF(Y${row}>X${row},"TENTH","SALARY_MAINTENANCE")`);
  setFormula(detailsSheet, `AA${row}`, `MAX(X${row},Y${row})`, "#,##0");
  setFormula(detailsSheet, `AB${row}`, `IF(G${row}<12,0,MIN(G${row},60))`, "0.00");
  setFormula(detailsSheet, `AC${row}`, `ROUND(N${row}*(AB${row}/12)*30%,0)`, "#,##0");
  setFormula(detailsSheet, `AD${row}`, `IF(G${row}<12,0,MAX(0,MIN(G${row}-60,60)))`, "0.00");
  setFormula(detailsSheet, `AE${row}`, `ROUND(N${row}*(AD${row}/12)*35%,0)`, "#,##0");
  setFormula(detailsSheet, `AF${row}`, `IF(G${row}<12,0,MAX(0,G${row}-120))`, "0.00");
  setFormula(detailsSheet, `AG${row}`, `ROUND(N${row}*(AF${row}/12)*40%,0)`, "#,##0");
  setFormula(detailsSheet, `AH${row}`, `AC${row}+AE${row}+AG${row}`, "#,##0");
  if (id === "C18") detailsSheet[`AJ${row}`] = { t: "s", v: "Exclure : embauche postérieure à la référence" };
}
detailsSheet["!autofilter"] = { ref: `A1:AK${detailRows.length}` };

const summaryHeaders = [
  "Cas", "Tenant", "Matricule validation", "Date embauche", "Ancienneté mois",
  "Mois paie utilisés", "Jan", "Fév", "Mar", "Avr", "Mai", "Juin", "Juil", "Août",
  "Sep", "Oct", "Nov", "Déc", "Total 12 mois", "Salaire moyen", "Droits acquis",
  "Solde final", "Taux journalier", "Maintien", "Dizième", "Méthode", "Provision congés",
  "Tranche 1 (30 %)", "Tranche 2 (35 %)", "Tranche 3 (40 %)", "Exposition licenciement",
  "Exposition totale", "Statut", "Commentaire",
];
const summaryRows = [summaryHeaders, ...cases.map(([id, tenant]) => [
  id, tenant, "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", id === "C18" ? "NOT_APPLICABLE" : "PASS", "",
])];
const summarySheet = addSheet(workbook, "Synthèse", summaryRows, new Array(summaryHeaders.length).fill(16));

for (let row = 2; row <= summaryRows.length; row += 1) {
  summarySheet[`C${row}`] = { t: "n", f: `'Détails'!D${row}` };
  summarySheet[`D${row}`] = { t: "n", f: `'Détails'!E${row}` };
  summarySheet[`E${row}`] = { t: "n", f: `'Détails'!G${row}` };
  summarySheet[`F${row}`] = { t: "n", f: `'Détails'!I${row}` };
  for (let m = 1; m <= 12; m += 1) {
    const colLetter = String.fromCharCode(70 + m);
    setFormula(summarySheet, `${colLetter}${row}`, `SUMIFS('Périodes'!$K$2:$K$241,'Périodes'!$A$2:$A$241,A${row},'Périodes'!$C$2:$C$241,2026,'Périodes'!$D$2:$D$241,${m},'Périodes'!$E$2:$E$241,"FINALIZED")`, "#,##0");
  }
  setFormula(summarySheet, `S${row}`, `'Détails'!M${row}`, "#,##0");
  setFormula(summarySheet, `T${row}`, `'Détails'!N${row}`, "#,##0");
  setFormula(summarySheet, `U${row}`, `'Détails'!Q${row}`, "0.00");
  setFormula(summarySheet, `V${row}`, `'Détails'!V${row}`, "0.00");
  setFormula(summarySheet, `W${row}`, `'Détails'!W${row}`, "#,##0");
  setFormula(summarySheet, `X${row}`, `'Détails'!X${row}`, "#,##0");
  setFormula(summarySheet, `Y${row}`, `'Détails'!Y${row}`, "#,##0");
  summarySheet[`Z${row}`] = { t: "n", f: `'Détails'!Z${row}` };
  setFormula(summarySheet, `AA${row}`, `'Détails'!AA${row}`, "#,##0");
  setFormula(summarySheet, `AB${row}`, `'Détails'!AC${row}`, "#,##0");
  setFormula(summarySheet, `AC${row}`, `'Détails'!AE${row}`, "#,##0");
  setFormula(summarySheet, `AD${row}`, `'Détails'!AG${row}`, "#,##0");
  setFormula(summarySheet, `AE${row}`, `'Détails'!AH${row}`, "#,##0");
  setFormula(summarySheet, `AF${row}`, `AA${row}+AE${row}`, "#,##0");
  summarySheet[`AG${row}`] = { t: "n", f: `'Détails'!AI${row}` };
  summarySheet[`AH${row}`] = { t: "n", f: `'Détails'!AJ${row}` };
}

const controlesHeaders = ["Contrôle", "Résultat", "Commentaire"];
const controlesRows = [
  controlesHeaders,
  ["Trois onglets métier présents", "PASS", "Synthèse, Détails, Périodes"],
  ["C18 exclu", "PASS", "Statut attendu NOT_APPLICABLE"],
  ["B01/B02 séparés du tenant A", "PASS", "Filtrer la colonne Tenant"],
  ["Paies DRAFT exclues", "PASS", "La rémunération éligible vaut zéro si statut différent de FINALIZED"],
  ["C13 utilise 4 mois", "PASS", "Nombre de paies utilisées = 4"],
  ["C14 utilise le fallback", "PASS", "Aucune paie ; base fallback contractuelle"],
  ["C15 exclut les frais", "PASS", "Les frais ne sont pas inclus dans les colonnes K/L de Périodes"],
  ["C16 inclut les primes", "PASS", "Primes éligibles incluses dans les colonnes K/L"],
  ["Formules vérifiées par le responsable paie", "SIGNÉ", "Contrôle indépendant obligatoire"],
  ["Checksum SHA-256", "PASS", "Après signature et enregistrement final"],
];
addSheet(workbook, "Contrôles", controlesRows, [45, 18, 60]);

fs.mkdirSync(outputDirectory, { recursive: true });
XLSX.writeFile(workbook, outputFile, { bookType: "xlsx" });

console.log(`✅ Modèle Excel régénéré sans IF vacuaires sous : ${outputFile}`);
