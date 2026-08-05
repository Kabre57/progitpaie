import { getDeclarationApiVersion, getDeclarationEndpoint } from "../declaration-api-version";

describe("Declaration API Version Feature Flag Config", () => {
  const originalEnv = process.env.NEXT_PUBLIC_DECLARATION_API_VERSION;

  afterEach(() => {
    process.env.NEXT_PUBLIC_DECLARATION_API_VERSION = originalEnv;
  });

  it("retourne 'v1' par défaut si la variable n'est pas définie", () => {
    delete process.env.NEXT_PUBLIC_DECLARATION_API_VERSION;
    expect(getDeclarationApiVersion()).toBe("v1");
    expect(getDeclarationEndpoint()).toBe("/api/declarations");
  });

  it("retourne 'v2' lorsque NEXT_PUBLIC_DECLARATION_API_VERSION=v2", () => {
    process.env.NEXT_PUBLIC_DECLARATION_API_VERSION = "v2";
    expect(getDeclarationApiVersion()).toBe("v2");
    expect(getDeclarationEndpoint()).toBe("/api/v2/declarations");
  });
});
