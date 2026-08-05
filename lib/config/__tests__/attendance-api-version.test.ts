import { getAttendanceApiVersion, getAttendanceEndpoint } from "../attendance-api-version";

describe("Attendance API Version Feature Flag Config", () => {
  const originalEnv = process.env.NEXT_PUBLIC_ATTENDANCE_API_VERSION;

  afterEach(() => {
    process.env.NEXT_PUBLIC_ATTENDANCE_API_VERSION = originalEnv;
  });

  it("retourne 'v2' par défaut si la variable n'est pas définie", () => {
    delete process.env.NEXT_PUBLIC_ATTENDANCE_API_VERSION;
    expect(getAttendanceApiVersion()).toBe("v2");
    expect(getAttendanceEndpoint()).toBe("/api/v2/attendance");
  });

  it("retourne 'v1' lorsque NEXT_PUBLIC_ATTENDANCE_API_VERSION=v1", () => {
    process.env.NEXT_PUBLIC_ATTENDANCE_API_VERSION = "v1";
    expect(getAttendanceApiVersion()).toBe("v1");
    expect(getAttendanceEndpoint()).toBe("/api/attendance");
  });
});
