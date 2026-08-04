/** @jest-environment jsdom */
import "@testing-library/jest-dom";
import { render, screen } from "@testing-library/react";
import { ProvisionWarningList } from "../provision-warning-list";

describe("ProvisionWarningList", () => {
  it("ordonne, groupe et rend accessibles les niveaux", () => {
    render(<ProvisionWarningList warnings={[
      { code: "INFO", message: "Information", severity: "info" },
      { code: "ERROR", message: "Calcul impossible", severity: "error" },
      { code: "ERROR", message: "Calcul impossible", severity: "error" },
      { code: "WARN", message: "Historique incomplet", severity: "warning" },
    ]} collapsible={false} />);
    expect(screen.getByText(/Calcul impossible/)).toHaveTextContent("2 occurrences");
    const items = screen.getAllByRole("listitem");
    expect(items[0]).toHaveTextContent("Erreur");
    expect(items[1]).toHaveTextContent("Attention");
    expect(items[2]).toHaveTextContent("Information");
  });
});
