import { getOvertimeApiVersion, getOvertimeEndpoint } from "../overtime-api-version";

describe("Overtime API Version Feature Flag Config", () => {
  const originalEnv = process.env.NEXT_PUBLIC_OVERTIME_API_VERSION;

  afterEach(() => {
    process.env.NEXT_PUBLIC_OVERTIME_API_VERSION = originalEnv;
  });

  it("retourne 'v1' par défaut si la variable n'est pas définie", () => {
    delete process.env.NEXT_PUBLIC_OVERTIME_API_VERSION;
    expect(getOvertimeApiVersion()).toBe("v1");
    expect(getOvertimeEndpoint()).toBe("/api/overtime");
  });

  it("retourne 'v2' lorsque NEXT_PUBLIC_OVERTIME_API_VERSION=v2", () => {
    process.env.NEXT_PUBLIC_OVERTIME_API_VERSION = "v2";
    expect(getOvertimeApiVersion()).toBe("v2");
    expect(getOvertimeEndpoint()).toBe("/api/v2/overtime");
  });
});
