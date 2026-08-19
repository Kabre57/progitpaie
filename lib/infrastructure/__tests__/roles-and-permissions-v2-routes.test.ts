import { GET as getPermissions } from "@/app/api/v2/permissions/route";
import { POST as clearPermissions } from "@/app/api/v2/permissions/clear/route";
import { POST as seedPermissions } from "@/app/api/v2/permissions/seed/route";
import { POST as createPermissionModule, DELETE as deletePermissionModule } from "@/app/api/v2/permissions/modules/route";
import { POST as createPermissionDefinition, DELETE as deletePermissionDefinition } from "@/app/api/v2/permissions/definitions/route";
import { GET as getRoles, POST as createRole } from "@/app/api/v2/roles/route";
import { GET as getRoleById, PUT as updateRole, DELETE as deleteRole } from "@/app/api/v2/roles/[id]/route";
import { POST as assignRole } from "@/app/api/v2/roles/assign/route";
import { NextRequest } from "next/server";

describe("Routes API V2 — Rôles & Permissions Dynamiques", () => {
  it("GET /api/v2/permissions doit exiger une authentification admin", async () => {
    const req = new NextRequest("http://localhost:3000/api/v2/permissions");
    const res = await getPermissions(req);
    expect([401, 403]).toContain(res.status);
  });

  it("POST /api/v2/permissions/clear doit exiger une authentification", async () => {
    const req = new NextRequest("http://localhost:3000/api/v2/permissions/clear", { method: "POST" });
    const res = await clearPermissions(req);
    expect([401, 403]).toContain(res.status);
  });

  it("POST /api/v2/permissions/seed doit exiger une authentification", async () => {
    const req = new NextRequest("http://localhost:3000/api/v2/permissions/seed", { method: "POST" });
    const res = await seedPermissions(req);
    expect([401, 403]).toContain(res.status);
  });

  it("POST /api/v2/permissions/modules doit exiger une authentification admin", async () => {
    const req = new NextRequest("http://localhost:3000/api/v2/permissions/modules", {
      method: "POST",
      body: JSON.stringify({ name: "Nouveau Module", code: "nouveau_module" }),
    });
    const res = await createPermissionModule(req);
    expect([401, 403]).toContain(res.status);
  });

  it("DELETE /api/v2/permissions/modules doit exiger une authentification", async () => {
    const req = new NextRequest("http://localhost:3000/api/v2/permissions/modules?id=mod-1", {
      method: "DELETE",
    });
    const res = await deletePermissionModule(req);
    expect([401, 403]).toContain(res.status);
  });

  it("POST /api/v2/permissions/definitions doit exiger une authentification", async () => {
    const req = new NextRequest("http://localhost:3000/api/v2/permissions/definitions", {
      method: "POST",
      body: JSON.stringify({ moduleId: "m1", name: "Voir les logs", code: "logs.read" }),
    });
    const res = await createPermissionDefinition(req);
    expect([401, 403]).toContain(res.status);
  });

  it("DELETE /api/v2/permissions/definitions doit exiger une authentification", async () => {
    const req = new NextRequest("http://localhost:3000/api/v2/permissions/definitions?id=perm-1", {
      method: "DELETE",
    });
    const res = await deletePermissionDefinition(req);
    expect([401, 403]).toContain(res.status);
  });

  it("GET /api/v2/roles doit exiger une authentification admin", async () => {
    const req = new NextRequest("http://localhost:3000/api/v2/roles");
    const res = await getRoles(req);
    expect([401, 403]).toContain(res.status);
  });

  it("POST /api/v2/roles doit exiger une authentification admin", async () => {
    const req = new NextRequest("http://localhost:3000/api/v2/roles", {
      method: "POST",
      body: JSON.stringify({ name: "Gestionnaire", permissions: ["employees.read"] }),
    });
    const res = await createRole(req);
    expect([401, 403]).toContain(res.status);
  });

  it("GET /api/v2/roles/[id] doit exiger une authentification", async () => {
    const req = new NextRequest("http://localhost:3000/api/v2/roles/role-123");
    const res = await getRoleById(req, { params: Promise.resolve({ id: "role-123" }) });
    expect([401, 403]).toContain(res.status);
  });

  it("PUT /api/v2/roles/[id] doit exiger une authentification", async () => {
    const req = new NextRequest("http://localhost:3000/api/v2/roles/role-123", {
      method: "PUT",
      body: JSON.stringify({ name: "Nouveau Nom" }),
    });
    const res = await updateRole(req, { params: Promise.resolve({ id: "role-123" }) });
    expect([401, 403]).toContain(res.status);
  });

  it("DELETE /api/v2/roles/[id] doit exiger une authentification", async () => {
    const req = new NextRequest("http://localhost:3000/api/v2/roles/role-123", {
      method: "DELETE",
    });
    const res = await deleteRole(req, { params: Promise.resolve({ id: "role-123" }) });
    expect([401, 403]).toContain(res.status);
  });

  it("POST /api/v2/roles/assign doit exiger une authentification admin", async () => {
    const req = new NextRequest("http://localhost:3000/api/v2/roles/assign", {
      method: "POST",
      body: JSON.stringify({ userId: "u1", roleId: "r1" }),
    });
    const res = await assignRole(req);
    expect([401, 403]).toContain(res.status);
  });
});
