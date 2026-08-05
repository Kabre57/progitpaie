import { test, expect } from "@playwright/test";

const baseUrl = process.env.E2E_BASE_URL ?? "http://localhost:3000";

const adminEmail = process.env.E2E_ADMIN_EMAIL ?? "admin-a-2026-r1@validation.invalid";
const adminPassword = process.env.E2E_ADMIN_PASSWORD ?? "tmp";

test.describe("Vérification complète de l'authentification et de l'inscription Progitpaie", () => {
  test("1. Règle de fermeture de l'inscription publique (403 lorsque des utilisateurs existent)", async ({ request }) => {
    const response = await request.post(`${baseUrl}/api/auth/register`, {
      data: {
        name: "Theodore Kabre",
        email: "theogeoffroy5@gmail.com",
        password: "Kwt0101006545++@",
        department: "Direction",
      },
    });

    // 201 si premier utilisateur, 403 si des utilisateurs existent déjà en base
    expect([201, 403]).toContain(response.status());
    const body = await response.json();
    if (response.status() === 403) {
      expect(body.code).toBe("REGISTRATION_CLOSED");
    } else {
      expect(body.success).toBe(true);
      expect(body.data.user.role).toBe("admin");
    }
  });

  test("2. Connexion Administrateur et vérification du cookie rbeas_token", async ({ request }) => {
    const response = await request.post(`${baseUrl}/api/auth/login`, {
      data: {
        email: adminEmail,
        password: adminPassword,
      },
    });

    expect(response.status()).toBe(200);
    const body = await response.json();
    expect(body.success).toBe(true);
    expect(body.data.user.role).toBe("admin");

    const headers = response.headers();
    const setCookie = headers["set-cookie"];
    expect(setCookie).toBeDefined();
    expect(setCookie).toContain("rbeas_token=");
    expect(setCookie).toContain("HttpOnly");
  });

  test("3. Authentification Google OAuth API et attribution du rôle admin", async ({ request }) => {
    const response = await request.post(`${baseUrl}/api/auth/google`, {
      data: {
        email: "google.admin@progitpaie.online",
        name: "Theodore Kabre Google",
        googleId: "google-oauth-sub-123456789",
      },
    });

    expect(response.status()).toBe(200);
    const body = await response.json();
    expect(body.success).toBe(true);
    expect(body.data.user.role).toBe("admin");

    const headers = response.headers();
    const setCookie = headers["set-cookie"];
    expect(setCookie).toBeDefined();
    expect(setCookie).toMatch(/(rbeas_token|token)=/);
  });
});
