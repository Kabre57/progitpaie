import { getJwtSecret } from "../../auth";

describe("getJwtSecret", () => {
  const originalSecret = process.env.JWT_SECRET;

  afterEach(() => {
    if (originalSecret === undefined) delete process.env.JWT_SECRET;
    else process.env.JWT_SECRET = originalSecret;
  });

  it("refuse de démarrer sans JWT_SECRET", () => {
    delete process.env.JWT_SECRET;
    expect(() => getJwtSecret()).toThrow("JWT_SECRET must be defined at runtime");
  });

  it("retourne exclusivement le secret injecté", () => {
    process.env.JWT_SECRET = "test-only-secret";
    expect(getJwtSecret()).toBe("test-only-secret");
  });
});
