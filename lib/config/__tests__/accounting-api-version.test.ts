import { getAccountingApiVersion, getAccountingEndpoint } from "../accounting-api-version";

describe("Accounting API Version Feature Flag Config", () => {
  const originalEnv = process.env.NEXT_PUBLIC_ACCOUNTING_API_VERSION;

  afterEach(() => {
    process.env.NEXT_PUBLIC_ACCOUNTING_API_VERSION = originalEnv;
  });

  it("retourne 'v1' par défaut si la variable n'est pas définie", () => {
    delete process.env.NEXT_PUBLIC_ACCOUNTING_API_VERSION;
    expect(getAccountingApiVersion()).toBe("v1");
    expect(getAccountingEndpoint()).toBe("/api/accounting");
  });

  it("retourne 'v2' lorsque NEXT_PUBLIC_ACCOUNTING_API_VERSION=v2", () => {
    process.env.NEXT_PUBLIC_ACCOUNTING_API_VERSION = "v2";
    expect(getAccountingApiVersion()).toBe("v2");
    expect(getAccountingEndpoint()).toBe("/api/v2/accounting");
  });
});
