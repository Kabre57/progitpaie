import { getEmployeeApiVersion, getEmployeeEndpoint } from "../employee-api-version";

describe("Employee API Version Feature Flag Config", () => {
  const originalEnv = process.env.NEXT_PUBLIC_EMPLOYEE_API_VERSION;

  afterEach(() => {
    process.env.NEXT_PUBLIC_EMPLOYEE_API_VERSION = originalEnv;
  });

  it("retourne 'v2' par défaut si la variable n'est pas définie", () => {
    delete process.env.NEXT_PUBLIC_EMPLOYEE_API_VERSION;
    expect(getEmployeeApiVersion()).toBe("v2");
    expect(getEmployeeEndpoint()).toBe("/api/v2/employees");
  });

  it("retourne 'v1' lorsque NEXT_PUBLIC_EMPLOYEE_API_VERSION=v1", () => {
    process.env.NEXT_PUBLIC_EMPLOYEE_API_VERSION = "v1";
    expect(getEmployeeApiVersion()).toBe("v1");
    expect(getEmployeeEndpoint()).toBe("/api/employees");
  });
});
