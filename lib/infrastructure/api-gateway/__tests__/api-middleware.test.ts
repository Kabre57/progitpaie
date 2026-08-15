import { NextRequest, NextResponse } from "next/server";

const mockValidateApiKey = jest.fn();
const mockEnforceRateLimit = jest.fn();

jest.mock("@/lib/infrastructure/api-gateway/api-key-service", () => ({
  ApiKeyService: jest.fn().mockImplementation(() => ({
    validateApiKey: mockValidateApiKey,
  })),
}));

jest.mock("@/lib/rate-limit", () => ({
  enforceRateLimit: mockEnforceRateLimit,
}));

import {
  authenticatePublicApi,
  getPublicApiContext,
} from "@/lib/infrastructure/api-gateway/api-middleware";

describe("authenticatePublicApi", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockEnforceRateLimit.mockResolvedValue(null);
  });

  it("retourne 401 lorsqu’aucune clé API n’est fournie", async () => {
    const request = new NextRequest("http://localhost/api/v2/public/payroll");

    const response = await authenticatePublicApi(request);

    expect(response).toBeInstanceOf(NextResponse);
    expect(response?.status).toBe(401);
    await expect(response?.json()).resolves.toMatchObject({ success: false });
    expect(mockValidateApiKey).not.toHaveBeenCalled();
  });

  it("retourne 403 lorsqu'une clé API invalide est fournie", async () => {
    mockValidateApiKey.mockResolvedValue(null);
    const request = new NextRequest("http://localhost/api/v2/public/payroll", {
      // Clé au format valide (pk_live_ + 48 hex) mais non enregistrée en base
      headers: { "x-api-key": "pk_live_000000000000000000000000000000000000000000000000" },
    });

    const response = await authenticatePublicApi(request);

    expect(response).toBeInstanceOf(NextResponse);
    expect(response?.status).toBe(403);
    await expect(response?.json()).resolves.toMatchObject({ success: false });
  });

  it("retourne 503 lorsque le service de validation est indisponible", async () => {
    mockValidateApiKey.mockRejectedValue(new Error("Database unavailable"));
    const request = new NextRequest("http://localhost/api/v2/public/payroll", {
      // Clé au format valide (pk_live_ + 48 hex) pour dépasser la garde de format
      // et atteindre validateApiKey qui lève une exception (DB indisponible)
      headers: { "x-api-key": "pk_live_111111111111111111111111111111111111111111111111" },
    });

    const response = await authenticatePublicApi(request);

    expect(response).toBeInstanceOf(NextResponse);
    expect(response?.status).toBe(503);
    await expect(response?.json()).resolves.toMatchObject({ success: false });
  });

  it("injecte le contexte tenant uniquement après validation réussie", async () => {
    mockValidateApiKey.mockResolvedValue({
      id: "api-key-1",
      companyId: "company-1",
    });
    const request = new NextRequest("http://localhost/api/v2/public/payroll", {
      // Clé au format valide (pk_live_ + 48 hex) pour passer la garde de format
      headers: { "x-api-key": "pk_live_222222222222222222222222222222222222222222222222" },
    });

    const response = await authenticatePublicApi(request);

    expect(response).toBeNull();
    expect(getPublicApiContext(request)).toEqual({
      apiKeyId: "api-key-1",
      companyId: "company-1",
    });
  });

  it("retourne la réponse de limitation sans appeler le service de clés", async () => {
    mockEnforceRateLimit.mockResolvedValue(
      NextResponse.json({ success: false }, { status: 429 })
    );
    const request = new NextRequest("http://localhost/api/v2/public/payroll", {
      headers: { "x-api-key": "pk_live_valid" },
    });

    const response = await authenticatePublicApi(request);

    expect(response?.status).toBe(429);
    expect(mockValidateApiKey).not.toHaveBeenCalled();
  });
});
