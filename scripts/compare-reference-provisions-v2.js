async function main() {
  const fs = await import("node:fs");
  const path = await import("node:path");
  const { default: ExcelJS } = await import("exceljs");
  const { Workbook } = ExcelJS;

  const root = process.cwd();
  const workbookPath = path.join(root, "docs/validation/evidence/payroll/reference-provisions-2026.xlsx");
  const tenantAPath = path.join(root, "docs/validation/evidence/comparison/tenant-a-provisions-v2-2026-08-03.json");
  const tenantBPath = path.join(root, "docs/validation/evidence/comparison/tenant-b-provisions-v2-2026-08-03.json");
  const outputPath = path.join(root, "docs/validation/phase-e-day4-differences.csv");

  function table(worksheet) {
    const headerRowNumber = worksheet.getRow(1).getCell(1).text === "Cas" ? 1 : 2;
    const headerRow = worksheet.getRow(headerRowNumber);
    const headers = [];
    headerRow.eachCell({ includeEmpty: true }, (cell, columnNumber) => {
      headers[columnNumber] = cell.text.trim();
    });

    const rows = [];
    for (let rowNumber = headerRowNumber + 1; rowNumber <= worksheet.rowCount; rowNumber += 1) {
      const row = worksheet.getRow(rowNumber);
      const record = {};
      let hasValue = false;
      headers.forEach((header, columnNumber) => {
        if (!header || columnNumber === 0) return;
        const value = row.getCell(columnNumber).text;
        record[header] = value;
        hasValue ||= value !== "";
      });
      if (hasValue) rows.push(record);
    }
    return rows;
  }

  function numeric(value) {
    if (typeof value === "number") return value;
    if (typeof value !== "string" || value.trim() === "") return null;
    const normalized = value.replace(/\s/g, "").replace(",", ".");
    const result = Number(normalized);
    return Number.isFinite(result) ? result : null;
  }

  function csv(value) {
    const text = value === null || value === undefined ? "" : String(value);
    return /[",\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
  }

  const workbook = new Workbook();
  await workbook.xlsx.readFile(workbookPath);
  const details = workbook.getWorksheet("Détails");
  if (!details) throw new Error("Feuille Détails absente du classeur de référence");
  const referenceRows = table(details);
  const payloads = {
    A: JSON.parse(fs.readFileSync(tenantAPath, "utf8")).data,
    B: JSON.parse(fs.readFileSync(tenantBPath, "utf8")).data,
  };

  const comparisons = [];
  function add({ tenant, caseId, employeeId, domain, field, referenceValue, v2Value, tolerance = 0, kind = "number", explanation = "" }) {
    let difference = "";
    let status;
    if (kind === "not-applicable") {
      status = "NOT_APPLICABLE";
    } else if (referenceValue === "" || referenceValue === null || referenceValue === undefined || v2Value === null || v2Value === undefined) {
      status = "BLOCKED";
    } else if (kind === "exact") {
      status = String(referenceValue) === String(v2Value) ? "PASS" : "FAIL";
    } else {
      const referenceNumber = numeric(referenceValue);
      const v2Number = numeric(v2Value);
      if (referenceNumber === null || v2Number === null) {
        status = "BLOCKED";
      } else {
        difference = Number((v2Number - referenceNumber).toFixed(4));
        status = Math.abs(difference) <= tolerance ? "PASS" : "FAIL";
      }
    }
    comparisons.push({ tenant, caseId, employeeId, domain, field, referenceValue, v2Value, difference, tolerance, status, explanation });
  }

  const fieldMappings = [
    ["leave", "seniorityMonths", "Ancienneté mois", "seniorityMonths", 0.01],
    ["leave", "effectiveServiceMonths", "Mois service effectif", "effectiveServiceMonths", 0.01],
    ["salary", "salaryMonthsUsed", "Mois paie utilisés", "salaryMonthsUsed", 0],
    ["salary", "averageMonthlySalary", "Salaire mensuel moyen", "averageMonthlySalary", 1],
    ["leave", "baseAccruedDays", "Droits base 2,2", "baseAccruedDays", 0.01],
    ["leave", "seniorityBonusDays", "Bonus ancienneté", "seniorityBonusDays", 0.01],
    ["leave", "openingBalanceDays", "Solde ouverture", "openingBalanceDays", 0.01],
    ["leave", "carriedForwardDays", "Jours reportés", "carriedForwardDays", 0.01],
    ["leave", "consumedDays", "Congés consommés", "consumedDays", 0.01],
    ["leave", "compensatedDays", "Congés compensés/payés", "compensatedDays", 0.01],
    ["leave", "closingBalanceDays", "Solde final", "closingBalanceDays", 0.01],
    ["leave", "salaryMaintenanceDailyRate", "Taux journalier", "salaryMaintenanceDailyRate", 1],
    ["leave", "salaryMaintenanceAmount", "Maintien salaire", "salaryMaintenanceAmount", 1],
    ["leave", "tenthRuleAmount", "Règle dixième", "tenthRuleAmount", 1],
    ["leave", "selectedMethod", "Méthode retenue", "selectedMethod", 0, "exact"],
    ["leave", "provisionAmount", "Provision congés", "provisionAmount", 1],
  ];
  const terminationMappings = [
    ["salary", "terminationAverageMonthlySalary", "Salaire mensuel moyen", "averageMonthlySalary", 1],
    ["termination", "firstTrancheMonths", "Mois tranche 1", "firstTrancheMonths", 0.01],
    ["termination", "firstTrancheAmount", "Montant tranche 1", "firstTrancheAmount", 1],
    ["termination", "secondTrancheMonths", "Mois tranche 2", "secondTrancheMonths", 0.01],
    ["termination", "secondTrancheAmount", "Montant tranche 2", "secondTrancheAmount", 1],
    ["termination", "thirdTrancheMonths", "Mois tranche 3", "thirdTrancheMonths", 0.01],
    ["termination", "thirdTrancheAmount", "Montant tranche 3", "thirdTrancheAmount", 1],
    ["termination", "theoreticalExposure", "Exposition licenciement", "theoreticalExposure", 1],
  ];

  for (const reference of referenceRows) {
    const caseId = String(reference.Cas);
    const tenant = String(reference.Tenant);
    const employeeId = String(reference["Matricule validation"]);
    const leave = payloads[tenant].leaveProvisions.find((item) => item.employeeId === employeeId);
    const termination = payloads[tenant].terminationBenefits.find((item) => item.employeeId === employeeId);
    if (caseId === "C18") {
      add({ tenant, caseId, employeeId, domain: "identity", field: "presence", referenceValue: "ABSENT", v2Value: leave || termination ? "PRESENT" : "ABSENT", kind: "not-applicable", explanation: "Embauche postérieure à la référence" });
      continue;
    }
    if (!leave || !termination) {
      add({ tenant, caseId, employeeId, domain: "identity", field: "presence", referenceValue: "PRESENT", v2Value: "ABSENT", kind: "exact", explanation: "Cas absent d'une collection V2" });
      continue;
    }
    add({ tenant, caseId, employeeId, domain: "identity", field: "employeeId", referenceValue: employeeId, v2Value: leave.employeeId, kind: "exact" });
    for (const [domain, field, referenceField, v2Field, tolerance, kind] of fieldMappings) {
      add({ tenant, caseId, employeeId, domain, field, referenceValue: reference[referenceField], v2Value: leave[v2Field], tolerance, kind });
    }
    for (const [domain, field, referenceField, v2Field, tolerance, kind] of terminationMappings) {
      add({ tenant, caseId, employeeId, domain, field, referenceValue: reference[referenceField], v2Value: termination[v2Field], tolerance, kind });
    }
    add({ tenant, caseId, employeeId, domain: "traceability", field: "ruleVersion", referenceValue: "CI-CCI-1977-PROVISIONS-2026.2", v2Value: leave.ruleVersion, kind: "exact" });
  }

  const tenantAEmployeeIds = new Set(payloads.A.leaveProvisions.map((item) => item.employeeId));
  const tenantBEmployeeIds = new Set(payloads.B.leaveProvisions.map((item) => item.employeeId));
  for (const employeeId of ["VAL26-B-B01", "VAL26-B-B02"]) {
    add({ tenant: "A", caseId: employeeId.slice(-3), employeeId, domain: "isolation", field: "absentFromTenantA", referenceValue: "ABSENT", v2Value: tenantAEmployeeIds.has(employeeId) ? "PRESENT" : "ABSENT", kind: "exact" });
  }
  for (const employeeId of referenceRows.filter((row) => row.Tenant === "A").map((row) => String(row["Matricule validation"]))) {
    add({ tenant: "B", caseId: employeeId.slice(-3), employeeId, domain: "isolation", field: "absentFromTenantB", referenceValue: "ABSENT", v2Value: tenantBEmployeeIds.has(employeeId) ? "PRESENT" : "ABSENT", kind: "exact" });
  }

  const headers = ["tenant", "caseId", "employeeId", "domain", "field", "referenceValue", "v2Value", "difference", "tolerance", "status", "explanation"];
  const lines = [headers.join(","), ...comparisons.map((item) => headers.map((header) => csv(item[header])).join(","))];
  fs.writeFileSync(outputPath, `${lines.join("\n")}\n`);
  const statuses = comparisons.reduce((result, item) => {
    result[item.status] = (result[item.status] || 0) + 1;
    return result;
  }, {});
  process.stdout.write(`${JSON.stringify({ output: outputPath, comparisons: comparisons.length, statuses }, null, 2)}\n`);
}

main().catch((error) => {
  console.error("Échec de comparaison des provisions :", error);
  process.exitCode = 1;
});
