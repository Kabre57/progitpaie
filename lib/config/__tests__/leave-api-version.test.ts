import { getLeaveApiVersion, getLeaveEndpoint } from "../leave-api-version";

describe("Leave API Version Feature Flag Config", () => {
  const originalEnv = process.env.NEXT_PUBLIC_LEAVE_API_VERSION;

  afterEach(() => {
    process.env.NEXT_PUBLIC_LEAVE_API_VERSION = originalEnv;
  });

  it("retourne 'v1' par défaut si la variable n'est pas définie", () => {
    delete process.env.NEXT_PUBLIC_LEAVE_API_VERSION;
    expect(getLeaveApiVersion()).toBe("v1");
    expect(getLeaveEndpoint()).toBe("/api/leaves");
    expect(getLeaveEndpoint("/apply")).toBe("/api/leaves/apply");
  });

  it("retourne 'v2' lorsque NEXT_PUBLIC_LEAVE_API_VERSION=v2", () => {
    process.env.NEXT_PUBLIC_LEAVE_API_VERSION = "v2";
    expect(getLeaveApiVersion()).toBe("v2");
    expect(getLeaveEndpoint()).toBe("/api/v2/leaves");
    expect(getLeaveEndpoint("apply")).toBe("/api/v2/leaves/apply");
  });
});
