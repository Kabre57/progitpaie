/** @jest-environment jsdom */
import "@testing-library/jest-dom";
import { render, screen } from "@testing-library/react";

const mockUsePayrollProvisions = jest.fn();
jest.mock("@/lib/hooks/use-payroll-provisions", () => ({
  usePayrollProvisions: mockUsePayrollProvisions,
}));

import ProvisionsPage from "../page";

const queryState = {
  isPending: false, isError: false, isFetching: false, error: null, refresh: jest.fn(),
};

describe("écran administrateur des provisions", () => {
  it("affiche le contrat V2, ses warnings et le vocabulaire métier corrigé", () => {
    mockUsePayrollProvisions.mockReturnValue({ ...queryState, data: { apiVersion: "v2", data: {
      companyId: "company-a", referenceDate: "2026-08-03T23:59:59.999Z", ruleVersion: "rules-v2", calculatedAt: "2026-08-03T12:00:00.000Z",
      leaveProvisions: [], terminationBenefits: [], totalLeaveProvision: 100, totalTerminationExposure: 200, totalExposure: 300,
      employeesProcessed: 2, employeesWithWarnings: 1,
      warnings: [{ code: "FALLBACK", message: "Historique salarial incomplet", severity: "warning" }],
      dataQuality: { completeSalaryHistories: 1, incompleteSalaryHistories: 1, contractFallbacks: 1, legacyLeaveBalances: 0 },
    } } });
    render(<ProvisionsPage />);
    expect(screen.getAllByText(/Indemnités de licenciement/i).length).toBeGreaterThan(0);
    expect(screen.queryByText(/retraite/i)).not.toBeInTheDocument();
    expect(screen.getByText(/Règles rules-v2/)).toBeInTheDocument();
    expect(screen.getByText(/Historique salarial incomplet/)).toBeInTheDocument();
  });

  it("signale explicitement le mode de compatibilité", () => {
    mockUsePayrollProvisions.mockReturnValue({ ...queryState, data: { apiVersion: "legacy", data: {
      companyId: "company-a", year: 2026, leaveProvisions: [], totalLeaveProvision: 100,
      retirementProvisions: [], totalRetirementProvision: 200, total: 300,
    } } });
    render(<ProvisionsPage />);
    expect(screen.getByText(/Mode de compatibilité actif/)).toBeInTheDocument();
    expect(screen.queryByText(/Règles rules-v2/)).not.toBeInTheDocument();
  });

  it("affiche un skeleton pendant le chargement", () => {
    mockUsePayrollProvisions.mockReturnValue({ ...queryState, isPending: true, data: undefined });
    render(<ProvisionsPage />);
    expect(screen.getByRole("status", { name: /Chargement des provisions/ })).toBeInTheDocument();
  });
});
