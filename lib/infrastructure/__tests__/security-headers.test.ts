import nextConfig from "@/next.config";

describe("Security Headers Configuration", () => {
  it("définit les headers de sécurité recommandés", async () => {
    expect(nextConfig.headers).toBeDefined();
    if (typeof nextConfig.headers === "function") {
      const headersConfig = await nextConfig.headers();
      expect(headersConfig).toHaveLength(1);
      expect(headersConfig[0].source).toBe("/(.*)");
      
      const headerMap = Object.fromEntries(
        headersConfig[0].headers.map((h: { key: string; value: string }) => [h.key, h.value])
      );

      expect(headerMap["X-Content-Type-Options"]).toBe("nosniff");
      expect(headerMap["X-Frame-Options"]).toBe("DENY");
      expect(headerMap["Referrer-Policy"]).toBe("strict-origin-when-cross-origin");
      expect(headerMap["Permissions-Policy"]).toContain("camera=()");
    }
  });
});
