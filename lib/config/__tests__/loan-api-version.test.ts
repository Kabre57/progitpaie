import { getLoanApiVersion, getLoanEndpoint } from "../loan-api-version";

describe("Loan API Version Feature Flag Config", () => {
  const originalEnv = process.env.NEXT_PUBLIC_LOAN_API_VERSION;

  afterEach(() => {
    process.env.NEXT_PUBLIC_LOAN_API_VERSION = originalEnv;
  });

  it("retourne 'v2' par défaut si la variable n'est pas définie", () => {
    delete process.env.NEXT_PUBLIC_LOAN_API_VERSION;
    expect(getLoanApiVersion()).toBe("v2");
    expect(getLoanEndpoint()).toBe("/api/v2/loans");
  });

  it("retourne 'v1' lorsque NEXT_PUBLIC_LOAN_API_VERSION=v1", () => {
    process.env.NEXT_PUBLIC_LOAN_API_VERSION = "v1";
    expect(getLoanApiVersion()).toBe("v1");
    expect(getLoanEndpoint()).toBe("/api/loans");
  });
});
