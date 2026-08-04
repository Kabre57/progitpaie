import { resolveProvisionApiVersion } from "../provision-api-version";

describe("resolveProvisionApiVersion", () => {
  it.each([
    [undefined, "legacy"],
    ["legacy", "legacy"],
    ["v2", "v2"],
    ["invalid", "legacy"],
  ])("résout %p vers %s", (value, expected) => {
    expect(resolveProvisionApiVersion(value)).toBe(expected);
  });
});
