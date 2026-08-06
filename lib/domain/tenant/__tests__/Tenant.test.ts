import { Tenant } from "../entities/Tenant";
import { TenantId } from "../value-objects/TenantId";
import { TenantStatus } from "../value-objects/TenantStatus";

describe("Domain Entity — Tenant", () => {
  it("crée une entreprise valide", () => {
    const tenant = new Tenant({
      id: new TenantId("tnt-001"),
      name: "SARL EXEMPLE CI",
      city: "Abidjan",
      isMain: false,
      status: new TenantStatus("ACTIVE"),
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    expect(tenant.id.getValue()).toBe("tnt-001");
    expect(tenant.name).toBe("SARL EXEMPLE CI");
    expect(tenant.status.isActive()).toBe(true);
  });

  it("empêche la suspension de l'entreprise principale siège", () => {
    const mainTenant = new Tenant({
      id: new TenantId("progitpaie-main"),
      name: "PROGITPAIE SIÈGE",
      isMain: true,
      status: new TenantStatus("ACTIVE"),
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    expect(() => mainTenant.suspend()).toThrow(
      "L'entreprise principale (siège) ne peut pas être suspendue"
    );
  });

  it("permet la suspension d'une filiale", () => {
    const subsidiary = new Tenant({
      id: new TenantId("sub-001"),
      name: "PROGITPAIE BOUAKE",
      isMain: false,
      status: new TenantStatus("ACTIVE"),
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    subsidiary.suspend();
    expect(subsidiary.status.isSuspended()).toBe(true);
  });
});
