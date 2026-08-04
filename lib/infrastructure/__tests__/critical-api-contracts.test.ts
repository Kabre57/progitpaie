import { createNotificationSchema } from "@/shared/validation/notification.schema";
import { documentGenerationSchema } from "@/shared/validation/document.schema";

describe("contrats API critiques", () => {
  it.each([
    ["contract", { userId: "user-1" }],
    ["attestation", { userId: "user-1" }],
    ["stc", { userId: "user-1" }],
    ["bulletin", { userId: "user-1", month: 7, year: 2026 }],
    ["its", { month: 7, year: 2026 }],
    ["cnps", { month: 7, year: 2026 }],
    ["fdfp", { month: 7, year: 2026 }],
    ["rns", { userId: "user-1" }],
  ])("accepte le contrat documentaire %s", (docType, payload) => {
    expect(documentGenerationSchema.safeParse({ docType, ...payload }).success).toBe(true);
  });

  it("refuse un bulletin sans période", () => {
    expect(documentGenerationSchema.safeParse({ docType: "bulletin", userId: "user-1" }).success).toBe(false);
  });

  it("refuse les liens de notification externes", () => {
    expect(createNotificationSchema.safeParse({
      userId: "user-1", title: "Test", message: "Test", link: "https://evil.example",
    }).success).toBe(false);
  });
});
