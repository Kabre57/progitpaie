import { getLeaveApiVersion, getLeaveEndpoint } from "../leave-api-version";

describe("Leave API Version Feature Flag Config", () => {
  const originalEnv = process.env.NEXT_PUBLIC_LEAVE_API_VERSION;

  afterEach(() => {
    process.env.NEXT_PUBLIC_LEAVE_API_VERSION = originalEnv;
  });

  it("retourne 'v2' par défaut si la variable n'est pas définie", () => {
    delete process.env.NEXT_PUBLIC_LEAVE_API_VERSION;
    expect(getLeaveApiVersion()).toBe("v2");
    expect(getLeaveEndpoint()).toBe("/api/v2/leaves");
  });

  it("retourne 'v1' lorsque NEXT_PUBLIC_LEAVE_API_VERSION=v1", () => {
    process.env.NEXT_PUBLIC_LEAVE_API_VERSION = "v1";
    expect(getLeaveApiVersion()).toBe("v1");
    expect(getLeaveEndpoint()).toBe("/api/leaves");
  });
});
