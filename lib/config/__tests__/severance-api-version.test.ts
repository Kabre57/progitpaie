import { getSeveranceApiVersion, getSeveranceEndpoint } from "../severance-api-version";

describe("Severance API Version Feature Flag Config", () => {
  const originalEnv = process.env.NEXT_PUBLIC_SEVERANCE_API_VERSION;

  afterEach(() => {
    process.env.NEXT_PUBLIC_SEVERANCE_API_VERSION = originalEnv;
  });

  it("retourne 'v2' par défaut si la variable n'est pas définie", () => {
    delete process.env.NEXT_PUBLIC_SEVERANCE_API_VERSION;
    expect(getSeveranceApiVersion()).toBe("v2");
    expect(getSeveranceEndpoint()).toBe("/api/v2/severance");
  });

  it("retourne 'v1' lorsque NEXT_PUBLIC_SEVERANCE_API_VERSION=v1", () => {
    process.env.NEXT_PUBLIC_SEVERANCE_API_VERSION = "v1";
    expect(getSeveranceApiVersion()).toBe("v1");
    expect(getSeveranceEndpoint()).toBe("/api/severance");
  });
});
