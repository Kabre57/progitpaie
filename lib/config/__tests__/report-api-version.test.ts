import { getReportApiVersion, getReportEndpoint } from "../report-api-version";

describe("Report API Version Feature Flag Config", () => {
  const originalEnv = process.env.NEXT_PUBLIC_REPORT_API_VERSION;

  afterEach(() => {
    process.env.NEXT_PUBLIC_REPORT_API_VERSION = originalEnv;
  });

  it("retourne 'v2' par défaut si la variable n'est pas définie", () => {
    delete process.env.NEXT_PUBLIC_REPORT_API_VERSION;
    expect(getReportApiVersion()).toBe("v2");
    expect(getReportEndpoint()).toBe("/api/v2/reports");
  });

  it("retourne 'v1' lorsque NEXT_PUBLIC_REPORT_API_VERSION=v1", () => {
    process.env.NEXT_PUBLIC_REPORT_API_VERSION = "v1";
    expect(getReportApiVersion()).toBe("v1");
    expect(getReportEndpoint()).toBe("/api/reports");
  });
});
