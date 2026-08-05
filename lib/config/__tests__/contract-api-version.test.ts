import { getContractApiVersion, getContractEndpoint } from "../contract-api-version";

describe("Contract API Version Feature Flag Config", () => {
  const originalEnv = process.env.NEXT_PUBLIC_CONTRACT_API_VERSION;

  afterEach(() => {
    process.env.NEXT_PUBLIC_CONTRACT_API_VERSION = originalEnv;
  });

  it("retourne 'v1' par défaut si la variable n'est pas définie", () => {
    delete process.env.NEXT_PUBLIC_CONTRACT_API_VERSION;
    expect(getContractApiVersion()).toBe("v1");
    expect(getContractEndpoint()).toBe("/api/contracts");
  });

  it("retourne 'v2' lorsque NEXT_PUBLIC_CONTRACT_API_VERSION=v2", () => {
    process.env.NEXT_PUBLIC_CONTRACT_API_VERSION = "v2";
    expect(getContractApiVersion()).toBe("v2");
    expect(getContractEndpoint()).toBe("/api/v2/contracts");
  });
});
