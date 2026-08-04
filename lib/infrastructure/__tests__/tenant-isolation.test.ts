import { tenantUserWhere } from "@/lib/database/prisma-extension";

describe("isolation multi-tenant", () => {
  it("ajoute toujours la société au filtre utilisateur", () => {
    expect(tenantUserWhere("company-a", { isActive: true })).toEqual({
      AND: [{ isActive: true }, { companyId: "company-a" }],
    });
  });

  it("ne permet pas à un filtre appelant de remplacer la société", () => {
    expect(tenantUserWhere("company-a", { companyId: "company-b" })).toEqual({
      AND: [{ companyId: "company-b" }, { companyId: "company-a" }],
    });
  });
});
