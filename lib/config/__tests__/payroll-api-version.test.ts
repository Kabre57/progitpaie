import { getPayrollApiVersion, getPayrollEndpoint } from "../payroll-api-version";

describe("Payroll API Version Feature Flag Config", () => {
  const originalEnv = process.env.NEXT_PUBLIC_PAYROLL_API_VERSION;

  afterEach(() => {
    process.env.NEXT_PUBLIC_PAYROLL_API_VERSION = originalEnv;
  });

  it("retourne 'v2' par défaut si la variable n'est pas définie", () => {
    delete process.env.NEXT_PUBLIC_PAYROLL_API_VERSION;
    expect(getPayrollApiVersion()).toBe("v2");
    expect(getPayrollEndpoint()).toBe("/api/v2/payroll");
  });

  it("retourne 'v1' lorsque NEXT_PUBLIC_PAYROLL_API_VERSION=v1", () => {
    process.env.NEXT_PUBLIC_PAYROLL_API_VERSION = "v1";
    expect(getPayrollApiVersion()).toBe("v1");
    expect(getPayrollEndpoint()).toBe("/api/payroll");
  });
});
