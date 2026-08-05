import { getSeveranceApiVersion, getSeveranceEndpoint } from "../severance-api-version";

describe("Severance API Version Feature Flag Config", () => {
  const originalEnv = process.env.NEXT_PUBLIC_SEVERANCE_API_VERSION;

  afterEach(() => {
    process.env.NEXT_PUBLIC_SEVERANCE_API_VERSION = originalEnv;
  });

  it("retourne 'v1' par défaut si la variable n'est pas définie", () => {
    delete process.env.NEXT_PUBLIC_SEVERANCE_API_VERSION;
    expect(getSeveranceApiVersion()).toBe("v1");
    expect(getSeveranceEndpoint()).toBe("/api/severance");
  });

  it("retourne 'v2' lorsque NEXT_PUBLIC_SEVERANCE_API_VERSION=v2", () => {
    process.env.NEXT_PUBLIC_SEVERANCE_API_VERSION = "v2";
    expect(getSeveranceApiVersion()).toBe("v2");
    expect(getSeveranceEndpoint()).toBe("/api/v2/severance");
  });
});
